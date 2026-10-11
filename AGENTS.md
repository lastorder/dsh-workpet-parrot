# AGENTS.md

This file is for an AI agent (or a human contributor) changing this repository, and especially for walking through a release. [README.md](README.md) (English) and [README.zh.md](README.zh.md) (中文) own how to draw and develop the pet; keep the two in sync in the same change; this file owns *where a change goes* and *how to ship it*.

## What this repository is

A cockatiel appearance for the DeepSeek Harness work pet. It is a Service Provider for the `ctx.workpet` capability defined in [dsh-workpet](https://github.com/lastorder/dsh-workpet) (`packages/workpet/workpet/src/client/contract.ts`), and the template users copy to make new pets.

- [`client.js`](client.js) — everything the browser runs: artwork (SVG markup strings), CSS animations, and registration into `ctx.workpet`. A classic script in the `window.__ModuleLoader__.load({ id, factory })` format; React comes from the page's module table.
- [`index.js`](index.js) — the empty Host half the Loader row loads.
- [`cordis.patch.yml`](cordis.patch.yml) — inserts the `dsh-workpet-parrot` row.
- [`test/smoke.test.mjs`](test/smoke.test.mjs) — loads `client.js` like the module table, registers into a stand-in `ctx.workpet`, and draws every activity.

## Commands

```sh
pnpm install
pnpm run check    # node --check on both runtime files
pnpm test         # node --test "test/*.test.mjs"
pnpm run verify   # check + test; CI runs exactly this on Node 22, 24, 26
```

## Hard constraints

- **No build step, ever.** `client.js` and `index.js` are published and loaded byte-for-byte as written. Do not add TypeScript, JSX, a bundler, or a `prepare`/`prepack` compile step: the point of this repository is that a pet is one editable file, and `link:` installs must work straight from a checkout.
- **Follow the dsh-workpet contract.** Draw every `WorkpetActivity` in a 100 × 80 box; draw only the bird (the capability draws bubbles, badges, companions, and effects); keep gradient ids unique per instance (`${id}`); keep the `wpp-` CSS prefix and the `prefers-reduced-motion` rule; register inside `ctx.effect` with `inject: ['workpet', 'locale']`. When the contract in dsh-workpet changes, update this repository in the same round.
- **No runtime dependencies.** React is provided by the page. `react` / `react-dom` are dev dependencies only for the smoke test and must stay on major 18.
- A new or changed pose gets its activity covered by the smoke test (it already iterates every activity in both normal and compact form; extend `ACTIVITIES` if the contract adds one).

## Releasing

### One-time setup, before the first tag

[release.yml](.github/workflows/release.yml) authenticates only through npm's token-free OIDC Trusted Publishing, which must be configured on an existing package. Do this once by hand (needs your npm login and 2FA):

1. From a clean checkout: `pnpm install && pnpm run verify`.
2. `npm login`, then `npm publish` once, so `0.1.0` exists and you own the name.
3. On npmjs.com → `dsh-workpet-parrot` → Settings → Trusted Publisher → GitHub Actions: repository `lastorder/dsh-workpet-parrot`, workflow file `.github/workflows/release.yml`, restricted to **stage-only**.

### Every release after that

1. Edit `version` in `package.json`.
2. `pnpm run verify`.
3. Commit as `Release vX.Y.Z: <summary>` with a prose body; this message becomes the GitHub Release notes verbatim.
4. `git tag -a vX.Y.Z -m "Release vX.Y.Z"` and `git push origin main vX.Y.Z`.
5. release.yml verifies, checks the tag against `package.json`, runs `npm stage publish`, packs a tarball, and creates a GitHub Release **marked pre-release**.
6. **Approve the stage** on `https://www.npmjs.com/package/dsh-workpet-parrot?activeTab=versions` (or `npm stage ls` / `npm stage approve`, 2FA), then uncheck "pre-release" on the GitHub Release.

Do not run `npm publish` / `npm stage publish` by hand for an ordinary release; only to recover from a CI outage, after `pnpm run verify`. Keep the Trusted Publisher stage-only: the human approval is the control.

### CI/release infrastructure notes

- Third-party actions are pinned to a full commit SHA (`softprops/action-gh-release`); first-party `actions/*` and `pnpm/*` stay on major tags. Read Dependabot's diff before repinning.
- Dependabot groups action bumps into one weekly PR and ignores React majors.
