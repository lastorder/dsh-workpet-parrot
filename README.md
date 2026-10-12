# dsh-workpet-parrot

English | [中文](https://github.com/lastorder/dsh-workpet-parrot/blob/main/README.zh.md)

A cockatiel appearance for the DeepSeek Harness **Work Pet** (`dsh-workpet`). Install it in the same profile as the `dsh-workpet` bundle and the cockatiel appears on screen next to the other pets, with no setting. Switch the bundle off in the Plugin Manager to take it away again.

<p align="center"><img src="https://raw.githubusercontent.com/lastorder/dsh-workpet-parrot/main/docs/images/cockatiel-poses.png" width="800" alt="The cockatiel in all thirteen activities"></p>

This package has **no build step and no TypeScript**: DeepSeek Harness loads `client.js` exactly as written. Almost all of that file is drawing, so developing this package is mostly drawing.

## Files

| File | Purpose |
|---|---|
| `client.js` | Everything the browser runs: the artwork, its CSS animations, and a short registration block |
| `index.js` | Empty Host half; the Loader row needs a module to load |
| `cordis.patch.yml` | Inserts the `dsh-workpet-parrot` row when the bundle is installed |
| `package.json` | Bundle manifest; `dsh.client.inject: ["dsh-workpet"]` makes the Work Pet load first |
| `locale/*.json`, `icon.svg` | Name, description, and icon shown in the Plugin Manager |
| `test/smoke.test.mjs` | Optional check that every activity draws without errors |
| `AGENTS.md`, `.github/` | Maintenance and release notes, CI, and the npm release pipeline |

## How the drawing works

The Work Pet decides **what the pet is doing**; this package only decides **what that looks like**.

1. For every render the Work Pet hands the Figure a `scene`. `scene.activity` is one of the 13 values in the table below; `scene.tool` and `scene.awaiting` carry details, and `scene.helpers` counts running subagents.
2. `draw(scene, id, compact)` in `client.js` picks a pose and returns **plain SVG markup** for a **100 × 80** box (`viewBox="0 0 100 80"`). The bird stands on the branch with its feet at about y = 68.
3. `ParrotFigure` wraps that markup in an `<svg>`. When `compact` is true, the bird is a small helper companion: skip scenery such as the shadow and wind lines.

The Work Pet draws the rest itself, so do **not** draw any of these: the status bubble, the tool badge (💻 🔍 …), helper companions, and effects such as hearts, sparkles, `z`, `!`, and `?`.

| `scene.activity` | When | Cockatiel pose (`draw`) |
|---|---|---|
| `absent` | No session is open | `perched`: eyes closed, crest down |
| `idle` | Session idle | `perched`: blinking |
| `sleeping` | Idle for more than 70 s | `sleeping`: fluffed into a ball, head tucked back |
| `thinking` | Model running, nothing written yet | `perched`: head tilted, eyes up, crest bobbing |
| `writing` | Model streaming text | `typing`: pecking at a laptop |
| `tool` | A tool call is running | `flying`: wings beating |
| `retrying` | Waiting to retry a failed request | `perched`: spiral eyes, wobbling |
| `awaiting` | Waiting for your approval or answer | `perched`: waving a wing, crest up |
| `delegating` | Idle while subagents still run | `perched`: looking around |
| `done` | Just finished | `perched`: happy eyes, hopping |
| `error` | Just failed | `perched`: sad eyes, a tear, shaking |
| `petted` | You clicked it | `perched`: eyes closed, cheeks glowing |
| `dragged` | You are dragging it | `dangling`: both wings flapping |

### Building blocks in `client.js`

- `P` — the palette. Change a colour here and it changes everywhere.
- `head(id, cx, cy, face)` — the head, radius 12.5, facing right. `face` controls `eyes` (`open`, `up`, `look`, `focus`, `happy`, `closed`, `wide`, `spiral`, `sad`), `crest` (`up`, `mid`, `down`), `tilt` in degrees, `beakOpen`, `blush` (`soft` or `strong`), `tear`, and `crestMotion` (an animation class for the crest).
- `body`, `tail`, `feet`, `foldedWing(x, y)`, `openWing(color)`, `perch(x1, x2, y)`, and `tube(d, color, width)` (a line with an ink outline, used for legs, tail feathers, and crest feathers).
- Poses: `perched`, `flying`, `typing`, `sleeping`, `dangling`.

### Animation rules

- Animate with CSS classes prefixed `wpp-`, all defined in the `CSS` string: add the class in the markup (`class="wpp-flap"`) and its `@keyframes` in `CSS`.
- In SVG, a CSS rotation pivots on `transform-origin` in **viewBox units**: `style="transform-origin:46px 60px"`. Without it, the pivot is the local `(0, 0)`. The wings rely on this: each wing is drawn hinged at `(0, 0)` inside a `translate(...)` group, so a plain `rotate()` flaps it from the shoulder.
- Never put an animation class on an element that also has a `transform="..."` attribute, because the CSS transform replaces the attribute. Nest a `<g>` instead.
- Gradient ids must include `${id}` (for example `url(#body-${id})`), because helper companions put several birds on the page at once.
- The `@media (prefers-reduced-motion: reduce)` rule at the end of `CSS` stops all motion for users who ask for that. Keep it.

## Development

Prerequisite: the `dsh-workpet` bundle is installed in your profile. It provides `ctx.workpet` and brings the default kitten with it; without it this plugin stays inactive.

1. **Install the bundle once.** In a DeepSeek Harness session, ask the agent to run `plugin_manager` `install_bundle` with this directory's absolute path as the target (the Desktop app's `desktop` profile can only be changed this way):

   ```text
   install_bundle  /absolute/path/to/dsh-workpet-parrot
   ```

   Once the package is on npm, the target can also be the package name `dsh-workpet-parrot`. A CLI-managed profile can instead run:

   ```sh
   dsh plugin --profile <profile> add link:/absolute/path/to/dsh-workpet-parrot
   ```

   A `link:` install points at this folder, so later edits need no reinstall.

