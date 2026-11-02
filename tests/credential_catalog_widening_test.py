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
  5. THE MAP JOIN (2026-10-31). A name join outside IT needs the issuer to agree: a
     college's own "Bookkeeping" course is not NACPB's certification, and two
     same-named rows from two issuers resolve to the one whose issuer MAP names.
     The hand check of Credential Engine's top 50 wins: its 11 in_map credentials
     come out in MAP, and its related and not_in_map ones stay out (ASE Entry-Level
     is not ASE G1; PCEP is not PCAP). Acronym twins need the issuer too (CDA, CPT).
  6. THE EXAMS (S546, 2026-11-02). Every official AP, CLEP and IB exam the fold readers
     list is a catalog row of kind "exam" under its issuer, a retired exam marked retired
     (never IB Mathematics: Analysis and Approaches, which merely shares a prefix with the
     retired IB Mathematics), and every reference title that is an official exam joins its
     row; the link holds each one, and a title naming no one exam stays unresolved.

Run: python3 tests/credential_catalog_widening_test.py
"""
import json
import os
import sys
import unittest

REPO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
sys.path.insert(0, os.path.join(REPO, "kb"))
import _build_it_ai_credential_catalog as b  # noqa: E402
import _build_exhibit_cert_links as lk  # noqa: E402


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


class IssuerAgrees(unittest.TestCase):
    def test_same_body_under_its_other_names(self):
        self.assertTrue(b.issuer_agrees("PMI", "Project Management Institute (PMI)"))
        self.assertTrue(b.issuer_agrees("Environmental Protection Agency (EPA)", "U.S. Environmental Protection Agency (EPA)"))
        self.assertTrue(b.issuer_agrees("National Center for Construction Education and Research (NCCER)", "NCCER"))
        self.assertTrue(b.issuer_agrees("Green Business Certification Inc.",
                                        "U.S. Green Building Council (USGBC) / Green Business Certification Inc. (GBCI)"))
        self.assertTrue(b.issuer_agrees("Intuit, Inc.", "Intuit"))
        self.assertTrue(b.issuer_agrees("Open Education and Development Group LLC", "C++ Institute"))

    def test_a_college_course_or_another_body_never_agrees(self):
        self.assertFalse(b.issuer_agrees("National Association of Certified Public Bookkeepers", "California Community Colleges"))
        self.assertFalse(b.issuer_agrees("International Code Council", "International Fire Service Accreditation Congress (IFSAC) / Pro Board"))
        self.assertFalse(b.issuer_agrees("National Association of Certified Public Bookkeepers", "Intuit"))
        self.assertFalse(b.issuer_agrees("Dental Assisting National Board (DANB)", "Council for Professional Recognition"))
        self.assertFalse(b.issuer_agrees("National Healthcareer Association (NHA)", "Manufacturing Skill Standards Council (MSSC)"))
        self.assertFalse(b.issuer_agrees("", "PMI"))


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

    def _checks(self):
        with open(os.path.join(REPO, "kb", "reference", "credential_engine_top50_map_check.json"), encoding="utf-8") as fh:
            return json.load(fh)["checks"]

    def test_the_hand_checks_in_map_come_out_in_map(self):
        checks = [c for c in self._checks() if c["verdict"] == "in_map"]
        self.assertEqual(len(checks), 11)
        for c in checks:
            rows = [r for r in self.cat["credentials"] if r.get("ctid") == c["ctid"]]
            self.assertTrue(rows, c["name"])
            for r in rows:
                self.assertNotEqual(r["map_status"], "not in MAP", c["name"])
                self.assertIn(c["map_title"], r["map"]["titles"], c["name"])

    def test_related_and_not_in_map_stay_out(self):
        for c in self._checks():
            if c["verdict"] in ("related", "not_in_map"):
                for r in self.cat["credentials"]:
                    if r.get("ctid") == c["ctid"]:
                        self.assertEqual(r["map_status"], "not in MAP", c["name"])

    def test_near_misses_are_not_joined(self):
        def titles(name):
            return [t for r in self.cat["credentials"] if r["name"] == name for t in (r.get("map") or {}).get("titles", [])]
        self.assertNotIn("ASE G1 — Auto Maintenance and Light Repair", titles("ASE Entry Level -Auto: Maintenance and Light Repair (MLR)"))
        self.assertNotIn("PCAP — Certified Associate in Python Programming", titles("Certified Entry-Level Python Programmer (PCEP)"))
        self.assertEqual(titles("Bookkeeping Certification"), [])
        self.assertEqual(titles("First Aid Certification"), [])
        self.assertNotIn("Child Development Associate (CDA) Credential", titles("Certified Dental Assistant (CDA)"))


class Exams(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(os.path.join(REPO, "kb", "it_ai_credential_catalog.json"), encoding="utf-8") as fh:
            cls.rows = {r["name"]: r for r in json.load(fh)["credentials"] if r.get("kind") == "exam"}
        with open(os.path.join(REPO, "kb", "exhibit_cert_links.json"), encoding="utf-8") as fh:
            cls.links = json.load(fh)["links"]

    def test_every_official_exam_is_a_row_with_its_status(self):
        for fam in b.official_exam_lists():
            for name, retired in fam["exams"]:
                r = self.rows.get(name) or self.rows.get(name.replace(" (Non-English)", ""))
                self.assertIsNotNone(r, name)
                self.assertEqual(r["issuer"], fam["issuer"], name)
                if name in self.rows:
                    self.assertEqual(r["status"], "retired" if retired else "active", name)

    def test_a_shared_prefix_is_not_retirement(self):
        self.assertEqual(self.rows["IB Mathematics: Analysis and Approaches HL"]["status"], "active")
        self.assertEqual(self.rows["IB Mathematics HL"]["status"], "retired")
        self.assertEqual(self.rows["AP Physics B"]["status"], "retired")

    def test_official_titles_join_and_link(self):
        for name in ("AP Biology", "CLEP Principles of Marketing", "IB Biology HL"):
            self.assertIn(name, (self.rows[name].get("map") or {}).get("titles", []), name)
            self.assertEqual(self.links[name]["certs"], [self.rows[name]["id"]], name)

    def test_two_exams_any_and_no_exam_unresolved(self):
        two = self.links["AP English Literature and Composition or AP English Language and Composition"]
        self.assertEqual((two["rule"], len(two["certs"])), ("any", 2))
        self.assertEqual(self.links["AP Physics"]["certs"], [])
        self.assertTrue(self.links["AP Physics"]["unresolved"])
        self.assertTrue(self.links["IB Language A1 HL (Non-English)"]["certs"])


class VendorCerts(unittest.TestCase):
    """CompTIA, Cisco and Microsoft (S548): every reference title in the table resolves, a version-less title holds
    any version, a two-cert bundle holds both, and a local course or a cert-less title is never linked to a cert."""

    @classmethod
    def setUpClass(cls):
        with open(os.path.join(REPO, "kb", "exhibit_cert_links.json"), encoding="utf-8") as fh:
            d = json.load(fh)
        cls.links, cls.certs = d["links"], d["certs"]

    def test_every_named_cert_is_in_the_catalog(self):
        for title, (rule, names) in lk.VENDOR.items():
            if title not in self.links:
                continue  # a title the reference no longer carries
            missing = [u for u in self.links[title].get("unresolved", []) if u.endswith("(not in the catalog)")]
            self.assertEqual(missing, [], title)
            self.assertEqual(len(self.links[title]["certs"]), len(set(self.links[title]["certs"])), title)

    def test_the_families(self):
        self.assertEqual(self.certs[self.links["CompTIA Network+"]["certs"][0]]["issuer"], "CompTIA")
        self.assertEqual(self.links["Microsoft Office Specialist — Excel"]["rule"], "any")
        self.assertGreater(len(self.links["Microsoft Office Specialist — Excel"]["certs"]), 1)
        both = self.links["Microsoft Office Specialist — Excel Expert and Access Expert (Office 2019)"]
        self.assertEqual((both["rule"], len(both["certs"])), ("all", 2))

    def test_no_cert_named_and_courses_stay_out(self):
        self.assertEqual(self.links["CompTIA Certification (unspecified)"]["certs"], [])
        self.assertTrue(self.links["CompTIA Certification (unspecified)"]["unresolved"])
        for course in ("Microsoft Excel 1", "Microsoft Word Beginning", "Using Microsoft Windows"):
            self.assertNotIn(course, self.links)
            self.assertNotIn(course, lk.VENDOR)


if __name__ == "__main__":
    unittest.main()
