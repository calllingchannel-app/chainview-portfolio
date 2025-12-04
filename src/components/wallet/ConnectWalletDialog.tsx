import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useWalletStore } from "@/stores/walletStore";
import { Loader2 } from "lucide-react";
import { useConnect, useDisconnect } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import { getAllChainBalances } from "@/lib/blockchainService";
import { fetchPricesByIds } from "@/lib/priceService";
import { CHAIN_NATIVE_IDS, EVM_TOKENS, SOLANA_TOKENS } from "@/lib/tokenLists";

// Import wallet logos
import metamaskLogo from "@/assets/wallets/metamask.png";
import phantomLogo from "@/assets/wallets/phantom.png";
import coinbaseLogo from "@/assets/wallets/coinbase.png";
import walletConnectLogo from "@/assets/wallets/walletconnect.png";
import trustLogo from "@/assets/wallets/trust.png";
import rainbowLogo from "@/assets/wallets/rainbow-new.png";
import solflareLogo from "@/assets/wallets/solflare.png";
import backpackLogo from "@/assets/wallets/backpack.png";
import glowLogo from "@/assets/wallets/glow.png";
import coin98Logo from "@/assets/wallets/coin98.png";
import safeLogo from "@/assets/wallets/safe-new.png";
import ledgerLogo from "@/assets/wallets/ledger-new.png";
import trezorLogo from "@/assets/wallets/trezor-new.png";
import okxLogo from "@/assets/wallets/okx-new.png";

interface ConnectWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Detect installed browser extension wallets
function getInstalledWallets() {
  if (typeof window === 'undefined') {
    return { metamask: false, coinbase: false, trust: false, rabby: false, brave: false, okx: false, phantom: false };
  }

  const ethereum = (window as any).ethereum;
  const providers = ethereum?.providers || [];
  
  // Check all providers
  const checkProviders = (check: (p: any) => boolean): boolean => {
    if (Array.isArray(providers) && providers.length > 0) {
      return providers.some(check);
    }
    return check(ethereum);
  };

  return {
    metamask: checkProviders(p => p?.isMetaMask && !p?.isBraveWallet && !p?.isTrust && !p?.isRabby),
    coinbase: Boolean(ethereum?.isCoinbaseWallet || (window as any).coinbaseWalletExtension),
    trust: checkProviders(p => p?.isTrust || p?.isTrustWallet),
    rabby: checkProviders(p => p?.isRabby),
    brave: checkProviders(p => p?.isBraveWallet),
    okx: Boolean((window as any).okxwallet || ethereum?.isOkxWallet),
    phantom: Boolean((window as any).phantom?.ethereum),
  };
}

// Get the specific provider for a wallet type
function getSpecificProvider(walletType: string): any {
  if (typeof window === 'undefined') return null;
  
  const ethereum = (window as any).ethereum;
  const providers: any[] = ethereum?.providers || [];
  
  const findProvider = (check: (p: any) => boolean): any => {
    if (Array.isArray(providers) && providers.length > 0) {
      return providers.find(check);
    }
    return check(ethereum) ? ethereum : null;
  };

  switch (walletType) {
    case 'metamask':
      // MetaMask specific - avoid other wallets
      return findProvider(p => p?.isMetaMask && !p?.isBraveWallet && !p?.isTrust && !p?.isRabby);
    case 'coinbase':
      return (window as any).coinbaseWalletExtension || findProvider(p => p?.isCoinbaseWallet);
    case 'trust':
      return findProvider(p => p?.isTrust || p?.isTrustWallet);
    case 'rabby':
      return findProvider(p => p?.isRabby);
    case 'brave':
      return findProvider(p => p?.isBraveWallet);
    case 'okx':
      return (window as any).okxwallet || findProvider(p => p?.isOkxWallet);
    case 'phantom':
      return (window as any).phantom?.ethereum;
    default:
      return ethereum;
  }
}

// Chain-based native token ID lookup
const NATIVE_TOKEN_IDS: Record<string, string> = {
  ethereum: 'ethereum',
  polygon: 'matic-network',
  arbitrum: 'ethereum',
  optimism: 'ethereum',
  base: 'ethereum',
  bsc: 'binancecoin',
  avalanche: 'avalanche-2',
  solana: 'solana',
};

