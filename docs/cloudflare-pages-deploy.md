# Cloudflare Pages Deploy

`study-musume.pages.dev` is safest to deploy from a clean export of `HEAD`, not from the current working tree.
This repo is often dirty during active work, and Pages deploys have already failed on local-only assets that should not ship.
The repo root now keeps a Pages config in `wrangler.jsonc`.
The Worker app still uses `wrangler.toml`, so the deploy script removes that Worker config inside the temporary export before upload to keep Pages deploys unambiguous.

## Run

```powershell
pwsh -File scripts/deploy-cloudflare-pages.ps1
```

## What the script does

1. Exports committed `HEAD` into a temporary `.deploy-head` workspace.
2. Removes `public/audio/tts-generated`, which has caused Pages upload failures and is no longer needed for battle-chain audio.
3. Removes `public/_redirects`, because it is a Netlify artifact and should not be deployed to Pages.
4. Runs `npm run build` inside the clean workspace.
5. Removes the temporary workspace `wrangler.toml` and writes a Pages-only `wrangler.jsonc` with the project name, so deploy does not inherit Worker-only bindings.
6. Removes built `*.vrm` assets from `dist/assets`, because they have exceeded the deploy size limit.
7. Deploys `dist/` with `wrangler pages deploy`.

## Notes

- The script deploys committed `HEAD` on purpose. Uncommitted local edits are ignored.
- Use `-SkipDeploy` if you only want to test the clean build locally.
- Use `-KeepWorkspace` if you want to inspect `.deploy-head` after the build.
- Make sure `npx wrangler whoami` already works on your machine before running the script.
- Cloudflare Pages Git builds can read `wrangler.jsonc` from the repo root as the Pages source of truth. This is separate from the Worker-only `wrangler.toml`.
