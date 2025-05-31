"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="relative flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <div className="mr-4 hidden md:flex">
              <a className="mr-6 flex items-center space-x-2" href="/">
                <span className="hidden font-bold sm:inline-block">
                  Urban Sim AI
                </span>
              </a>
            </div>
            <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
              <div className="w-full flex-1 md:w-auto md:flex-none">
                {/* Add search component here if needed */}
              </div>
              <nav className="flex items-center">
                <ModeToggle />
              </nav>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </ThemeProvider>
  )
} 