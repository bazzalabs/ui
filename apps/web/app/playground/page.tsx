'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ComponentFrameSimple } from '@/components/component-frame-simple'
import { Examples } from '@/components/examples'
import { MultiSelect } from '@/components/examples/action-menu/multiselect'
import { NavBar } from '@/components/nav-bar'
import logoSrc from '@/public/bazzaui-v3-color.png'
import { Playground } from './playground'

export default function Page() {
  return (
    <div className="flex flex-col h-full flex-1">
      <div className="border-b border-border border-dashed sticky top-0 bg-site-background backdrop-blur-md z-50">
        <div className="px-4 py-2 max-w-screen-xl w-full mx-auto border-border border-dashed xl:border-x">
          <NavBar />
        </div>
      </div>
      <div className="border-b border-border border-dashed bg-site-background">
        <div className="px-4 py-2 max-w-screen-xl w-full mx-auto border-border border-dashed xl:border-x">
          <div className="flex flex-col gap-4 p-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-medium font-mono tracking-tight text-base"
            >
              <Image
                className="size-6 mr-2 translate-y-[-0.75px]"
                src={logoSrc}
                alt="bazza/ui"
              />
              <span>bazza</span>
              <span className="text-lg text-muted-foreground/75">/</span>
              <span>ui</span>
            </Link>

            <h1 className="text-5xl font-[538] tracking-[-0.035rem] select-none">
              Playground
            </h1>
          </div>
        </div>
      </div>

      <div className="border-b border-border border-dashed bg-site-background flex-1 flex flex-col">
        <div className="px-4 py-2 max-w-screen-xl w-full mx-auto border-border border-dashed xl:border-x flex-1 flex flex-col">
          <div className="flex flex-col gap-8 p-8 flex-1">
            <Playground />
          </div>
        </div>
      </div>
      <div className="border-b border-border border-dashed bg-site-background">
        <div className="px-4 py-2 max-w-screen-xl w-full mx-auto border-border border-dashed xl:border-x h-16"></div>
      </div>
    </div>
  )
}
