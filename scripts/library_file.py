#!/usr/bin/env python3
"""library_file.py — file a deck, film, spreadsheet or document to the team Drive,
and write the receipt that records it in the Library (cpl_library).

    python3 scripts/library_file.py --check
    python3 scripts/library_file.py <file> --slug <record>             # a new version, to Drafts
    python3 scripts/library_file.py <file> --slug <record> --to library
    python3 scripts/library_file.py <file> --slug <record> --move --to library
    python3 scripts/library_file.py <file> --new --title "..." --kind deck [--occasion ...]
    python3 scripts/library_file.py <file> --slug <record> --dry-run

WHY (Sam's calls 7-8, 2026-10-05, "7, 8,9 Y"): every piece files itself to Drive
the moment a session makes it, films included, and each edit is its own file,
<date code>_<name>_vN, keeping the original date code. Drive's own revision
history drops versions after 30 days unless pinned, so a version is a file and the
Library record lists every one with the time it was filed.

HOW
  * Signs in with the camapinitiative account's stored Google sign-in: three
    environment secrets, GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET and
    GOOGLE_DRIVE_REFRESH_TOKEN (setup: docs/reference/library_filer.md). The scope
    is the full Drive scope: the narrow drive.file scope may write only into
    folders the app itself created, and Sam made CPLLibrary by hand.
  * Uploads with Drive's resumable protocol in 8 MiB chunks, so a 16 MB film
    resumes after a dropped connection instead of starting over.
  * Checks the upload: Drive's size and md5 must equal the local file's.
  * Writes only into CPLLibrary or CPLLibrary/Drafts, and only creates files: it
    never deletes, trashes, renames or overwrites one. A same-named file already in
    the folder with the same bytes (Sam dropped it in by hand) is reused, not
    uploaded twice; one with different bytes stops the run.
  * Writes a receipt, kb/receipts/library_filed/<date>_<slug>__<file>.sql. A
    session's shell cannot reach *.supabase.co, so the session applies the receipt
    with the Supabase MCP's apply_migration under the name the filer prints (the
    repo's execute_sql guard refuses writes; a named migration is this repo's
    recorded path for a receipted data write, as cpl_library_seed_2026_10_05 was).
    The update is guarded on the Drive file id, so applying it twice changes
    nothing, and the history trigger files the row as it was before (CLAUDE.md
    Rule 10 a2). Measured on a copy of the live rows, 2026-10-06: UPDATE 1, then 0.

MODES
  new version (default)  uploads <date>_<name>_vN, N one past the highest already in
                         either folder; the record links it, and earlier files of the
                         same name read "Replaced by vN" in its version list.
  --move                 an existing file, already listed on its record, moves to
                         Drive under its own name; the version entry whose link ends
                         in that name now links Drive. Nothing is renumbered.
  --new                  a first file for a piece with no record yet: an INSERT-only
                         receipt (ON CONFLICT (slug) DO NOTHING).

Status is Sam's to set, so the filer changes it in one case only: a Requested
record whose first draft lands in Drafts moves to Draft.

Exit codes: 0 filed (or checked), 1 refused or failed, 2 the sign-in is not set up.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import mimetypes
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RECEIPTS = os.path.join(ROOT, "kb", "receipts", "library_filed")

# The only two places the filer may write (Sam's calls 2 and 4, 2026-10-05).
FOLDERS = {
    "library": ("13WnIL1j-Qo3CJ5znVFZhs5wmAjJqOxxN", "CPLLibrary"),
    "drafts": ("15eXeJb9OIl1nOFE4Tykr1y7rBGKBUvih", "CPLLibrary/Drafts"),
}
ENV = ("GOOGLE_DRIVE_CLIENT_ID", "GOOGLE_DRIVE_CLIENT_SECRET", "GOOGLE_DRIVE_REFRESH_TOKEN")
TOKEN_URL = "https://oauth2.googleapis.com/token"
API = "https://www.googleapis.com/drive/v3"
UPLOAD = "https://www.googleapis.com/upload/drive/v3/files"
FULL_SCOPE = "https://www.googleapis.com/auth/drive"
CHUNK = 8 * 1024 * 1024  # resumable chunks must be a multiple of 256 KiB
FILER = "library-filer@bot"
KINDS = ("deck", "film", "document", "spreadsheet")
EXTRA_TYPES = {
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".mp4": "video/mp4",
    ".pdf": "application/pdf",
}
SETUP = "docs/reference/library_filer.md"


class FilerError(Exception):
    pass


# ── transport ────────────────────────────────────────────────────────────────
class _NoRedirect(urllib.request.HTTPRedirectHandler):
    # Resumable upload answers 308 to say "keep going"; it is never a redirect.
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


_OPENER = urllib.request.build_opener(_NoRedirect)


def http(method, url, headers=None, data=None, timeout=300):
    """One HTTP exchange -> (status, lower-cased headers, body bytes).

    HTTPS_PROXY and SSL_CERT_FILE are honored by urllib itself."""
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    try:
        with _OPENER.open(req, timeout=timeout) as res:
            return res.status, {k.lower(): v for k, v in res.headers.items()}, res.read()
    except urllib.error.HTTPError as e:
        return e.code, {k.lower(): v for k, v in (e.headers or {}).items()}, e.read() or b""


def _why(body):
    try:
        err = json.loads(body.decode("utf-8", "replace")).get("error")
        if isinstance(err, dict):
            return err.get("message") or json.dumps(err)[:300]
        return str(err)[:300]
    except Exception:
        return body.decode("utf-8", "replace")[:300]


def credentials(environ=os.environ):
    missing = [k for k in ENV if not environ.get(k)]
    if missing:
        raise SystemExit(
            "The Drive sign-in is not set up in this environment: " + ", ".join(missing)
            + " missing.\nSetup (Sam, once): " + SETUP + ". A new session reads the secrets.")
    return {k: environ[k] for k in ENV}


def sign_in(creds, transport=http):
    """Exchange the stored refresh token for an access token. Never prints either."""
    body = urllib.parse.urlencode({
        "client_id": creds["GOOGLE_DRIVE_CLIENT_ID"],
        "client_secret": creds["GOOGLE_DRIVE_CLIENT_SECRET"],
        "refresh_token": creds["GOOGLE_DRIVE_REFRESH_TOKEN"],
        "grant_type": "refresh_token",
    }).encode()
    status, _, raw = transport("POST", TOKEN_URL, {"Content-Type": "application/x-www-form-urlencoded"}, body)
    if status != 200:
        hint = ""
        if b"invalid_grant" in raw:
            hint = (" The stored sign-in was refused: it expired or was revoked. In Testing mode Google"
                    " ends a sign-in after 7 days; publish the app (step 4 of " + SETUP + ") and repeat steps 6-8.")
        raise FilerError("Google sign-in failed (" + str(status) + "): " + _why(raw) + hint)
    tok = json.loads(raw)
    return tok["access_token"], tok.get("scope", "")


class Drive:
    def __init__(self, token, transport=http):
        self.token = token
        self.transport = transport

    def _auth(self, extra=None):
        h = {"Authorization": "Bearer " + self.token}
        h.update(extra or {})
        return h

    def get(self, path, params):
        url = API + path + "?" + urllib.parse.urlencode(params)
        status, _, raw = self.transport("GET", url, self._auth())
        if status != 200:
            raise FilerError("Drive answered " + str(status) + " to GET " + path + ": " + _why(raw))
        return json.loads(raw)

    def whoami(self):
        return self.get("/about", {"fields": "user(emailAddress,displayName)"}).get("user", {})

    def folder(self, folder_id):
        return self.get("/files/" + folder_id, {"fields": "id,name,trashed,capabilities(canAddChildren)",
                                                 "supportsAllDrives": "true"})

    def list_folder(self, folder_id):
        files, page = [], None
        while True:
            params = {"q": "'" + folder_id + "' in parents and trashed = false",
                      "fields": "nextPageToken,files(id,name,size,md5Checksum)",
                      "pageSize": "1000", "supportsAllDrives": "true", "includeItemsFromAllDrives": "true"}
            if page:
                params["pageToken"] = page
            out = self.get("/files", params)
            files.extend(out.get("files", []))
            page = out.get("nextPageToken")
            if not page:
                return files

    def upload(self, path, name, parent_id, mime, description, chunk=CHUNK, retries=6, sleep=time.sleep):
        """Resumable upload; returns Drive's file resource (id, name, size, md5Checksum)."""
        if parent_id not in {f[0] for f in FOLDERS.values()}:
            raise FilerError("Refused: the filer writes only into CPLLibrary or CPLLibrary/Drafts.")
        total = os.path.getsize(path)
        meta = json.dumps({"name": name, "parents": [parent_id], "description": description}).encode()
        status, hdr, raw = self.transport(
            "POST", UPLOAD + "?uploadType=resumable&supportsAllDrives=true&fields=id,name,size,md5Checksum",
            self._auth({"Content-Type": "application/json; charset=UTF-8",
                        "X-Upload-Content-Type": mime, "X-Upload-Content-Length": str(total)}), meta)
        session = hdr.get("location")
        if status != 200 or not session:
            raise FilerError("Drive would not start the upload (" + str(status) + "): " + _why(raw))
        def put(headers, data):
            try:
                return self.transport("PUT", session, headers, data)
            except OSError as e:  # a dropped connection
                return 0, {}, str(e).encode()

        def resume_at(hdr):
            got = re.match(r"bytes=0-(\d+)", hdr.get("range", ""))
            return int(got.group(1)) + 1 if got else 0

        offset, failures = 0, 0
        with open(path, "rb") as fh:
            while True:
                if total == 0:
                    data, rng = b"", "bytes */0"
                else:
                    fh.seek(offset)
                    data = fh.read(chunk)
                    rng = "bytes " + str(offset) + "-" + str(offset + len(data) - 1) + "/" + str(total)
                status, hdr, raw = put({"Content-Length": str(len(data)), "Content-Range": rng}, data)
                # A failed chunk: ask Drive how far it got before sending more, so no
                # byte is sent twice (Drive's resumable protocol).
                while status in (0, 500, 502, 503, 504) and failures < retries:
                    failures += 1
                    sleep(min(2 ** failures, 60))
                    status, hdr, raw = put({"Content-Length": "0", "Content-Range": "bytes */" + str(total)}, b"")
                if status in (200, 201):
                    return json.loads(raw)
                if status == 308:
                    offset = resume_at(hdr)
                    continue
                raise FilerError("The upload stopped (" + str(status) + "): " + _why(raw)
                                 + ". Nothing was recorded; run the same command again.")


