import { AppSidebar } from '@/components/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider className="h-svh min-h-0">
      <AppSidebar />
      <SidebarInset className="group lg:border-[0.5px] lg:border-border/75 overflow-y-auto sidebar-inset-scroll min-h-0">
        <div className="min-h-7 h-7 sticky left-4 top-4 ml-4">
          <SidebarTrigger className="hidden group-data-[state=closed]/sidebar-wrapper:flex" />
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
