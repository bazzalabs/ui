import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Engine parts (`internal/popup-menu`, `internal/listbox`) read the tree tier
 * and the surface tier, never a published context object (design R2,
 * UI-680 option 1): the published contexts are still provided, for
 * consumers. This pins the reads that remain, each with the slice that
 * removes it; a new direct read fails here, and so does one removed without
 * its entry. A context no engine part reads any more (`members: true`) is
 * held for the menu members' parts too.
 */

const SRC = join(import.meta.dirname, '../..')

/** A published context object: its names, its hooks and where it's made. */
interface Published {
  names: readonly string[]
  hooks: readonly string[]
  /** The module that creates it, whose own hooks read it. */
  module: string
  /**
   * Whether the menu members' parts are held to it too (`MEMBERS`), not only
   * the engine's: once no part reads it, none may again.
   */
  members?: true
}

const PUBLISHED: Record<string, Published> = {
  PopupMenuContext: {
    names: ['PopupMenuContext'],
    hooks: ['usePopupMenuContext', 'useMaybePopupMenuContext'],
    module: 'internal/popup-menu/contexts/popup-menu-context.ts',
    members: true,
  },
  ListboxContext: {
    names: ['ListboxContext', 'ListboxContextProvider'],
    hooks: ['useListboxContext', 'useMaybeListboxContext'],
    module: 'internal/listbox/contexts/listbox-context.ts',
    members: true,
  },
  SurfaceContext: {
    names: ['SurfaceContext'],
    hooks: ['useSurfaceContext', 'useMaybeSurfaceContext'],
    module: 'internal/listbox/contexts/surface-context.ts',
  },
  PopupSurfaceIdContext: {
    names: ['PopupSurfaceIdContext'],
    hooks: ['usePopupSurfaceId'],
    module: 'internal/popup-menu/contexts/popup-surface-id-context.ts',
  },
  RowWidthContext: {
    names: ['RowWidthContext'],
    hooks: ['useRowWidthContext', 'useMaybeRowWidthContext'],
    module: 'internal/listbox/contexts/row-width-context.ts',
  },
  SubpageStackContext: {
    names: ['SubpageStackContext'],
    hooks: ['useSubpageStack', 'useMaybeSubpageStack'],
    module: 'internal/popup-menu/contexts/subpage-stack-context.ts',
  },
  SubpageContext: {
    names: ['SubpageContext'],
    hooks: ['useSubpageContext', 'useMaybeSubpageContext'],
    module: 'internal/popup-menu/contexts/subpage-context.ts',
  },
  DataPopupContext: {
    names: ['DataPopupContext'],
    hooks: [],
    module: 'internal/popup-menu/data-first/context.ts',
  },
  DataSurfaceContext: {
    names: ['DataSurfaceContext'],
    hooks: ['useDataSurfaceContext', 'useMaybeDataSurfaceContext'],
    module: 'internal/popup-menu/data-first/context.ts',
  },
  DataListContext: {
    names: ['DataListContext'],
    hooks: ['useDataList', 'useMaybeDataList'],
    module: 'internal/popup-menu/data-first/context.ts',
  },
  GroupContext: {
    names: ['GroupContext'],
    hooks: ['useGroupContext'],
    module: 'internal/listbox/contexts/group-context.ts',
  },
  ItemContext: {
    names: ['ItemContext'],
    hooks: ['useItemContext', 'useMaybeItemContext'],
    module: 'internal/listbox/contexts/item-context.ts',
  },
}

/** The reads that remain: who removes them, why they're there, and where. */
interface Allowed {
  removedBy: 'UI-755' | 'UI-690' | 'permanent'
  reason: string
  /** Each engine file's direct reads, by its path from `src`. */
  reads: Record<string, number>
}

