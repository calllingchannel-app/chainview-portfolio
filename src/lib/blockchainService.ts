import { createPublicClient, http, parseAbi, formatUnits, type Address } from 'viem';
import { mainnet, polygon, arbitrum, optimism, base, bsc, avalanche } from 'viem/chains';
import { Connection, PublicKey } from '@solana/web3.js';
import { EVM_TOKENS, SOLANA_TOKENS, type TokenInfo } from './tokenLists';
import type { TokenBalance } from '@/stores/walletStore';

// Chain configurations
const CHAINS = {
  ethereum: mainnet,
  polygon,
  arbitrum,
  optimism,
  base,
  bsc,
  avalanche,
};

const ERC20_ABI = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
]);

// Create viem clients with timeout
function createClient(chainName: keyof typeof CHAINS) {
  return createPublicClient({
    chain: CHAINS[chainName],
    transport: http(undefined, { timeout: 10_000 }),
  });
}

// Solana connection with fallback to public RPC
const SOLANA_RPC = import.meta.env.VITE_HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com';
const solanaConnection = new Connection(SOLANA_RPC, { commitment: 'confirmed' });

// Get native balance for EVM chains
export async function getNativeBalance(
  chainName: keyof typeof CHAINS,
  address: string
): Promise<bigint> {
  try {
    const client = createClient(chainName);
    const balance = await client.getBalance({ address: address as Address });
    return balance;
  } catch (error) {
    console.error(`Failed to get native balance for ${chainName}:`, error);
    return 0n;
  }
}

// Get EVM token balances - check each token individually
export async function getEvmTokenBalances(
  chainName: keyof typeof CHAINS,
  address: string,
  tokens: TokenInfo[]
): Promise<TokenBalance[]> {
  if (tokens.length === 0) return [];

  const balances: TokenBalance[] = [];
  const client = createClient(chainName);

  try {
    // Check each token balance
    for (const token of tokens) {
      try {
        const balance = (await client.readContract({
          address: token.address as Address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address as Address],
        } as any)) as bigint;

        // Only include tokens with non-zero balance
        if (balance && balance > 0n) {
          const formatted = formatUnits(balance, token.decimals);
          balances.push({
            symbol: token.symbol,
            name: token.name,
            balance: formatted,
            decimals: token.decimals,
            usdValue: 0, // Will be filled by price service
            priceUsd: 0, // Will be filled by price service
            chain: chainName,
            contractAddress: token.address,
            logo: token.logoURI,
          });
        }
      } catch (error) {
        // Skip tokens with errors (likely not held by this wallet)
        continue;
      }
    }
  } catch (error) {
    console.error(`Failed to get EVM token balances for ${chainName}:`, error);
  }

  return balances;
}

// Get all EVM balances (native + tokens) for a wallet
export async function getAllEvmBalances(
  chainName: keyof typeof CHAINS,
  address: string
): Promise<TokenBalance[]> {
  const balances: TokenBalance[] = [];

  try {
    // Get native balance
    const nativeBalance = await getNativeBalance(chainName, address);
    
    if (nativeBalance > 0n) {
      const formatted = formatUnits(nativeBalance, 18);
      balances.push({
        symbol: chainName === 'bsc' ? 'BNB' : chainName === 'polygon' ? 'MATIC' : chainName === 'avalanche' ? 'AVAX' : 'ETH',
        name: chainName === 'bsc' ? 'BNB' : chainName === 'polygon' ? 'Polygon' : chainName === 'avalanche' ? 'Avalanche' : 'Ethereum',
        balance: formatted,
        decimals: 18,
        usdValue: 0,
        priceUsd: 0,
        chain: chainName,
      });
    }

    // Get token balances
    const tokens = EVM_TOKENS[chainName] || [];
    const tokenBalances = await getEvmTokenBalances(chainName, address, tokens);
    balances.push(...tokenBalances);

  } catch (error) {
    console.error(`Failed to get balances for ${chainName}:`, error);
  }

  return balances;
}

// Get Solana native balance
export async function getSolanaNative(address: string): Promise<bigint> {
  try {
    const publicKey = new PublicKey(address);
    const balance = await solanaConnection.getBalance(publicKey);
    return BigInt(balance);
  } catch (error) {
    console.error('Failed to get Solana native balance:', error);
    return 0n;
  }
}

// Get Solana SPL token balances
export async function getSolanaSPLBalances(
  address: string,
  tokens: TokenInfo[]
): Promise<TokenBalance[]> {
  const balances: TokenBalance[] = [];

  try {
    const publicKey = new PublicKey(address);
    const tokenAccounts = await solanaConnection.getParsedTokenAccountsByOwner(publicKey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    });

    tokenAccounts.value.forEach((accountInfo) => {
      const parsedInfo = accountInfo.account.data.parsed.info;
      const mint = parsedInfo.mint;
      const amount = parsedInfo.tokenAmount.amount;
      const decimals = parsedInfo.tokenAmount.decimals;

      // Find token info from our curated list
      const tokenInfo = tokens.find((t) => t.address === mint);

      if (amount !== '0' && tokenInfo) {
        const balance = formatUnits(BigInt(amount), decimals);
        balances.push({
          symbol: tokenInfo.symbol,
          name: tokenInfo.name,
          balance,
          decimals,
          usdValue: 0,
          priceUsd: 0,
          chain: 'solana',
          contractAddress: mint,
        });
      }
    });
  } catch (error) {
    console.error('Failed to get Solana SPL balances:', error);
  }

  return balances;
}

// Get all Solana balances (native + SPL)
export async function getAllSolanaBalances(address: string): Promise<TokenBalance[]> {
  const balances: TokenBalance[] = [];

  try {
    // Get native SOL balance
    const nativeBalance = await getSolanaNative(address);
    
    if (nativeBalance > 0n) {
      const formatted = formatUnits(nativeBalance, 9);
      balances.push({
        symbol: 'SOL',
        name: 'Solana',
        balance: formatted,
        decimals: 9,
        usdValue: 0,
        priceUsd: 0,
        chain: 'solana',
      });
    }

    // Get SPL token balances
    const splBalances = await getSolanaSPLBalances(address, SOLANA_TOKENS);
    balances.push(...splBalances);

  } catch (error) {
    console.error('Failed to get Solana balances:', error);
  }

  return balances;
}

// Get all balances for a wallet (used by wallet connection)
export async function getAllChainBalances(
  address: string,
  walletType: 'evm' | 'solana'
): Promise<TokenBalance[]> {
  if (walletType === 'solana') {
    return getAllSolanaBalances(address);
  }

  // For EVM, fetch from all supported chains in parallel
  const evmChains = Object.keys(CHAINS) as (keyof typeof CHAINS)[];
  const balancePromises = evmChains.map((chain) => getAllEvmBalances(chain, address));
  
  const results = await Promise.allSettled(balancePromises);
  const allBalances: TokenBalance[] = [];

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      allBalances.push(...result.value);
    }
  });

  return allBalances;
}
