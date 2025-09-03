'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Calculator, AlertCircle } from 'lucide-react'
import { ethers } from 'ethers'

interface PostCostEstimatorProps {
  content: string
  onCostCalculated?: (cost: string) => void
}

export function PostCostEstimator({ content, onCostCalculated }: PostCostEstimatorProps) {
  const [cost, setCost] = useState<string>('0')
  const [isCalculating, setIsCalculating] = useState(false)

  const estimateCost = async (content: string) => {
    if (!content.trim()) {
      setCost('0')
      onCostCalculated?.('0')
      return
    }

    setIsCalculating(true)
    
    try {
      // Estimate based on content size
      // This is a rough estimate - in production you'd call irys.getPrice()
      const contentSize = new TextEncoder().encode(content).length
      const basePrice = contentSize * 1e12 // Very rough estimate in wei
      
      const estimatedCost = basePrice.toString()
      setCost(estimatedCost)
      onCostCalculated?.(estimatedCost)
    } catch (error) {
      console.error('Failed to estimate cost:', error)
      setCost('0')
      onCostCalculated?.('0')
    } finally {
      setIsCalculating(false)
    }
  }

  useEffect(() => {
    const debounce = setTimeout(() => {
      estimateCost(content)
    }, 500)

    return () => clearTimeout(debounce)
  }, [content, onCostCalculated])

  const costInEther = ethers.formatEther(cost || '0')
  const isHighCost = parseFloat(costInEther) > 0.001

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Estimated Cost
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-semibold">
              {isCalculating ? '...' : `${parseFloat(costInEther).toFixed(6)}`}
            </span>
            <span className="text-xs text-muted-foreground">IRYS</span>
          </div>
          
          {isHighCost && (
            <div className="flex items-center gap-1 text-yellow-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs">High cost</span>
            </div>
          )}
        </div>
        
        <div className="mt-2 text-xs text-muted-foreground">
          Size: {new TextEncoder().encode(content || '').length} bytes
        </div>
        
        {content && (
          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
            💡 Cost includes permanent storage on Irys DataChain
          </div>
        )}
      </CardContent>
    </Card>
  )
}