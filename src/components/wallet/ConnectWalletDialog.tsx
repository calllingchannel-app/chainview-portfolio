import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useWalletStore } from "@/stores/walletStore";
import { Loader2, AlertCircle } from "lucide-react";
import { useConnect, useDisconnect } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import { getAllChainBalances } from "@/lib/blockchainService";
import { fetchPricesByIds } from "@/lib/priceService";
import { NATIVE_COINGECKO_IDS } from "@/lib/tokenLists";

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

const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID;
const WALLETCONNECT_ENABLED = Boolean(WALLETCONNECT_PROJECT_ID);

interface ConnectWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Detect specific wallet providers
function detectWalletProvider(): {
  isMetaMask: boolean;
  isCoinbase: boolean;
  isTrust: boolean;
  isRabby: boolean;
  isBrave: boolean;
  isOKX: boolean;
} {
  if (typeof window === 'undefined') {
    return { isMetaMask: false, isCoinbase: false, isTrust: false, isRabby: false, isBrave: false, isOKX: false };
  }

  const ethereum = (window as any).ethereum;
  
  return {
    isMetaMask: Boolean(ethereum?.isMetaMask && !ethereum?.isBraveWallet && !ethereum?.isTrust && !ethereum?.isRabby),
    isCoinbase: Boolean(ethereum?.isCoinbaseWallet || (window as any).coinbaseWalletExtension),
    isTrust: Boolean(ethereum?.isTrust || ethereum?.isTrustWallet),
    isRabby: Boolean(ethereum?.isRabby),
    isBrave: Boolean(ethereum?.isBraveWallet),
    isOKX: Boolean(ethereum?.isOkxWallet || (window as any).okxwallet),
  };
}

