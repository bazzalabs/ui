// -----------------------------------------------------------------------------
// Palette (single source of truth)
// -----------------------------------------------------------------------------
const OSCURA = {
  comment: '#46474F', // comments
  text: '#E6E6E6', // default light text
  tag: '#E6E7A3', // tags / classes / headings / attrs (yellowish)
  invalid: '#D84F68', // errors / deletions / special highlights (red)
  keyword: '#9099A1', // keywords / operators / control
  neutral: '#868F97', // secondary text / regex / docstrings, etc.
  url: '#479FFA', // links
  number: '#F9B98C', // numbers / constants / Next.js directives
  attrTeal: '#54C0A3', // HTML/CSS attributes
  strMeaningful: '#4EBE96', // semantically meaningful string literals
  templateText: '#F6B98B', // template-string body text
  bracket: '#5C6974', // brackets & delimiters
  mdSeparator: '#65737E', // markdown separators
  fencedDim: '#00000050', // dim fenced-code markers/backgrounds
}

// -----------------------------------------------------------------------------
// Theme
// -----------------------------------------------------------------------------
export const oscuraMidnight = {
  name: 'oscura-midnight',
  tokenColors: [
    {
      name: 'Comment',
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: OSCURA.comment },
    },
    {
      name: 'Variables',
      scope: [
        'variable',
        'string constant.other.placeholder',
        'entity.name.tag',
      ],
      settings: { foreground: OSCURA.text },
    },
    {
      name: 'Colors',
      scope: ['constant.other.color'],
      settings: { foreground: OSCURA.text },
    },
    {
      name: 'Invalid',
      scope: ['invalid', 'invalid.illegal'],
      settings: { foreground: OSCURA.invalid },
    },
    {
      name: 'Keyword, Storage',
      scope: ['keyword', 'storage.type', 'storage.modifier'],
      settings: { foreground: OSCURA.keyword },
    },
    {
      name: 'Operator, Punctuation, Misc',
      scope: [
        'keyword.control',
        'constant.other.color',
        'punctuation.definition.tag',
        'punctuation.separator.inheritance.php',
        'punctuation.definition.tag.html',
        'punctuation.definition.tag.begin.html',
        'punctuation.definition.tag.end.html',
        'punctuation.terminator.statement.ts',
        'punctuation.separator.parameter.ts',
        'punctuation.section.embedded',
        'keyword.other.template',
        'keyword.other.substitution',
      ],
      settings: { foreground: OSCURA.keyword },
    },
    {
      name: 'Tag',
      scope: ['entity.name.tag', 'meta.tag.sgml', 'markup.deleted.git_gutter'],
      settings: { foreground: OSCURA.tag },
    },
    {
      name: 'Function, Special Method',
      scope: [
        'entity.name.function',
        'variable.function',
        'support.function',
        'keyword.other.special-method',
      ],
      settings: { foreground: OSCURA.tag },
    },
    {
      name: 'Block Level Variables',
      scope: ['meta.block variable.other'],
      settings: { foreground: OSCURA.text },
    },
    {
      name: 'Other Variable, String Link',
      scope: ['support.other.variable', 'string.other.link'],
      settings: { foreground: OSCURA.text },
    },
    {
      name: 'Number, Constant, Function Argument, Tag Attribute, Embedded',
      scope: [
        'constant.numeric',
        'support.constant',
        'constant.character',
        'constant.escape',
        'keyword.other.unit',
        'keyword.other',
        'constant.language.boolean',
      ],
      settings: { foreground: OSCURA.number },
    },
    {
      name: 'String, Symbols, Inherited Class',
      scope: [
        'string',
        'constant.other.symbol',
        'constant.other.key',
        'meta.group.braces.curly constant.other.object.key.js string.unquoted.label.js',
      ],
      settings: { foreground: OSCURA.text },
    },
    {
      name: 'Class, Support',
      scope: [
        'entity.name',
        'support.type',
        'support.class',
        'support.other.namespace.use.php',
        'meta.use.php',
        'support.other.namespace.php',
        'markup.changed.git_gutter',
        'support.type.sys-types',
      ],
      settings: { foreground: OSCURA.tag },
    },
    {
      name: 'CSS Class and Support',
      scope: [
        'source.css support.type.property-name',
        'source.sass support.type.property-name',
        'source.scss support.type.property-name',
        'source.less support.type.property-name',
        'source.stylus support.type.property-name',
        'source.postcss support.type.property-name',
        'support.type.vendored.property-name.css',
        'source.css.scss entity.name.tag',
        'variable.parameter.keyframe-list.css',
        'meta.property-name.css',
        'variable.parameter.url.scss',
        'meta.property-value.scss',
        'meta.property-value.css',
      ],
      settings: { foreground: OSCURA.text },
    },
    {
      name: 'Sub-methods',
      scope: [
        'entity.name.module.js',
        'variable.import.parameter.js',
        'variable.other.class.js',
      ],
      settings: { foreground: OSCURA.invalid },
    },
    {
      name: 'Language methods',
      scope: ['variable.language'],
      settings: { foreground: OSCURA.neutral },
    },
    {
      name: 'entity.name.method.js',
      scope: ['entity.name.method.js'],
      settings: { foreground: OSCURA.text },
    },
    {
      name: 'meta.method.js',
      scope: [
        'meta.class-method.js entity.name.function.js',
        'variable.function.constructor',
      ],
      settings: { foreground: OSCURA.text },
    },
    {
      name: 'Attributes',
      scope: [
        'entity.other.attribute-name',
        'meta.property-list.scss',
        'meta.attribute-selector.scss',
        'meta.property-value.css',
        'entity.other.keyframe-offset.css',
        'meta.selector.css',
        'entity.name.tag.reference.scss',
        'entity.name.tag.nesting.css',
        'punctuation.separator.key-value.css',
      ],
      settings: { foreground: OSCURA.attrTeal },
    },
    {
      name: 'HTML Attributes',
      scope: [
        'text.html.basic entity.other.attribute-name.html',
        'text.html.basic entity.other.attribute-name',
      ],
      settings: { foreground: OSCURA.tag },
    },
    {
      name: 'CSS Classes',
      scope: [
        'entity.other.attribute-name.class',
        'entity.other.attribute-name.id',
        'meta.attribute-selector.scss',
        'variable.parameter.misc.css',
      ],
      settings: { foreground: OSCURA.tag },
    },
    {
      name: "CSS ID's",
      scope: ['source.sass keyword.control', 'meta.attribute-selector.scss'],
      settings: { foreground: OSCURA.text },
    },
    {
      name: 'Inserted',
      scope: ['markup.inserted'],
      settings: { foreground: OSCURA.text },
    },
    {
      name: 'Deleted',
      scope: ['markup.deleted'],
      settings: { foreground: OSCURA.invalid },
    },
    {
      name: 'Changed',
      scope: ['markup.changed'],
      settings: { foreground: OSCURA.neutral },
    },
    {
      name: 'Regular Expressions',
      scope: ['string.regexp'],
      settings: { foreground: OSCURA.neutral },
    },
    {
      name: 'Escape Characters',
      scope: ['constant.character.escape'],
      settings: { foreground: OSCURA.neutral },
    },
    {
      name: 'URL',
      scope: ['*url*', '*link*', '*uri*'],
      settings: { fontStyle: 'underline', foreground: OSCURA.url },
    },
    {
      name: 'Decorators',
      scope: [
        'tag.decorator.js entity.name.tag.js',
        'tag.decorator.js punctuation.definition.tag.js',
      ],
      settings: { foreground: OSCURA.text },
    },
    {
      name: 'ES7 Bind Operator',
      scope: [
        'source.js constant.other.object.key.js string.unquoted.label.js',
      ],
      settings: { fontStyle: 'italic', foreground: OSCURA.invalid },
    },
    {
      name: 'JSON Keys (All Levels)',
      scope: ['support.type.property-name.json'],
      settings: { foreground: OSCURA.tag },
    },
    {
      name: 'Markdown - Plain',
      scope: [
        'text.html.markdown',
        'punctuation.definition.list_item.markdown',
      ],
      settings: { foreground: OSCURA.text },
    },
    {
      name: 'Markdown - Markup Raw Inline',
      scope: ['text.html.markdown markup.inline.raw.markdown'],
      settings: { foreground: OSCURA.neutral },
    },
    {
      name: 'Markdown - Markup Raw Inline Punctuation',
      scope: [
        'text.html.markdown markup.inline.raw.markdown punctuation.definition.raw.markdown',
      ],
      settings: { foreground: OSCURA.text },
    },
    {
      name: 'Markdown - Heading',
      scope: [
        'markdown.heading',
        'markup.heading | markup.heading entity.name',
        'markup.heading.markdown punctuation.definition.heading.markdown',
        'markup.heading',
        'markup.inserted.git_gutter',
      ],
      settings: { foreground: OSCURA.tag },
    },
    {
      name: 'Markup - Italic',
      scope: ['markup.italic'],
      settings: { fontStyle: 'italic', foreground: OSCURA.text },
    },
    {
      name: 'Markup - Bold',
      scope: ['markup.bold', 'markup.bold string'],
      settings: { fontStyle: 'bold', foreground: OSCURA.text },
    },
    {
      name: 'Markup - Bold-Italic',
      scope: [
        'markup.bold markup.italic',
        'markup.italic markup.bold',
        'markup.quote markup.bold',
        'markup.bold markup.italic string',
        'markup.italic markup.bold string',
        'markup.quote markup.bold string',
      ],
      settings: { fontStyle: 'bold', foreground: OSCURA.text },
    },
    {
      name: 'Markup - Underline',
      scope: ['markup.underline'],
      settings: { fontStyle: 'underline', foreground: OSCURA.tag },
    },
    {
      name: 'Markdown - Blockquote',
      scope: ['markup.quote punctuation.definition.blockquote.markdown'],
      settings: { foreground: OSCURA.text },
    },
    {
      name: 'Markup - Quote',
      scope: ['markup.quote'],
      settings: { foreground: OSCURA.text },
    },
    {
      name: 'Markdown - Link',
      scope: ['string.other.link.title.markdown'],
      settings: { foreground: OSCURA.text },
    },
    {
      name: 'Markdown - Link Description',
      scope: ['string.other.link.description.title.markdown'],
      settings: { foreground: OSCURA.neutral },
    },
    {
      name: 'Markdown - Link Anchor',
      scope: ['constant.other.reference.link.markdown'],
      settings: { foreground: OSCURA.tag },
    },
    {
      name: 'Markup - Raw Block',
      scope: ['markup.raw.block'],
      settings: { foreground: OSCURA.neutral },
    },
    {
      name: 'Markdown - Raw Block Fenced',
      scope: ['markup.raw.block.fenced.markdown'],
      settings: { foreground: OSCURA.fencedDim },
    },
    {
      name: 'Markdown - Fenced Bode Block',
      scope: ['punctuation.definition.fenced.markdown'],
      settings: { foreground: OSCURA.fencedDim },
    },
    {
      name: 'Markdown - Fenced Bode Block Variable',
      scope: [
        'markup.raw.block.fenced.markdown',
        'variable.language.fenced.markdown',
        'punctuation.section.class.end',
      ],
      settings: { foreground: OSCURA.text },
    },
    {
      name: 'Markdown - Fenced Language',
      scope: ['variable.language.fenced.markdown'],
      settings: { foreground: OSCURA.text },
    },
    {
      name: 'Markdown - Separator',
      scope: ['meta.separator'],
      settings: { fontStyle: 'bold', foreground: OSCURA.mdSeparator },
    },
    {
      name: 'Markup - Table',
      scope: ['markup.table'],
      settings: { foreground: OSCURA.text },
    },
    {
      name: 'Brackets',
      scope: [
        'meta.brace',
        'punctuation.definition.block',
        'punctuation.definition.parameters',
        'punctuation.section.function',
        'meta.brackets',
        'punctuation.definition.brackets',
        'punctuation.definition.dictionary',
        'punctuation.definition.array',
        'punctuation.section',
        'punctuation.section.block',
        'punctuation.section.braces',
        'punctuation.section.group',
        'punctuation.section.parameters',
      ],
      settings: { foreground: OSCURA.bracket },
    },
    {
      name: 'Next.js Directives',
      scope: [
        'meta.function string.quoted.double.ts',
        'meta.function string.quoted.single.ts',
        'meta.function string.quoted.double.js',
        'meta.function string.quoted.single.js',
        'meta.function string.quoted.double.tsx',
        'meta.function string.quoted.single.tsx',
      ],
      settings: { foreground: OSCURA.number },
    },

    // -------------------------------------------------------------------------
    // Python Colors
    // -------------------------------------------------------------------------
    {
      name: 'Python Built-in Functions & Classes',
      scope: [
        'support.function.builtin.python',
        'support.function.magic.python',
        'support.type.builtin.python',
      ],
      settings: { foreground: OSCURA.tag, fontStyle: 'bold' },
    },
    {
      name: 'Python Function Arguments',
      scope: ['variable.parameter.function.python'],
      settings: { foreground: OSCURA.neutral, fontStyle: 'italic' },
    },
    {
      name: 'Python Special Keywords',
      scope: [
        'keyword.control.flow.python',
        'keyword.control.import.python',
        'keyword.control.statement.python',
        'keyword.operator.member.python',
        'keyword.operator.wordlike.python',
      ],
      settings: { foreground: OSCURA.keyword },
    },
    {
      name: 'Python Operators',
      scope: [
        'keyword.operator.logical.python',
        'keyword.operator.arithmetic.python',
        'keyword.operator.assignment.python',
        'keyword.operator.comparison.python',
        'keyword.operator.bitwise.python',
      ],
      settings: { foreground: OSCURA.number },
    },
    {
      name: 'Python Type Hints',
      scope: [
        'storage.type.python',
        'storage.type.annotation.python',
        'storage.type.function.python',
        'storage.type.class.python',
        'storage.type.union.python',
        'storage.type.intersection.python',
        'storage.type.optional.python',
        'storage.type.any.python',
        'storage.type.unknown.python',
        'storage.type.none.python',
      ],
      settings: { foreground: OSCURA.tag, fontStyle: 'bold' },
    },
    {
      name: 'Python Self Parameter',
      scope: ['variable.parameter.function.language.special.self.python'],
      settings: { foreground: OSCURA.neutral },
    },
    {
      name: 'Python Class Names',
      scope: [
        'entity.name.type.class.python',
        'entity.name.type.class.python punctuation.definition.class.python',
      ],
      settings: { foreground: OSCURA.tag },
    },
    {
      name: 'Python Function Names',
      scope: [
        'entity.name.function.python',
        'meta.function.python entity.name.function.python',
      ],
      settings: { foreground: OSCURA.tag },
    },
    {
      name: 'Python Variables',
      scope: [
        'variable.other.constant.python',
        'variable.other.enummember.python',
        'variable.other.property.python',
        'variable.other.object.python',
        'variable.other.readwrite.python',
      ],
      settings: { foreground: OSCURA.tag },
    },
    {
      name: 'Python String Formatting',
      scope: [
        'constant.character.format.placeholder.other.python',
        'constant.character.format.placeholder.other.python punctuation.definition.format.placeholder.python',
      ],
      settings: { foreground: OSCURA.number },
    },
    {
      name: 'Python Strings',
      scope: [
        'string.quoted.single.python',
        'string.quoted.double.python',
        'string.quoted.triple.single.python',
        'string.quoted.triple.double.python',
        'string.regexp.python',
        'string.quoted.single.python punctuation.definition.string.begin.python',
        'string.quoted.single.python punctuation.definition.string.end.python',
        'string.quoted.double.python punctuation.definition.string.begin.python',
        'string.quoted.double.python punctuation.definition.string.end.python',
        'string.quoted.triple.single.python punctuation.definition.string.begin.python',
        'string.quoted.triple.single.python punctuation.definition.string.end.python',
        'string.quoted.triple.double.python punctuation.definition.string.begin.python',
        'string.quoted.triple.double.python punctuation.definition.string.end.python',
      ],
      settings: { foreground: OSCURA.number },
    },
    {
      name: 'Python Docstrings',
      scope: ['string.quoted.docstring.multi.python'],
      settings: { fontStyle: 'italic', foreground: OSCURA.neutral },
    },
    {
      name: 'Python Built-in Constants',
      scope: ['constant.language.python'],
      settings: { foreground: OSCURA.number, fontStyle: 'italic' },
    },

    // -------------------------------------------------------------------------
    // JS/TS String Special Cases
    // -------------------------------------------------------------------------
    {
      name: 'String Literals in TypeScript/JavaScript',
      scope: [
        'meta.object-literal.key string.quoted.single.ts',
        'meta.object-literal.key string.quoted.double.ts',
        'meta.object-literal.key string.quoted.single.js',
        'meta.object-literal.key string.quoted.double.js',
        'meta.object-literal.key string.quoted.single.tsx',
        'meta.object-literal.key string.quoted.double.tsx',
        'meta.object.member string.quoted.single.ts',
        'meta.object.member string.quoted.double.ts',
        'meta.object.member string.quoted.single.js',
        'meta.object.member string.quoted.double.js',
        'meta.object.member string.quoted.single.tsx',
        'meta.object.member string.quoted.double.tsx',
        'meta.array.literal string.quoted.single.ts',
        'meta.array.literal string.quoted.double.ts',
        'meta.array.literal string.quoted.single.js',
        'meta.array.literal string.quoted.double.js',
        'meta.array.literal string.quoted.single.tsx',
        'meta.array.literal string.quoted.double.tsx',
        'meta.enum.declaration string.quoted.single.ts',
        'meta.enum.declaration string.quoted.double.ts',
        'meta.enum.declaration string.quoted.single.js',
        'meta.enum.declaration string.quoted.double.js',
        'meta.enum.declaration string.quoted.single.tsx',
        'meta.enum.declaration string.quoted.double.tsx',
      ],
      settings: { foreground: OSCURA.strMeaningful },
    },
    {
      name: 'SVG and HTML Attribute Strings',
      scope: [
        'meta.tag string.quoted.single.ts',
        'meta.tag string.quoted.double.ts',
        'meta.tag string.quoted.single.js',
        'meta.tag string.quoted.double.js',
        'meta.tag string.quoted.single.tsx',
        'meta.tag string.quoted.double.tsx',
        'meta.attribute string.quoted.single.ts',
        'meta.attribute string.quoted.double.ts',
        'meta.attribute string.quoted.single.js',
        'meta.attribute string.quoted.double.js',
        'meta.attribute string.quoted.single.tsx',
        'meta.attribute string.quoted.double.tsx',
      ],
      settings: { foreground: OSCURA.text },
    },
    {
      name: 'Import Statements in TypeScript/JavaScript',
      scope: [
        'meta.import string.quoted.single.ts',
        'meta.import string.quoted.double.ts',
        'meta.import string.quoted.single.js',
        'meta.import string.quoted.double.js',
        'meta.import string.quoted.single.tsx',
        'meta.import string.quoted.double.tsx',
      ],
      settings: { foreground: OSCURA.text },
    },
    {
      name: 'Template String Text Content',
      scope: ['string.template.js', 'string.template.ts'],
      settings: { foreground: OSCURA.templateText },
    },
  ],
}