const ALLOWED: Record<string, Allowed> = {
  SurfaceContext: {
    removedBy: 'UI-755',
    reason:
      "The surface's store and id, until the surface tier carries its identity.",
    reads: {
      'internal/listbox/hooks/use-listbox-item.ts': 1,
      'internal/popup-menu/components/checkbox-group/checkbox-group.tsx': 1,
      'internal/popup-menu/components/checkbox-item/checkbox-item.tsx': 1,
      'internal/popup-menu/components/checkbox-item/checkbox-selection.ts': 1,
      'internal/popup-menu/components/empty/empty.tsx': 1,
      'internal/popup-menu/components/focus-zone/use-focus-zone-registration.ts': 1,
      'internal/popup-menu/components/group-label/group-label.tsx': 1,
      'internal/popup-menu/components/group/group.tsx': 1,
      'internal/popup-menu/components/input/input.tsx': 1,
      'internal/popup-menu/components/list/list.tsx': 2,
      'internal/popup-menu/components/loading/loading.tsx': 1,
      'internal/popup-menu/components/radio-group/radio-group.tsx': 1,
      'internal/popup-menu/components/scroll-arrow/scroll-arrow.tsx': 1,
      'internal/popup-menu/components/separator/separator.tsx': 1,
      'internal/popup-menu/components/submenu-root/submenu-root.tsx': 1,
      'internal/popup-menu/components/submenu-trigger/submenu-trigger.tsx': 1,
      'internal/popup-menu/contexts/checkbox-selection-context.ts': 1,
    },
  },
  PopupSurfaceIdContext: {
    removedBy: 'UI-755',
    reason: "The popup's surface id, until the surface tier carries it.",
    reads: {
      'internal/popup-menu/components/surface/surface.tsx': 1,
      'internal/popup-menu/data-first/data-list.tsx': 1,
      'internal/popup-menu/data-first/data-subpages.tsx': 2,
    },
  },
  RowWidthContext: {
    removedBy: 'UI-755',
    reason: "The row-width measurement queue, until it's on the surface tier.",
    reads: {
      'internal/listbox/hooks/use-listbox-item.ts': 1,
    },
  },
  SubpageStackContext: {
    removedBy: 'UI-690',
    reason: 'The subpage stack, until it lives in a store.',
    reads: {
      'internal/popup-menu/components/subpage-back/subpage-back.tsx': 1,
      'internal/popup-menu/components/subpage-trigger/subpage-trigger.tsx': 1,
      'internal/popup-menu/components/subpage/subpage.tsx': 1,
      'internal/popup-menu/components/surface/surface.tsx': 1,
      'internal/popup-menu/data-first/data-list.tsx': 1,
    },
  },
  SubpageContext: {
    removedBy: 'UI-690',
    reason:
      'The subpage a part is in, folded into the tier once the subpage stack lives in a store.',
    reads: {
      'internal/popup-menu/components/input/input.tsx': 1,
      'internal/popup-menu/components/list/list.tsx': 1,
      'internal/popup-menu/components/subpage-back-item/subpage-back-item.tsx': 1,
      'internal/popup-menu/components/subpage-back/subpage-back.tsx': 1,
      'internal/popup-menu/components/surface/surface.tsx': 1,
      'internal/popup-menu/data-first/data-list.tsx': 1,
    },
  },
  DataPopupContext: {
    removedBy: 'UI-690',
    reason: "A popup's data-first subpages, which move with the subpage stack.",
    reads: {
      'internal/popup-menu/components/surface/surface.tsx': 1,
      'internal/popup-menu/data-first/data-list.tsx': 1,
      'internal/popup-menu/data-first/data-subpages.tsx': 1,
    },
  },
  DataSurfaceContext: {
    removedBy: 'UI-690',
    reason: 'A data-first surface, which moves with the subpage stack.',
    reads: {
      'internal/popup-menu/components/list/list.tsx': 1,
      'internal/popup-menu/data-first/data-list.tsx': 1,
    },
  },
  GroupContext: {
    removedBy: 'permanent',
    reason: "One per group: a row reads the group it's in.",
    reads: {
      'internal/listbox/hooks/use-listbox-item.ts': 1,
      'internal/popup-menu/components/group-label/group-label.tsx': 1,
      'internal/popup-menu/components/group/group-description.tsx': 1,
      'internal/popup-menu/components/group/group-value.tsx': 1,
      'internal/popup-menu/components/group/use-group-visibility.ts': 1,
      'internal/popup-menu/components/separator/separator.tsx': 1,
      'internal/popup-menu/data-first/group-container.tsx': 1,
    },
  },
  ItemContext: {
    removedBy: 'permanent',
    reason: "One per row: a row's parts read their row.",
    reads: {
      'internal/popup-menu/components/shortcut/shortcut.tsx': 1,
    },
  },
}

/** The engine's layers, by their path from `src`. */
const ENGINE = ['internal/popup-menu', 'internal/listbox']
/** The menu members and the loaders, which build on the engine. */
const MEMBERS = [
  'combobox',
  'command-menu',
  'context-menu',
  'dropdown-menu',
  'loaders',
  'select',
  'suggestion-menu',
]

/** Source files under `folders`, by their path from `src`. */
function sourceFiles(folders: readonly string[]): string[] {
  const files: string[] = []
  for (const layer of folders) {
    for (const entry of readdirSync(join(SRC, layer), {
      recursive: true,
      withFileTypes: true,
    })) {
      if (!entry.isFile() || !/\.tsx?$/.test(entry.name)) continue
      if (/\.test(-d)?\.tsx?$/.test(entry.name)) continue
      const path = relative(SRC, join(entry.parentPath, entry.name))
      if (/(^|\/)(__tests__|test-helpers)(\/|$)/.test(path)) continue
      files.push(path.split('\\').join('/'))
    }
  }
  return files.sort()
}

