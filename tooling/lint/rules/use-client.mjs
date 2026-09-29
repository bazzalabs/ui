/**
 * `bazza/use-client`: parts and context modules start with `'use client'`.
 *
 * Every part uses hooks or context, so a React Server Components app can only
 * import it across a client boundary. Which files the rule applies to is set
 * in `.oxlintrc.json`.
 */
export const useClient = {
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description: "Parts and context modules start with 'use client'.",
    },
  },
  create(context) {
    return {
      Program(program) {
        const prologue = []
        for (const statement of program.body) {
          if (typeof statement.directive !== 'string') break
          prologue.push(statement.directive)
        }
        if (prologue.includes('use client')) return
        // Report on the first statement, so an `oxlint-disable-next-line`
        // comment above it can make an exception.
        const [first] = program.body
        context.report({
          ...(first
            ? { node: first }
            : {
                loc: {
                  start: { line: 1, column: 0 },
                  end: { line: 1, column: 0 },
                },
              }),
          message:
            "Missing `'use client'` directive. Parts and their contexts use hooks, so a React Server Components app can only import them across a client boundary. Add `'use client'` as the first statement. See \"Component Pattern\" in packages/react/AGENTS.md.",
          fix: (fixer) =>
            fixer.insertTextBeforeRange([0, 0], "'use client'\n\n"),
        })
      },
    }
  },
}
