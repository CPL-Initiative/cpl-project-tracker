#!/usr/bin/env python3
"""Guards for kb/_sync_credential_catalog.py — the loader behind route CRED-STD.

Two failure modes are worth a test here, and neither is "does it parse":

  1. ADOPTER / POTENTIAL CONFLATION. These are disjoint sets. A college in
     potential_colleges has NOT articulated the credential. Mixing them makes a
     chatbot claim credit is available where it isn't, which sends a person to a
     counter where nobody expects them — the exact thing the v35 student rule
     forbids. Nothing else in the pipeline would catch it.

  2. SUPPRESSION LEAKING. students_served must be inherited from the published
     artifact, never recomputed. If someone repoints the loader at raw data, an
     exact sub-floor headcount reaches a world-readable table.

Run: python3 tests/credential_catalog_sync_test.py
"""

import json
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "kb"))
import importlib

sync = importlib.import_module("_sync_credential_catalog")

REPO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


def rec(**kw):
    base = {
        "ut": "Test Credential", "statewide": True, "ccc_rec": "3 hours in Something",
        "raw_variants": [{"r": "TEST CRED", "c": 0.9}], "articulations": [],
        "potential_colleges": [], "issuer": "Some Agency",
    }
    base.update(kw)
    return base


class AdopterPotential(unittest.TestCase):
    def test_adopters_come_from_nested_articulations(self):
        r = rec(articulations=[
            {"local": [{"colleges": ["Alpha College", "Beta College"]},
                       {"colleges": ["Beta College"]}]},
            {"local": [{"colleges": ["Gamma College"]}]},
        ])
        self.assertEqual(sync.adopters_of(r),
                         ["Alpha College", "Beta College", "Gamma College"])

    def test_adopters_and_potential_stay_separate(self):
        r = rec(articulations=[{"local": [{"colleges": ["Alpha College"]}]}],
                potential_colleges=["Zeta College", "Omega College"])
        row = sync.to_row(r, None)
        self.assertEqual(row["adopter_colleges"], ["Alpha College"])
        self.assertEqual(row["potential_colleges"], ["Zeta College", "Omega College"])
        # The failure that matters: a potential college must never appear as an
        # adopter. Asserted as a set relation so it holds for any input.
        self.assertEqual(
            set(row["adopter_colleges"]) & set(row["potential_colleges"]), set(),
            "a potential college leaked into adopters — this fabricates a route")

    def test_no_articulations_means_no_adopters_not_an_error(self):
        row = sync.to_row(rec(articulations=[]), None)
        self.assertEqual(row["adopter_colleges"], [])


class SuppressionInheritance(unittest.TestCase):
    def test_suppressed_record_carries_no_count(self):
        row = sync.to_row(rec(students_served=None, served_suppressed=True), None)
        self.assertIsNone(row["students_served"])
        self.assertTrue(row["served_suppressed"])

    def test_a_masked_string_never_becomes_a_number(self):
        # If upstream ever bakes the mask itself ("<10") rather than null, it must
        # land as NULL, not be coerced into an integer column.
        row = sync.to_row(rec(students_served="<10", served_suppressed=True), None)
        self.assertIsNone(row["students_served"])

    def test_exact_count_passes_through(self):
        row = sync.to_row(rec(students_served=42), None)
        self.assertEqual(row["students_served"], 42)

    def test_zero_is_distinct_from_suppressed(self):
        row = sync.to_row(rec(students_served=0, served_suppressed=False), None)
        self.assertEqual(row["students_served"], 0)
        self.assertFalse(row["served_suppressed"])


class SearchText(unittest.TestCase):
    def test_variants_are_searchable(self):
        # The whole point: a person's phrasing reaches the canonical name through
        # a variant, not through the canonical title.
        r = rec(ut="POST Basic Academy", raw_variants=[
            {"r": "Peace Officer Standardized Training Academy", "c": 0.9}])
        st = sync.search_text_for(r, [])
        self.assertIn("peace officer standardized", st)
        self.assertIn("post basic academy", st)

    def test_lowercased_and_whitespace_collapsed(self):
        r = rec(ut="  Mixed   Case\tTitle ", raw_variants=[])
        self.assertEqual(sync.search_text_for(r, [])[:16], "mixed case title")


class DuplicateGuard(unittest.TestCase):
    def test_duplicate_titles_fail_loudly(self):
        doc = {"_generated_at": None, "unified_titles": [rec(ut="Dup"), rec(ut="Dup")]}
        with self.assertRaises(SystemExit):
            sync.build_rows(doc)

    def test_untitled_records_are_dropped_not_crashed(self):
        doc = {"_generated_at": None, "unified_titles": [rec(ut="Real"), {"ut": ""}]}
        self.assertEqual([r["unified_title"] for r in sync.build_rows(doc)], ["Real"])


class AgainstTheRealArtifact(unittest.TestCase):
    """Skipped in a clean checkout; runs wherever the baked payload exists."""

    @classmethod
    def setUpClass(cls):
        if not os.path.exists(sync.ARTIFACT):
            raise unittest.SkipTest("credential_reference_data.js absent")
        cls.rows = sync.build_rows(sync.load_artifact())

    def test_every_statewide_credential_can_answer_cred_std(self):
        missing = [r["unified_title"] for r in self.rows
                   if r["statewide"] and not r["ccc_rec"]]
        self.assertEqual(missing, [],
                         "statewide credentials with no recommendation text")

    def test_post_folds_its_variants_and_knows_its_adopters(self):
        post = next((r for r in self.rows
                     if r["unified_title"] == "POST Basic Academy"), None)
        self.assertIsNotNone(post, "POST Basic Academy missing from the artifact")
        self.assertTrue(post["statewide"])
        self.assertEqual(post["ccc_rec"], "3 hours in Criminal Investigation")
        # The measured facts that motivated this whole route.
        self.assertGreaterEqual(len(post["raw_variants"]), 10)
        self.assertGreaterEqual(len(post["adopter_colleges"]), 30)
        self.assertEqual(set(post["adopter_colleges"]) & set(post["potential_colleges"]),
                         set())
        # Positive control for the variant-search claim: a variant that does NOT
        # contain "POST" must still be present, since that is exactly the string
        # raw-title matching misses.
        self.assertTrue(
            any("post" not in v.lower() for v in post["raw_variants"]),
            "expected at least one POST variant with no 'POST' substring")

    def test_no_adopter_potential_overlap_anywhere(self):
        bad = [r["unified_title"] for r in self.rows
               if set(r["adopter_colleges"]) & set(r["potential_colleges"])]
        self.assertEqual(bad[:5], [], f"{len(bad)} credential(s) with overlap")

    def test_no_exact_subfloor_count_reaches_the_table(self):
        # Whatever the floor is, a suppressed record must carry no number.
        leaked = [r["unified_title"] for r in self.rows
                  if r["served_suppressed"] and r["students_served"] is not None]
        self.assertEqual(leaked, [], "suppressed records carrying an exact count")


if __name__ == "__main__":
    unittest.main(verbosity=2)
