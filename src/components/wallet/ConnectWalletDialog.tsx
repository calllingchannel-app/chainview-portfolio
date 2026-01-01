import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useWalletStore } from "@/stores/walletStore";
import { Loader2, Wallet, Zap, Shield } from "lucide-react";
import { useConnect, useDisconnect } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import { getAllChainBalances } from "@/lib/blockchainService";
import { fetchPricesByIds } from "@/lib/priceService";
import { EVM_TOKENS, SOLANA_TOKENS } from "@/lib/tokenLists";

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

// Enhanced wallet detection with priority for native providers
function detectWallets() {
  if (typeof window === 'undefined') {
    return { metamask: false, coinbase: false, trust: false, rabby: false, brave: false, okx: false, phantom: false };
  }

  const ethereum = (window as any).ethereum;
  const providers: any[] = ethereum?.providers || [];
  
  // Find specific MetaMask provider (not other wallets pretending to be MetaMask)
  const findMetaMask = (): any => {
    if (Array.isArray(providers) && providers.length > 0) {
      // When multiple providers exist, find the real MetaMask
      const mm = providers.find(p => 
        p?.isMetaMask === true && 
        !p?.isBraveWallet && 
        !p?.isTrust && 
        !p?.isRabby &&
        !p?.isCoinbaseWallet &&
        !p?.isPhantom
      );
      return mm || null;
    }
    // Single provider case
    if (ethereum?.isMetaMask && !ethereum?.isBraveWallet && !ethereum?.isTrust && !ethereum?.isRabby) {
      return ethereum;
    }
    return null;
  };

  return {
    metamask: !!findMetaMask(),
    coinbase: Boolean(ethereum?.isCoinbaseWallet || (window as any).coinbaseWalletExtension),
    trust: Boolean(providers.some(p => p?.isTrust) || ethereum?.isTrust),
    rabby: Boolean(providers.some(p => p?.isRabby) || ethereum?.isRabby),
    brave: Boolean(providers.some(p => p?.isBraveWallet) || ethereum?.isBraveWallet),
    okx: Boolean((window as any).okxwallet || ethereum?.isOkxWallet),
    phantom: Boolean((window as any).phantom?.ethereum),
  };
}

// Get the exact MetaMask provider - critical for preventing wallet conflicts
function getMetaMaskProvider(): any {
  if (typeof window === 'undefined') return null;
  
  const ethereum = (window as any).ethereum;
  if (!ethereum) return null;
  
  const providers: any[] = ethereum.providers || [];
  
  // Multi-provider environment (e.g., MetaMask + Coinbase both installed)
  if (Array.isArray(providers) && providers.length > 0) {
    const metaMaskProvider = providers.find(p => 
      p?.isMetaMask === true && 
      !p?.isBraveWallet && 
      !p?.isTrust && 
      !p?.isRabby &&
      !p?.isCoinbaseWallet &&
      !p?.isPhantom
    );
    return metaMaskProvider || null;
  }
  
  // Single provider - verify it's actually MetaMask
  if (ethereum.isMetaMask && !ethereum.isBraveWallet && !ethereum.isTrust && !ethereum.isRabby) {
    return ethereum;
  }
  
  return null;
}

// Get provider for other wallet types
function getWalletProvider(walletType: string): any {
  if (typeof window === 'undefined') return null;
  
  const ethereum = (window as any).ethereum;
  const providers: any[] = ethereum?.providers || [];
  
  switch (walletType) {
    case 'metamask':
      return getMetaMaskProvider();
    case 'coinbase':
      return (window as any).coinbaseWalletExtension || providers.find(p => p?.isCoinbaseWallet) || (ethereum?.isCoinbaseWallet ? ethereum : null);
    case 'trust':
      return providers.find(p => p?.isTrust || p?.isTrustWallet) || (ethereum?.isTrust ? ethereum : null);
    case 'rabby':
      return providers.find(p => p?.isRabby) || (ethereum?.isRabby ? ethereum : null);
    case 'brave':
      return providers.find(p => p?.isBraveWallet) || (ethereum?.isBraveWallet ? ethereum : null);
    case 'okx':
      return (window as any).okxwallet || providers.find(p => p?.isOkxWallet) || (ethereum?.isOkxWallet ? ethereum : null);
    case 'phantom':
      return (window as any).phantom?.ethereum;
    default:
      return ethereum;
  }
}

