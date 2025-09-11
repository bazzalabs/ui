import { ResponsiveImage } from './responsive-image'

export const ComponentsList = () => {
  return (
    <div className="grid grid-cols-2 w-full gap-4">
      <div className="col-span-1 h-auto aspect-square rounded-xl bg-sidebar border shadow-md hover:scale-105 transition-[scale] cursor-default duration-150 ease-in-out">
        <div className="relative flex flex-col justify-end h-full">
          <div className="absolute inset-0 h-full translate-y-8">
            <ResponsiveImage
              lightSrc="/changelog/2025-05-05/grouped-options-light.png"
              darkSrc="/changelog/2025-05-05/grouped-options-dark.png"
              alt=""
              className="mask-l-from-60% mask-b-from-30% mask-b-to-90% select-none mask-r-from-80%"
              wrapperClassName="aspect-[calc(16/12)] scale-140 border-none bg-transparent dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col gap-2 p-4">
            <h2 className="text-3xl font-[550] tracking-[-0.02em]">
              Data table filter
            </h2>
            <p className="text-base text-muted-foreground text-balance leading-6">
              Powerful filtering library with modern components, for your next
              data table.
            </p>
          </div>
        </div>
      </div>
      <div className="col-span-1 h-auto aspect-square overflow-clip rounded-xl bg-site-background border shadow-md hover:scale-105 transition-[scale] cursor-default  duration-150 ease-in-out">
        <div className="relative flex flex-col justify-end h-full">
          <div className="absolute inset-0 h-full w-full">
            <ResponsiveImage
              lightSrc="/action-menu/light.png"
              darkSrc="/action-menu/dark.png"
              alt=""
              className="mask-b-from-30% mask-b-to-80% select-none"
              wrapperClassName="w-full h-full scale-140 translate-x-4 -translate-y-8 border-none bg-transparent dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col gap-2 p-4">
            <h2 className="text-3xl font-[550] tracking-[-0.02em]">
              Action menu
            </h2>
            <p className="text-base text-muted-foreground text-balance leading-6">
              Composable menu with deep search and multi-level submenus.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
