import { createPublicClient, http, formatUnits, parseAbi } from 'viem';
import { mainnet, polygon, bsc, arbitrum, optimism, base, avalanche, fantom } from 'viem/chains';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getTokenPrice, getMultipleTokenPrices } from './priceService';
import type { TokenBalance } from '@/stores/walletStore';

// Chain configurations
const CHAINS = {
  ethereum: mainnet,
  polygon: polygon,
  bsc: bsc,
  arbitrum: arbitrum,
  optimism: optimism,
  base: base,
  avalanche: avalanche,
  fantom: fantom,
};

// ERC-20 ABI for balance checking
const ERC20_ABI = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
]);

// Common ERC-20 tokens per chain
const COMMON_TOKENS: Record<string, Array<{ address: string; symbol: string; decimals: number; name: string }>> = {
  ethereum: [
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', decimals: 6, name: 'Tether USD' },
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6, name: 'USD Coin' },
    { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', decimals: 18, name: 'Dai Stablecoin' },
    { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', decimals: 8, name: 'Wrapped Bitcoin' },
  ],
  polygon: [
    { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', decimals: 6, name: 'Tether USD' },
    { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', decimals: 6, name: 'USD Coin' },
    { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', symbol: 'DAI', decimals: 18, name: 'Dai Stablecoin' },
  ],
  bsc: [
    { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', decimals: 18, name: 'Tether USD' },
    { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', decimals: 18, name: 'USD Coin' },
    { address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', symbol: 'DAI', decimals: 18, name: 'Dai Stablecoin' },
  ],
  arbitrum: [
    { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT', decimals: 6, name: 'Tether USD' },
    { address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', symbol: 'USDC', decimals: 6, name: 'USD Coin' },
    { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', symbol: 'DAI', decimals: 18, name: 'Dai Stablecoin' },
  ],
  optimism: [
    { address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', symbol: 'USDT', decimals: 6, name: 'Tether USD' },
    { address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', symbol: 'USDC', decimals: 6, name: 'USD Coin' },
    { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', symbol: 'DAI', decimals: 18, name: 'Dai Stablecoin' },
  ],
  base: [
    { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', decimals: 6, name: 'USD Coin' },
  ],
  avalanche: [
    { address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', symbol: 'USDT', decimals: 6, name: 'Tether USD' },
    { address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', symbol: 'USDC', decimals: 6, name: 'USD Coin' },
  ],
  fantom: [
    { address: '0x049d68029688eAbF473097a2fC38ef61633A3C7A', symbol: 'USDT', decimals: 6, name: 'Tether USD' },
    { address: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75', symbol: 'USDC', decimals: 6, name: 'USD Coin' },
  ],
};

// Native token symbols
const NATIVE_SYMBOLS: Record<string, string> = {
  ethereum: 'ETH',
  polygon: 'MATIC',
  bsc: 'BNB',
  arbitrum: 'ETH',
  optimism: 'ETH',
  base: 'ETH',
  avalanche: 'AVAX',
  fantom: 'FTM',
};

const NATIVE_NAMES: Record<string, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  bsc: 'BNB',
  arbitrum: 'Ethereum',
  optimism: 'Ethereum',
  base: 'Ethereum',
  avalanche: 'Avalanche',
  fantom: 'Fantom',
};

export async function getEVMBalances(address: string, chainName: string): Promise<TokenBalance[]> {
  const balances: TokenBalance[] = [];
  const chain = CHAINS[chainName as keyof typeof CHAINS];
  
  if (!chain) return balances;

  const client = createPublicClient({
    chain,
    transport: http(),
  });

  try {
    // Get native token balance
    const nativeBalance = await client.getBalance({ address: address as `0x${string}` });
    const nativeSymbol = NATIVE_SYMBOLS[chainName];
    const nativePrice = await getTokenPrice(nativeSymbol);
    const nativeAmount = parseFloat(formatUnits(nativeBalance, 18));

    if (nativeAmount > 0.0001) {
      balances.push({
        symbol: nativeSymbol,
        name: NATIVE_NAMES[chainName],
        balance: nativeAmount.toString(),
        decimals: 18,
        usdValue: nativeAmount * nativePrice,
        priceUsd: nativePrice,
        chain: chainName,
      });
    }

    // Get ERC-20 token balances
    const tokens = COMMON_TOKENS[chainName] || [];
    
    for (const token of tokens) {
      try {
        const balance = await client.readContract({
          address: token.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        } as any);

        const amount = parseFloat(formatUnits(balance as bigint, token.decimals));
        
        if (amount > 0.01) {
          const price = await getTokenPrice(token.symbol);
          balances.push({
            symbol: token.symbol,
            name: token.name,
            balance: amount.toString(),
            decimals: token.decimals,
            usdValue: amount * price,
            priceUsd: price,
            chain: chainName,
            contractAddress: token.address,
          });
        }
      } catch (error) {
        console.error(`Error fetching ${token.symbol} balance:`, error);
      }
    }
  } catch (error) {
    console.error(`Error fetching balances for ${chainName}:`, error);
  }

  return balances;
}

export async function getSolanaBalances(address: string): Promise<TokenBalance[]> {
  const balances: TokenBalance[] = [];
  
  try {
    const connection = new Connection('https://api.mainnet-beta.solana.com');
    const publicKey = new PublicKey(address);

    // Get SOL balance
    const solBalance = await connection.getBalance(publicKey);
    const solAmount = solBalance / LAMPORTS_PER_SOL;
    const solPrice = await getTokenPrice('SOL');

    if (solAmount > 0.001) {
      balances.push({
        symbol: 'SOL',
        name: 'Solana',
        balance: solAmount.toString(),
        decimals: 9,
        usdValue: solAmount * solPrice,
        priceUsd: solPrice,
        chain: 'Solana',
      });
    }

    // Get SPL token balances
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    });

    for (const { account } of tokenAccounts.value) {
      const parsedInfo = account.data.parsed.info;
      const amount = parsedInfo.tokenAmount.uiAmount;
      
      if (amount > 0.01) {
        const mint = parsedInfo.mint;
        // For now, we'll just show the token without price (would need token metadata service)
        balances.push({
          symbol: mint.slice(0, 4).toUpperCase(),
          name: 'SPL Token',
          balance: amount.toString(),
          decimals: parsedInfo.tokenAmount.decimals,
          usdValue: 0,
          priceUsd: 0,
          chain: 'Solana',
          contractAddress: mint,
        });
      }
    }
  } catch (error) {
    console.error('Error fetching Solana balances:', error);
  }

  return balances;
}

export async function getAllChainBalances(address: string, walletType: 'evm' | 'solana'): Promise<TokenBalance[]> {
  if (walletType === 'solana') {
    return getSolanaBalances(address);
  }

  // For EVM, fetch from multiple chains in parallel
  const chainNames = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'];
  const balancePromises = chainNames.map(chain => getEVMBalances(address, chain));
  const allBalances = await Promise.all(balancePromises);
  
  return allBalances.flat();
}
