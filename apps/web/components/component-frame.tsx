import { CodeXmlIcon, FrameIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import ComponentCode from './component-code'
import { ScrollArea, ScrollBar } from './ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

export const ComponentFrame = ({
  className,
  containerClassName,
  previewClassName,
  children,
  caption,
  src,
  ...props
}: React.ComponentProps<'div'> & {
  containerClassName?: string
  previewClassName?: string
  caption?: React.ReactNode
  src?: string
}) => {
  const tabsList = (
    <TabsList className="bg-transparent px-0 gap-4 font-medium mx-3 2xl:-mx-12">
      <TabsTrigger
        className="text-muted-foreground/75 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 font-mono tracking-tighter"
        value="preview"
      >
        <FrameIcon className="size-4" />
        Preview
      </TabsTrigger>
      <TabsTrigger
        className="text-muted-foreground/75 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 font-mono"
        value="code"
      >
        <CodeXmlIcon className="size-4" />
        Code
      </TabsTrigger>
    </TabsList>
  )

  return (
    <div className={cn('h-fit flex flex-col gap-4 w-full', className)}>
      <Tabs defaultValue="preview">
        {src && tabsList}
        <div
          className={cn(
            'rounded-2xl border 2xl:-mx-16 h-fit relative overflow-scroll flex',
            containerClassName,
          )}
          {...props}
        >
          <TabsContent value="preview">
            <div
              className={cn(
                'p-8 h-fit w-fit z-[10] relative',
                previewClassName,
              )}
            >
              {children}
            </div>
            <div className="absolute h-full w-full bg-grid text-muted top-0 left-0 mask-radial-at-center mask-radial-from-50% z-[2]" />
            <div className="absolute h-full w-full  bg-white dark:bg-black top-0 left-0 z-[1]" />
          </TabsContent>
          {src && (
            <TabsContent value="code" asChild>
              <ScrollArea className="h-full w-full">
                <ComponentCode src={src} />
                <ScrollBar orientation="horizontal" />
                <ScrollBar orientation="vertical" />
              </ScrollArea>
            </TabsContent>
          )}
        </div>
      </Tabs>
      {caption && (
        <div className="text-sm text-muted-foreground w-full text-center">
          {caption}
        </div>
      )}
    </div>
  )
}
