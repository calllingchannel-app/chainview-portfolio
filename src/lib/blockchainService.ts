import { createPublicClient, http, parseAbi, formatUnits, type Address } from 'viem';
import { mainnet, polygon, arbitrum, optimism, base, bsc, avalanche } from 'viem/chains';
import { Connection, PublicKey } from '@solana/web3.js';
import { EVM_TOKENS, SOLANA_TOKENS, type TokenInfo } from './tokenLists';
import type { TokenBalance } from '@/stores/walletStore';

// Chain configurations with custom RPC endpoints for reliability
const CHAINS = {
  ethereum: mainnet,
  polygon,
  arbitrum,
  optimism,
  base,
  bsc,
  avalanche,
};

// Custom RPC endpoints for better reliability
const RPC_URLS: Record<string, string> = {
  ethereum: 'https://eth.llamarpc.com',
  polygon: 'https://polygon.llamarpc.com',
  arbitrum: 'https://arbitrum.llamarpc.com',
  optimism: 'https://optimism.llamarpc.com',
  base: 'https://base.llamarpc.com',
  bsc: 'https://bsc-dataseed1.binance.org',
  avalanche: 'https://api.avax.network/ext/bc/C/rpc',
};

const ERC20_ABI = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
]);

// Create viem clients with proper RPC and timeout
function createClient(chainName: keyof typeof CHAINS) {
  const rpcUrl = RPC_URLS[chainName];
  return createPublicClient({
    chain: CHAINS[chainName],
    transport: http(rpcUrl, { 
      timeout: 12_000,
      retryCount: 2,
      retryDelay: 1000
    }),
  });
}

// Solana RPC with resilient fallback
const SOLANA_RPC_CANDIDATES: string[] = [
  import.meta.env.VITE_HELIUS_RPC_URL || '',
  'https://api.mainnet-beta.solana.com',
  'https://solana.public-rpc.com',
  'https://rpc.ankr.com/solana',
].filter(Boolean);

async function withSolanaConnection<T>(fn: (conn: Connection) => Promise<T>): Promise<T> {
  let lastError: any;
  for (const url of SOLANA_RPC_CANDIDATES) {
    try {
      const conn = new Connection(url, { 
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 10000
      });
      const result = await fn(conn);
      return result;
    } catch (err) {
      lastError = err;
      console.warn(`Solana RPC failed: ${url.substring(0, 40)}...`);
      continue;
    }
  }
  throw new Error(`All Solana RPC endpoints failed: ${lastError?.message || 'Unknown error'}`);
}

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

// Native token metadata per chain
const NATIVE_TOKENS: Record<string, { symbol: string; name: string; decimals: number }> = {
  ethereum: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  polygon: { symbol: 'MATIC', name: 'Polygon', decimals: 18 },
  arbitrum: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  optimism: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  base: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  bsc: { symbol: 'BNB', name: 'BNB', decimals: 18 },
  avalanche: { symbol: 'AVAX', name: 'Avalanche', decimals: 18 },
};

// Get all EVM balances (native + tokens) for a wallet
export async function getAllEvmBalances(
  chainName: keyof typeof CHAINS,
  address: string
): Promise<TokenBalance[]> {
  const balances: TokenBalance[] = [];
  const nativeInfo = NATIVE_TOKENS[chainName] || { symbol: 'ETH', name: 'Ethereum', decimals: 18 };

  try {
    // Get native balance
    const nativeBalance = await getNativeBalance(chainName, address);
    const formatted = formatUnits(nativeBalance, nativeInfo.decimals);
    const balanceNum = parseFloat(formatted);
    
    // Only include if balance > 0 (except we always show native for context)
    if (balanceNum > 0.00001 || balanceNum === 0) {
      balances.push({
        symbol: nativeInfo.symbol,
        name: nativeInfo.name,
        balance: formatted,
        decimals: nativeInfo.decimals,
        usdValue: 0,
        priceUsd: 0,
        chain: chainName,
      });
    }

    // Get token balances
    const tokens = EVM_TOKENS[chainName] || [];
    if (tokens.length > 0) {
      const tokenBalances = await getEvmTokenBalances(chainName, address, tokens);
      balances.push(...tokenBalances);
    }

  } catch (error) {
    console.error(`Failed to get balances for ${chainName}:`, error);
  }

  return balances;
}

// Get Solana native balance
export async function getSolanaNative(address: string): Promise<bigint> {
  try {
    const publicKey = new PublicKey(address);
    const balance = await withSolanaConnection((conn) => conn.getBalance(publicKey));
    console.log(`Raw Solana balance for ${address}: ${balance} lamports`);
    return BigInt(balance);
  } catch (error) {
    console.error('Failed to get Solana native balance:', error);
    throw error; // Re-throw to be handled by caller
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
    const tokenAccounts = await withSolanaConnection((conn) =>
      conn.getParsedTokenAccountsByOwner(publicKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      })
    );

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
    // Get native SOL balance - ALWAYS include it, even if 0
    const nativeBalance = await getSolanaNative(address);
    const formatted = formatUnits(nativeBalance, 9);
    
    console.log(`SOL native balance for ${address}: ${formatted} SOL`);
    
    balances.push({
      symbol: 'SOL',
      name: 'Solana',
      balance: formatted,
      decimals: 9,
      usdValue: 0,
      priceUsd: 0,
      chain: 'solana',
    });

    // Get SPL token balances
    const splBalances = await getSolanaSPLBalances(address, SOLANA_TOKENS);
    console.log(`Found ${splBalances.length} SPL tokens for ${address}`);
    balances.push(...splBalances);

  } catch (error) {
    console.error('Failed to get Solana balances:', error);
    // Still return SOL with 0 balance if RPC fails
    balances.push({
      symbol: 'SOL',
      name: 'Solana',
      balance: '0',
      decimals: 9,
      usdValue: 0,
      priceUsd: 0,
      chain: 'solana',
    });
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
