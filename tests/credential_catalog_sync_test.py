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


class RetiredNames(unittest.TestCase):
    """Sam, 2026-11-11: an approved rename keeps the old title as a search alias. Sierra's tiers 2 and 4 read
    raw_variants, so the old name rides on the live successor's row; then its ghost row can go
    (kb/_chatbox_ghost_delete.py holds a ghost until it does)."""

    def setUp(self):
        import tempfile
        self.root = tempfile.mkdtemp(prefix="retired_names_")
        kb = os.path.join(self.root, "kb")
        os.makedirs(kb)
        # Live in the credential layer: Gamma, Delta, Echo (Echo was renamed away once, then brought back), Omega.
        with open(os.path.join(kb, "credentials.json"), "w") as f:
            json.dump({"Gamma": [], "Delta": [], "Echo": [], "Omega": []}, f)
        snaps = {
            "2026-11-01": ("2026-11-01T10:00:00Z", {"Alpha": "Beta", "Echo": "Delta", "Zeta": "Omega",
                                                    "Kappa": "Gamma"}),
            "2026-11-02": ("2026-11-02T10:00:00Z", {"Beta": "Gamma"}),
        }
        for name, (at, renames) in snaps.items():
            d = os.path.join(kb, "cred_rename_out", name)
            os.makedirs(d)
            with open(os.path.join(d, "alias_map.json"), "w") as f:
                json.dump({"_applied_at": at, "renames": renames, "merges": {}}, f)
        # The reference this sync upserts: no Omega (a successor it does not carry), and Kappa is a title here.
        self.titles = {"Gamma", "Delta", "Echo", "Kappa"}

    def tearDown(self):
        import shutil
        shutil.rmtree(self.root, ignore_errors=True)

    def retired(self):
        return sync.retired_names(self.titles, root=self.root)

    def test_a_chain_resolves_to_its_final_live_title(self):
        # Alpha -> Beta -> Gamma, and Beta -> Gamma: both old names land on Gamma, sorted.
        self.assertEqual(self.retired().get("Gamma"), ["Alpha", "Beta"])

    def test_an_old_name_live_again_is_not_added(self):
        # Echo -> Delta was applied, but Echo is live again: it answers as itself.
        self.assertNotIn("Delta", self.retired())

    def test_a_successor_this_sync_does_not_upsert_adds_nothing(self):
        # Zeta -> Omega: Omega is live in the credential layer but not in the reference.
        self.assertNotIn("Omega", self.retired())
        self.assertNotIn("Zeta", [n for v in self.retired().values() for n in v])

    def test_an_old_name_that_is_a_reference_title_is_skipped(self):
        self.assertNotIn("Kappa", self.retired().get("Gamma", []))

    def test_the_old_name_lands_in_the_successors_raw_variants_once(self):
        doc = {"_generated_at": None, "unified_titles": [
            rec(ut="Gamma", raw_variants=[{"r": "GAMMA cert"}, {"r": "beta"}]),
            rec(ut="Delta", raw_variants=[]),
        ]}
        rows = {r["unified_title"]: r for r in sync.build_rows(doc, retired=self.retired())}
        # "beta" is already a variant (Sierra compares lower-case), so only Alpha is added, after the college ones.
        self.assertEqual(rows["Gamma"]["raw_variants"], ["GAMMA cert", "beta", "Alpha"])
        self.assertIn("alpha", rows["Gamma"]["search_text"])
        self.assertEqual(rows["Delta"]["raw_variants"], [])

    def test_no_row_count_change(self):
        doc = {"_generated_at": None, "unified_titles": [rec(ut=t) for t in sorted(self.titles)]}
        self.assertEqual(len(sync.build_rows(doc, retired=self.retired())), len(sync.build_rows(doc, retired={})))
        self.assertEqual(len(sync.build_rows(doc, retired=self.retired())), len(self.titles))


class AgainstTheRealArtifact(unittest.TestCase):
    """Skipped in a clean checkout; runs wherever the baked payload exists."""

    @classmethod
    def setUpClass(cls):
        if not os.path.exists(sync.ARTIFACT):
            raise unittest.SkipTest("credential_reference_data.js absent")
        cls.rows = sync.build_rows(sync.load_artifact())

    def test_every_statewide_credential_can_answer_cred_std(self):
        # CRED-STD answers from ccc_rec OR the published statewide set, the Fact
        # Sheet builder's. ccc_rec is derived from adoptions, so a gate on it
        # alone hides every statewide credential no college has adopted yet
        # (the sierra-retrieval-corpus lane). The one known gap is the
        # builder's MAP fix list: a statewide exhibit MAP publishes with no
        # CCC-tagged recommendation, which Sierra still names without a line.
        recs = importlib.import_module("_build_credential_recs")
        if not os.path.exists(recs.ARTIFACT):
            self.skipTest("statewide_data.js absent")
        data = recs.load_artifact()
        published = recs.statewide_sets(data)
        _, fix_in_map = recs._load_factsheet_builder().build(data)
        fix_in_map = set(fix_in_map)
        missing = [r["unified_title"] for r in self.rows
                   if r["statewide"] and not r["ccc_rec"]
                   and not published.get(r["unified_title"])
                   and r["unified_title"] not in fix_in_map]
        self.assertEqual(missing, [],
                         "statewide credentials with no recommendation text "
                         "and not on the Fact Sheet builder's MAP fix list")
        # The published set must actually carry the adoption-less ones; if it
        # went empty, the fix list would be the whole statewide set.
        reached = [r for r in self.rows if r["statewide"] and not r["ccc_rec"]
                   and published.get(r["unified_title"])]
        self.assertTrue(reached, "no statewide credential reaches a rec "
                        "through the published set")
        self.assertLess(len(fix_in_map), len(published),
                        "the MAP fix list outgrew the published statewide set")

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
