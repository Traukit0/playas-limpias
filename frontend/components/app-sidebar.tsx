"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Compass, FileBarChart, History, Map, Plus, Settings, User, Menu, X, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

const menuItems = [
  {
    title: "Dashboard",
    icon: Compass,
    href: "/",
  },
  {
    title: "Nueva Inspección",
    icon: Plus,
    href: "/nueva-inspeccion",
  },
  {
    title: "Historial",
    icon: History,
    href: "/historial",
  },
  {
    title: "Mapa",
    icon: Map,
    href: "/mapa",
  },
  {
    title: "Reincidencias",
    icon: FileBarChart,
    href: "/reincidencias",
  },
  {
    title: "Mis Denuncias",
    icon: Settings,
    href: "/mis-denuncias",
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, logout } = useAuth()

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 transform border-r bg-background transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
          isCollapsed ? "-translate-x-full" : "translate-x-0",
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Compass className="h-6 w-6 text-primary" />
            <span className="text-lg">Playas Limpias</span>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsCollapsed(true)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
              onClick={() => setIsCollapsed(true)}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2 rounded-md p-2 hover:bg-accent">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://ui.shadcn.com/avatars/01.png" alt="Avatar" />
                  <AvatarFallback>
                    {user ? user.nombre.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-sm">
                  <span className="font-medium">
                    {user ? user.nombre : 'Usuario'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user ? user.email : 'cargando...'}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/perfil">
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/mis-denuncias">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Mis Denuncias</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn("fixed left-4 top-4 z-40 md:hidden", !isCollapsed && "hidden")}
        onClick={() => setIsCollapsed(false)}
      >
        <Menu className="h-5 w-5" />
      </Button>
    </>
  )
}
