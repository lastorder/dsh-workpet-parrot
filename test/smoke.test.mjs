// Smoke test: load client.js the way DeepSeek Harness does, register the
// skin into a stand-in `ctx.workpet`, and draw every activity.
// Run with `pnpm test` (needs the react / react-dom dev dependencies).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'

const require = createRequire(import.meta.url)
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

const ACTIVITIES = ['absent', 'idle', 'sleeping', 'thinking', 'writing', 'tool', 'retrying',
  'awaiting', 'delegating', 'done', 'error', 'petted', 'dragged']

function loadPlugin() {
  let entry
  const window = { __ModuleLoader__: { load: e => { entry = e } } }
  new Function('window', readFileSync(new URL('../client.js', import.meta.url), 'utf8'))(window)
  assert.equal(entry.id, 'dsh-workpet-parrot')
  return entry.factory(name => ({ react: React })[name])
}

function registerSkin() {
  const plugin = loadPlugin()
  const skins = []
  const disposers = []
  const ctx = {
    workpet: { register: skin => { skins.push(skin); return () => skins.splice(skins.indexOf(skin), 1) } },
    locale: { register: () => () => {}, bind: () => key => key },
    effect: fn => { disposers.push(fn()) },
  }
  plugin.apply(ctx)
  return { plugin, skins, unload: () => disposers.reverse().forEach(d => d()) }
}

test('waits for the Work Pet capability and registers one skin', () => {
  const { plugin, skins, unload } = registerSkin()
  assert.deepEqual(plugin.inject, ['workpet', 'locale'])
  assert.equal(skins.length, 1)
  assert.equal(skins[0].id, 'cockatiel')
  unload()
  assert.equal(skins.length, 0)
})

test('draws every activity', () => {
  const { skins } = registerSkin()
  for (const activity of ACTIVITIES) {
    for (const compact of [false, true]) {
      const html = renderToStaticMarkup(React.createElement(skins[0].Figure, { scene: { activity, helpers: 0 }, compact }))
      assert.match(html, /^<svg class="wpp"/, activity)
      assert.doesNotMatch(html, /NaN|undefined/, activity)
    }
  }
})
