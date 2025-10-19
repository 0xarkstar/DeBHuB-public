import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Database,
  Plus,
  Link2,
  BarChart3,
  Settings,
  Menu,
  X,
  Zap,
  TestTube
} from 'lucide-react';

import { ConnectWallet } from '@/components/ConnectWallet';
import { NetworkStatus } from '@/components/shared/NetworkStatus';
import { NetworkGuard } from '@/components/NetworkGuard';
import { IrysBalance } from '@/components/IrysBalance';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Data Browser', href: '/data', icon: Database },
  { name: 'Create Data', href: '/data/create', icon: Plus },
  { name: 'Blockchain', href: '/blockchain', icon: Link2 },
  { name: 'Usage', href: '/usage', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Vector DB Test', href: '/vector-db-test', icon: TestTube },
  { name: 'Pure Irys Test', href: '/pure-irys-test', icon: Zap },
];

export default function DashboardLayout() {
  const location = useLocation();
  const pathname = location.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Network Guard - Blocks UI if wrong network */}
      <NetworkGuard />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-muted/50 border-r transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">IB</span>
              </div>
              <div>
                <h1 className="text-lg font-bold">DeBHuB</h1>
                <p className="text-xs text-muted-foreground">Decentralized BaaS</p>
              </div>
            </Link>
          </div>

          {/* Network Status */}
          <div className="mb-4">
            <NetworkStatus compact />
          </div>

          {/* Irys Balance */}
          <div className="mb-6">
            <IrysBalance />
          </div>

          {/* Navigation */}
          <nav className="space-y-1 mb-6 flex-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Wallet Connection */}
          <div className="mt-auto">
            <ConnectWallet />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar (Mobile) */}
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

            <Link to="/" className="flex items-center gap-2">
              <div className="h-7 w-7 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">IB</span>
              </div>
              <span className="font-bold">DeBHuB</span>
            </Link>

            <ConnectWallet />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
