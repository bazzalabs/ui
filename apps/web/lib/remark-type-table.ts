// docs/plugins/remark-type-table.ts (or wherever you keep it)
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Root } from 'mdast'
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

type PropMeta = {
  name: string
  type: string
  required: boolean
  default?: string
  description?: string
}

type TypeMeta = {
  name: string
  kind: 'interface' | 'typealias' | 'enum'
  typeParams?: Array<{ name: string; constraint?: string; default?: string }>
  doc?: string
  props?: PropMeta[]
  definition?: string
}

type PackageMeta = {
  entrypoint: string
  types: Record<string, TypeMeta>
}

type TypesIndex = Record<string, PackageMeta>

const getTypes = (): TypesIndex => {
  try {
    const p = join(process.cwd(), '.types', 'types-meta.json')
    return JSON.parse(readFileSync(p, 'utf-8'))
  } catch (e) {
    console.error(
      '[remark-type-table] failed to read .types/types-meta.json',
      e,
    )
    return {}
  }
}

function getAttrString(
  node: MdxJsxFlowElement,
  name: string,
): string | undefined {
  const attr = node.attributes?.find(
    (a: any) => a.type === 'mdxJsxAttribute' && a.name === name,
  ) as any
  return typeof attr?.value === 'string' ? attr.value : undefined
}

export const remarkTypeTable: Plugin<[], Root> = () => {
  const typesIndex = getTypes()

  return (tree) => {
    visit(tree, 'mdxJsxFlowElement', (node: MdxJsxFlowElement, idx, parent) => {
      if (node.name !== 'TypeTable') return
      if (!parent || typeof idx !== 'number') return

      const pkgName = getAttrString(node, 'pkg')
      const typeName = getAttrString(node, 'type')

      if (!pkgName || !typeName) return

      const pkg = typesIndex[pkgName]
      const meta: TypeMeta | undefined = pkg?.types?.[typeName]
      if (!meta) {
        // Replace with a tiny warning paragraph so the page still builds.
        parent.children.splice(idx, 1, {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'Type ' },
            { type: 'inlineCode', value: `${pkgName}:${typeName}` },
            { type: 'text', value: ' not found.' },
          ],
        } as any)
        return
      }

      const rows = (meta.props ?? []).map((p) => {
        const attributes: any[] = [
          { type: 'mdxJsxAttribute', name: 'name', value: p.name },
          { type: 'mdxJsxAttribute', name: 'type', value: p.type },
        ]

        if (p.required) {
          attributes.push({
            type: 'mdxJsxAttribute',
            name: 'required',
          })
        }

        if (p.default !== undefined) {
          attributes.push({
            type: 'mdxJsxAttribute',
            name: 'defaultValue',
            value: p.default,
          })
        }

        if (p.description) {
          attributes.push({
            type: 'mdxJsxAttribute',
            name: 'description',
            value: p.description,
          })
        }

        const row = {
          type: 'mdxJsxFlowElement',
          name: 'PropRow',
          attributes,
          children: [],
        }

        return row
      }) as any[]

      console.log('rows:', rows)

      // Container for rows (handy for styling layout)
      const container: MdxJsxFlowElement = {
        type: 'mdxJsxFlowElement',
        name: 'PropsTable',
        attributes: [
          {
            type: 'mdxJsxAttribute',
            name: 'className',
            value: 'grid grid-cols-[auto_1fr]',
          },
        ],
        children: rows,
      }

      const nodes: any[] = []
      // if (maybeDoc) nodes.push(maybeDoc)
      // if (maybeDef) nodes.push(maybeDef)
      if (rows) nodes.push(container)

      parent.children.splice(idx, 1, ...nodes)
    })
  }
}
