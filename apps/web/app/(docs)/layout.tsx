import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider>
      <div className="lg:grid lg:grid-cols-[auto_1fr] w-full h-svh lg:mr-2">
        <AppSidebar />
        <SidebarInset className="overflow-y-scroll lg:border-[0.5px] lg:border-border/75">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
