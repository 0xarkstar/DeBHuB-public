import { create } from 'zustand'
import { ethers } from 'ethers'
import { WalletState, AuthState, IRYS_VM_CONFIG, IRYS_VM_CHAIN_ID, createAuthMessage, createAuthToken } from '../types'

interface WalletStore extends WalletState, AuthState {
  connect: () => Promise<void>
  disconnect: () => void
  signMessage: (message: string) => Promise<string>
  authenticate: () => Promise<void>
  switchToIrysVM: () => Promise<void>
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  // Wallet state
  address: null,
  isConnected: false,
  chainId: null,
  provider: null,
  signer: null,
  
  // Auth state
  isAuthenticated: false,
  authToken: null,
  message: null,
  signature: null,

  connect: async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const network = await provider.getNetwork()
      const chainId = Number(network.chainId)

      set({
        address,
        isConnected: true,
        chainId,
        provider,
        signer
      })

      // Try to switch to IrysVM if not already connected
      if (chainId !== IRYS_VM_CHAIN_ID) {
        await get().switchToIrysVM()
      }

      // Clear old auth state
      localStorage.removeItem('authToken')
      set({
        isAuthenticated: false,
        authToken: null,
        message: null,
        signature: null
      })

    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    }
  },

  disconnect: () => {
    localStorage.removeItem('authToken')
    set({
      address: null,
      isConnected: false,
      chainId: null,
      provider: null,
      signer: null,
      isAuthenticated: false,
      authToken: null,
      message: null,
      signature: null
    })
  },

  switchToIrysVM: async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed')
      }

      // Try to switch to the network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${IRYS_VM_CHAIN_ID.toString(16)}` }],
        })
      } catch (switchError: any) {
        // Network not added, try to add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [IRYS_VM_CONFIG],
          })
        } else {
          throw switchError
        }
      }

      // Update chain ID
      const provider = new ethers.BrowserProvider(window.ethereum)
      const network = await provider.getNetwork()
      const chainId = Number(network.chainId)

      set({ chainId })

    } catch (error) {
      console.error('Failed to switch to IrysVM:', error)
      throw error
    }
  },

  signMessage: async (message: string): Promise<string> => {
    const { signer } = get()
    if (!signer) {
      throw new Error('Wallet not connected')
    }

    try {
      return await signer.signMessage(message)
    } catch (error) {
      console.error('Failed to sign message:', error)
      throw error
    }
  },

  authenticate: async () => {
    const { address, signer } = get()
    
    if (!address || !signer) {
      throw new Error('Wallet not connected')
    }

    try {
      const timestamp = Date.now()
      const message = createAuthMessage(address, timestamp)
      const signature = await signer.signMessage(message)
      const authToken = createAuthToken(address, signature, message)

      set({
        isAuthenticated: true,
        authToken,
        message,
        signature
      })

      // Store token for Apollo Client
      localStorage.setItem('authToken', authToken)

    } catch (error) {
      console.error('Failed to authenticate:', error)
      throw error
    }
  }
}))

// Initialize auth from localStorage on page load
if (typeof window !== 'undefined') {
  const storedToken = localStorage.getItem('authToken')
  if (storedToken) {
    try {
      const decoded = JSON.parse(Buffer.from(storedToken, 'base64').toString())
      useWalletStore.setState({
        isAuthenticated: true,
        authToken: storedToken,
        message: decoded.message,
        signature: decoded.signature
      })
    } catch (error) {
      // Invalid token, remove it
      localStorage.removeItem('authToken')
    }
  }
}