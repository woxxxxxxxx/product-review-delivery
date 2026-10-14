"""Negative checks for guards that prevent a misleading delivery pass."""
import copy
from pathlib import Path
import unittest
from check_contract import load, validate

ROOT = Path(__file__).resolve().parents[1] / 'assets' / 'review-kit'

class ContractTests(unittest.TestCase):
    def setUp(self):
        self.m = copy.deepcopy(load(ROOT/'data.js'))
    def errors(self, ready=False):
        return validate(self.m, ROOT, ready)[0]
    def test_example_has_valid_structure(self):
        self.assertEqual(self.errors(), [])
    def test_example_cannot_claim_ready(self):
        self.assertTrue(self.errors(True))
    def test_unknown_reference_is_rejected(self):
        self.m['pages'][0]['requirements']=['R-missing']
        self.assertTrue(any('unknown requirement' in x for x in self.errors()))
    def test_dead_end_is_rejected(self):
        self.m['transitions']=[t for t in self.m['transitions'] if t['from']!='unknown']
        self.assertTrue(any('unknown: nonterminal has no exit' in x for x in self.errors()))
    def test_discontinuous_case_is_rejected(self):
        self.m['cases'][0]['path']=['T-05']
        self.assertTrue(any('discontinuous' in x for x in self.errors()))
    def test_fake_live_claim_is_rejected(self):
        self.m['pages'][0]['baseline']='verified'
        self.assertTrue(any('verified without evidence' in x for x in self.errors()))
    def test_test_environment_cannot_prove_production(self):
        self.m['meta']['environment']='production'
        self.m['pages'][0].update(baseline='verified', evidence=['E-01'])
        self.m['evidence']=[{'id':'E-01','kind':'live','rechecked':True,'environment':'uat'}]
        self.assertTrue(any('environment mismatch' in x for x in self.errors()))
    def test_fake_test_pass_is_rejected(self):
        self.m['cases'][0]['result']='pass'
        self.assertTrue(any('pass without saved run evidence' in x for x in self.errors()))
    def test_missing_applicability_is_rejected(self):
        self.m['coverage']=[]
        self.assertTrue(any('missing applicability' in x for x in self.errors()))
    def test_omitted_role_cannot_pass_ready(self):
        self.m['reviews']=[]
        self.assertTrue(any('missing review roles' in x for x in self.errors(True)))

if __name__=='__main__':
    unittest.main()
