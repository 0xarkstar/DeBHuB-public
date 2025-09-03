'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../lib/utils'
import { Database, FileText, Settings, Network } from 'lucide-react'
import { ConnectWallet } from './ConnectWallet'
import { IrysBalance } from './IrysBalance'
import { useWalletStore } from '../store/wallet'

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
  const { chainId, isConnected } = useWalletStore()

  const isIrysVM = chainId === 1270

  return (
    <div className="w-64 bg-muted/50 border-r min-h-screen p-6 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold">IrysBase</h1>
        <p className="text-sm text-muted-foreground">
          Decentralized BaaS Platform
        </p>
      </div>

      {/* Network Status */}
      {isConnected && (
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Network className="h-4 w-4" />
            <span className={cn(
              "font-medium",
              isIrysVM ? "text-green-600" : "text-orange-600"
            )}>
              {isIrysVM ? "IrysVM" : `Chain ${chainId}`}
            </span>
          </div>
          {!isIrysVM && (
            <p className="text-xs text-muted-foreground mt-1">
              Switch to IrysVM for full functionality
            </p>
          )}
        </div>
      )}

      <nav className="space-y-2 mb-6">
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

      {/* Wallet Connection & Balance */}
      <div className="mt-auto space-y-4">
        <ConnectWallet />
        <IrysBalance />
      </div>
    </div>
  )
}