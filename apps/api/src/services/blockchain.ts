import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, IRYS_VM_CHAIN_ID } from '@debhub/shared';

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private authRolesContract: ethers.Contract;
  private postsContract: ethers.Contract;

  constructor() {
    // Default to IrysVM network
    const rpcUrl = process.env.RPC_URL || 'https://rpc.irys.computer';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    const authRolesABI = [
      "function hasRole(address user, string memory role) external view returns (bool)",
      "function assignRole(address user, string memory role) external",
      "function owner() external view returns (address)"
    ];

    const postsABI = [
      "function registerPost(string memory irysTransactionId) external",
      "function updatePost(string memory newTransactionId, string memory previousTransactionId) external",
      "event PostCreated(address indexed author, string irysTransactionId, uint256 timestamp)",
      "event PostUpdated(address indexed author, string newTransactionId, string previousTransactionId)"
    ];

    this.authRolesContract = new ethers.Contract(
      process.env.AUTH_ROLES_CONTRACT_ADDRESS || CONTRACT_ADDRESSES.AUTH_ROLES,
      authRolesABI,
      this.provider
    );

    this.postsContract = new ethers.Contract(
      process.env.POSTS_CONTRACT_ADDRESS || CONTRACT_ADDRESSES.POSTS,
      postsABI,
      this.provider
    );
  }

  async hasRole(userAddress: string, role: string): Promise<boolean> {
    try {
      return await this.authRolesContract.hasRole(userAddress, role);
    } catch (error) {
      console.error('Failed to check role:', error);
      return false;
    }
  }

  async registerPost(irysTransactionId: string, signerPrivateKey: string): Promise<string> {
    try {
      const wallet = new ethers.Wallet(signerPrivateKey, this.provider);
      const postsWithSigner = this.postsContract.connect(wallet);
      
      const tx = await postsWithSigner.getFunction("registerPost")(irysTransactionId);
      const receipt = await tx.wait();
      
      console.log(`✅ Post registered on blockchain: ${receipt.hash}`);
      return receipt.hash;
    } catch (error) {
      console.error('Failed to register post on blockchain:', error);
      throw new Error('Failed to register post on blockchain');
    }
  }

  async updatePost(
    newTransactionId: string, 
    previousTransactionId: string, 
    signerPrivateKey: string
  ): Promise<string> {
    try {
      const wallet = new ethers.Wallet(signerPrivateKey, this.provider);
      const postsWithSigner = this.postsContract.connect(wallet);
      
      const tx = await postsWithSigner.getFunction("updatePost")(newTransactionId, previousTransactionId);
      const receipt = await tx.wait();
      
      console.log(`✅ Post updated on blockchain: ${receipt.hash}`);
      return receipt.hash;
    } catch (error) {
      console.error('Failed to update post on blockchain:', error);
      throw new Error('Failed to update post on blockchain');
    }
  }

  subscribeToPostEvents(callback: (author: string, irysTxId: string, timestamp: number) => void) {
    this.postsContract.on('PostCreated', (author, irysTxId, timestamp) => {
      callback(author, irysTxId, Number(timestamp));
    });
  }

  async getPostCreatedEvents(fromBlock: number = 0) {
    try {
      const filter = this.postsContract.filters.PostCreated();
      const events = await this.postsContract.queryFilter(filter, fromBlock);
      return events;
    } catch (error) {
      console.error('Failed to get post events:', error);
      return [];
    }
  }
}