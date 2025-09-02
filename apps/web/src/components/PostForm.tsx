'use client'

import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { useWalletStore } from '../store/wallet'
import { CREATE_POST, GET_POSTS_BY_AUTHOR } from '../lib/queries'
import { Send, AlertTriangle, DollarSign } from 'lucide-react'
import { VALIDATION } from '../types'

export function PostForm() {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { 
    address, 
    isConnected, 
    isAuthenticated, 
    chainId, 
    authenticate 
  } = useWalletStore()

  const [createPost] = useMutation(CREATE_POST, {
    refetchQueries: [
      {
        query: GET_POSTS_BY_AUTHOR,
        variables: { 
          authorAddress: address,
          limit: 20,
          offset: 0
        }
      }
    ],
    onError: (err) => {
      setError(err.message)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!isConnected || !address || !content.trim()) {
      setError('Please connect your wallet and enter content')
      return
    }

    if (!isAuthenticated) {
      setError('Please authenticate first')
      return
    }

    if (content.length < VALIDATION.MIN_CONTENT_LENGTH || 
        content.length > VALIDATION.MAX_CONTENT_LENGTH) {
      setError(`Content must be between ${VALIDATION.MIN_CONTENT_LENGTH} and ${VALIDATION.MAX_CONTENT_LENGTH} characters`)
      return
    }

    setIsSubmitting(true)

    try {
      await createPost({
        variables: { content: content.trim() }
      })

      setContent('')
      setError(null)
    } catch (error) {
      console.error('Failed to create post:', error)
      // Error is handled by onError callback
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAuthenticate = async () => {
    try {
      await authenticate()
      setError(null)
    } catch (error) {
      setError('Authentication failed')
    }
  }

  if (!isConnected) {
    return (
      <div className="p-6 bg-muted/50 rounded-lg">
        <p className="text-center text-muted-foreground">
          Connect your wallet to create posts
        </p>
      </div>
    )
  }

  const getContentLengthColor = () => {
    const length = content.length
    if (length === 0) return 'text-muted-foreground'
    if (length < VALIDATION.MIN_CONTENT_LENGTH) return 'text-orange-600'
    if (length > VALIDATION.MAX_CONTENT_LENGTH) return 'text-red-600'
    return 'text-green-600'
  }

  const isContentValid = content.length >= VALIDATION.MIN_CONTENT_LENGTH && 
                        content.length <= VALIDATION.MAX_CONTENT_LENGTH

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Share your thoughts on Irys..."
            className="min-h-[120px] resize-none"
            disabled={isSubmitting}
            maxLength={VALIDATION.MAX_CONTENT_LENGTH}
          />
        </div>
        
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle size={16} className="text-red-600 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className={`text-sm ${getContentLengthColor()}`}>
              {content.length}/{VALIDATION.MAX_CONTENT_LENGTH} characters
            </span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign size={12} />
              <span>~$0.001 per post</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isAuthenticated && (
              <Button
                type="button"
                variant="outline"
                onClick={handleAuthenticate}
                className="flex items-center gap-2"
              >
                <AlertTriangle size={16} />
                Authenticate
              </Button>
            )}
            
            <Button 
              type="submit" 
              disabled={!isContentValid || isSubmitting || !isAuthenticated}
              className="flex items-center gap-2"
            >
              <Send size={16} />
              {isSubmitting ? 'Creating...' : 'Create Post'}
            </Button>
          </div>
        </div>
      </form>
      
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Posts are permanently stored on Irys and synchronized with our database</p>
        <p>• You need creator role permissions to publish posts</p>
        <p>• All posts are signed with your wallet for authenticity</p>
      </div>
    </div>
  )
}