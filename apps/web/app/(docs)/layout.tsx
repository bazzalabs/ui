import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider>
      <div className="lg:grid lg:grid-cols-[auto_1fr] w-full px-4 lg:px-0">
        <AppSidebar />
        <main className="no-scrollbar">{children}</main>
      </div>
    </SidebarProvider>
  )
}
