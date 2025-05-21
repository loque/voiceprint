"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Mic, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Navbar() {
  const pathname = usePathname()

  const navItems = [
    {
      name: "Voices",
      href: "/",
      icon: <Mic className="h-4 w-4 mr-2" />,
      active: pathname === "/",
    },
    {
      name: "Models",
      href: "/models",
      icon: <Brain className="h-4 w-4 mr-2" />,
      active: pathname === "/models",
    },
  ]

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-lg flex items-center">
            <Mic className="h-5 w-5 mr-2" />
            VoicePrint
          </Link>
          <nav className="flex gap-2">
            {navItems.map((item) => (
              <Button key={item.href} asChild variant={item.active ? "default" : "ghost"} size="sm">
                <Link href={item.href} className="flex items-center">
                  {item.icon}
                  {item.name}
                </Link>
              </Button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
