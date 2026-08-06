The pause notice on iRacing's OAuth docs is no longer detected, which means new
OAuth client IDs may be available again.

**Why this matters:** `.github/workflows/update-season-data.yml` skips every run
without `IRACING_CLIENT_ID` / `IRACING_CLIENT_SECRET`, so
`data/iracing-season-data.json` is not refreshed when a new season starts.

**To activate the sync:**

1. Register a client at <https://oauth.iracing.com/accountmanagement>
2. Add repository secrets `IRACING_CLIENT_ID` and `IRACING_CLIENT_SECRET`
   (`IRACING_EMAIL` / `IRACING_PASSWORD` are already set)
3. Run **Update iRacing season data** manually with `dry_run: true` to verify
4. Re-run without dry run to commit the refreshed season data

Verify the notice really is gone before acting — this check is text-based, and
iRacing may simply have reworded the page.

_Filed automatically by `.github/workflows/watch-iracing-oauth.yml`._