/** Characters after which a `/` starts a regular expression, not a division. */
const BEFORE_REGEX = new Set([...'(,=:[!&|?{;+-*%~^'])
const KEYWORD_BEFORE_REGEX =
  /\b(?:return|typeof|case|do|else|in|of|new|delete|void|throw|yield|await)\s*$/

/** What likely made a file unreadable to `code`, and how to fix it. */
const UNREADABLE = {
  string:
    'Likely an apostrophe or a quote in JSX text, which this scan reads as a string that never closes on its line: write it as {"\'"} or &apos; (a double quote as {\'"\'} or &quot;).',
  'regular expression':
    "Likely a `/` in JSX text, which this scan reads as a pattern that never closes on its line: write it as {'/'}.",
  'template literal':
    "Likely a backtick in JSX text, which this scan reads as a template literal that never closes: write it as {'`'}.",
  comment: 'A `/*` comment never closes.',
}

/**
 * The source with its comments removed and the text of its strings,
 * template literals and regular expressions emptied, so a name in prose, in
 * a string or in a pattern isn't a read, and a `//` in a string doesn't hide
 * the code after it. A template's `${…}` stays code. Throws on a quote it
 * can't close on its line (an apostrophe in JSX text, say), so the guard
 * never reads a file it misunderstood.
 */
function code(source: string, path: string): string {
  let out = ''
  let previous = ''
  // The brace depth inside each open template expression.
  const templates: number[] = []
  let i = 0
  const fail = (what: keyof typeof UNREADABLE) => {
    const before = source.slice(0, i)
    const line = before.split('\n').length
    const column = i - before.lastIndexOf('\n')
    const end = source.indexOf('\n', i)
    const text = source.slice(i, end === -1 ? undefined : end).trim()
    throw new Error(
      `${path}:${line}:${column}: can't read the ${what} that starts here (${text.slice(0, 60)}). ${UNREADABLE[what]}`,
    )
  }
  while (i < source.length) {
    const c = source[i] as string
    const next = source[i + 1]
    if (c === '/' && next === '/') {
      const end = source.indexOf('\n', i)
      i = end === -1 ? source.length : end
      continue
    }
    if (c === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2)
      if (end === -1) fail('comment')
      out += ' '
      i = end + 2
      continue
    }
    if (c === '"' || c === "'") {
      let j = i + 1
      while (source[j] !== c) {
        if (j >= source.length || source[j] === '\n') fail('string')
        j += source[j] === '\\' ? 2 : 1
      }
      out += c + c
      previous = c
      i = j + 1
      continue
    }
    if (c === '`' || (c === '}' && templates.at(-1) === 0)) {
      if (c === '}') templates.pop()
      let j = i + 1
      while (
        source[j] !== '`' &&
        !(source[j] === '$' && source[j + 1] === '{')
      ) {
        if (j >= source.length) fail('template literal')
        j += source[j] === '\\' ? 2 : 1
      }
      if (source[j] === '`') {
        out += '``'
        previous = '`'
        i = j + 1
      } else {
        out += '`${'
        templates.push(0)
        previous = '{'
        i = j + 2
      }
      continue
    }
    if (
      c === '/' &&
      (previous === '' ||
        BEFORE_REGEX.has(previous) ||
        KEYWORD_BEFORE_REGEX.test(out))
    ) {
      let j = i + 1
      let inClass = false
      while (inClass || source[j] !== '/') {
        if (j >= source.length || source[j] === '\n') fail('regular expression')
        if (source[j] === '[') inClass = true
        else if (source[j] === ']') inClass = false
        j += source[j] === '\\' ? 2 : 1
      }
      j += 1
      while (/[a-z]/.test(source[j] ?? '')) j += 1
      out += '/r/'
      previous = '/'
      i = j
      continue
    }
    if (templates.length > 0 && c === '{') templates[templates.length - 1]! += 1
    if (templates.length > 0 && c === '}') templates[templates.length - 1]! -= 1
    out += c
    if (!/\s/.test(c)) previous = c
    i += 1
  }
  return out
}

const ID = '[A-Za-z_$][\\w$]*'
/** `a.b.` before a name: a namespace it's read through. */
const QUALIFIER = `(?:${ID}\\s*\\.\\s*)*`
const either = (names: Iterable<string>) => `(?:${[...names].join('|')})`
const TYPE_KEYWORDS = new Set(['any', 'unknown', 'never', 'const'])

/** Adds the names `pattern` (with `NAMES` for `names`) binds to `names`. */
function addAliases(source: string, names: Set<string>, pattern: string) {
  let grew = true
  while (grew) {
    grew = false
    const regex = new RegExp(pattern.replace('NAMES', either(names)), 'g')
    for (const match of source.matchAll(regex)) {
      const alias = match[1] as string
      if (TYPE_KEYWORDS.has(alias) || names.has(alias)) continue
      names.add(alias)
      grew = true
    }
  }
}

