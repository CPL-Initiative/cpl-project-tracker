# The CTDL exchange's seed

`seed/` is the private exchange repository that Sam ruled on Open Asks Sheet 102, card 1 (2026-10-20): one repository
under CPL-Initiative, administered by Malone, where Credential Engine, WestEd and COBI file what crosses an
organization's line. A session cannot create a repository in the organization, so the tracker holds the first
version here until Malone copies it. Lane: `docs/reference/lanes/ctdl-partner-exchange.md`.

The exchange's `CLAUDE.md` is kept here as `seed/CLAUDE.exchange.md`. Named `CLAUDE.md`, it would load into every
tracker session that reads this folder and tell it that it is working in the exchange. The paste below renames it.

**One writer per store.** Once the exchange exists, its `main` is the contract's home. The tracker PR that records
the repository's address in the lane also deletes this folder, so the contract never has two copies that drift.

`tests/ctdl_exchange_seed_test.py` runs the seed's check against good and bad drops in throwaway repositories.

## The paste for Malone

Run in Git Bash on Windows, or any shell on macOS or Linux, with the GitHub CLI signed in as an owner of
CPL-Initiative. Replace the three handles in step 3 first.

```bash
# 1. Create the private repository
gh repo create CPL-Initiative/cpl-ctdl-exchange --private \
  --description "Files and contract shared by the CPL Initiative, Credential Engine and WestEd"
gh repo edit CPL-Initiative/cpl-ctdl-exchange --enable-squash-merge --enable-merge-commit=false \
  --enable-rebase-merge=false --delete-branch-on-merge

# 2. Copy the seed out of the tracker
git clone --depth 1 https://github.com/CPL-Initiative/cpl-project-tracker.git tracker-seed
git clone https://github.com/CPL-Initiative/cpl-ctdl-exchange.git
cp -R tracker-seed/partners/ctdl-exchange/seed/. cpl-ctdl-exchange/
cd cpl-ctdl-exchange
mv CLAUDE.exchange.md CLAUDE.md

# 3. Name the code owners: your handle, Credential Engine's contact, WestEd's contact (no @)
sed -i 's/MALONE_HANDLE/your-handle/g; s/CE_CONTACT_HANDLE/ce-contact-handle/g; s/WESTED_CONTACT_HANDLE/wested-contact-handle/g' .github/CODEOWNERS

# 4. Check, commit, tag contract v0 (on Windows, `py tools/check_drop.py` if python3 is not found)
python3 tools/check_drop.py
git add -A
git commit -m "Seed the exchange: contract v0, the drop check, decisions 0001 and 0002"
git push origin main
git tag contract-v0 && git push origin contract-v0

# 5. Protect main: pull requests only, one approving review, code owners, the check must pass
gh api -X PUT repos/CPL-Initiative/cpl-ctdl-exchange/branches/main/protection --input - <<'JSON'
{"required_status_checks": {"strict": true, "contexts": ["check"]},
 "enforce_admins": false,
 "required_pull_request_reviews": {"required_approving_review_count": 1, "require_code_owner_reviews": true},
 "restrictions": null}
JSON

# 6. Invite one technical contact from each partner, write access
gh api -X PUT repos/CPL-Initiative/cpl-ctdl-exchange/collaborators/ce-contact-handle -f permission=push
gh api -X PUT repos/CPL-Initiative/cpl-ctdl-exchange/collaborators/wested-contact-handle -f permission=push
```

Paste the output back to a COBI session, without investigating it. A good result: step 4 prints
`ok: 0 drop(s) checked, 0 problem(s)`, step 5 returns the protection settings as JSON, and step 6 returns two
invitations. Step 5 answers 403 or "Upgrade to GitHub Pro" when the organization's plan does not offer branch
protection on private repositories; the check still runs on every pull request, and Malone then merges only when it
is green.

The CODEOWNERS file names the folder owners; the review rule in step 5 is what makes their review count.
