/**
 * Lint rules for how parts in `@bazza-ui/react` are written, loaded by oxlint
 * through `jsPlugins` (see the root `.oxlintrc.json`).
 *
 * Each rule's message says why the rule exists, what to write instead, and
 * which section of `packages/react/AGENTS.md` describes the convention.
 */
import { disableNeedsReason } from './rules/disable-needs-reason.mjs'

export {
  directiveProblem,
  parseDirective,
} from './rules/disable-needs-reason.mjs'
export { bazzaRuleNames } from './rules/rule-names.mjs'

export default {
  meta: { name: 'bazza' },
  rules: {
    'disable-needs-reason': disableNeedsReason,
  },
}
