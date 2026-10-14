"""Check product traceability and state paths, not business truth or live fidelity.
Usage: python check_contract.py path/to/data.js [--gate ready]
"""
import argparse
import json
from pathlib import Path
import sys

BASE_CATEGORIES = {'happy', 'validation', 'failure', 'unknown', 'return', 'retry',
                   'duplicate', 'permission', 'empty', 'refresh', 'boundary', 'partial', 'concurrency'}
ROLES = {'user', 'business', 'design', 'engineering', 'qa', 'operations'}


def load(path):
    raw = Path(path).read_text(encoding='utf-8-sig').strip()
    if raw.startswith('window.PRODUCT_REVIEW ='):
        raw = raw.split('=', 1)[1].strip().removesuffix(';')
    return json.loads(raw)


def validate(m, root, ready=False):
    errors, notes = [], []
    def check(ok, message):
        if not ok:
            errors.append(message)
    def index(key, field='id'):
        rows = m.get(key, [])
        check(isinstance(rows, list), f'{key}: expected list')
        if not isinstance(rows, list):
            return {}
        out = {}
        for row in rows:
            if not isinstance(row, dict):
                errors.append(f'{key}: expected object'); continue
            ident = row.get(field)
            check(bool(ident) and ident not in out, f'{key}: missing or duplicate {field}: {ident}')
            if ident:
                out[ident] = row
        return out
    def present(row, fields, label):
        for field in fields:
            check(bool(row.get(field)), f'{label}: missing {field}')
    def file_exists(value):
        return isinstance(value, str) and (root / value).is_file()

    meta = m.get('meta', {})
    present(meta, ['title','version','environment','initial','stage'], 'meta')
    req = index('requirements'); pages = index('pages'); states = index('states')
    trans = index('transitions'); cases = index('cases'); ev = index('evidence')
    decisions = index('decisions'); reviews = index('reviews', 'role')
    coverage = index('coverage', 'category')
    check(bool(req) and bool(pages) and bool(states) and bool(cases), 'empty product contract')
    check(meta.get('initial') in states, 'initial state does not exist')
    check(BASE_CATEGORIES <= coverage.keys(), 'coverage: missing applicability categories: '+str(sorted(BASE_CATEGORIES-coverage.keys())))
    for category, c in coverage.items():
        check(c.get('mode') in ['required','na'], f'{category}: invalid applicability')
        if c.get('mode') == 'na':
            present(c, ['reason'], category)
        if c.get('mode') == 'required':
            check(any(x.get('category') == category for x in cases.values()), f'{category}: no case')
    for r, row in req.items():
        present(row, ['title','rule','status'], r)
        check(any(r in p.get('requirements',[]) for p in pages.values()), f'{r}: no page')
        check(any(c.get('requirement') == r for c in cases.values()), f'{r}: no acceptance case')
    for p, row in pages.items():
        present(row, ['title','requirements','states','baseline'], p)
        check(row.get('baseline') in ['verified','historical','unknown','new'], f'{p}: invalid baseline')
        for r in row.get('requirements',[]):
            check(r in req, f'{p}: unknown requirement {r}')
        for s in row.get('states',[]):
            check(s in states, f'{p}: unknown state {s}')
        for e in row.get('evidence',[]):
            check(e in ev, f'{p}: unknown evidence {e}')
        if row.get('baseline') == 'new':
            present(row, ['previous_journey','reason'], p)
        if row.get('baseline') == 'verified':
            check(bool(row.get('evidence')), f'{p}: verified without evidence')
            for eid in row.get('evidence',[]):
                e = ev.get(eid, {})
                present(e, ['captured_at','version','role','route','actions','observation','screenshot'], eid)
                check(e.get('kind') == 'live' and e.get('rechecked') is True, f'{p}: evidence not current live interaction')
                check(e.get('environment') == meta.get('environment'), f'{p}: evidence environment mismatch')
                check(file_exists(e.get('screenshot')), f'{p}: evidence screenshot missing')
        if row.get('baseline') in ['unknown','historical']:
            notes.append(f'{p}: current baseline not verified; keep proposal label')
    edges = {s: [] for s in states}
    pairs = set()
    for t, row in trans.items():
        present(row, ['from','to','event','guard','effect'], t)
        check(row.get('from') in states and row.get('to') in states, f'{t}: unknown state reference')
        pair = (row.get('from'), row.get('event'))
        check(pair not in pairs, f'{t}: ambiguous state/event; use distinct explicit events')
        pairs.add(pair)
        if row.get('from') in edges:
            edges[row['from']].append(row.get('to'))
    def reachable(start, graph):
        seen, todo = set(), [start]
        while todo:
            s = todo.pop()
            if s in seen:
                continue
            seen.add(s); todo.extend(x for x in graph.get(s,[]) if x not in seen)
        return seen
    seen = reachable(meta.get('initial'), edges)
    for s, row in states.items():
        check(isinstance(row.get('terminal'), bool), f'{s}: terminal must be boolean')
        check(s in seen, f'{s}: unreachable')
        check(any(s in p.get('states',[]) for p in pages.values()), f'{s}: no page mapping')
        if not row.get('terminal'):
            check(any(x != s for x in edges[s]), f'{s}: nonterminal has no exit')
            check(any(states.get(x,{}).get('terminal') for x in reachable(s,edges)), f'{s}: no path to completion')
    for c, row in cases.items():
        present(row, ['given','path','expected','assertion','category','result'], c)
        check(row.get('requirement') in req, f'{c}: unknown requirement')
        check(row.get('category') in coverage, f'{c}: undeclared coverage category')
        check(row.get('result') in ['not-run','pass','fail','blocked'], f'{c}: invalid result')
        state = meta.get('initial')
        for tid in row.get('path',[]):
            t = trans.get(tid)
            if not t:
                errors.append(f'{c}: missing transition {tid}'); continue
            check(t.get('from') == state, f'{c}: discontinuous path at {tid}')
            state = t.get('to')
        check(state == row.get('expected'), f'{c}: wrong expected terminal state')
        if row.get('result') == 'pass':
            check(file_exists(row.get('run_evidence')), f'{c}: pass without saved run evidence')
        if ready:
            check(row.get('result') == 'pass', f'{c}: acceptance not passed')
    if ready:
        check(ROLES <= reviews.keys(), 'missing review roles')
        for role in ROLES:
            row = reviews.get(role,{})
            check(row.get('status') == 'pass', f'{role}: review not passed')
            present(row, ['scope','findings','resolution'], role)
            check(file_exists(row.get('evidence')), f'{role}: review evidence missing')
        for d,row in decisions.items():
            check(not row.get('blocking') or row.get('status') == 'resolved', f'{d}: open blocking decision')
        for p,row in pages.items():
            check(row.get('baseline') in ['verified','new'], f'{p}: baseline not ready')
    for artifact in m.get('artifacts',[]):
        check(artifact.get('version') == meta.get('version'), 'artifact version mismatch')
        check(file_exists(artifact.get('path')), 'artifact file missing: '+str(artifact.get('path')))
    return errors, notes


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('contract', type=Path)
    parser.add_argument('--gate', choices=['structure','ready'], default='structure')
    args=parser.parse_args()
    try:
        errors, notes=validate(load(args.contract), args.contract.parent, args.gate=='ready')
    except (ValueError, TypeError, KeyError, AttributeError, OSError) as error:
        print(json.dumps({'gate':args.gate,'pass':False,'errors':[str(error)]},ensure_ascii=False))
        return 2
    print(json.dumps({'gate':args.gate,'pass':not errors,'errors':errors,'notes':notes,
                      'limit':'Checks structure and declared evidence only; not business truth, browser behavior or production acceptance.'},ensure_ascii=False,indent=2))
    return 1 if errors else 0


if __name__=='__main__':
    sys.exit(main())
