---
title: "The Library filer — every piece files itself to Drive"
created: 2026-10-06
updated: 2026-10-08
tags: [reference, library, drive, deliverables, filer]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
related:
  - "[[library]]"
---

# The Library filer

> **Parked (Sam, Open Asks Sheet 49, 2026-10-08).** The Library's files moved to a CPLLibrary folder on
> the MAP team's SharePoint site, which the whole team can open. Files reach it by hand and through Sam's
> OneDrive sync for now; the automatic upload comes later, into that same folder, *"so we avoid creating
> different artifact storage solutions."* This Drive filer is kept for that rewrite and is not run.
> [`lanes/library.md`](lanes/library.md) holds the current path.

`scripts/library_file.py` puts a deck, film, spreadsheet or document into the team
Drive and writes the receipt that records it in the Library (`cpl_library`). Sam's
calls 7 and 8 (2026-10-05): a session files each piece the moment it makes it, films
included, and every edit is its own file, `<date code>_<name>_vN`, with the original
date code kept. Lane state: [`lanes/library.md`](lanes/library.md).

## Using it

```
python3 scripts/library_file.py --check                                  # the sign-in and both folders
python3 scripts/library_file.py <file> --slug <record>                   # a new version, to Drafts
python3 scripts/library_file.py <file> --slug <record> --to library      # an approved piece
python3 scripts/library_file.py <file> --slug <record> --move --to library   # an existing file, its name kept
python3 scripts/library_file.py <file> --new --title "..." --kind deck   # a piece with no record yet
```

Each run prints the Drive link, writes `kb/receipts/library_filed/<date>_<slug>__<file>.sql`,
and names the migration to apply it under. Apply it with the Supabase MCP's
`apply_migration` under that name, then commit the receipt. The repo's `execute_sql`
guard refuses writes. A named migration is this repo's recorded path for a receipted
data write, as `cpl_library_seed_2026_10_05` was.

- **A new version** uploads `<date code>_<name>_vN`, with N one past the highest of
  that name in either folder. The record links the new file, and the version list
  marks earlier files of the same name *Replaced by vN*. Other cuts on the same record
  keep their own status.
- **`--move`** files an existing file under its own name, with no renumbering. The
  version entry whose link ends in that name now links Drive. The record's own link
  moves only if it pointed at that file.
- **`--new`** is INSERT-only (`ON CONFLICT (slug) DO NOTHING`).
- **Status is Sam's.** The filer changes it in one case only: a Requested record whose
  first draft lands in Drafts moves to Draft.

What it will not do: write anywhere but CPLLibrary and CPLLibrary/Drafts, or delete,
trash, rename or overwrite a file. A same-named file already in the folder with the
same bytes, for example one Sam dropped in by hand, is reused. One with different
bytes stops the run. Drive's size and md5 must match the local file, or no receipt
is written.

**Verified 2026-10-06** on a copy of the live rows in a local Postgres 16. Receipts
for all six files of PR 2 (four moves to CPLLibrary, two Summit cuts to Drafts) and
a v2 of the music cut each returned `UPDATE 1`, then `UPDATE 0` on a second apply.
The v2 marked the music cut *Replaced by v2* and left the narrated cut at Draft, and
a Requested record moved to Draft. Tests: `tests/library_file_test.py`.

## Setting up the sign-in (Sam, once, about ten minutes)

The filer signs in as the **camapinitiative** account with a stored Google sign-in:
three environment secrets. **Only new sessions read them.** The scope is the full
Drive scope. Google's narrow `drive.file` scope may write only into folders the app
itself created, and Sam made CPLLibrary by hand.

**A. Google Cloud console** (console.cloud.google.com, signed in as camapinitiative)

1. Create a project named *CPL Library filer*.
2. APIs & Services, Library, *Google Drive API*, **Enable**.
3. Google Auth Platform, **Get started**: app name *CPL Library filer*, support email
   camapinitiative, Audience **External**, contact email, agree, Create.
