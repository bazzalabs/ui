/**
 * Lint rules for how parts in `@bazza-ui/react` are written, loaded by oxlint
 * through `jsPlugins` (see the root `.oxlintrc.json`).
 *
 * Each rule's message says why the rule exists, what to write instead, and
 * which section of `packages/react/AGENTS.md` describes the convention.
 */
import { contextHookContract } from './rules/context-hook-contract.mjs'
import { dataAttrsEnum } from './rules/data-attrs-enum.mjs'
import { disableNeedsReason } from './rules/disable-needs-reason.mjs'
import { forwardRefNamed } from './rules/forward-ref-named.mjs'
import { noSpreadStyle } from './rules/no-spread-style.mjs'
import { partNamespace } from './rules/part-namespace.mjs'
import { resolveStateProps } from './rules/resolve-state-props.mjs'
import { useClient } from './rules/use-client.mjs'

export {
  directiveProblem,
  parseDirective,
} from './rules/disable-needs-reason.mjs'
export { bazzaRuleNames, partShapeRuleNames } from './rules/rule-names.mjs'

export default {
  meta: { name: 'bazza' },
  rules: {
    'context-hook-contract': contextHookContract,
    'data-attrs-enum': dataAttrsEnum,
    'disable-needs-reason': disableNeedsReason,
    'forward-ref-named': forwardRefNamed,
    'no-spread-style': noSpreadStyle,
    'part-namespace': partNamespace,
    'resolve-state-props': resolveStateProps,
    'use-client': useClient,
  },
}
