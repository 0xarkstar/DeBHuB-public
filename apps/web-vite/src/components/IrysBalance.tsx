'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Wallet, RefreshCw, ExternalLink } from 'lucide-react'
import { useAccount, useBalance } from 'wagmi'
import { formatEther } from 'viem'

export function IrysBalance() {
  const { address, isConnected } = useAccount()
  const { data: balanceData, refetch, isLoading } = useBalance({
    address: address,
  })

  const [fundingUrl, setFundingUrl] = useState<string>('')

  useEffect(() => {
    if (address) {
      setFundingUrl(`https://faucet.irys.computer?address=${address}`)
    }
  }, [address])

  const handleRefresh = () => {
    refetch()
  }

  const handleFunding = () => {
    if (fundingUrl) {
      window.open(fundingUrl, '_blank')
    }
  }

  if (!isConnected) {
    return null
  }

  const balance = balanceData?.value || BigInt(0)
  const formattedBalance = formatEther(balance)
  const balanceNum = parseFloat(formattedBalance)

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-bold">
              {isLoading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                balanceNum.toFixed(4)
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              {balanceData?.symbol || 'ETH'}
            </span>
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

        {balanceNum < 0.01 && (
          <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              Low balance. Consider funding your wallet to create documents.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}