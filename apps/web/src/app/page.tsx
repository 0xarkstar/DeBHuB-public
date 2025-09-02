'use client'

import { useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import { ConnectWallet } from '../components/ConnectWallet'
import { PostForm } from '../components/PostForm'
import { PostsTable } from '../components/PostsTable'
import { DataVerifier } from '../components/DataVerifier'
import { Button } from '../components/ui/button'
import { FileText, Search, Plus } from 'lucide-react'

type ActiveTab = 'posts' | 'create' | 'verify'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('posts')

  const getTabContent = () => {
    switch (activeTab) {
      case 'create':
        return (
          <div className="max-w-2xl">
            <h3 className="text-lg font-medium mb-4">Create New Post</h3>
            <PostForm />
          </div>
        )
      case 'verify':
        return (
          <div className="max-w-2xl">
            <h3 className="text-lg font-medium mb-4">Data Verification</h3>
            <DataVerifier />
          </div>
        )
      case 'posts':
      default:
        return (
          <div>
            <h3 className="text-lg font-medium mb-4">Your Posts</h3>
            <PostsTable />
          </div>
        )
    }
  }

  const getTabTitle = () => {
    switch (activeTab) {
      case 'create':
        return {
          title: 'Create Post',
          description: 'Share your thoughts on the decentralized web'
        }
      case 'verify':
        return {
          title: 'Verify Data',
          description: 'Check data integrity against Irys gateway'
        }
      case 'posts':
      default:
        return {
          title: 'Posts',
          description: 'Create and manage your posts on Irys'
        }
    }
  }

  const { title, description } = getTabTitle()

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-6">
            <div>
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            </div>
            <ConnectWallet />
          </div>
        </header>

        <div className="border-b">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <Button
              variant={activeTab === 'posts' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('posts')}
              className="flex items-center gap-2"
            >
              <FileText size={16} />
              Posts
            </Button>
            <Button
              variant={activeTab === 'create' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('create')}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Create
            </Button>
            <Button
              variant={activeTab === 'verify' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('verify')}
              className="flex items-center gap-2"
            >
              <Search size={16} />
              Verify
            </Button>
          </nav>
        </div>

        <main className="p-6">
          {getTabContent()}
        </main>
      </div>
    </div>
  )
}