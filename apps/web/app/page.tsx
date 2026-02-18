import { ContextMenuShowcase } from '@/components/landing/context-menu-showcase'
import { NavBar } from '@/components/nav-bar'
import { cn } from '@/lib/utils'
import DropdownMenuDeepSearchSubpagesLinear from '@/registry/examples/dropdown-menu/deep-search-subpages-linear'
import DropdownMenuLinearSubpageLabelCreation from '@/registry/examples/dropdown-menu/linear-subpage-label-creation'
import { Filters } from '@/registry/examples/filter-variants'
import SelectSearch from '@/registry/examples/select/search'
import { InputEmbeddedComboboxDemo } from './playground/menu/menu-playground'

export default function Page() {
  return (
    <div className="flex flex-col min-h-svh select-none">
      <div className="sticky top-0 backdrop-blur-md z-50">
        <div className="px-8 py-2 max-w-screen-xl w-full mx-auto rounded-b-4xl bg-popover border-b border-x border-border/50 shadow-xs">
          <NavBar />
        </div>
      </div>
      <div className="px-8 py-16 sm:py-32 max-w-screen-xl w-full mx-auto flex flex-col-reverse lg:flex-row items-center gap-x-12 gap-y-12 lg:justify-between">
        <div className="flex lg:flex-row flex-col gap-8">
          <div className="flex flex-col gap-8 w-full">
            <div className="flex justify-between items-center gap-4">
              <div className="space-y-8">
                <h1 className="-ml-1 text-3xl sm:text-5xl lg:text-6xl font-[538] leading-16 tracking-[-0.03em] text-center lg:text-left">
                  Opinionated tools
                  <br />
                  for building interfaces.
                </h1>
                <div className="space-y-2">
                  <p className="*:text-base sm:*:text-lg leading-none *:lg:text-xl *:tracking-[-0.01em] *:font-[410] text-neutral-500 dark:text-neutral-400 flex flex-col gap-1 text-center lg:text-left">
                    Unstyled UI components for building web interfaces.
                  </p>
                  <p className="*:text-base sm:*:text-lg leading-none *:lg:text-xl *:tracking-[-0.01em] *:font-[410] text-neutral-500 dark:text-neutral-400 flex flex-col gap-1 text-center lg:text-left">
                    Primitives for filtering, sorting, and managing data views.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/*<BazzaUIIcon className="drop-shadow-2xl dark:drop-shadow-muted h-auto w-[150px] sm:w-[300px] lg:w-[900px]" />*/}
      </div>
      <div
        className={cn(
          'h-fit max-w-screen-xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3',
          'border rounded-lg overflow-hidden',
          '[&>div]:px-8 [&>div]:py-10 [&>div]:flex [&>div]:flex-col [&>div]:items-center [&>div]:justify-center [&>div]:gap-4',
          '[&>div:not(:last-child)]:border-b',
          'lg:[&>div:not(:last-child)]:border-b-0',
          'lg:[&>div:not(:nth-child(3n))]:border-r',
          'lg:[&>div:nth-child(n+4)]:border-t',
        )}
      >
        <div>
          <div className="w-[225px] h-[calc(209px+8px+32px)]">
            <DropdownMenuDeepSearchSubpagesLinear />
          </div>
        </div>

        <div>
          <div className="w-[288px] h-[310px]">
            <InputEmbeddedComboboxDemo />
          </div>
        </div>

        <div>
          <div className="w-[240px] min-h-[220px] flex items-center justify-center">
            <SelectSearch />
          </div>
        </div>

        <div>
          <ContextMenuShowcase />
        </div>

        <div className="lg:items-start">
          <div className="w-full max-w-[340px]">
            <Filters variant="default" />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="w-[calc(225px+8px+28px)] h-[calc(241px+40px+32px)] translate-y-22 -translate-x-4">
            <DropdownMenuLinearSubpageLabelCreation />
          </div>
        </div>
      </div>
    </div>
  )
}