export function ConnectWalletDialog({ open, onOpenChange }: ConnectWalletDialogProps) {
  const { toast } = useToast();
  const { connectedWallets, addWallet } = useWalletStore();
  const [loadingWallet, setLoadingWallet] = useState<string | null>(null);
  
  const { connectors, connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { wallets, select } = useWallet();

  const providers = detectWalletProvider();

  const isWalletConnected = (address: string) => {
    return connectedWallets.some(w => w.address.toLowerCase() === address.toLowerCase());
  };

  const fetchAndStoreBalances = async (address: string, walletName: string, walletType: 'evm' | 'solana') => {
    toast({ title: "Fetching balances...", description: "Getting your token balances across chains" });

    const balances = await getAllChainBalances(address, walletType);
    console.log(`Fetched ${balances.length} balances for ${walletName}:`, balances);
    
    // Get unique coingecko IDs for price fetching
    const coingeckoIds = [...new Set(balances.map(t => 
      NATIVE_COINGECKO_IDS[t.symbol.toUpperCase()] || t.symbol.toLowerCase()
    ))];
    
    const prices = await fetchPricesByIds(coingeckoIds);
    console.log('Fetched prices:', prices);
    
    // Apply prices to balances
    const balancesWithPrices = balances.map(b => {
      const priceId = NATIVE_COINGECKO_IDS[b.symbol.toUpperCase()] || b.symbol.toLowerCase();
      const price = prices[priceId] || 0;
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

  const handleEVMConnect = async (walletName: string, connectorType: 'injected' | 'walletconnect' | 'coinbase') => {
    if (loadingWallet) return;
    setLoadingWallet(walletName);
    
    try {
      let connector;
      
      // Route to correct connector based on type
      if (connectorType === 'coinbase') {
        connector = connectors.find(c => c.id === 'coinbaseWalletSDK' || c.id === 'coinbaseWallet');
        if (!connector) {
          throw new Error('Coinbase Wallet connector not available. Please install the Coinbase Wallet extension.');
        }
      } else if (connectorType === 'walletconnect') {
        if (!WALLETCONNECT_ENABLED) {
          throw new Error(
            `WalletConnect requires a Project ID. Add VITE_WC_PROJECT_ID to your environment variables.\n\nGet a free Project ID at: cloud.walletconnect.com`
          );
        }
        connector = connectors.find(c => c.id === 'walletConnect');
        if (!connector) {
          throw new Error('WalletConnect connector not configured properly.');
        }
      } else {
        // Injected connector - for MetaMask and other browser extensions
        if (walletName === 'MetaMask' && !providers.isMetaMask) {
          throw new Error('MetaMask is not installed. Please install the MetaMask browser extension from metamask.io');
        }
        if (walletName === 'Brave Wallet' && !providers.isBrave) {
          throw new Error('Brave Wallet is not available. Please use the Brave browser with the wallet enabled.');
        }
        if (walletName === 'Rabby' && !providers.isRabby) {
          throw new Error('Rabby Wallet is not installed. Please install the Rabby extension.');
        }
        
        connector = connectors.find(c => c.id === 'injected');
        if (!connector) {
          throw new Error(`${walletName} connector not available. Please install the browser extension.`);
        }
      }

      console.log(`Connecting ${walletName} using connector: ${connector.id}`);
      
      // Disconnect any existing connection first to ensure clean state
      try {
        await disconnectAsync();
      } catch (e) {
        // Ignore disconnect errors
      }

      const result = await connectAsync({ connector });
      const address = result.accounts[0];
      
      if (!address) {
        throw new Error("No address returned from wallet. Please try again.");
      }
      
      console.log(`Connected to ${walletName}: ${address}`);
      
      if (isWalletConnected(address)) {
        toast({ 
          title: "Already connected", 
          description: `This wallet address is already in your portfolio.` 
        });
        setLoadingWallet(null);
        return;
      }

      const totalValue = await fetchAndStoreBalances(address, walletName, 'evm');

      toast({ 
        title: "Wallet Connected!", 
        description: `${walletName} connected with $${totalValue.toFixed(2)} in assets.` 
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error(`${walletName} connection error:`, error);
      
      let message = error.message || "Connection failed. Please try again.";
      if (error.message?.includes('User rejected') || error.message?.includes('user rejected')) {
        message = 'Connection cancelled by user.';
      } else if (error.message?.includes('already pending')) {
        message = 'A connection request is already pending. Please check your wallet.';
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
      // Find the wallet adapter
      const walletEntry = wallets.find(w => 
        w.adapter.name.toLowerCase().includes(walletName.toLowerCase())
      );

      if (!walletEntry) {
        throw new Error(`${walletName} is not installed. Please install the ${walletName} browser extension.`);
      }

      const adapter = walletEntry.adapter;
      console.log(`Connecting to ${walletName} via adapter: ${adapter.name}`);

      // Select and connect
      select(adapter.name);
      
      if (!adapter.connected) {
        await adapter.connect();
      }

      const pubkey = adapter.publicKey;
      if (!pubkey) {
        throw new Error("Failed to get wallet address. Please try again.");
      }

      const address = pubkey.toBase58();
      console.log(`Connected to ${walletName}: ${address}`);
      
      if (isWalletConnected(address)) {
        toast({ 
          title: "Already connected", 
          description: "This wallet address is already in your portfolio." 
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
      console.error(`${walletName} connection error:`, error);
      
      let message = error.message || "Connection failed. Please try again.";
      if (error.message?.includes('User rejected') || error.message?.includes('user rejected')) {
        message = 'Connection cancelled by user.';
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

  // EVM Wallets Configuration
  const evmWallets = [
    { 
      name: "MetaMask", 
      logo: metamaskLogo, 
      description: providers.isMetaMask ? "Ready to connect" : "Extension required",
      connector: "injected" as const, 
      color: "from-orange-500/20 to-orange-600/20",
      available: providers.isMetaMask
    },
    { 
      name: "Coinbase Wallet", 
      logo: coinbaseLogo, 
      description: "Mobile & extension", 
      connector: "coinbase" as const, 
      color: "from-blue-500/20 to-blue-600/20",
      available: true // Coinbase connector handles installation
    },
    { 
      name: "Trust Wallet", 
      logo: trustLogo, 
      description: WALLETCONNECT_ENABLED ? "Via WalletConnect" : "Requires WC Project ID",
      connector: "walletconnect" as const, 
      color: "from-blue-500/20 to-cyan-500/20",
      available: WALLETCONNECT_ENABLED
    },
    { 
      name: "Rainbow", 
      logo: rainbowLogo, 
      description: WALLETCONNECT_ENABLED ? "Via WalletConnect" : "Requires WC Project ID",
      connector: "walletconnect" as const, 
      color: "from-purple-500/20 to-pink-500/20",
      available: WALLETCONNECT_ENABLED
    },
    { 
      name: "OKX Wallet", 
      logo: okxLogo, 
      description: WALLETCONNECT_ENABLED ? "Via WalletConnect" : "Requires WC Project ID",
      connector: "walletconnect" as const, 
      color: "from-gray-700/20 to-gray-800/20",
      available: WALLETCONNECT_ENABLED
    },
    { 
      name: "WalletConnect", 
      logo: walletConnectLogo, 
      description: WALLETCONNECT_ENABLED ? "Scan QR code" : "Requires Project ID",
      connector: "walletconnect" as const, 
      color: "from-blue-400/20 to-blue-500/20",
      available: WALLETCONNECT_ENABLED
    },
    { 
      name: "Safe", 
      logo: safeLogo, 
      description: WALLETCONNECT_ENABLED ? "Multi-sig wallet" : "Requires WC Project ID",
      connector: "walletconnect" as const, 
      color: "from-green-500/20 to-emerald-500/20",
      available: WALLETCONNECT_ENABLED
    },
    { 
      name: "Ledger", 
      logo: ledgerLogo, 
      description: WALLETCONNECT_ENABLED ? "Hardware wallet" : "Requires WC Project ID",
      connector: "walletconnect" as const, 
      color: "from-gray-600/20 to-gray-700/20",
      available: WALLETCONNECT_ENABLED
    },
    { 
      name: "Trezor", 
      logo: trezorLogo, 
      description: WALLETCONNECT_ENABLED ? "Hardware wallet" : "Requires WC Project ID",
      connector: "walletconnect" as const, 
      color: "from-green-600/20 to-teal-600/20",
      available: WALLETCONNECT_ENABLED
    },
  ];

  // Solana Wallets Configuration
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

        {!WALLETCONNECT_ENABLED && (
          <div className="mx-8 mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-500">WalletConnect not configured</p>
              <p className="text-muted-foreground mt-1">
                Add <code className="bg-card/50 px-1 rounded">VITE_WC_PROJECT_ID</code> to enable Trust Wallet, Rainbow, hardware wallets, and more.
              </p>
            </div>
          </div>
        )}

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
                    onClick={() => handleEVMConnect(wallet.name, wallet.connector)} 
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
                const walletEntry = wallets.find((w) =>
                  w.adapter.name.toLowerCase().includes(wallet.name.toLowerCase())
                );
                const isLoading = loadingWallet === wallet.name;
                const isDisabled = !walletEntry || (loadingWallet !== null && !isLoading);

                return (
                  <button
                    key={wallet.name}
                    onClick={() => handleSolanaConnect(wallet.name)}
                    disabled={isDisabled}
                    className={`wallet-button group ${!walletEntry ? 'opacity-50' : ''}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${wallet.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
                    <div className="relative flex flex-col items-center gap-3">
                      <div className="h-16 w-16 rounded-xl bg-card/80 backdrop-blur-sm flex items-center justify-center p-3 group-hover:scale-110 transition-transform duration-300">
                        <img src={wallet.logo} alt={wallet.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{wallet.name}</p>
                        <p className={`text-xs mt-0.5 ${walletEntry ? 'text-muted-foreground/80' : 'text-amber-500/80'}`}>
                          {walletEntry ? wallet.description : 'Extension required'}
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
