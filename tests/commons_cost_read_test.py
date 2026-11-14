#!/usr/bin/env python3
"""The Commons data dashboard reads a college's cost as what its filed records cost to read (S653).

summarize() in kb/_program_requirements_college.py writes cost_usd_filed and cost_usd_run; a summary written
before S647 carries cost_usd alone. The builder read cost_usd only, so every college a reconcile rescored fell out
of the statewide cost totals (cost_usd, passed_at_read, cost_receipts). Guards, one summary of each shape:
  (1) old shape, cost_usd alone: that figure;
  (2) reconcile's two fields: cost_usd_filed, never this run's spend;
  (3) a free rescore, cost_usd_run 0.0: still the filed cost, never zero;
  (4) no cost at all: None, so the college stays out of the totals rather than counting as free;
  (5) harvest() reads the cost through filed_cost, so the guard covers the figure the page shows.

Run from the repo root: python3 tests/commons_cost_read_test.py
"""
import importlib.util
import inspect
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("build_cdd", os.path.join(ROOT, "kb", "_build_commons_data_status.py"))
B = importlib.util.module_from_spec(spec)
spec.loader.exec_module(B)

fails = []


def check(label, got, want):
    if got != want:
        fails.append(f"{label}: got {got!r}, want {want!r}")


check("(1) old shape", B.filed_cost({"cost_usd": 9.69, "passed_machine_checks": 134}), 9.69)
check("(2) reconcile shape", B.filed_cost({"cost_usd_run": 5.12, "cost_usd_filed": 16.04}), 16.04)
check("(3) free rescore", B.filed_cost({"cost_usd_run": 0.0, "cost_usd_filed": 9.69}), 9.69)
check("(4) no cost", B.filed_cost({"passed_machine_checks": 10}), None)
src = inspect.getsource(B.harvest)
if '"cost_usd": filed_cost(summary)' not in src or 'summary.get("cost_usd")' in src:
    fails.append("(5) harvest() must read the cost through filed_cost(summary)")

if fails:
    print("FAIL\n  " + "\n  ".join(fails))
    raise SystemExit(1)
print("ok: the Commons cost read, 5 guards")
