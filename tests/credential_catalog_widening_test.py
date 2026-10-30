#!/usr/bin/env python3
"""Guards for the any-field widening of kb/_build_it_ai_credential_catalog.py (Sam, 2026-10-30).

The failure modes worth a test, none of them "does it parse":
  1. A GUESSED FIELD. A credential no source places reads "Not yet assigned"
     with a null CIP code; the build never invents one.
  2. THE REGISTRY'S OWN CIP LOSING TO A RULE. A CTDL instructionalProgramType
     outranks the name rules and the SOC fallback.
  3. A CTID ON THE WRONG CREDENTIAL. Two boards' "Certified Dental Assistant"
     are two credentials; a CTID rides only on the owner's row.
  4. A DEAD CIP CODE in any rule table (the build fails on one).

Run: python3 tests/credential_catalog_widening_test.py
"""
import json
import os
import sys
import unittest

REPO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
sys.path.insert(0, os.path.join(REPO, "kb"))
import _build_it_ai_credential_catalog as b  # noqa: E402


class FieldCip(unittest.TestCase):
    def test_registry_cip_outranks_rules(self):
        ctdl = {"instructional_program_type": [{"code": "03.0601", "name": "Wildlife"}]}
        self.assertEqual(b.field_cip("Certified Welder", ctdl)[0], "03.0601")

    def test_name_before_issuer_before_soc(self):
        self.assertEqual(b.field_cip("Certified Welder", None, "Some Board of Medicine")[0], "48.0508")
        self.assertEqual(b.field_cip("Spectacle Lens Dispenser", None, "Board of Optometry")[0], "51.1801")
        soc = {"occupation_type": [{"code": "53-3032.00", "name": "Heavy truck drivers"}]}
        self.assertEqual(b.field_cip("Widget Credential", soc, "Widget Council")[0], "49.0205")

    def test_unplaced_credential_is_not_guessed(self):
        self.assertEqual(b.field_cip("Concepts of Business Management", None, "Assessment Group"), (None, None))

    def test_every_rule_code_is_live(self):
        titles = b.load_cip_titles(os.path.join(REPO, "kb", "reference", "CIPCode2020.csv"))
        codes = [c for _p, c in b.FIELD_RULES + b.ISSUER_FIELD_RULES] + list(b.SOC_MAJOR_CIP.values())
        self.assertEqual([c for c in codes if c not in titles], [])


class Built(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(os.path.join(REPO, "kb", "it_ai_credential_catalog.json"), encoding="utf-8") as fh:
            cls.cat = json.load(fh)

    def test_unassigned_rows_carry_no_code(self):
        for r in self.cat["credentials"]:
            if r["domain"] == b.NO_FIELD:
                self.assertIsNone(r["cip"]["code"], r["name"])
            else:
                self.assertTrue(r["cip"]["code"], r["name"])

    def test_the_fifty_are_all_in_the_catalog(self):
        st = self.cat["_stats"]
        self.assertEqual((st["ce_top50_in_catalog"], st["ce_top50_total"]), (50, 50))

    def test_a_ctid_rides_only_where_the_issuer_is_its_owner_or_the_row_is_it(self):
        with open(os.path.join(REPO, "kb", "reference", "credential_engine_top50.json"), encoding="utf-8") as fh:
            top = {t["ctid"]: t for t in json.load(fh)["credentials"]}
        for r in self.cat["credentials"]:
            if r.get("ctid") and r["domain"] in (b.NO_FIELD,) or (r.get("ctid") and r["cip"]["source"] != "rule (domain and name)"):
                t = top[r["ctid"]]
                owner = b.issuer_of(b.ctdl_owner(t))[0] or b.ctdl_owner(t)
                self.assertEqual(r["issuer"], owner, r["name"])


if __name__ == "__main__":
    unittest.main()