// Token ID mappings
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

  const installed = detectWallets();

  const isWalletConnected = (address: string) => {
    return connectedWallets.some(w => w.address.toLowerCase() === address.toLowerCase());
  };

  const fetchAndStoreBalances = async (address: string, walletName: string, walletType: 'evm' | 'solana') => {
    toast({ title: "Syncing portfolio...", description: "Fetching real-time token balances" });

    const balances = await getAllChainBalances(address, walletType);
    console.log(`[${walletName}] Fetched ${balances.length} balances`);
    
    const coingeckoIds = new Set<string>();
    
    balances.forEach((token) => {
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
      
      const symbolId = SYMBOL_TO_COINGECKO[token.symbol.toUpperCase()];
      if (symbolId) coingeckoIds.add(symbolId);
    });
    
    const prices = await fetchPricesByIds(Array.from(coingeckoIds));
    console.log('[Prices] Fetched:', Object.keys(prices).length);
    
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

  // Direct MetaMask connection - bypasses wagmi entirely for reliability
  const connectMetaMaskDirect = async (): Promise<string> => {
    const provider = getMetaMaskProvider();
    
    if (!provider) {
      throw new Error('MetaMask is not installed. Please install the MetaMask browser extension.');
    }

    console.log('[MetaMask] Using direct provider connection...');
    
    try {
      // Request accounts directly - this triggers the MetaMask popup immediately
      const accounts = await provider.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from MetaMask');
      }
      
      console.log('[MetaMask] Connected:', accounts[0]);
      return accounts[0];
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('Connection cancelled by user');
      }
      if (error.code === -32002) {
        throw new Error('MetaMask is already processing a request. Please check the extension.');
      }
      throw error;
    }
  };

  // Connect other injected wallets
  const connectInjectedWallet = async (walletName: string, providerType: string): Promise<string> => {
    const provider = getWalletProvider(providerType);
    
    if (!provider) {
      throw new Error(`${walletName} is not installed. Please install the browser extension.`);
    }

    console.log(`[${walletName}] Requesting accounts...`);
    
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned from wallet');
    }
    
    console.log(`[${walletName}] Got account: ${accounts[0]}`);
    return accounts[0];
  };

  // Connect using wagmi (for WalletConnect, Coinbase SDK, etc.)
  const connectWithWagmi = async (connectorId: string): Promise<string> => {
    const connector = connectors.find(c => c.id === connectorId);
    if (!connector) {
      throw new Error(`Connector ${connectorId} not found`);
    }
    
    console.log(`[wagmi] Connecting with: ${connectorId}`);
    
    try {
      await disconnectAsync();
    } catch (e) {
      // Ignore
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

      // MetaMask gets special direct handling for reliability
      if (wallet.providerKey === 'metamask') {
        address = await connectMetaMaskDirect();
      } else if (wallet.connectionType === 'injected') {
        address = await connectInjectedWallet(wallet.name, wallet.providerKey);
      } else if (wallet.connectionType === 'coinbase') {
        address = await connectWithWagmi('coinbaseWalletSDK');
      } else {
        // WalletConnect fallback
        address = await connectWithWagmi('walletConnect');
      }
      
      if (!address) {
        throw new Error("No address returned from wallet");
      }
      
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
        title: "Connected successfully!", 
        description: `${wallet.name}: $${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} portfolio value` 
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error(`[${wallet.name}] Connection error:`, error);
      
      let message = error.message || "Connection failed";
      if (message.includes('User rejected') || message.includes('user rejected') || message.includes('cancelled')) {
        message = 'Connection cancelled by user';
      } else if (message.includes('already pending') || message.includes('-32002')) {
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
      const walletAdapter = solanaWalletAdapters.find(w => 
        w.adapter.name.toLowerCase().includes(walletName.toLowerCase())
      );

      if (!walletAdapter) {
        throw new Error(`${walletName} is not installed. Please install the browser extension.`);
      }

      const adapter = walletAdapter.adapter;
      console.log(`[${walletName}] Connecting via adapter: ${adapter.name}`);

      if (walletAdapter.readyState !== 'Installed') {
        throw new Error(`${walletName} is not installed. Please install the browser extension.`);
      }

      try {
        await disconnectSolana();
      } catch (e) {
        // Ignore
      }

      select(adapter.name);
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
        title: "Connected successfully!", 
        description: `${walletName}: $${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} portfolio value` 
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
    priority?: number;
  }

  // EVM Wallets - MetaMask prioritized with direct connection
  const evmWallets: EVMWallet[] = [
    { 
      name: "MetaMask", 
      logo: metamaskLogo, 
      description: installed.metamask ? "Ready to connect" : "Install extension",
      connectionType: "injected",
      providerKey: "metamask",
      color: "from-amber-500/20 to-orange-600/20",
      available: installed.metamask,
      priority: 1
    },
    { 
      name: "Coinbase Wallet", 
      logo: coinbaseLogo, 
      description: "Mobile & browser", 
      connectionType: "coinbase",
      providerKey: "coinbase",
      color: "from-blue-500/20 to-blue-600/20",
      available: true,
      priority: 2
    },
    { 
      name: "WalletConnect", 
      logo: walletConnectLogo, 
      description: "Scan QR code",
      connectionType: "walletconnect",
      providerKey: "walletconnect",
      color: "from-sky-400/20 to-blue-500/20",
      available: true,
      priority: 3
    },
    { 
      name: "Trust Wallet", 
      logo: trustLogo, 
      description: installed.trust ? "Ready to connect" : "Via WalletConnect",
      connectionType: installed.trust ? "injected" : "walletconnect",
      providerKey: "trust",
      color: "from-blue-400/20 to-cyan-500/20",
      available: true,
      priority: 4
    },
    { 
      name: "OKX Wallet", 
      logo: okxLogo, 
      description: installed.okx ? "Ready to connect" : "Via WalletConnect",
      connectionType: installed.okx ? "injected" : "walletconnect",
      providerKey: "okx",
      color: "from-neutral-700/20 to-neutral-800/20",
      available: true,
      priority: 5
    },
    { 
      name: "Rainbow", 
      logo: rainbowLogo, 
      description: "Via WalletConnect",
      connectionType: "walletconnect",
      providerKey: "rainbow",
      color: "from-violet-500/20 to-pink-500/20",
      available: true,
      priority: 6
    },
    { 
      name: "Safe", 
      logo: safeLogo, 
      description: "Multi-sig wallet",
      connectionType: "walletconnect",
      providerKey: "safe",
      color: "from-emerald-500/20 to-green-600/20",
      available: true,
      priority: 7
    },
    { 
      name: "Ledger", 
      logo: ledgerLogo, 
      description: "Hardware wallet",
      connectionType: "walletconnect",
      providerKey: "ledger",
      color: "from-neutral-600/20 to-neutral-700/20",
      available: true,
      priority: 8
    },
    { 
      name: "Trezor", 
      logo: trezorLogo, 
      description: "Hardware wallet",
      connectionType: "walletconnect",
      providerKey: "trezor",
      color: "from-green-600/20 to-teal-600/20",
      available: true,
      priority: 9
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
      <DialogContent className="max-w-2xl premium-dialog border-0 p-0 overflow-hidden gap-0">
        {/* Header */}
        <div className="relative px-8 pt-8 pb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-accent/5 to-transparent" />
          <DialogHeader className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-foreground">Connect Wallet</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                  Select your preferred wallet to continue
                </DialogDescription>
              </div>
            </div>
            
            {/* Trust indicators */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/30">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                <span>Secure connection</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Instant sync</span>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <Tabs defaultValue="evm" className="px-6 pb-6">
          <TabsList className="grid w-full grid-cols-2 bg-muted/30 p-1 h-11 mb-5 rounded-xl">
            <TabsTrigger 
              value="evm" 
              className="rounded-lg font-medium text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              EVM Chains
            </TabsTrigger>
            <TabsTrigger 
              value="solana" 
              className="rounded-lg font-medium text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              Solana
            </TabsTrigger>
          </TabsList>

          <TabsContent value="evm" className="mt-0">
            <div className="grid grid-cols-3 gap-3">
              {evmWallets.map((wallet) => {
                const isLoading = loadingWallet === wallet.name;
                const isDisabled = !wallet.available || (loadingWallet !== null && !isLoading);

                return (
                  <button 
                    key={wallet.name} 
                    onClick={() => handleEVMConnect(wallet)} 
                    disabled={isDisabled} 
                    className={`wallet-card group ${isDisabled && !isLoading ? 'opacity-40 cursor-not-allowed' : ''} ${isLoading ? 'ring-2 ring-primary/50' : ''}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${wallet.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl`} />
                    <div className="relative flex flex-col items-center gap-2.5 py-1">
                      <div className="h-12 w-12 rounded-xl bg-background/80 flex items-center justify-center p-2.5 group-hover:scale-110 transition-transform duration-200">
                        <img src={wallet.logo} alt={wallet.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">{wallet.name}</p>
                        <p className={`text-[10px] mt-0.5 ${wallet.available ? 'text-muted-foreground' : 'text-amber-400'}`}>
                          {wallet.description}
                        </p>
                      </div>
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary absolute -top-1 -right-1" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="solana" className="mt-0">
            <div className="grid grid-cols-3 gap-3">
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
                    className={`wallet-card group ${isDisabled && !isLoading ? 'opacity-40 cursor-not-allowed' : ''} ${isLoading ? 'ring-2 ring-primary/50' : ''}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${wallet.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl`} />
                    <div className="relative flex flex-col items-center gap-2.5 py-1">
                      <div className="h-12 w-12 rounded-xl bg-background/80 flex items-center justify-center p-2.5 group-hover:scale-110 transition-transform duration-200">
                        <img src={wallet.logo} alt={wallet.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">{wallet.name}</p>
                        <p className={`text-[10px] mt-0.5 ${isInstalled ? 'text-muted-foreground' : 'text-amber-400'}`}>
                          {isInstalled ? wallet.description : "Install extension"}
                        </p>
                      </div>
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary absolute -top-1 -right-1" />}
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
