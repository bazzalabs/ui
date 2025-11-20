import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider>
      <div className={cn('lg:grid lg:grid-cols-[300px_auto] w-full h-svh')}>
        <AppSidebar className="col-span-1 w-[300px]" />
        <SidebarInset className="col-span-1 lg:border-[0.5px] lg:border-border/75 overflow-y-auto lg:w-[calc(100%-1rem)] sidebar-inset-scroll">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
