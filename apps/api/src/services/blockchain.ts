import { ethers } from 'ethers';

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private authRolesContract: ethers.Contract;
  private postsContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || 'http://localhost:8545'
    );

    const authRolesABI = [
      "function hasRole(address user, string memory role) external view returns (bool)",
      "function assignRole(address user, string memory role) external",
      "function owner() external view returns (address)"
    ];

    const postsABI = [
      "function registerPost(string memory irysTxId) external",
      "event PostCreated(address indexed author, string irysTxId, uint256 timestamp)"
    ];

    this.authRolesContract = new ethers.Contract(
      process.env.AUTH_ROLES_CONTRACT_ADDRESS || '',
      authRolesABI,
      this.provider
    );

    this.postsContract = new ethers.Contract(
      process.env.POSTS_CONTRACT_ADDRESS || '',
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

  async registerPost(irysTxId: string, signerPrivateKey: string): Promise<string> {
    try {
      const wallet = new ethers.Wallet(signerPrivateKey, this.provider);
      const postsWithSigner = this.postsContract.connect(wallet);
      
      const tx = await postsWithSigner.registerPost(irysTxId);
      const receipt = await tx.wait();
      
      return receipt.hash;
    } catch (error) {
      console.error('Failed to register post on blockchain:', error);
      throw new Error('Failed to register post on blockchain');
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