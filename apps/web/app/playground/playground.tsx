'use client'

import DropdownMenuDeepSearchLinear from '@/registry/examples/dropdown-menu/deep-search-linear'
import { InputEmbeddedComboboxDemo } from './menu/menu-playground'

export function Playground() {
  return (
    <div className="space-y-4 p-8 h-[2000px]">
      <div className="p-32">
        {/*<InputEmbeddedComboboxDemo withoutConfig />*/}
        <DropdownMenuDeepSearchLinear />
      </div>
    </div>
  )
}
