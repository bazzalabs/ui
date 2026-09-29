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
  'no-spread-style',
  'part-namespace',
  'resolve-state-props',
  'use-client',
])

/**
 * Rules about how shipped parts are written. They skip tests (see
 * `.oxlintrc.json`); the rest also run on tests.
 */
export const partShapeRuleNames = new Set([
  'context-hook-contract',
  'data-attrs-enum',
  'forward-ref-named',
  'part-namespace',
  'use-client',
])
