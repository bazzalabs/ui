'use client'

import { Examples } from '@/components/examples'
import { NavBar } from '@/components/nav-bar'
import { DiamondSpinner } from '@/registry/action-menu'

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
          <div className="flex flex-col gap-8 p-8">
            <h1 className="text-4xl font-[538] tracking-[-0.03rem] select-none">
              Action Menu
            </h1>
          </div>
        </div>
      </div>

      <div className="border-b border-border border-dashed bg-site-background flex-1 flex flex-col">
        <div className="px-4 py-2 max-w-screen-xl w-full mx-auto border-border border-dashed xl:border-x flex-1 flex flex-col">
          <div className="flex flex-col gap-8 p-8 flex-1 w-fit">
            {/*<div className="size-[500px] flex items-center justify-center">
              <DiamondSpinner className="text-primary size-24" />
            </div>*/}
            {/* Content here! */}
            {/*<Examples.ActionMenu.AsyncBasic />*/}
            {/*<Examples.ActionMenu.AsyncSubmenus />*/}
            <Examples.ActionMenu.AsyncDeepSearch />
            {/* <Examples.ActionMenu.ItemDescriptions /> */}
            <Examples.ActionMenu.AIModelSwitcher />
            {/*<Examples.ActionMenu.Basic /> */}
            {/*<Examples.ActionMenu.Submenus />*/}
            <Examples.ActionMenu.Linear />
            <Examples.ActionMenu.LinearAsync />
            {/* <Examples.ActionMenu.Notion /> */}
            {/* <Examples.ActionMenu.HeaderFooter /> */}
            {/* <Examples.ActionMenu.RadioGroups /> */}
            {/* <Examples.ActionMenu.CheckboxItems /> */}
            {/* <Examples.ActionMenu.Massive numItems={10_000} /> */}
            {/* <Examples.ActionMenu.SubmenusDeep /> */}
          </div>
        </div>
      </div>
      <div className="border-b border-border border-dashed bg-site-background">
        <div className="px-4 py-2 max-w-screen-xl w-full mx-auto border-border border-dashed xl:border-x h-16"></div>
      </div>
    </div>
  )
}
