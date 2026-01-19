import Link from 'next/link'
import { ResponsiveImage } from './responsive-image'

export const ComponentsList = () => {
  return (
    <div className="grid grid-cols-2 w-full gap-4">
      <Link
        href="/docs/filters/introduction"
        className="col-span-2 md:col-span-1 h-auto aspect-square rounded-xl bg-sidebar border shadow-md hover:scale-[1.02] transition-[scale] cursor-pointer duration-150 ease-in-out"
      >
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
      </Link>
    </div>
  )
}
