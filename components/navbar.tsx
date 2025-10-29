"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Home, Package, FolderKanban, Users, Menu, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/projects", label: "Proyectos", icon: FolderKanban },
  { href: "/resources", label: "Recursos", icon: Package },
  { href: "/team", label: "Equipo", icon: Users },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
              <FolderKanban className="h-5 w-5" />
            </div>
            
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link key={item.href} href={item.href}>
                <motion.div className="relative px-4 py-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <div
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 rounded-lg bg-muted"
                      style={{ zIndex: -1 }}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </motion.div>
              </Link>
            )
          })}
        </div>

        {/* Mobile Menu Button */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      <motion.div
        initial={false}
        animate={{
          height: mobileMenuOpen ? "auto" : 0,
          opacity: mobileMenuOpen ? 1 : 0,
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
        className="overflow-hidden border-t md:hidden"
      >
        <div className="container space-y-1 px-4 py-4">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.3,
                }}
              >
                <Link href={item.href} onClick={() => setMobileMenuOpen(false)}>
                  <div
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </nav>
  )
}
