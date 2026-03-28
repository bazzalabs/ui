'use client'

import DropdownMenuDeepSearchLinear from '@/registry/examples/dropdown-menu/deep-search-linear'
import DropdownMenuDeepSearchLinearAsync from '@/registry/examples/dropdown-menu/deep-search-linear-async'
import DropdownMenuDeepSearchLinearAsyncTanstack from '@/registry/examples/dropdown-menu/deep-search-linear-async-tanstack'
import DropdownMenuDeepSearchSubpagesLinear from '@/registry/examples/dropdown-menu/deep-search-subpages-linear'
import DropdownMenuLinearSubpageLabelCreation from '@/registry/examples/dropdown-menu/linear-subpage-label-creation'
import { DiamondSpinner } from '@/registry/ui/dropdown-menu'

export function Playground() {
  return (
    <div className="space-y-4 p-8 h-[2000px]">
      <div className="p-32 flex flex-col gap-32 w-fit">
        <DiamondSpinner className="size-12" />
        <DropdownMenuDeepSearchLinear />
        <DropdownMenuDeepSearchLinearAsync />
        <DropdownMenuDeepSearchLinearAsyncTanstack />
        <DropdownMenuDeepSearchSubpagesLinear />
        <DropdownMenuLinearSubpageLabelCreation />
      </div>
    </div>
  )
}
