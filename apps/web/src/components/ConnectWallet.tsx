'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { useWalletStore } from '../store/wallet'
import { Wallet, LogOut, Shield, AlertTriangle, CheckCircle } from 'lucide-react'
import { shortenAddress, IRYS_VM_CHAIN_ID } from '../types'

export function ConnectWallet() {
  const { 
    address, 
    isConnected, 
    chainId, 
    isAuthenticated,
    connect, 
    disconnect, 
    authenticate, 
    switchToIrysVM 
  } = useWalletStore()

  const [isConnecting, setIsConnecting] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const handleConnect = async () => {
    if (isConnecting) return
    
    setIsConnecting(true)
    try {
      await connect()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleAuthenticate = async () => {
    if (isAuthenticating) return
    
    setIsAuthenticating(true)
    try {
      await authenticate()
    } catch (error) {
      console.error('Failed to authenticate:', error)
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleSwitchNetwork = async () => {
    try {
      await switchToIrysVM()
    } catch (error) {
      console.error('Failed to switch network:', error)
    }
  }

  const getNetworkStatus = () => {
    if (!chainId) return null
    
    if (chainId === IRYS_VM_CHAIN_ID) {
      return (
        <div className="flex items-center gap-1 text-green-600 text-xs">
          <CheckCircle size={12} />
          IrysVM
        </div>
      )
    }
    
    return (
      <div className="flex items-center gap-1 text-orange-600 text-xs">
        <AlertTriangle size={12} />
        Wrong Network
      </div>
    )
  }

  const getAuthStatus = () => {
    if (!isConnected) return null
    
    if (isAuthenticated) {
      return (
        <div className="flex items-center gap-1 text-green-600 text-xs">
          <Shield size={12} />
          Authenticated
        </div>
      )
    }
    
    return (
      <div className="flex items-center gap-1 text-orange-600 text-xs">
        <Shield size={12} />
        Not Authenticated
      </div>
    )
  }

  if (isConnected && address) {
    const isWrongNetwork = chainId && chainId !== IRYS_VM_CHAIN_ID

    return (
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end gap-1">
          <span className="text-sm font-medium">
            {shortenAddress(address)}
          </span>
          <div className="flex items-center gap-2">
            {getNetworkStatus()}
            {getAuthStatus()}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isWrongNetwork && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSwitchNetwork}
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              Switch to IrysVM
            </Button>
          )}
          
          {!isAuthenticated && !isWrongNetwork && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAuthenticate}
              disabled={isAuthenticating}
              className="flex items-center gap-2"
            >
              <Shield size={16} />
              {isAuthenticating ? 'Authenticating...' : 'Authenticate'}
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={disconnect}
            className="flex items-center gap-2"
          >
            <LogOut size={16} />
            Disconnect
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Button 
      onClick={handleConnect} 
      disabled={isConnecting}
      className="flex items-center gap-2"
    >
      <Wallet size={16} />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  )
}