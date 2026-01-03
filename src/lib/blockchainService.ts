import { createPublicClient, http, parseAbi, formatUnits, type Address } from 'viem';
import { mainnet, polygon, arbitrum, optimism, base, bsc, avalanche } from 'viem/chains';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
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

// More reliable RPC endpoints
const RPC_URLS: Record<string, string[]> = {
  ethereum: [
    'https://eth.llamarpc.com',
    'https://rpc.ankr.com/eth',
    'https://ethereum.publicnode.com',
    'https://1rpc.io/eth',
  ],
  polygon: [
    'https://polygon.llamarpc.com',
    'https://polygon-bor-rpc.publicnode.com',
    'https://rpc.ankr.com/polygon',
  ],
  arbitrum: [
    'https://arbitrum.llamarpc.com',
    'https://arb1.arbitrum.io/rpc',
    'https://rpc.ankr.com/arbitrum',
  ],
  optimism: [
    'https://optimism.llamarpc.com',
    'https://mainnet.optimism.io',
    'https://rpc.ankr.com/optimism',
  ],
  base: [
    'https://base.llamarpc.com',
    'https://mainnet.base.org',
    'https://base.publicnode.com',
  ],
  bsc: [
    'https://bsc-dataseed1.binance.org',
    'https://bsc-dataseed2.binance.org',
    'https://bsc.publicnode.com',
  ],
  avalanche: [
    'https://api.avax.network/ext/bc/C/rpc',
    'https://avalanche-c-chain-rpc.publicnode.com',
    'https://rpc.ankr.com/avalanche',
  ],
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
      timeout: 15_000,
      retryCount: 2,
      retryDelay: 1000,
    }),
  });
}

// Solana RPC with fallbacks - prioritize Helius for reliability
const SOLANA_RPC_URLS = [
  import.meta.env.VITE_HELIUS_RPC_URL,
  import.meta.env.VITE_SOLANA_RPC_URL,
  'https://rpc.ankr.com/solana',
  'https://api.mainnet-beta.solana.com',
].filter(Boolean) as string[];

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

// Cache for Solana connection - shorter TTL for more accurate data
let cachedSolanaConnection: Connection | null = null;
let cachedSolanaRpcUrl: string | null = null;
let lastConnectionAttempt = 0;
const CONNECTION_CACHE_TTL = 20000; // 20 seconds

async function getSolanaConnection(forceNew: boolean = false): Promise<Connection> {
  const now = Date.now();
  
  // Reuse cached connection if available and recent
  if (!forceNew && cachedSolanaConnection && cachedSolanaRpcUrl && (now - lastConnectionAttempt < CONNECTION_CACHE_TTL)) {
    return cachedSolanaConnection;
  }

  // Try each RPC in order
  for (const url of SOLANA_RPC_URLS) {
    try {
      const conn = new Connection(url, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 10000,
        fetch: (url, options) => {
          return fetch(url, { ...options, cache: 'no-store' });
        },
      });
      // Quick connection test
      await withTimeout(conn.getSlot(), 5000);
      console.log(`✅ Solana RPC: ${url.substring(0, 40)}...`);
      cachedSolanaConnection = conn;
      cachedSolanaRpcUrl = url;
      lastConnectionAttempt = now;
      return conn;
    } catch (err: any) {
      console.warn(`Solana RPC failed: ${url.substring(0, 40)}...`);
    }
  }
  throw new Error('All Solana RPCs failed');
}

function resetSolanaConnection() {
  cachedSolanaConnection = null;
  cachedSolanaRpcUrl = null;
  lastConnectionAttempt = 0;
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
      const balance = await withTimeout(
        client.getBalance({ address: address as Address }),
        12000
      );
      console.log(`✅ ${chainName} native: ${formatUnits(balance, 18)}`);
      return balance;
    } catch (error: any) {
      console.warn(`RPC ${i + 1}/${rpcUrls.length} failed for ${chainName}:`, error.message);
      if (i === rpcUrls.length - 1) {
        console.error(`❌ All RPCs failed for ${chainName}`);
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

      // Fetch balances for each token
      const promises = tokens.map(async (token) => {
        try {
          const balance = await (client.readContract as any)({
            address: token.address as Address,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address as Address],
          }) as bigint;

          if (balance && (balance as bigint) > 0n) {
            const formatted = formatUnits(balance as bigint, token.decimals);
            return {
              symbol: token.symbol,
              name: token.name,
              balance: formatted,
              decimals: token.decimals,
              usdValue: 0,
              priceUsd: 0,
              chain: chainName,
              contractAddress: token.address,
              logo: token.logoURI,
            } as TokenBalance;
          }
          return null;
        } catch {
          return null;
        }
      });

      const results = await Promise.allSettled(promises);
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          balances.push(result.value);
        }
      });

      console.log(`✅ ${chainName} tokens: ${balances.length} found`);
      return balances;
    } catch (error: any) {
      console.warn(`RPC ${rpcIndex + 1} failed for ${chainName} tokens:`, error.message);
      if (rpcIndex === rpcUrls.length - 1) {
        console.error(`❌ All RPCs failed for ${chainName} tokens`);
      }
    }
  }

  return balances;
}

