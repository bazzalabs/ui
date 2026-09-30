/**
 * Every rule in the `bazza` plugin, by bare name. `bazza-plugin.mjs` registers
 * exactly these (a test checks the two agree).
 *
 * `disable-needs-reason` needs the list because oxlint drops the plugin prefix
 * when it matches a directive to a rule: `use-client` and `foo/use-client`
 * both disable `bazza/use-client`.
 */
export const bazzaRuleNames = new Set([
  'context-hook-contract',
  'data-attrs-enum',
  'disable-needs-reason',
  'forward-ref-named',
  'no-raw-controlled-state',
  'no-spread-style',
  'part-namespace',
  'resolve-state-props',
  'use-client',
])

/**
 * Rules about how shipped parts are written. They skip tests (see
 * `.oxlintrc.json`), and repo-config tests that aren't about part shape filter
 * them out. The rest run on tests too, except `no-raw-controlled-state`, which
 * skips tests because they read a store's internal fields on purpose. It isn't
 * a part-shape rule, so those tests still see it.
 */
export const partShapeRuleNames = new Set([
  'context-hook-contract',
  'data-attrs-enum',
  'forward-ref-named',
  'part-namespace',
  'use-client',
])
