import { AppSidebar } from '@/components/app-sidebar'
import AppSidebarOpenTrigger from '@/components/app-sidebar-open-trigger'
import { SidebarProvider } from '@/components/ui/sidebar'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider>
      <div className="lg:grid lg:grid-cols-[240px_1fr] w-full px-4 lg:px-0">
        <AppSidebar />
        <AppSidebarOpenTrigger />
        <main className="no-scrollbar">{children}</main>
      </div>
    </SidebarProvider>
  )
}
