'use client'

import DropdownMenuDeepSearchLinear from '@/registry/examples/dropdown-menu/deep-search-linear'
import DropdownMenuDeepSearchLinearAsync from '@/registry/examples/dropdown-menu/deep-search-linear-async'
import DropdownMenuDeepSearchLinearAsyncTanstack from '@/registry/examples/dropdown-menu/deep-search-linear-async-tanstack'

export function Playground() {
  return (
    <div className="space-y-4 p-8 h-[2000px]">
      <div className="p-32 flex flex-col gap-32 w-fit">
        {/*<InputEmbeddedComboboxDemo withoutConfig />*/}
        <DropdownMenuDeepSearchLinear />
        <DropdownMenuDeepSearchLinearAsync />
        <DropdownMenuDeepSearchLinearAsyncTanstack />
      </div>
    </div>
  )
}
