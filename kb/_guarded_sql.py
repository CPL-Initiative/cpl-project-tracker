"""One guarded-UPDATE shape for the cheap-piles plans on program_requirement_records (S680, #3496 review).

Every apply and every rollback built here:
  * never writes a row a person has checked (CLAUDE.md, "Person-settled wins"): the UPDATE carries
    `r.checked is not true`, and the returned value lists the plan's rows that were checked as `skipped_checked`;
  * aborts, writing nothing, unless it matched exactly the plan's count less the rows checked at that moment
    (`expect` minus `skipped_checked`). The abort is a failed cast in the final SELECT: Postgres runs the
    data-modifying CTE and the SELECT as one statement, so the error rolls back both;
  * states its count in one place, the `e(expect)` line: a partial rollback runs only when a person edits that
    number to the smaller count they mean.

guarded(v_cte, update, expect, tag) takes the plan's values CTE ("with v(i, college, control_number, ...) as
(values ...)") and an UPDATE that ends "returning v.i".
"""


def _q(s) -> str:
    return "'%s'" % str(s).replace("'", "''")


def guarded(v_cte: str, update: str, expect: int, tag: str, rollback: bool = False) -> str:
    note = ("-- A partial rollback: set expect below to the smaller count you mean.\n" if rollback else "")
    return (v_cte + ",\n"
            "c as (select count(*) filter (where r.checked is true) as n,\n"
            "             coalesce(json_agg(v.i order by v.i) filter (where r.checked is true), '[]'::json) as keys\n"
            "        from v join public.program_requirement_records r\n"
            "          on r.college = v.college and r.control_number = v.control_number),\n"
            + note +
            "e(expect) as (values (%d)),\n"
            "u as (\n%s\n   and r.checked is not true\nreturning v.i),\n"
            "s as (select count(*) as n, coalesce(json_agg(i order by i), '[]'::json) as keys from u)\n"
            "select case when s.n = e.expect - c.n\n"
            "            then json_build_object('returned', s.n, 'keys', s.keys, 'skipped_checked', c.keys)\n"
            "            else (%s || s.n || ' rows, the plan names ' || (e.expect - c.n))::int::text::json end as returned\n"
            "  from s, c, e;" % (expect, update.rstrip(), _q("%s guard: the UPDATE matched " % tag)))
