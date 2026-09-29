/**
 * Lint rules for how parts in `@bazza-ui/react` are written, loaded by oxlint
 * through `jsPlugins` (see the root `.oxlintrc.json`).
 *
 * Each rule's message says why the rule exists, what to write instead, and
 * which section of `packages/react/AGENTS.md` describes the convention.
 */
import { dataAttrsEnum } from './rules/data-attrs-enum.mjs'
import { disableNeedsReason } from './rules/disable-needs-reason.mjs'
import { forwardRefNamed } from './rules/forward-ref-named.mjs'
import { partNamespace } from './rules/part-namespace.mjs'
import { useClient } from './rules/use-client.mjs'

export {
  directiveProblem,
  parseDirective,
} from './rules/disable-needs-reason.mjs'
export { bazzaRuleNames } from './rules/rule-names.mjs'

export default {
  meta: { name: 'bazza' },
  rules: {
    'data-attrs-enum': dataAttrsEnum,
    'disable-needs-reason': disableNeedsReason,
    'forward-ref-named': forwardRefNamed,
    'part-namespace': partNamespace,
    'use-client': useClient,
  },
}
