import { useState } from 'react';
import { User, Key, Bell, Palette, Shield, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WalletGuard } from '@/components/WalletGuard';
import { useWallet, useUser, useProjects } from '@/lib/irys-hooks';
import { cn } from '@/lib/utils';

type SettingsTab = 'profile' | 'api-keys' | 'notifications' | 'appearance' | 'security';

function SettingsContent() {
  const { address } = useWallet();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [notifications, setNotifications] = useState({
    documentUpdates: true,
    collaboratorInvites: true,
    comments: true,
    weeklyDigest: false,
  });

  const { data: user, loading } = useUser(address);
  const { data: projects } = useProjects(address);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
  ] as const;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  View your account information and wallet details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Wallet Address</label>
                  <div className="flex items-center gap-2">
                    <Input value={address || ''} readOnly className="font-mono text-sm" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(address || '')}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                    <div className="h-10 bg-muted animate-pulse rounded" />
                  </div>
                ) : user ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">User ID</label>
                      <Input value={user.entityId} readOnly />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Member Since</label>
                      <Input value={formatDate(user.createdAt)} readOnly />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Owned Projects</label>
                      <Input
                        value={`${projects?.length || 0} projects`}
                        readOnly
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Display Name</label>
                      <Input
                        value={user.profile?.displayName || 'Not set'}
                        readOnly
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Failed to load user information
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'api-keys' && (
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  Manage your API keys for programmatic access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">API Keys Coming Soon</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    API key management will be available in a future update.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 text-left">
                    <p className="text-sm font-medium mb-2">Irys Network:</p>
                    <code className="text-xs bg-background px-2 py-1 rounded block mb-2">
                      Query: @irys/query
                    </code>
                    <code className="text-xs bg-background px-2 py-1 rounded block">
                      Upload: @irys/upload
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications for this activity
                      </p>
                    </div>
                    <Button
                      variant={value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        setNotifications({ ...notifications, [key]: !value })
                      }
                    >
                      {value ? 'On' : 'Off'}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how DeBHuB looks for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Theme</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setTheme('light')}
                      className={cn(
                        'relative flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-colors',
                        theme === 'light'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground'
                      )}
                    >
                      <div className="w-full h-24 rounded bg-white border shadow-sm" />
                      <span className="text-sm font-medium">Light</span>
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={cn(
                        'relative flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-colors',
                        theme === 'dark'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground'
                      )}
                    >
                      <div className="w-full h-24 rounded bg-slate-950 border shadow-sm" />
                      <span className="text-sm font-medium">Dark</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Theme preferences are currently view-only. Full theme customization coming soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Manage your security settings and authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="font-medium">Wallet Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        Sign messages to prove wallet ownership
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                      Active
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="font-medium">Session Management</p>
                      <p className="text-sm text-muted-foreground">
                        Your session is stored locally
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        localStorage.removeItem('authToken');
                        window.location.reload();
                      }}
                    >
                      Sign Out
                    </Button>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">Network</p>
                      <p className="text-sm text-muted-foreground">
                        Connected to IrysVM
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                      Chain ID: 1270
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <WalletGuard>
      <SettingsContent />
    </WalletGuard>
  );
}
