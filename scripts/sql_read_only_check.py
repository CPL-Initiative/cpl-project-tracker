"""Fail a SQL file unless it is one read-only statement.

Usage: python3 -I scripts/sql_read_only_check.py <file.sql>  (S685: run it on a live-read SQL before it is pushed)
Passes only when, with comments removed, the file is a single statement (no semicolon outside a string literal
except one at the very end), it starts with `with` or `select`, and none of the write or DDL words appears as a
word anywhere outside comments (string literals included, the stricter reading).
"""
import re
import sys

BANNED = ["insert", "update", "delete", "merge", "truncate", "alter", "drop", "create", "grant", "revoke",
          "call", "do", "copy"]


def strip_comments(sql):
    out, i, n, in_str = [], 0, len(sql), False
    while i < n:
        c = sql[i]
        if in_str:
            out.append(c)
            if c == "'":
                if i + 1 < n and sql[i + 1] == "'":
                    out.append("'")
                    i += 1
                else:
                    in_str = False
            i += 1
        elif c == "'":
            in_str = True
            out.append(c)
            i += 1
        elif sql.startswith("--", i):
            j = sql.find("\n", i)
            i = n if j < 0 else j
        elif sql.startswith("/*", i):
            j = sql.find("*/", i + 2)
            if j < 0:
                raise SystemExit("FAIL: unclosed block comment")
            i = j + 2
            out.append(" ")
        else:
            out.append(c)
            i += 1
    if in_str:
        raise SystemExit("FAIL: unclosed string literal")
    return "".join(out)


def main(path):
    with open(path, encoding="utf-8") as fh:
        sql = strip_comments(fh.read())
    failures = []
    code = re.sub(r"'(?:[^']|'')*'", "''", sql)  # literals emptied, for the statement count only
    body = code.strip()
    if body.endswith(";"):
        body = body[:-1]
    if ";" in body:
        failures.append("more than one statement (a semicolon before the end)")
    first = re.match(r"\s*([A-Za-z_]+)", sql)
    if not first or first.group(1).lower() not in ("with", "select"):
        failures.append("starts with %r, not with or select" % (first.group(1) if first else ""))
    lowered = sql.lower()
    for w in BANNED:
        hits = re.findall(r"(?<![a-z0-9_])%s(?![a-z0-9_])" % w, lowered)
        if hits:
            failures.append("holds %r %d time(s)" % (w, len(hits)))
    if failures:
        print("FAIL %s: %s" % (path, "; ".join(failures)))
        sys.exit(1)
    print("PASS %s: one statement, starts with %s, no write or DDL word outside comments"
          % (path, first.group(1).lower()))


if __name__ == "__main__":
    main(sys.argv[1])