// Symbol to CoinGecko ID mapping
const SYMBOL_TO_COINGECKO: Record<string, string> = {
  ETH: 'ethereum',
  WETH: 'weth',
  MATIC: 'matic-network',
  BNB: 'binancecoin',
  AVAX: 'avalanche-2',
  SOL: 'solana',
  USDT: 'tether',
  USDC: 'usd-coin',
  DAI: 'dai',
  WBTC: 'wrapped-bitcoin',
  LINK: 'chainlink',
  AAVE: 'aave',
  UNI: 'uniswap',
  ARB: 'arbitrum',
};

export function ConnectWalletDialog({ open, onOpenChange }: ConnectWalletDialogProps) {
  const { toast } = useToast();
  const { connectedWallets, addWallet } = useWalletStore();
  const [loadingWallet, setLoadingWallet] = useState<string | null>(null);
  
  const { connectors, connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { wallets: solanaWalletAdapters, select, disconnect: disconnectSolana } = useWallet();

  const installed = getInstalledWallets();

  const isWalletConnected = (address: string) => {
    return connectedWallets.some(w => w.address.toLowerCase() === address.toLowerCase());
  };

  const fetchAndStoreBalances = async (address: string, walletName: string, walletType: 'evm' | 'solana') => {
    toast({ title: "Fetching balances...", description: "Getting your real-time token balances" });

    const balances = await getAllChainBalances(address, walletType);
    console.log(`[${walletName}] Fetched ${balances.length} balances`);
    
    // Collect all unique CoinGecko IDs for price fetching
    const coingeckoIds = new Set<string>();
    
    balances.forEach((token) => {
      // Native tokens - use chain-based lookup
      if (!token.contractAddress) {
        const nativeId = NATIVE_TOKEN_IDS[token.chain];
        if (nativeId) coingeckoIds.add(nativeId);
      } else if (token.chain === 'solana') {
        const info = SOLANA_TOKENS.find((t) => t.address === token.contractAddress);
        if (info?.coingeckoId) coingeckoIds.add(info.coingeckoId);
      } else {
        const chainTokens = EVM_TOKENS[token.chain];
        const info = chainTokens?.find((t) => t.address.toLowerCase() === token.contractAddress?.toLowerCase());
        if (info?.coingeckoId) coingeckoIds.add(info.coingeckoId);
      }
      
      // Also try symbol-based lookup as fallback
      const symbolId = SYMBOL_TO_COINGECKO[token.symbol.toUpperCase()];
      if (symbolId) coingeckoIds.add(symbolId);
    });
    
    const prices = await fetchPricesByIds(Array.from(coingeckoIds));
    console.log('[Prices] Fetched:', Object.keys(prices).length);
    
    // Apply prices to balances
    const balancesWithPrices = balances.map(b => {
      let priceId: string | undefined;
      
      if (!b.contractAddress) {
        priceId = NATIVE_TOKEN_IDS[b.chain];
      } else if (b.chain === 'solana') {
        const info = SOLANA_TOKENS.find((t) => t.address === b.contractAddress);
        priceId = info?.coingeckoId;
      } else {
        const chainTokens = EVM_TOKENS[b.chain];
        const info = chainTokens?.find((t) => t.address.toLowerCase() === b.contractAddress?.toLowerCase());
        priceId = info?.coingeckoId;
      }
      
      // Fallback to symbol lookup
      if (!priceId || !prices[priceId]) {
        priceId = SYMBOL_TO_COINGECKO[b.symbol.toUpperCase()];
      }

      const price = priceId ? (prices[priceId] || 0) : 0;
      const balanceNum = parseFloat(b.balance) || 0;
      return {
        ...b,
        priceUsd: price,
        usdValue: balanceNum * price
      };
    });

    const totalUsdValue = balancesWithPrices.reduce((sum, b) => sum + b.usdValue, 0);

    addWallet({
      id: `${walletName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      address,
      name: walletName,
      chain: walletType === 'solana' ? 'solana' : 'multi-chain',
      type: walletType,
      connectedAt: Date.now(),
      balances: balancesWithPrices,
      totalUsdValue,
    });

    return totalUsdValue;
  };

  // Connect using browser extension directly
  const connectInjected = async (walletName: string, providerType: string): Promise<string> => {
    const provider = getSpecificProvider(providerType);
    
    if (!provider) {
      throw new Error(`${walletName} is not installed. Please install the browser extension.`);
    }

    console.log(`[${walletName}] Requesting accounts from provider...`);
    
    // Request accounts directly from the specific provider
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned from wallet');
    }
    
    console.log(`[${walletName}] Got account: ${accounts[0]}`);
    return accounts[0];
  };

  // Connect using wagmi connector
  const connectWagmi = async (connectorId: string): Promise<string> => {
    const connector = connectors.find(c => c.id === connectorId);
    if (!connector) {
      throw new Error(`Connector ${connectorId} not found`);
    }
    
    console.log(`[wagmi] Connecting with connector: ${connectorId}`);
    
    // Disconnect any existing connection first
    try {
      await disconnectAsync();
    } catch (e) {
      // Ignore disconnect errors
    }
    
    const result = await connectAsync({ connector });
    console.log(`[wagmi] Connected: ${result.accounts[0]}`);
    return result.accounts[0];
  };

  const handleEVMConnect = async (wallet: EVMWallet) => {
    if (loadingWallet) return;
    setLoadingWallet(wallet.name);
    
    try {
      let address: string;

      // Route to correct connection method based on wallet type
      switch (wallet.connectionType) {
        case 'injected':
          address = await connectInjected(wallet.name, wallet.providerKey);
          break;
        case 'coinbase':
          address = await connectWagmi('coinbaseWalletSDK');
          break;
        case 'walletconnect':
        default:
          address = await connectWagmi('walletConnect');
          break;
      }
      
      if (!address) {
        throw new Error("No address returned from wallet");
      }
      
      console.log(`[${wallet.name}] Connected: ${address}`);
      
      if (isWalletConnected(address)) {
        toast({ 
          title: "Already connected", 
          description: "This wallet is already in your portfolio." 
        });
        setLoadingWallet(null);
        return;
      }

      const totalValue = await fetchAndStoreBalances(address, wallet.name, 'evm');

      toast({ 
        title: "Wallet Connected!", 
        description: `${wallet.name} connected with $${totalValue.toFixed(2)} in assets.` 
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error(`[${wallet.name}] Connection error:`, error);
      
      let message = error.message || "Connection failed";
      if (message.includes('User rejected') || message.includes('user rejected')) {
        message = 'Connection cancelled by user';
      } else if (message.includes('already pending')) {
        message = 'Check your wallet for a pending request';
      }
      
      toast({ 
        title: "Connection Failed", 
        description: message, 
        variant: "destructive" 
      });
    } finally {
      setLoadingWallet(null);
    }
  };

  const handleSolanaConnect = async (walletName: string) => {
    if (loadingWallet) return;
    setLoadingWallet(walletName);

    try {
      // Find the wallet adapter by name
      const walletAdapter = solanaWalletAdapters.find(w => 
        w.adapter.name.toLowerCase().includes(walletName.toLowerCase())
      );

      if (!walletAdapter) {
        throw new Error(`${walletName} is not installed. Please install the browser extension.`);
      }

      const adapter = walletAdapter.adapter;
      console.log(`[${walletName}] Connecting via adapter: ${adapter.name}, readyState: ${walletAdapter.readyState}`);

      // Check if installed
      if (walletAdapter.readyState !== 'Installed') {
        throw new Error(`${walletName} is not installed. Please install the browser extension.`);
      }

      // Disconnect existing if any
      try {
        await disconnectSolana();
      } catch (e) {
        // Ignore
      }

      // Select the wallet first
      select(adapter.name);
      
      // Then connect
      await adapter.connect();

      const pubkey = adapter.publicKey;
      if (!pubkey) {
        throw new Error("Failed to get wallet address");
      }

      const address = pubkey.toBase58();
      console.log(`[${walletName}] Connected: ${address}`);
      
      if (isWalletConnected(address)) {
        toast({ 
          title: "Already connected", 
          description: "This wallet is already in your portfolio." 
        });
        setLoadingWallet(null);
        return;
      }

      const totalValue = await fetchAndStoreBalances(address, walletName, 'solana');

      toast({ 
        title: "Wallet Connected!", 
        description: `${walletName} connected with $${totalValue.toFixed(2)} in assets.` 
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error(`[${walletName}] Connection error:`, error);
      
      let message = error.message || "Connection failed";
      if (message.includes('User rejected') || message.includes('user rejected')) {
        message = 'Connection cancelled by user';
      }
      
      toast({ 
        title: "Connection Failed", 
        description: message, 
        variant: "destructive" 
      });
    } finally {
      setLoadingWallet(null);
    }
  };

  interface EVMWallet {
    name: string;
    logo: string;
    description: string;
    color: string;
    connectionType: 'injected' | 'coinbase' | 'walletconnect';
    providerKey: string;
    available: boolean;
  }

  // EVM Wallets - Properly routed
  const evmWallets: EVMWallet[] = [
    { 
      name: "MetaMask", 
      logo: metamaskLogo, 
      description: installed.metamask ? "Ready" : "Install extension",
      connectionType: "injected",
      providerKey: "metamask",
      color: "from-orange-500/20 to-orange-600/20",
      available: installed.metamask
    },
    { 
      name: "Coinbase Wallet", 
      logo: coinbaseLogo, 
      description: "Mobile & extension", 
      connectionType: "coinbase",
      providerKey: "coinbase",
      color: "from-blue-500/20 to-blue-600/20",
      available: true
    },
    { 
      name: "Trust Wallet", 
      logo: trustLogo, 
      description: installed.trust ? "Ready" : "Via WalletConnect",
      connectionType: installed.trust ? "injected" : "walletconnect",
      providerKey: "trust",
      color: "from-blue-500/20 to-cyan-500/20",
      available: true
    },
    { 
      name: "Rabby", 
      logo: rainbowLogo, 
      description: installed.rabby ? "Ready" : "Install extension",
      connectionType: "injected",
      providerKey: "rabby",
      color: "from-purple-500/20 to-blue-500/20",
      available: installed.rabby
    },
    { 
      name: "Brave Wallet", 
      logo: rainbowLogo, 
      description: installed.brave ? "Ready" : "Use Brave browser",
      connectionType: "injected",
      providerKey: "brave",
      color: "from-orange-500/20 to-red-500/20",
      available: installed.brave
    },
    { 
      name: "OKX Wallet", 
      logo: okxLogo, 
      description: installed.okx ? "Ready" : "Via WalletConnect",
      connectionType: installed.okx ? "injected" : "walletconnect",
      providerKey: "okx",
      color: "from-gray-700/20 to-gray-800/20",
      available: true
    },
    { 
      name: "Rainbow", 
      logo: rainbowLogo, 
      description: "Via WalletConnect",
      connectionType: "walletconnect",
      providerKey: "rainbow",
      color: "from-purple-500/20 to-pink-500/20",
      available: true
    },
    { 
      name: "WalletConnect", 
      logo: walletConnectLogo, 
      description: "Scan QR code",
      connectionType: "walletconnect",
      providerKey: "walletconnect",
      color: "from-blue-400/20 to-blue-500/20",
      available: true
    },
    { 
      name: "Safe", 
      logo: safeLogo, 
      description: "Multi-sig wallet",
      connectionType: "walletconnect",
      providerKey: "safe",
      color: "from-green-500/20 to-emerald-500/20",
      available: true
    },
    { 
      name: "Ledger", 
      logo: ledgerLogo, 
      description: "Hardware wallet",
      connectionType: "walletconnect",
      providerKey: "ledger",
      color: "from-gray-600/20 to-gray-700/20",
      available: true
    },
    { 
      name: "Trezor", 
      logo: trezorLogo, 
      description: "Hardware wallet",
      connectionType: "walletconnect",
      providerKey: "trezor",
      color: "from-green-600/20 to-teal-600/20",
      available: true
    },
  ];

  // Solana Wallets
  const solanaWallets = [
    { name: "Phantom", logo: phantomLogo, description: "Most popular", color: "from-purple-500/20 to-indigo-500/20" },
    { name: "Solflare", logo: solflareLogo, description: "Feature-rich", color: "from-orange-500/20 to-red-500/20" },
    { name: "Backpack", logo: backpackLogo, description: "Modern design", color: "from-red-500/20 to-pink-500/20" },
    { name: "Glow", logo: glowLogo, description: "Simple & fast", color: "from-green-400/20 to-cyan-400/20" },
    { name: "Coin98", logo: coin98Logo, description: "Multi-chain", color: "from-yellow-500/20 to-orange-500/20" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl glass-card border-white/10 p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-transparent p-8">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold gradient-text">Connect Wallet</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground/90 mt-2">
              Choose your wallet to start tracking your portfolio
            </DialogDescription>
          </DialogHeader>
        </div>

        <Tabs defaultValue="evm" className="px-8 pb-8 pt-4">
          <TabsList className="grid w-full grid-cols-2 bg-card/50 backdrop-blur-xl border border-white/5 p-1 h-12 mb-6">
            <TabsTrigger value="evm" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white transition-all rounded-lg font-semibold">
              EVM Chains
            </TabsTrigger>
            <TabsTrigger value="solana" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white transition-all rounded-lg font-semibold">
              Solana
            </TabsTrigger>
          </TabsList>

          <TabsContent value="evm" className="mt-0">
            <div className="wallet-dialog-grid">
              {evmWallets.map((wallet) => {
                const isLoading = loadingWallet === wallet.name;
                const isDisabled = !wallet.available || (loadingWallet !== null && !isLoading);

                return (
                  <button 
                    key={wallet.name} 
                    onClick={() => handleEVMConnect(wallet)} 
                    disabled={isDisabled} 
                    className={`wallet-button group ${isDisabled && !isLoading ? 'opacity-50' : ''}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${wallet.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
                    <div className="relative flex flex-col items-center gap-3">
                      <div className="h-16 w-16 rounded-xl bg-card/80 backdrop-blur-sm flex items-center justify-center p-3 group-hover:scale-110 transition-transform duration-300">
                        <img src={wallet.logo} alt={wallet.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{wallet.name}</p>
                        <p className={`text-xs mt-0.5 ${wallet.available ? 'text-muted-foreground/80' : 'text-amber-500/80'}`}>
                          {wallet.description}
                        </p>
                      </div>
                      {isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary mt-1" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="solana" className="mt-0">
            <div className="wallet-dialog-grid">
              {solanaWallets.map((wallet) => {
                const walletAdapter = solanaWalletAdapters.find((w) =>
                  w.adapter.name.toLowerCase().includes(wallet.name.toLowerCase())
                );
                const isLoading = loadingWallet === wallet.name;
                const isInstalled = walletAdapter?.readyState === 'Installed';
                const isDisabled = !isInstalled || (loadingWallet !== null && !isLoading);

                return (
                  <button
                    key={wallet.name}
                    onClick={() => handleSolanaConnect(wallet.name)}
                    disabled={isDisabled}
                    className={`wallet-button group ${isDisabled && !isLoading ? 'opacity-50' : ''}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${wallet.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
                    <div className="relative flex flex-col items-center gap-3">
                      <div className="h-16 w-16 rounded-xl bg-card/80 backdrop-blur-sm flex items-center justify-center p-3 group-hover:scale-110 transition-transform duration-300">
                        <img src={wallet.logo} alt={wallet.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{wallet.name}</p>
                        <p className={`text-xs mt-0.5 ${isInstalled ? 'text-muted-foreground/80' : 'text-amber-500/80'}`}>
                          {isInstalled ? wallet.description : "Install extension"}
                        </p>
                      </div>
                      {isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary mt-1" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
