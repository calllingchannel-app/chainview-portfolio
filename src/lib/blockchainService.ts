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

// Custom RPC endpoints with fallbacks
const RPC_URLS: Record<string, string[]> = {
  ethereum: ['https://eth.llamarpc.com', 'https://rpc.ankr.com/eth', 'https://cloudflare-eth.com'],
  polygon: ['https://polygon.llamarpc.com', 'https://rpc.ankr.com/polygon', 'https://polygon-rpc.com'],
  arbitrum: ['https://arbitrum.llamarpc.com', 'https://rpc.ankr.com/arbitrum', 'https://arb1.arbitrum.io/rpc'],
  optimism: ['https://optimism.llamarpc.com', 'https://rpc.ankr.com/optimism', 'https://mainnet.optimism.io'],
  base: ['https://base.llamarpc.com', 'https://mainnet.base.org', 'https://rpc.ankr.com/base'],
  bsc: ['https://bsc-dataseed1.binance.org', 'https://bsc-dataseed2.binance.org', 'https://rpc.ankr.com/bsc'],
  avalanche: ['https://api.avax.network/ext/bc/C/rpc', 'https://rpc.ankr.com/avalanche', 'https://avalanche.public-rpc.com'],
};

const ERC20_ABI = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
]);

// Create viem client with retry logic
function createClient(chainName: keyof typeof CHAINS, rpcIndex: number = 0) {
  const rpcUrls = RPC_URLS[chainName];
  const rpcUrl = rpcUrls[rpcIndex % rpcUrls.length];
  
  return createPublicClient({
    chain: CHAINS[chainName],
    transport: http(rpcUrl, { 
      timeout: 10_000,
      retryCount: 2,
      retryDelay: 500
    }),
  });
}

// Solana RPC fallbacks
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
      return await fn(conn);
    } catch (err) {
      lastError = err;
      console.warn(`Solana RPC failed: ${url.substring(0, 40)}...`);
    }
  }
  
  throw new Error(`All Solana RPC endpoints failed: ${lastError?.message || 'Unknown error'}`);
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

// Get native balance for EVM chains with retry
export async function getNativeBalance(
  chainName: keyof typeof CHAINS,
  address: string
): Promise<bigint> {
  const rpcUrls = RPC_URLS[chainName];
  
  for (let i = 0; i < rpcUrls.length; i++) {
    try {
      const client = createClient(chainName, i);
      const balance = await client.getBalance({ address: address as Address });
      return balance;
    } catch (error) {
      console.warn(`RPC ${i + 1} failed for ${chainName} native balance:`, error);
      if (i === rpcUrls.length - 1) {
        console.error(`All RPCs failed for ${chainName} native balance`);
        return 0n;
      }
    }
  }
  
  return 0n;
}

// Get EVM token balances
export async function getEvmTokenBalances(
  chainName: keyof typeof CHAINS,
  address: string,
  tokens: TokenInfo[]
): Promise<TokenBalance[]> {
  if (tokens.length === 0) return [];

  const balances: TokenBalance[] = [];
  const rpcUrls = RPC_URLS[chainName];
  
  for (let rpcIndex = 0; rpcIndex < rpcUrls.length; rpcIndex++) {
    try {
      const client = createClient(chainName, rpcIndex);
      
      for (const token of tokens) {
        try {
          const balance = (await client.readContract({
            address: token.address as Address,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address as Address],
          } as any)) as bigint;

          if (balance && balance > 0n) {
            const formatted = formatUnits(balance, token.decimals);
            balances.push({
              symbol: token.symbol,
              name: token.name,
              balance: formatted,
              decimals: token.decimals,
              usdValue: 0,
              priceUsd: 0,
              chain: chainName,
              contractAddress: token.address,
              logo: token.logoURI,
            });
          }
        } catch (error) {
          // Skip individual token errors
          continue;
        }
      }
      
      // If we got here without error, break out of retry loop
      break;
    } catch (error) {
      console.warn(`RPC ${rpcIndex + 1} failed for ${chainName} tokens:`, error);
      if (rpcIndex === rpcUrls.length - 1) {
        console.error(`All RPCs failed for ${chainName} tokens`);
      }
    }
  }

  return balances;
}

// Get all EVM balances (native + tokens) for a wallet
export async function getAllEvmBalances(
  chainName: keyof typeof CHAINS,
  address: string
): Promise<TokenBalance[]> {
  const balances: TokenBalance[] = [];
  const nativeInfo = NATIVE_TOKENS[chainName];

  try {
    // Get native balance
    const nativeBalance = await getNativeBalance(chainName, address);
    const formatted = formatUnits(nativeBalance, nativeInfo.decimals);
    const balanceNum = parseFloat(formatted);
    
    // Always include native token if balance > 0
    if (balanceNum > 0.000001) {
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
    console.log(`SOL balance for ${address}: ${balance} lamports`);
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
    const formatted = formatUnits(nativeBalance, 9);
    const balanceNum = parseFloat(formatted);
    
    console.log(`SOL native: ${formatted} SOL (${balanceNum})`);
    
    // Always include SOL if balance > 0
    if (balanceNum > 0.000001) {
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
    console.log(`Found ${splBalances.length} SPL tokens`);
    balances.push(...splBalances);
  } catch (error) {
    console.error('Failed to get Solana balances:', error);
  }

  return balances;
}

// Get all balances for a wallet
export async function getAllChainBalances(
  address: string,
  walletType: 'evm' | 'solana'
): Promise<TokenBalance[]> {
  console.log(`Fetching ${walletType} balances for ${address}...`);
  
  if (walletType === 'solana') {
    return getAllSolanaBalances(address);
  }

  // For EVM, fetch from all supported chains in parallel
  const evmChains = Object.keys(CHAINS) as (keyof typeof CHAINS)[];
  const balancePromises = evmChains.map((chain) => getAllEvmBalances(chain, address));
  
  const results = await Promise.allSettled(balancePromises);
  const allBalances: TokenBalance[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`${evmChains[index]}: ${result.value.length} tokens`);
      allBalances.push(...result.value);
    } else {
      console.warn(`Failed to fetch ${evmChains[index]} balances:`, result.reason);
    }
  });

  console.log(`Total EVM balances: ${allBalances.length} tokens`);
  return allBalances;
}
