/**
 * ankrBFC Smart Contract Integration
 *
 * Provides integration with blockchain smart contracts for:
 * - Audit trail anchoring
 * - Consent management on-chain
 * - Loan agreement tokenization (future)
 */

import { ethers } from 'ethers';

// Audit Anchor Contract ABI
export const AUDIT_ANCHOR_ABI = [
  'event AuditAnchored(uint256 indexed blockNumber, bytes32 merkleRoot, uint256 timestamp)',
  'function anchor(uint256 blockNumber, bytes32 merkleRoot) external',
  'function verify(uint256 blockNumber) external view returns (bytes32 merkleRoot, uint256 timestamp)',
  'function getLatestBlock() external view returns (uint256 blockNumber)',
];

// Consent Registry Contract ABI (for on-chain consent proof)
export const CONSENT_REGISTRY_ABI = [
  'event ConsentRecorded(bytes32 indexed customerId, bytes32 consentType, bool granted, uint256 timestamp)',
  'function recordConsent(bytes32 customerId, bytes32 consentType, bool granted) external',
  'function getConsent(bytes32 customerId, bytes32 consentType) external view returns (bool granted, uint256 timestamp)',
  'function revokeConsent(bytes32 customerId, bytes32 consentType) external',
];

export interface BlockchainIntegrationConfig {
  rpcUrl: string;
  privateKey: string;
  auditAnchorAddress?: string;
  consentRegistryAddress?: string;
  chainId: number;
}

/**
 * Blockchain integration service
 */
export class BlockchainIntegration {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private auditContract?: ethers.Contract;
  private consentContract?: ethers.Contract;

  constructor(config: BlockchainIntegrationConfig) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);

    if (config.auditAnchorAddress) {
      this.auditContract = new ethers.Contract(
        config.auditAnchorAddress,
        AUDIT_ANCHOR_ABI,
        this.wallet
      );
    }

    if (config.consentRegistryAddress) {
      this.consentContract = new ethers.Contract(
        config.consentRegistryAddress,
        CONSENT_REGISTRY_ABI,
        this.wallet
      );
    }
  }

  /**
   * Anchor audit block merkle root to blockchain
   */
  async anchorAuditBlock(
    blockNumber: number,
    merkleRoot: string
  ): Promise<{ txHash: string; blockNumber: number }> {
    if (!this.auditContract) {
      throw new Error('Audit anchor contract not configured');
    }

    const tx = await this.auditContract.anchor(
      blockNumber,
      ethers.zeroPadValue(ethers.toBeHex(merkleRoot), 32)
    );

    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  }

  /**
   * Verify audit block on blockchain
   */
  async verifyAuditBlock(
    blockNumber: number
  ): Promise<{ merkleRoot: string; timestamp: number } | null> {
    if (!this.auditContract) {
      throw new Error('Audit anchor contract not configured');
    }

    try {
      const [merkleRoot, timestamp] = await this.auditContract.verify(blockNumber);
      return {
        merkleRoot: merkleRoot,
        timestamp: Number(timestamp),
      };
    } catch {
      return null;  // Block not found
    }
  }

  /**
   * Record consent on blockchain (for immutable proof)
   */
  async recordConsentOnChain(
    customerId: string,
    consentType: string,
    granted: boolean
  ): Promise<{ txHash: string }> {
    if (!this.consentContract) {
      throw new Error('Consent registry contract not configured');
    }

    const customerHash = ethers.keccak256(ethers.toUtf8Bytes(customerId));
    const consentHash = ethers.keccak256(ethers.toUtf8Bytes(consentType));

    const tx = await this.consentContract.recordConsent(
      customerHash,
      consentHash,
      granted
    );

    const receipt = await tx.wait();

    return { txHash: receipt.hash };
  }

  /**
   * Get consent status from blockchain
   */
  async getConsentFromChain(
    customerId: string,
    consentType: string
  ): Promise<{ granted: boolean; timestamp: number } | null> {
    if (!this.consentContract) {
      throw new Error('Consent registry contract not configured');
    }

    try {
      const customerHash = ethers.keccak256(ethers.toUtf8Bytes(customerId));
      const consentHash = ethers.keccak256(ethers.toUtf8Bytes(consentType));

      const [granted, timestamp] = await this.consentContract.getConsent(
        customerHash,
        consentHash
      );

      return {
        granted,
        timestamp: Number(timestamp),
      };
    } catch {
      return null;
    }
  }

  /**
   * Get current gas price estimate
   */
  async getGasPrice(): Promise<bigint> {
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice ?? 0n;
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }
}

/**
 * Solidity source for Audit Anchor Contract
 * Deploy this to your preferred blockchain
 */
export const AUDIT_ANCHOR_SOLIDITY = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AuditAnchor {
    struct AuditBlock {
        bytes32 merkleRoot;
        uint256 timestamp;
        address submitter;
    }

    mapping(uint256 => AuditBlock) public auditBlocks;
    uint256 public latestBlockNumber;
    address public owner;

    event AuditAnchored(
        uint256 indexed blockNumber,
        bytes32 merkleRoot,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function anchor(uint256 blockNumber, bytes32 merkleRoot) external onlyOwner {
        require(auditBlocks[blockNumber].timestamp == 0, "Block already anchored");
        require(blockNumber > latestBlockNumber, "Invalid block number");

        auditBlocks[blockNumber] = AuditBlock({
            merkleRoot: merkleRoot,
            timestamp: block.timestamp,
            submitter: msg.sender
        });

        latestBlockNumber = blockNumber;

        emit AuditAnchored(blockNumber, merkleRoot, block.timestamp);
    }

    function verify(uint256 blockNumber) external view returns (bytes32, uint256) {
        AuditBlock memory blk = auditBlocks[blockNumber];
        require(blk.timestamp > 0, "Block not found");
        return (blk.merkleRoot, blk.timestamp);
    }

    function getLatestBlock() external view returns (uint256) {
        return latestBlockNumber;
    }
}
`;

/**
 * Solidity source for Consent Registry Contract
 */
export const CONSENT_REGISTRY_SOLIDITY = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ConsentRegistry {
    struct Consent {
        bool granted;
        uint256 timestamp;
        uint256 revokedAt;
    }

    // customerId hash => consentType hash => Consent
    mapping(bytes32 => mapping(bytes32 => Consent)) public consents;
    address public owner;

    event ConsentRecorded(
        bytes32 indexed customerId,
        bytes32 consentType,
        bool granted,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function recordConsent(
        bytes32 customerId,
        bytes32 consentType,
        bool granted
    ) external onlyOwner {
        consents[customerId][consentType] = Consent({
            granted: granted,
            timestamp: block.timestamp,
            revokedAt: 0
        });

        emit ConsentRecorded(customerId, consentType, granted, block.timestamp);
    }

    function getConsent(
        bytes32 customerId,
        bytes32 consentType
    ) external view returns (bool, uint256) {
        Consent memory c = consents[customerId][consentType];
        return (c.granted && c.revokedAt == 0, c.timestamp);
    }

    function revokeConsent(
        bytes32 customerId,
        bytes32 consentType
    ) external onlyOwner {
        consents[customerId][consentType].granted = false;
        consents[customerId][consentType].revokedAt = block.timestamp;

        emit ConsentRecorded(customerId, consentType, false, block.timestamp);
    }
}
`;