/** `X as Y`, in an import or an export. */
const RENAMED = `\\bNAMES\\s+as\\s+(${ID})`
/** `const { X: Y } = …`, from a namespace or an object. */
const DESTRUCTURED = `\\{[^{}]*\\bNAMES\\s*:\\s*(${ID})[^{}]*\\}\\s*=`
/** `const Y = X` or `const Y = ns.X`, not a call. */
const ASSIGNED = `\\b(?:const|let|var)\\s+(${ID})\\s*(?::[^=;]+)?=\\s*${QUALIFIER}NAMES\\b(?![\\w$]|\\s*[(.])`

/**
 * Each published context's direct reads in each engine file (and member
 * file, for a context with `members: true`), read from its code (`code`):
 * - a call of one of its hooks, as `useX()` or `ns.useX()`;
 * - `useContext(X)` or `use(X)` of it, `React.` before them or not, and
 *   `X` itself as `ns.X` or not;
 * - under its own names, or any alias they have: renamed in an import or
 *   export anywhere in the engine or the members (`X as Y`), or in the file, destructured
 *   (`const { X: Y } = ns`) or assigned (`const Y = X`, `const Y = ns.X`).
 *
 * It doesn't see a context or hook passed as an argument and read
 * elsewhere, read by a computed key (`ns['useX']`), or imported
 * dynamically.
 */
function directReads(): Record<string, Record<string, number>> {
  const read = (path: string, member: boolean) => ({
    path,
    member,
    source: code(readFileSync(join(SRC, path), 'utf8'), path),
  })
  const files = [
    ...sourceFiles(ENGINE).map((path) => read(path, false)),
    ...sourceFiles(MEMBERS).map((path) => read(path, true)),
  ]
  const reads: Record<string, Record<string, number>> = {}
  for (const [context, published] of Object.entries(PUBLISHED)) {
    // Renamed anywhere: an engine module may re-export it as another name.
    const hooks = new Set(published.hooks)
    const names = new Set(published.names)
    for (const { source } of files) {
      if (hooks.size > 0) addAliases(source, hooks, RENAMED)
      addAliases(source, names, RENAMED)
    }
    for (const { path, member, source } of files) {
      if (path === published.module || (member && !published.members)) continue
      const fileHooks = new Set(hooks)
      const fileNames = new Set(names)
      for (const pattern of [DESTRUCTURED, ASSIGNED]) {
        if (fileHooks.size > 0) addAliases(source, fileHooks, pattern)
        addAliases(source, fileNames, pattern)
      }
      let count = 0
      if (fileHooks.size > 0) {
        count +=
          source.match(
            new RegExp(`(?<!function\\s+)\\b${either(fileHooks)}\\s*\\(`, 'g'),
          )?.length ?? 0
      }
      count +=
        source.match(
          new RegExp(
            `\\b(?:useContext|use)\\s*\\(\\s*${QUALIFIER}${either(fileNames)}\\b(?!\\s*\\.)`,
            'g',
          ),
        )?.length ?? 0
      if (count === 0) continue
      reads[context] ??= {}
      ;(reads[context] as Record<string, number>)[path] = count
    }
  }
  return reads
}

describe('engine reads of published context objects', () => {
  it('are only the ones the allowlist names, each with the slice that removes it', () => {
    const actual = directReads()
    const problems: string[] = []
    for (const context of new Set([
      ...Object.keys(actual),
      ...Object.keys(ALLOWED),
    ])) {
      const found = actual[context] ?? {}
      const allowed = ALLOWED[context]?.reads ?? {}
      for (const path of new Set([
        ...Object.keys(found),
        ...Object.keys(allowed),
      ])) {
        const n = found[path] ?? 0
        const max = allowed[path] ?? 0
        if (n > max) {
          problems.push(
            `${path} reads ${context} directly ${n} time(s), ${max} allowed: read the tree tier or the surface tier instead`,
          )
        } else if (n < max) {
          problems.push(
            `${path} reads ${context} ${n} time(s), but the allowlist says ${max}: lower its entry`,
          )
        }
      }
    }
    expect(problems).toEqual([])
  })

  it('tags every entry with the slice that removes it, and a reason', () => {
    for (const [context, entry] of Object.entries(ALLOWED)) {
      expect(PUBLISHED[context], context).toBeDefined()
      expect(entry.reason.length, context).toBeGreaterThan(0)
    }
    for (const context of ['GroupContext', 'ItemContext']) {
      expect(ALLOWED[context]?.removedBy ?? 'permanent').toBe('permanent')
    }
  })
})