4. Branding: fill **Application home page**
   (`https://cpl-initiative.github.io/cpl-project-tracker/`) and **Application privacy
   policy link** (`https://cpl-initiative.github.io/cpl-project-tracker/privacy.html`),
   add `cpl-initiative.github.io` under **Authorized domains**, Save. Terms of service
   stays blank. Until both links are saved, Audience greys out **Publish app** with
   *"complete your configuration on the Branding page"* (measured 2026-10-06).
   Then Audience, **Publish app**, Confirm; the status reads **In production**. No test
   users. In *Testing*, Google ends the sign-in after 7 days, so publish before step 8.
5. Clients, **Create client**: type **Web application**, name *CPL Library filer*.
   Under *Authorized redirect URIs* add `https://developers.google.com/oauthplayground`,
   then Create. Copy the Client ID and the Client secret at once. Google shows the
   secret only once.

**B. OAuth Playground** (developers.google.com/oauthplayground)

6. The gear icon, top right: tick **Use your own OAuth credentials**, then paste the
   Client ID and secret.
7. In *Input your own scopes* (the box beside **Authorize APIs**; replace the
   `cloud-platform` scope it may hold), enter `https://www.googleapis.com/auth/drive`,
   then **Authorize APIs** and choose camapinitiative. Google may text a sign-in code;
   that is the account's own two-step check. The unverified-app warning comes in one of
   two forms: a full page *Google hasn't verified this app* (choose **Advanced**, then
   *Go to CPL Library filer (unsafe)*), or a yellow box on the consent screen itself
   (choose **Continue**). Either is normal for an app only its owner uses.
8. Step 2, **Exchange authorization code for tokens**, once. A successful exchange
   jumps the Playground to Step 3: reopen **Step 2** and copy the **Refresh token**
   (it starts with `1//`). A second press on the same code returns `invalid_grant`, as
   does a code issued before step 6's own credentials were set; authorize again.

**C. The Claude environment** (the cloud environment menu in a session's title bar,
then Edit)

9. In the **Environment variables** box, one line each, the value right after the `=`
   with no quotes or spaces: `GOOGLE_DRIVE_CLIENT_ID=` (ends
   `.apps.googleusercontent.com`), `GOOGLE_DRIVE_CLIENT_SECRET=` (starts `GOCSPX-`) and
   `GOOGLE_DRIVE_REFRESH_TOKEN=` (starts `1//`). **Not the *Add credential* form**: it
   attaches a header to web requests, and the filer reads these three values and
   exchanges the refresh token itself. Never paste a value into a chat. On 2026-10-06 a
   first save held the template's own placeholder words; a session can check the shape
   without printing a value (lengths, and the three endings above).
10. Open a new session and run `python3 scripts/library_file.py --check`. It names the
    account, confirms the full scope, and says whether each folder can take files.

**Who can see this.** Every session in the environment can read the three values,
and the full scope reaches everything in camapinitiative's Drive. The filer itself
only creates files, and only in the two folders. To cut it off: myaccount.google.com,
Security, Third-party connections, *CPL Library filer*, Remove access.

## When it fails

- **`invalid_client`**: the client ID or secret is wrong, often a placeholder or a
  stray space (step 9). Check the shape without printing the value.
- **`invalid_grant`**: the sign-in expired or was revoked. Check step 4 (published,
  not Testing), then repeat steps 6 to 9.
- **A folder `CANNOT add files`, or the scope is not the full one**: the refresh token
  was made with a narrower scope. Repeat step 7 with the full scope.
- **The upload stopped**: the filer resumes inside one run (it asks Drive how far it
  got). If the run ends, run the same command again. Nothing was recorded, and a
  completed copy with the same bytes is reused.
- **An md5 mismatch**: the copy stays in Drive, because the filer never deletes. Tell
  Sam, and file it again.

## How a cloud session reaches Google

Measured 2026-10-05 and again 2026-10-06: the proxy lets the shell reach
`oauth2.googleapis.com`, `www.googleapis.com/drive/v3` and
`www.googleapis.com/upload`, and stdlib `urllib` honors `HTTPS_PROXY` and
`SSL_CERT_FILE`. `developers.google.com` is blocked from the shell, which matters only
for reading Google's documentation. Sam uses the OAuth Playground in his own browser.
