// Search callbacks a surface takes. No JSDoc here: members alias these
// (`DropdownMenuFilterFn`, …), and a doc comment would become their docs.

export type FilterFn = (
  value: string,
  search: string,
  keywords?: string[],
) => number

export type SearchNormalizer = (search: string) => string