# ── naming ───────────────────────────────────────────────────────────────────
NAME_RE = re.compile(r"^(?P<date>\d{8})_(?P<name>.+?)(?:_v(?P<n>\d+))?$")


def plan_name(local_path, existing_names, date_code=None, today=None):
    """The Drive name for a new version: <date code>_<name>_vN<ext>.

    N is one past the highest version of the same name in either folder, and the
    date code is the original one (the date code of that name's lowest version),
    so a later edit keeps the date the piece was first made (Sam's call 8)."""
    stem, ext = os.path.splitext(os.path.basename(local_path))
    m = NAME_RE.match(stem)
    name = m.group("name") if m else stem
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", name).strip("_") or "piece"
    date = (m.group("date") if m else None) or date_code or (today or dt.date.today()).strftime("%Y%m%d")
    line = re.compile(r"^(\d{8})_" + re.escape(name) + r"(?:_v(\d+))?" + re.escape(ext) + r"$", re.I)
    found = []
    for nm in existing_names:
        hit = line.match(nm)
        if hit:
            found.append((int(hit.group(2) or 1), hit.group(1)))
    if found:
        n = max(f[0] for f in found) + 1
        date = min(found)[1]
    else:
        n = 1
    # A local name already at a higher _vN (an earlier version lives elsewhere) keeps it.
    if m and m.group("n"):
        n = max(n, int(m.group("n")))
    return {"file_name": date + "_" + name + "_v" + str(n) + ext, "n": n, "date_code": date,
            "name": name, "ext": ext, "lineage": line.pattern}


