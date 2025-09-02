'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../lib/utils'
import { Database, FileText, Settings } from 'lucide-react'

const sidebarItems = [
  {
    title: 'Posts',
    href: '/',
    icon: FileText
  },
  {
    title: 'Database',
    href: '/database',
    icon: Database
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings
  }
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-muted/50 border-r min-h-screen p-6">
      <div className="mb-8">
        <h1 className="text-xl font-bold">IrysBase</h1>
        <p className="text-sm text-muted-foreground">
          Decentralized BaaS Platform
        </p>
      </div>

      <nav className="space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <Icon size={18} />
              {item.title}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}