'use client'

import { InputEmbeddedComboboxDemo } from './menu/menu-playground'

export function Playground() {
  return (
    <div className="space-y-4 p-8 h-[2000px]">
      <div className="p-32">
        <InputEmbeddedComboboxDemo withoutConfig />
      </div>
    </div>
  )
}