def human_size(n):
    if n < 1024 * 1024:
        return str(max(1, round(n / 1024))) + " KB"
    return ("%.1f" % (n / (1024 * 1024))) + " MB"


def md5_of(path):
    h = hashlib.md5()
    with open(path, "rb") as fh:
        for block in iter(lambda: fh.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def mime_of(path):
    ext = os.path.splitext(path)[1].lower()
    return EXTRA_TYPES.get(ext) or mimetypes.guess_type(path)[0] or "application/octet-stream"


def drive_link(file_id):
    return "https://drive.google.com/file/d/" + file_id + "/view"


# ── receipts ─────────────────────────────────────────────────────────────────
def q(s):
    """A SQL string literal."""
    return "'" + str(s).replace("'", "''") + "'"


def jlit(obj):
    return q(json.dumps(obj, ensure_ascii=False, separators=(",", ":"))) + "::jsonb"


def _iso_date(code):
    return code[0:4] + "-" + code[4:6] + "-" + code[6:8]


def receipt_sql(mode, slug, entry, folder_key, ext, extra=None):
    """The guarded SQL that records one filed file. Applied by the session (MCP)."""
    extra = extra or {}
    link, fid, name = entry["url"], entry["file_id"], entry["file_name"]
    guard = "not (versions @> " + jlit([{"file_id": fid}]) + ")"
    if mode == "new":
        cols = {
            "slug": q(slug), "title": q(extra["title"]), "kind": q(extra["kind"]),
            "occasion": q(extra["occasion"]) if extra.get("occasion") else "null",
            "made_on": q(entry["date"]), "version": q(entry["label"]), "file_type": q(ext.lstrip(".").lower()),
            "status": q(extra["status"]) if extra.get("status") else "null",
            "seen_by": q(extra["seen_by"]) if extra.get("seen_by") else "null",
            "home": "'drive'", "url": q(link), "file_name": q(name),
            "rebuild_from": q(extra["rebuild_from"]) if extra.get("rebuild_from") else "null",
            "versions": jlit([entry]), "added_by": q(FILER),
        }
        return ("insert into public.cpl_library (" + ", ".join(cols) + ")\nvalues (" + ", ".join(cols.values())
                + ")\non conflict (slug) do nothing;\n-- expect: INSERT 0 1 (0 0 means the slug already exists: file with --slug instead)\n")
    if mode == "move":
        base = os.path.basename(name)
        tail = "%/" + base.replace("%", "\\%").replace("_", "\\_")
        versions = (
            "case when exists (select 1 from jsonb_array_elements(versions) e where e->>'url' like " + q(tail) + ")\n"
            "    then (select jsonb_agg(case when e->>'url' like " + q(tail) + " then e || " + jlit({k: entry[k] for k in ("url", "file_id", "file_name", "md5", "filed_at", "folder")}) + " else e end order by o)\n"
            "          from jsonb_array_elements(versions) with ordinality t(e, o))\n"
            "    else " + jlit([entry]) + " || versions end")
        return (
            "update public.cpl_library set\n"
            "  versions = " + versions + ",\n"
            "  url = case when url is null or url like " + q(tail) + " then " + q(link) + " else url end,\n"
            "  home = case when url is null or url like " + q(tail) + " then 'drive' else home end,\n"
            "  updated_by = " + q(FILER) + "\n"
            "where slug = " + q(slug) + " and retired_at is null and " + guard + ";\n"
            "-- expect: UPDATE 1 (0 means the slug is wrong, the record is retired, or this file is already recorded)\n")
    # a new version
    replaced = q("Replaced by " + entry["label"])
    lineage = q(extra["lineage"])
    status = ("case when status = 'requested' then 'draft' else status end" if folder_key == "drafts" else "status")
    return (
        "update public.cpl_library set\n"
        "  versions = " + jlit([entry]) + " || coalesce((select jsonb_agg(case when e->>'status' in ('Latest', 'Draft')\n"
        "      and coalesce(e->>'file_name', regexp_replace(e->>'url', '^.*/', '')) ~* " + lineage + "\n"
        "      then jsonb_set(e, '{status}', to_jsonb(" + replaced + "::text)) else e end order by o)\n"
        "    from jsonb_array_elements(versions) with ordinality t(e, o)), '[]'::jsonb),\n"
        "  url = " + q(link) + ", home = 'drive', file_name = " + q(name) + ", version = " + q(entry["label"]) + ",\n"
        "  made_on = coalesce(made_on, " + q(entry["date"]) + "::date), file_type = coalesce(file_type, " + q(ext.lstrip(".").lower()) + "),\n"
        "  status = " + status + ",\n"
        "  updated_by = " + q(FILER) + "\n"
        "where slug = " + q(slug) + " and retired_at is null and " + guard + ";\n"
        "-- expect: UPDATE 1 (0 means the slug is wrong, the record is retired, or this file is already recorded)\n")


def migration_name(slug, file_name, now):
    """The apply_migration name for a receipt: one per filed file, snake_case."""
    stem = re.sub(r"[^a-z0-9]+", "_", os.path.splitext(file_name)[0].lower()).strip("_")
    return ("cpl_library_file_" + now.strftime("%Y_%m_%d") + "_" + slug.replace("-", "_") + "_" + stem)[:120].rstrip("_")


def write_receipt(sql, slug, file_name, header_lines, now):
    os.makedirs(RECEIPTS, exist_ok=True)
    stem = os.path.splitext(file_name)[0]
    path = os.path.join(RECEIPTS, now.strftime("%Y-%m-%d") + "_" + slug + "__" + stem + ".sql")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("\n".join("-- " + h for h in header_lines) + "\n" + sql)
    return path


# ── commands ─────────────────────────────────────────────────────────────────
def check(drive, scope, out=print):
    ok = True
    user = drive.whoami()
    out("Signed in as " + (user.get("emailAddress") or "an unknown account") + ".")
    if FULL_SCOPE not in scope.split():
        ok = False
        out("The sign-in's scope is '" + scope + "', not the full Drive scope. Google's narrow scope cannot write"
            " into a folder the app did not create. Repeat step 7 of " + SETUP + " with " + FULL_SCOPE + ".")
    for key in ("library", "drafts"):
        fid, label = FOLDERS[key]
        try:
            f = drive.folder(fid)
            can = bool(f.get("capabilities", {}).get("canAddChildren")) and not f.get("trashed")
        except FilerError as e:
            can = False
            out("  " + label + ": not visible to this sign-in (" + str(e) + ").")
        out("  " + label + ": " + ("can add files" if can else "CANNOT add files"))
        ok = ok and can
    return ok


def file_one(args, drive, now=None, out=print):
    now = now or dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
    path = args.path
    if not os.path.isfile(path):
        raise FilerError("No such file: " + path)
    folder_id, folder_label = FOLDERS[args.to]
    size, md5 = os.path.getsize(path), md5_of(path)
    ext = os.path.splitext(path)[1]

    listing = {k: (drive.list_folder(FOLDERS[k][0]) if drive else []) for k in FOLDERS}
    if args.move:
        name = os.path.basename(path)
        n_hit = NAME_RE.match(os.path.splitext(name)[0])
        label = args.label or ("v" + n_hit.group("n") if n_hit and n_hit.group("n") else "v1")
        date_code = n_hit.group("date") if n_hit else now.strftime("%Y%m%d")
        plan = {"file_name": name, "date_code": date_code, "lineage": None}
    else:
        names = [f["name"] for k in FOLDERS for f in listing[k]]
        plan = plan_name(path, names, args.date_code, now.date())
        name, label = plan["file_name"], args.label or ("v" + str(plan["n"]))

    same = [f for f in listing[args.to] if f.get("name") == name]
    if args.dry_run:
        out("Would file " + path + " (" + human_size(size) + ") to " + folder_label + " as " + name
            + (" (reusing the copy already there)" if same else "") + ".")
        if not drive:
            out("  (No sign-in: the version number assumes nothing is in Drive yet.)")
        return None
    if same:
        f = same[0]
        if f.get("md5Checksum") != md5 or int(f.get("size", -1)) != size:
            raise FilerError(name + " is already in " + folder_label + " with different bytes. The filer never"
                             " overwrites; rename the new file or file it as a new version.")
        res = f
        out("Already in " + folder_label + " with the same bytes; reusing " + drive_link(f["id"]) + ".")
    else:
        desc = "Filed by scripts/library_file.py for Library record " + (args.slug or args.new_slug) + "."
        res = drive.upload(path, name, folder_id, mime_of(path), desc)
        if res.get("md5Checksum") != md5 or int(res.get("size", -1)) != size:
            raise FilerError("Drive holds " + str(res.get("size")) + " bytes, md5 " + str(res.get("md5Checksum"))
                             + ", for a local file of " + str(size) + " bytes, md5 " + md5 + ". The copy stays in Drive"
                             " (the filer never deletes); tell Sam, and file it again.")
        out("Uploaded " + name + " to " + folder_label + ": " + drive_link(res["id"]))

    entry = {
        "label": label, "date": _iso_date(plan["date_code"]),
        "size": ((args.extent + " · ") if args.extent else "") + human_size(size),
        "status": args.version_status or ("Draft" if args.to == "drafts" else "Latest"),
        "url": drive_link(res["id"]), "file_id": res["id"], "file_name": name, "md5": md5,
        "filed_at": now.strftime("%Y-%m-%dT%H:%M:%SZ"), "folder": folder_label,
    }
    mode = "new" if args.new else ("move" if args.move else "version")
    slug = args.slug or args.new_slug
    extra = {"lineage": plan.get("lineage"), "title": args.title, "kind": args.kind, "occasion": args.occasion,
             "status": args.status or ("draft" if args.to == "drafts" else None), "seen_by": args.seen,
             "rebuild_from": args.rebuild_from}
    sql = receipt_sql(mode, slug, entry, args.to, ext, extra)
    header = [
        "cpl_library filing receipt, written by scripts/library_file.py at " + entry["filed_at"] + ".",
        "File: " + os.path.relpath(os.path.abspath(path), ROOT) + " (" + str(size) + " bytes, md5 " + md5 + ").",
        "Drive: " + name + " in " + folder_label + ", " + entry["url"],
        "Apply with the Supabase MCP: apply_migration, name " + migration_name(slug, name, now) + ".",
        "Guarded on the Drive file id: applying it twice changes nothing.",
        "Rollback: cpl_library_history holds the row as it was (changed_by '" + FILER + "'); restore from `before`."
        if mode != "new" else "Rollback: an INSERT-only receipt; retire the row (retired_at) to take it off the list.",
    ]
    rp = write_receipt(sql, slug, name, header, now)
    mig = migration_name(slug, name, now)
    out("Receipt: " + os.path.relpath(rp, ROOT))
    out("Next: apply it with the Supabase MCP's apply_migration, name " + mig + ", then commit the receipt.")
    return {"entry": entry, "receipt": rp, "sql": sql, "migration": mig}


def parse(argv):
    p = argparse.ArgumentParser(description="File a piece to the team Drive and write its Library receipt.")
    p.add_argument("path", nargs="?", help="the file to file")
    p.add_argument("--check", action="store_true", help="check the sign-in and both folders, upload nothing")
    p.add_argument("--slug", help="the Library record this file belongs to")
    p.add_argument("--to", choices=sorted(FOLDERS), default="drafts", help="drafts (default) or library (approved pieces)")
    p.add_argument("--move", action="store_true", help="move an existing file under its own name; no new version")
    p.add_argument("--new", action="store_true", help="a first file for a piece with no record yet")
    p.add_argument("--title")
    p.add_argument("--kind", choices=KINDS)
    p.add_argument("--occasion")
    p.add_argument("--seen", choices=("team", "colleges", "public"), help="--new only; Sam's call when unset")
    p.add_argument("--status", choices=("requested", "draft", "approved", "presented"), help="--new only")
    p.add_argument("--rebuild-from", dest="rebuild_from", help="--new only: the source that rebuilds it")
    p.add_argument("--label", help="the version's label (default vN)")
    p.add_argument("--extent", help="shown before the size, e.g. 1:41 or 12 slides")
    p.add_argument("--version-status", dest="version_status", help="the version's status line")
    p.add_argument("--date-code", dest="date_code", help="YYYYMMDD for a file whose name has none (default today)")
    p.add_argument("--dry-run", action="store_true", help="say what would happen; upload and write nothing")
    a = p.parse_args(argv)
    if a.check:
        return a
    if not a.path:
        p.error("name a file, or use --check")
    if a.new:
        if a.slug or a.move:
            p.error("--new makes a record; it takes no --slug or --move")
        if not (a.title and a.kind):
            p.error("--new needs --title and --kind")
        slug = re.sub(r"[^a-z0-9]+", "-", a.title.lower()).strip("-")[:70] or "piece"
        a.new_slug = slug if re.match(r"^[a-z0-9]", slug) else "p-" + slug
    else:
        a.new_slug = None
        if not a.slug:
            p.error("name the record with --slug (or make one with --new)")
        if not re.match(r"^[a-z0-9][a-z0-9-]{1,80}$", a.slug):
            p.error("--slug must be a Library slug (lower case, digits and hyphens)")
    if a.date_code and not re.match(r"^\d{8}$", a.date_code):
        p.error("--date-code is YYYYMMDD")
    return a


def main(argv=None):
    args = parse(argv if argv is not None else sys.argv[1:])
    try:
        if args.dry_run and not all(os.environ.get(k) for k in ENV):
            file_one(args, None)
            return 0
        token, scope = sign_in(credentials())
        drive = Drive(token)
        if args.check:
            return 0 if check(drive, scope) else 1
        file_one(args, drive)
        return 0
    except FilerError as e:
        print("library_file: " + str(e), file=sys.stderr)
        return 1
    except SystemExit as e:
        if isinstance(e.code, str):
            print(e.code, file=sys.stderr)
            return 2
        raise


if __name__ == "__main__":
    sys.exit(main())
