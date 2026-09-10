#!/usr/bin/env python3
"""SessionStart hint: tell the session to announce itself on COBI's banner.

DR-26 Option B (Sam, 2026-09-10): *"I'd prefer it be automatic as long as I set
the CC session public ... perhaps add an opt out for me rather than the admin
procedure which takes just enough steps that I will likely neglect to do it."*

⚠️ WHY THIS IS A HINT AND NOT THE ACTION.  Two hard constraints, both measured
rather than assumed (2026-09-10):

  1. THE CONTAINER DOES NOT KNOW THE SESSION'S claude.ai ID.  `CLAUDE_CODE_
     SESSION_ID` and the transcript filename are the same internal UUID
     (c49acb9f-…), not the `session_01…` id the banner URL needs.  Only the
     `get_session` MCP tool returns that, and only the model can call it.
  2. THE SANDBOX CANNOT REACH `*.supabase.co` (Rule 10c), so a hook could not
     write the row even if it had the id.  The write goes through the Supabase
     MCP tools, which again means the model.

So the hook does the one thing a hook can do: put the instruction where the
session will read it.  Everything else is the session's own work.

⚠️ IT PRINTS UNCONDITIONALLY.  It cannot read `auto_announce` (constraint 2), so
the flag is checked by the session, not here.  A hint on a session that turns
out to be opted out costs one Supabase read; a hook that tried to be clever
about it would need the network it does not have.

Exits 0 always.  A SessionStart hook that fails is a session that will not
start, and a banner is never worth that.
"""
import sys

HINT = """\
COBI live-session banner (DR-26 Option B, Sam 2026-09-10) — announce this session:

  1. Read the opt-out first:
       select auto_announce, session_url, expires_at from cobi_live_session where id = 1;
     If auto_announce is false, STOP — Sam has opted out. Say nothing.
  2. Get this session's claude.ai id with the get_session MCP tool (the container
     only knows a different internal UUID, so nothing else will give it to you).
  3. Write the row, last-writer-wins — Sam runs several sessions at once and the
     banner points at whichever announced most recently:
       update cobi_live_session
          set active = true,
              session_url = 'https://claude.ai/code/<id from step 2>',
              expires_at  = now() + interval '8 hours',
              updated_by  = '<your moniker> — auto-announce'
        where id = 1 and auto_announce is true;
  4. Mention it in ONE line so Sam can veto it, and remember: the banner cannot
     tell whether he has shared the session, so the link only opens for the team
     once he sets it to Team visibility in claude.ai.

Full procedure and the reasoning: docs/reference/live_session_banner.md
"""

def main():
    sys.stdout.write(HINT)
    return 0

if __name__ == "__main__":
    sys.exit(main())
