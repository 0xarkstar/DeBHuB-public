'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Wallet, RefreshCw, ExternalLink } from 'lucide-react'
import { useWalletStore } from '../store/wallet'
import { formatIrysBalance } from '@irysbase/shared'
import { ethers } from 'ethers'

export function IrysBalance() {
  const { address, isConnected, provider } = useWalletStore()
  const [balance, setBalance] = useState<string>('0')
  const [isLoading, setIsLoading] = useState(false)
  const [fundingUrl, setFundingUrl] = useState<string>('')

  const fetchBalance = async () => {
    if (!address || !provider || !isConnected) {
      setBalance('0')
      return
    }

    setIsLoading(true)
    try {
      const balance = await provider.getBalance(address)
      setBalance(balance.toString())
      
      // Set funding URL for IrysVM
      setFundingUrl(`https://faucet.irys.computer?address=${address}`)
    } catch (error) {
      console.error('Failed to fetch Irys balance:', error)
      setBalance('0')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBalance()
  }, [address, isConnected, provider])

  const handleRefresh = () => {
    fetchBalance()
  }

  const handleFunding = () => {
    if (fundingUrl) {
      window.open(fundingUrl, '_blank')
    }
  }

  if (!isConnected) {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Irys Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-bold">
              {isLoading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                formatIrysBalance(balance)
              )}
            </span>
            <span className="text-xs text-muted-foreground">IRYS</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFunding}
              disabled={!fundingUrl}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {parseFloat(ethers.formatEther(balance)) < 0.01 && (
          <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              Low balance. Consider funding your wallet to create posts.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}