-- NC-1's mirror channel, counted (Sam's ask 2 of 2026-10-24: "a metric that can be counted rather than attested").
-- An exhibit counts when one of its target credit courses has a noncredit twin at the same college: a CDCP noncredit
-- course whose normalized title equals the credit course's (title_norm, the S449 mirror rule). Run through the
-- Supabase MCP, 2026-10-24 ~17:35Z (S468). An exhibit with no exhibit_id (61 statewide) is keyed by its title, so
-- count(distinct) does not drop it; sample_courses lists an exhibit's target courses, so the count is a floor.
with cc as (select college, subject||' '||course_number code, title_norm, credit_type
            from chatbox_college_courses where title_norm is not null and title_norm <> ''),
cdcp as (select college, count(*) n from cc
         where credit_type in ('Other Noncredit Enhanced Funding','Workforce Preparation Enhanced Funding') group by 1),
ncn as (select distinct college, title_norm from cc
        where credit_type in ('Other Noncredit Enhanced Funding','Workforce Preparation Enhanced Funding')),
ex as (select college, coalesce(exhibit_id::text, 't:'||exhibit_title) xid, unnest(sample_courses) code from chatbox_exhibits),
hit as (select ex.college, count(distinct ex.xid) n
        from ex join cc t on t.college = ex.college and t.code = ex.code and t.credit_type = 'Credit Course'
        join ncn on ncn.college = ex.college and ncn.title_norm = t.title_norm group by 1)
select cdcp.college, cdcp.n as cdcp, least(10, greatest(2, ceil(0.05 * cdcp.n)))::int as target, coalesce(hit.n, 0) as mirrored_exhibits
from cdcp left join hit on hit.college = cdcp.college where cdcp.n > 0 order by mirrored_exhibits desc, college;
