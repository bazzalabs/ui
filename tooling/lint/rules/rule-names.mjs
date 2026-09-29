/**
 * Every rule in the `bazza` plugin, by bare name. `bazza-plugin.mjs` registers
 * exactly these (a test checks the two agree).
 *
 * `disable-needs-reason` needs the list because oxlint drops the plugin prefix
 * when it matches a directive to a rule: `use-client` and `foo/use-client`
 * both disable `bazza/use-client`.
 */
export const bazzaRuleNames = new Set(['disable-needs-reason'])
