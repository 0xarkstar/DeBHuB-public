'use client'

import { useState } from 'react'
import { useLazyQuery } from '@apollo/client'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { VERIFY_POST_FROM_IRYS } from '../lib/queries'
import { Post } from '../types'
import { Search, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface VerificationResult {
  status: 'verified' | 'mismatch' | 'not_found' | 'error'
  post?: Post
  message: string
}

export function DataVerifier() {
  const [transactionId, setTransactionId] = useState('')
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const [verifyPost] = useLazyQuery(VERIFY_POST_FROM_IRYS, {
    onCompleted: (data) => {
      if (data.verifyPostFromIrys) {
        setResult({
          status: 'verified',
          post: data.verifyPostFromIrys,
          message: 'Data successfully verified against Irys gateway'
        })
      } else {
        setResult({
          status: 'not_found',
          message: 'Transaction not found on Irys gateway'
        })
      }
      setIsVerifying(false)
    },
    onError: (error) => {
      setResult({
        status: 'error',
        message: `Verification failed: ${error.message}`
      })
      setIsVerifying(false)
    }
  })

  const handleVerify = async () => {
    if (!transactionId.trim()) {
      setResult({
        status: 'error',
        message: 'Please enter an Irys transaction ID'
      })
      return
    }

    setIsVerifying(true)
    setResult(null)

    try {
      await verifyPost({
        variables: { irysTransactionId: transactionId.trim() }
      })
    } catch (error) {
      setResult({
        status: 'error',
        message: 'Verification request failed'
      })
      setIsVerifying(false)
    }
  }

  const getStatusIcon = (status: VerificationResult['status']) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="text-green-600" size={20} />
      case 'mismatch':
        return <AlertTriangle className="text-orange-600" size={20} />
      case 'not_found':
      case 'error':
        return <XCircle className="text-red-600" size={20} />
      default:
        return null
    }
  }

  const getStatusColor = (status: VerificationResult['status']) => {
    switch (status) {
      case 'verified':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'mismatch':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'not_found':
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-muted border'
    }
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Data Verification</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Verify data integrity by checking PostgreSQL data against the original Irys transaction.
        </p>
        
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter Irys transaction ID..."
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            className="flex-1"
            disabled={isVerifying}
          />
          <Button
            onClick={handleVerify}
            disabled={isVerifying || !transactionId.trim()}
            className="flex items-center gap-2"
          >
            <Search size={16} />
            {isVerifying ? 'Verifying...' : 'Verify'}
          </Button>
        </div>
      </div>

      {result && (
        <div className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}>
          <div className="flex items-start gap-3">
            {getStatusIcon(result.status)}
            <div className="flex-1">
              <h4 className="font-semibold mb-2">Verification Result</h4>
              <p className="text-sm mb-3">{result.message}</p>
              
              {result.post && (
                <div className="space-y-3">
                  <div className="bg-background/50 rounded p-3 border">
                    <h5 className="font-medium text-sm mb-2">Post Data:</h5>
                    <div className="space-y-1 text-xs">
                      <div><strong>ID:</strong> {result.post.id}</div>
                      <div><strong>Author:</strong> {result.post.authorAddress}</div>
                      <div><strong>Version:</strong> {result.post.version}</div>
                      <div><strong>Timestamp:</strong> {new Date(result.post.timestamp).toLocaleString()}</div>
                      <div><strong>Content:</strong></div>
                      <div className="bg-background rounded p-2 mt-1 font-mono">
                        {result.post.content}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    <div><strong>Irys TX:</strong> {result.post.irysTransactionId}</div>
                    {result.post.previousVersionId && (
                      <div><strong>Previous Version:</strong> {result.post.previousVersionId}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>How verification works:</strong></p>
        <p>• Fetches the original data directly from Irys gateway</p>
        <p>• Compares content, metadata, and signatures</p>
        <p>• Ensures data integrity and authenticity</p>
        <p>• Note: This feature requires actual Irys integration to function fully</p>
      </div>
    </div>
  )
}