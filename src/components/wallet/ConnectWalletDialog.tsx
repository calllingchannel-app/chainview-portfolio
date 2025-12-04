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
  const providers = ethereum?.providers || [ethereum];
  
  // Check for specific providers in the providers array or main ethereum object
  const hasProvider = (check: (p: any) => boolean) => {
    if (Array.isArray(providers)) {
      return providers.some(check);
    }
    return check(ethereum);
  };

  return {
    metamask: hasProvider(p => p?.isMetaMask && !p?.isBraveWallet && !p?.isTrust),
    coinbase: Boolean(ethereum?.isCoinbaseWallet || (window as any).coinbaseWalletExtension),
    trust: hasProvider(p => p?.isTrust || p?.isTrustWallet),
    rabby: hasProvider(p => p?.isRabby),
    brave: hasProvider(p => p?.isBraveWallet),
    okx: Boolean(ethereum?.isOkxWallet || (window as any).okxwallet),
    phantom: Boolean((window as any).phantom?.ethereum),
  };
}

// Get the correct provider for a specific wallet
function getSpecificProvider(walletType: string): any {
  if (typeof window === 'undefined') return null;
  
  const ethereum = (window as any).ethereum;
  const providers = ethereum?.providers || [];
  
  switch (walletType) {
    case 'metamask':
      if (Array.isArray(providers)) {
        return providers.find((p: any) => p?.isMetaMask && !p?.isBraveWallet && !p?.isTrust);
      }
      return ethereum?.isMetaMask ? ethereum : null;
    case 'coinbase':
      return (window as any).coinbaseWalletExtension || 
             (Array.isArray(providers) ? providers.find((p: any) => p?.isCoinbaseWallet) : 
              ethereum?.isCoinbaseWallet ? ethereum : null);
    case 'trust':
      if (Array.isArray(providers)) {
        return providers.find((p: any) => p?.isTrust || p?.isTrustWallet);
      }
      return ethereum?.isTrust ? ethereum : null;
    case 'rabby':
      if (Array.isArray(providers)) {
        return providers.find((p: any) => p?.isRabby);
      }
      return ethereum?.isRabby ? ethereum : null;
    case 'brave':
      if (Array.isArray(providers)) {
        return providers.find((p: any) => p?.isBraveWallet);
      }
      return ethereum?.isBraveWallet ? ethereum : null;
    case 'okx':
      return (window as any).okxwallet || ethereum?.isOkxWallet ? ethereum : null;
    case 'phantom':
      return (window as any).phantom?.ethereum;
    default:
      return ethereum;
  }
}

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
    console.log(`[${walletName}] Fetched ${balances.length} balances:`, balances);
    
    // Get unique coingecko IDs for price fetching
    const coingeckoIds = [...new Set(balances.map(t => 
      NATIVE_COINGECKO_IDS[t.symbol.toUpperCase()] || t.symbol.toLowerCase()
    ))];
    
    const prices = await fetchPricesByIds(coingeckoIds);
    console.log('[Prices] Fetched:', prices);
    
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

  // Connect using browser extension (injected provider)
  const connectInjected = async (walletName: string, providerType: string) => {
    const provider = getSpecificProvider(providerType);
    if (!provider) {
      throw new Error(`${walletName} is not installed. Please install the browser extension.`);
    }

    // Request accounts directly from the specific provider
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned from wallet');
    }
    return accounts[0];
  };

  // Connect using wagmi connector
  const connectWagmi = async (connectorId: string) => {
    const connector = connectors.find(c => c.id === connectorId);
    if (!connector) {
      throw new Error(`Connector ${connectorId} not found`);
    }
    
    try {
      await disconnectAsync();
    } catch (e) {
      // Ignore disconnect errors
    }
    
    const result = await connectAsync({ connector });
    return result.accounts[0];
  };

  const handleEVMConnect = async (wallet: EVMWallet) => {
    if (loadingWallet) return;
    setLoadingWallet(wallet.name);
    
    try {
      let address: string;

      // Route to correct connection method
      if (wallet.connectionType === 'injected') {
        address = await connectInjected(wallet.name, wallet.providerKey);
      } else if (wallet.connectionType === 'coinbase') {
        address = await connectWagmi('coinbaseWalletSDK');
      } else {
        // WalletConnect
        address = await connectWagmi('walletConnect');
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
      // Find the wallet adapter
      const walletAdapter = solanaWalletAdapters.find(w => 
        w.adapter.name.toLowerCase().includes(walletName.toLowerCase())
      );

      if (!walletAdapter) {
        throw new Error(`${walletName} is not installed. Please install the browser extension.`);
      }

      const adapter = walletAdapter.adapter;
      console.log(`[${walletName}] Connecting via adapter: ${adapter.name}`);

      // Disconnect existing if any
      try {
        await disconnectSolana();
      } catch (e) {
        // Ignore
      }

      // Select and connect
      select(adapter.name);
      
      if (!adapter.connected) {
        await adapter.connect();
      }

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
      available: installed.trust || true
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
      available: installed.okx || true
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
                const isInstalled = Boolean(walletAdapter?.readyState === 'Installed');
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