2. **Edit `client.js`**, usually a pose or a part of the head.

3. **Check it**:

   ```sh
   pnpm run check              # syntax check, no dependencies needed
   pnpm install && pnpm test   # optional: draws all 13 activities with React's server renderer
   ```

4. **Look at it**: refresh the Harness window, open **Plugins → Work Pet**, and press the action buttons under the appearance cards: the cockatiel's card acts out each activity on demand, so you do not have to wait for a real session to fall asleep or fail. If the page still shows the old drawing after a refresh, restart DeepSeek Harness so it reloads the file.

### Adding a new pose

1. Write a function that returns markup for the 100 × 80 box, reusing `head`, `body`, `tube`, and the other parts:

   ```js
   const bathing = (id) => `
     ${perch()}
     <g class="wpp-splash" style="transform-origin:50px 68px">
       ${body(id)}
       ${foldedWing(47, 38)}
       ${head(id, 54, 30, { eyes: 'happy', crest: 'up' })}
     </g>`
   ```

2. Add `.wpp-splash{animation:…}` and its `@keyframes` to `CSS`.
3. Return it from the matching `case` in `draw`.

### Using this repository as a template for a new pet

1. Copy this repository and rename: `name` in `package.json`, the row `id`/`name` in `cordis.patch.yml`, the `id` passed to `window.__ModuleLoader__.load` at the top of `client.js` (it must equal the package name), the skin `id` in the registration, and the `wpp-` CSS prefix (so the two pets do not collide).
2. Redraw part 1 (ARTWORK) and part 2 (ANIMATION) of `client.js`; in part 3 (PLUG-IN) change only names and text.
3. Update `locale/*.json`, `icon.svg`, and both `README.md` and `README.zh.md`.

### Publishing to npm

[AGENTS.md](https://github.com/lastorder/dsh-workpet-parrot/blob/main/AGENTS.md) describes the release procedure: the one-time Trusted Publisher setup, tagging, and approving on npm. In short: bump `version` in `package.json` → `pnpm run verify` → commit `Release vX.Y.Z: …` → push the `vX.Y.Z` tag → GitHub Actions stages the package on npm → approve it on npmjs.com.

### The interface, for reference

Registration happens in the last block of `client.js` and rarely needs changes. The plugin waits for the capability with `inject: ['workpet', 'locale']` and registers inside `ctx.effect`, so switching the bundle off removes the cockatiel again:

```js
ctx.effect(() => ctx.workpet.register({
  id: 'cockatiel',          // stable id; the bird's screen position is saved under it
  order: 10,                // arrangement: on screen and on the page (the default kitten is 0)
  title: () => t('title'),  // localized name
  description: () => t('description'),
  Figure: ParrotFigure,     // React component: ({ scene, compact }) => <svg>
}))
```

The full contract (`WorkpetScene`, `WorkpetSkin`, `WorkpetService`) is `packages/workpet/workpet/src/client/contract.ts` in the [dsh-workpet](https://github.com/lastorder/dsh-workpet) repository, published as `dsh-workpet/contract`.
