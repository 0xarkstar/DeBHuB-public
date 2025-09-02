'use client'

import { useState } from 'react'
import { useQuery, useSubscription } from '@apollo/client'
import { useWalletStore } from '../store/wallet'
import { GET_POSTS_BY_AUTHOR, GET_POST_HISTORY, POST_UPDATES_SUBSCRIPTION } from '../lib/queries'
import { Post, UpdateType } from '../types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { Button } from './ui/button'
import { formatDistanceToNow } from 'date-fns'
import { Eye, History, ExternalLink } from 'lucide-react'

export function PostsTable() {
  const { address, isConnected } = useWalletStore()
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const { data, loading, error, refetch } = useQuery(GET_POSTS_BY_AUTHOR, {
    variables: { 
      authorAddress: address || '',
      limit: 20,
      offset: 0
    },
    skip: !isConnected || !address,
    fetchPolicy: 'cache-and-network'
  })

  const { data: historyData, loading: historyLoading } = useQuery(GET_POST_HISTORY, {
    variables: { id: selectedPostId },
    skip: !selectedPostId || !showHistory,
  })

  useSubscription(POST_UPDATES_SUBSCRIPTION, {
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.postUpdates) {
        const { type, post } = subscriptionData.data.postUpdates
        if (post.authorAddress === address) {
          console.log(`Post ${type.toLowerCase()}: ${post.irysTransactionId}`)
          refetch()
        }
      }
    },
    skip: !isConnected || !address
  })

  const formatContent = (content: string) => {
    if (content.length <= 100) return content
    return content.substring(0, 100) + '...'
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch {
      return 'Unknown time'
    }
  }

  if (!isConnected) {
    return (
      <div className="p-6 bg-muted/50 rounded-lg">
        <p className="text-center text-muted-foreground">
          Connect your wallet to view your posts
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-center text-muted-foreground">Loading posts...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-destructive/10 rounded-lg">
        <p className="text-center text-destructive">
          Failed to load posts: {error.message}
        </p>
      </div>
    )
  }

  const posts: Post[] = data?.postsByAuthor || []
  const history: Post[] = historyData?.postHistory || []

  const handleViewHistory = (postId: string) => {
    setSelectedPostId(postId)
    setShowHistory(true)
  }

  const handleCloseHistory = () => {
    setShowHistory(false)
    setSelectedPostId(null)
  }

  if (posts.length === 0) {
    return (
      <div className="p-6 bg-muted/50 rounded-lg">
        <p className="text-center text-muted-foreground">
          No posts yet. Create your first post!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Content</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Irys TX ID</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">
                  {formatContent(post.content)}
                </TableCell>
                <TableCell>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    v{post.version}
                  </span>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {post.irysTransactionId.slice(0, 8)}...
                  </code>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatTimestamp(post.timestamp)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewHistory(post.id)}
                      className="h-8 w-8 p-0"
                    >
                      <History size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://gateway.irys.xyz/${post.irysTransactionId}`, '_blank')}
                      className="h-8 w-8 p-0"
                    >
                      <ExternalLink size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {showHistory && selectedPostId && (
        <div className="border rounded-lg p-4 bg-muted/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Version History</h3>
            <Button variant="outline" size="sm" onClick={handleCloseHistory}>
              Close
            </Button>
          </div>
          
          {historyLoading ? (
            <p className="text-muted-foreground">Loading history...</p>
          ) : (
            <div className="space-y-2">
              {history.map((version, index) => (
                <div key={version.id} className="border rounded p-3 bg-background">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        v{version.version}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(version.timestamp)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://gateway.irys.xyz/${version.irysTransactionId}`, '_blank')}
                      className="h-6 w-6 p-0"
                    >
                      <ExternalLink size={12} />
                    </Button>
                  </div>
                  <p className="text-sm">{version.content}</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">
                    {version.irysTransactionId}
                  </code>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}