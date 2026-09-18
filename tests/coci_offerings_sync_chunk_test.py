#!/usr/bin/env python3
"""A catalog-replace chunk the database cancels is retried smaller, never skipped,
and never re-truncates once a chunk has landed.

Why this exists (2026-09-18, S274): the merge of #1608 changed
chatbox/build_coci_offerings.py, which is a path trigger for
coci-offerings-sync.yml. The sync's 4,000-row chunks hit the authenticator
role's 8 s statement_timeout (57014) on chunk 4, then on chunk 3 of the re-run,
and because the first chunk truncates and each chunk is its own transaction,
coci_college_offerings sat LIVE at 12,000 and then 8,000 of 16,097 rows —
Sierra's offerings route answered from a partial catalog and both smoke runs on
v69 failed 7c's anchored-offerings check (Orange rows=2). Pure stdlib, no
network: _sb_rpc is replaced by a fake that records every call.
"""
import importlib.util
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT = os.path.join(ROOT, "chatbox", "sync_coci_offerings.py")
spec = importlib.util.spec_from_file_location("sync_coci_offerings", SCRIPT)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

TIMEOUT = ('{"code":"57014","details":null,"hint":null,'
           '"message":"canceling statement due to statement timeout"}')
OTHER = '{"code":"22P02","details":null,"hint":null,"message":"invalid input syntax for type integer"}'

passed = failed = 0


def check(label, ok, detail=""):
    global passed, failed
    if ok:
        passed += 1
        print(f"  ok   {label}")
    else:
        failed += 1
        print(f"  FAIL {label}{(' — ' + detail) if detail else ''}")


def run(rows, fake):
    """Install `fake` as the RPC and load `rows`; returns (calls, total_or_exception)."""
    calls = []

    def rpc(fn, body, key):
        part = body["p_rows"]
        calls.append((len(part), body["p_truncate"]))
        return fake(len(calls), part, body["p_truncate"])

    mod._sb_rpc = rpc
    try:
        total = mod._load_chunked("coci_offerings_replace", rows, "k")
    except BaseException as e:  # SystemExit is what the script raises to stop
        return calls, e
    return calls, total


rows = [{"college": f"C{i}"} for i in range(2500)]

print("(0) the measured sizes are pinned")
check("CHUNK is 1,000 (4,000 timed out twice on 2026-09-18)", mod.CHUNK == 1000, str(mod.CHUNK))
check("MIN_CHUNK is 250", mod.MIN_CHUNK == 250, str(mod.MIN_CHUNK))
check("a 57014 body is recognized as a statement timeout",
      mod._is_statement_timeout(mod._RpcError("f", 500, TIMEOUT)))
check("another error body is not", not mod._is_statement_timeout(mod._RpcError("f", 500, OTHER)))

print("(1) happy path: 2,500 rows land in 1,000 / 1,000 / 500, the first call truncates")
calls, total = run(rows, lambda n, part, trunc: len(part))
check("three calls", [c[0] for c in calls] == [1000, 1000, 500], str(calls))
check("only the first call truncates", [c[1] for c in calls] == [True, False, False], str(calls))
check("total is every row", total == 2500, str(total))

print("(2) the first chunk is canceled: it retries smaller and truncates again, then appends")
def cancel_above_300(n, part, trunc):
    if len(part) > 300:
        raise mod._RpcError("coci_offerings_replace", 500, TIMEOUT)
    return len(part)
calls, total = run(rows, cancel_above_300)
sizes = [c[0] for c in calls]
check("1,000 then 500 were canceled, 250 landed", sizes[:3] == [1000, 500, 250], str(sizes[:4]))
check("every canceled attempt at the start truncated (the delete rolled back with it)",
      all(c[1] for c in calls[:3]), str(calls[:3]))
check("no call after the first success truncates", not any(c[1] for c in calls[3:]), str(calls[3:6]))
check("every row landed at 250", total == 2500 and set(sizes[2:]) == {250}, f"{total} {set(sizes[2:])}")

print("(3) a LATER chunk is canceled: the retry appends — it never re-truncates")
def cancel_third_call(n, part, trunc):
    if n == 3:
        raise mod._RpcError("coci_offerings_replace", 500, TIMEOUT)
    return len(part)
calls, total = run(rows, cancel_third_call)
check("the canceled third call was an append", calls[2] == (500, False), str(calls))
check("its retry appended too", len(calls) >= 4 and calls[3][1] is False, str(calls))
check("total is every row, nothing counted twice", total == 2500, str(total))

print("(4) a chunk canceled at MIN_CHUNK stops the run loudly — no infinite loop, no skip")
def cancel_above_100(n, part, trunc):
    if len(part) > 100:
        raise mod._RpcError("coci_offerings_replace", 500, TIMEOUT)
    return len(part)
calls, err = run(rows, cancel_above_100)
check("the run raised SystemExit", isinstance(err, SystemExit), repr(err))
check("it names the 57014 body", isinstance(err, SystemExit) and "57014" in str(err), str(err)[:120])
check("it stopped after 1,000 / 500 / 250 — the floor is tried once, never looped", [c[0] for c in calls] == [1000, 500, 250], str(calls))

print("(5) any other error stops the run at once — a retry would hide a real defect")
def other_error(n, part, trunc):
    raise mod._RpcError("coci_offerings_replace", 400, OTHER)
calls, err = run(rows, other_error)
check("SystemExit on the first call", isinstance(err, SystemExit) and len(calls) == 1, f"{err!r} {calls}")
check("the message carries the function and the body",
      isinstance(err, SystemExit) and "coci_offerings_replace" in str(err) and "22P02" in str(err), str(err)[:120])

print("(6) _sb_rpc raises _RpcError rather than exiting, so the retry can see the body")
src = open(SCRIPT, encoding="utf-8").read()
check("the HTTPError branch raises _RpcError", "raise _RpcError(fn, e.code, detail)" in src)
check("main converts the geo replace's error to SystemExit", "except _RpcError as e:\n        raise SystemExit(str(e))" in src)

total_checks = passed + failed
print(f"\ncoci_offerings_sync_chunk_test.py: {passed}/{total_checks} checks passed")
sys.exit(1 if failed else 0)