// Get all EVM balances (native + tokens) for a wallet on one chain
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

    // Include if balance > 0
    if (balanceNum > 0) {
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

// Get Solana native balance with retry logic
export async function getSolanaNative(address: string, retryCount: number = 0): Promise<number> {
  const MAX_RETRIES = 2;
  
  try {
    const publicKey = new PublicKey(address);
    const conn = await getSolanaConnection(retryCount > 0); // Force new connection on retry
    
    const balance = await withTimeout(conn.getBalance(publicKey), 8000);
    
    // Validate balance - sometimes RPC returns 0 on first call
    if (balance === 0 && retryCount === 0) {
      console.log('⚠️ SOL balance returned 0, retrying with fresh connection...');
      resetSolanaConnection();
      return getSolanaNative(address, 1);
    }
    
    const solAmount = balance / LAMPORTS_PER_SOL;
    console.log(`✅ SOL balance: ${solAmount.toFixed(9)} SOL (${balance} lamports)`);
    return balance;
  } catch (error: any) {
    console.error('Failed to get SOL balance:', error.message);
    
    // Retry with fresh connection
    if (retryCount < MAX_RETRIES) {
      console.log(`🔄 Retrying SOL balance fetch (attempt ${retryCount + 2}/${MAX_RETRIES + 1})...`);
      resetSolanaConnection();
      return getSolanaNative(address, retryCount + 1);
    }
    
    resetSolanaConnection();
    return 0;
  }
}

// Get Solana SPL token balances with improved accuracy
export async function getSolanaSPLBalances(
  address: string,
  tokens: TokenInfo[]
): Promise<TokenBalance[]> {
  const balances: TokenBalance[] = [];

  try {
    const publicKey = new PublicKey(address);
    const conn = await getSolanaConnection();

    const tokenAccounts = await withTimeout(
      conn.getParsedTokenAccountsByOwner(publicKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      }),
      10000
    );

    console.log(`📊 Found ${tokenAccounts.value.length} SPL token accounts`);

    tokenAccounts.value.forEach((accountInfo) => {
      try {
        const parsedInfo = accountInfo.account.data.parsed.info;
        const mint = parsedInfo.mint;
        const decimals = parsedInfo.tokenAmount.decimals;
        
        // Use uiAmountString for better precision, fallback to uiAmount
        const uiAmountStr = parsedInfo.tokenAmount.uiAmountString;
        const uiAmount = uiAmountStr ? parseFloat(uiAmountStr) : parsedInfo.tokenAmount.uiAmount;
        
        // Also get raw amount for validation
        const rawAmount = parsedInfo.tokenAmount.amount;

        // Find token in our list
        const tokenInfo = tokens.find((t) => t.address === mint);

        // Only include tokens with actual balance
        if (uiAmount > 0 || (rawAmount && BigInt(rawAmount) > 0n)) {
          const finalAmount = uiAmount > 0 ? uiAmount : Number(BigInt(rawAmount)) / Math.pow(10, decimals);
          
          if (finalAmount > 0) {
            balances.push({
              symbol: tokenInfo?.symbol || 'UNKNOWN',
              name: tokenInfo?.name || `Token ${mint.slice(0, 8)}...`,
              balance: finalAmount.toString(),
              decimals,
              usdValue: 0,
              priceUsd: 0,
              chain: 'solana',
              contractAddress: mint,
            });
            console.log(`  ✓ ${tokenInfo?.symbol || mint.slice(0, 8)}: ${finalAmount}`);
          }
        }
      } catch (parseError) {
        console.warn('Failed to parse token account:', parseError);
      }
    });

    console.log(`✅ Solana SPL tokens with balance: ${balances.length}`);
  } catch (error: any) {
    console.error('Failed to get Solana SPL balances:', error.message);
    resetSolanaConnection();
  }

  return balances;
}

// Get all Solana balances (native + SPL)
export async function getAllSolanaBalances(address: string): Promise<TokenBalance[]> {
  const balances: TokenBalance[] = [];

  try {
    // Get native SOL balance
    const lamports = await getSolanaNative(address);
    const solBalance = lamports / LAMPORTS_PER_SOL;

    if (solBalance > 0) {
      balances.push({
        symbol: 'SOL',
        name: 'Solana',
        balance: solBalance.toString(),
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

// Main function: Get all balances for a wallet
export async function getAllChainBalances(
  address: string,
  walletType: 'evm' | 'solana'
): Promise<TokenBalance[]> {
  console.log(`🔍 Fetching ${walletType} balances for ${address.slice(0, 10)}...`);

  if (walletType === 'solana') {
    return getAllSolanaBalances(address);
  }

  // For EVM, fetch from all chains in parallel
  const evmChains = Object.keys(CHAINS) as (keyof typeof CHAINS)[];
  const balancePromises = evmChains.map((chain) => getAllEvmBalances(chain, address));

  const results = await Promise.allSettled(balancePromises);
  const allBalances: TokenBalance[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.length > 0) {
      console.log(`${evmChains[index]}: ${result.value.length} tokens`);
      allBalances.push(...result.value);
    } else if (result.status === 'rejected') {
      console.warn(`${evmChains[index]} failed:`, result.reason);
    }
  });

  console.log(`✅ Total EVM balances: ${allBalances.length} tokens across all chains`);
  return allBalances;
}
