// npm shows README.md on npmjs.com, where relative links break: every link in
// the published READMEs must be absolute (or an in-page #anchor).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

for (const name of ['README.md', 'README.zh.md']) {
  test(`${name} has no relative links`, () => {
    const text = readFileSync(new URL(`../${name}`, import.meta.url), 'utf8')
    const relative = [...text.matchAll(/\]\((?!https?:|#|mailto:)([^)\s]+)\)/g)].map(match => match[1])
    assert.deepEqual(relative, [])
  })
}
