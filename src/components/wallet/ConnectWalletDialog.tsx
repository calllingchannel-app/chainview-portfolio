import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useWalletStore } from "@/stores/walletStore";
import { getAllChainBalances } from "@/lib/blockchainService";
import { fetchPricesByIds } from "@/lib/priceService";
import { NATIVE_COINGECKO_IDS, EVM_TOKENS, SOLANA_TOKENS } from "@/lib/tokenLists";
import type { ConnectedWallet } from "@/stores/walletStore";
import { useConnect, useAccount } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import { Loader2, Sparkles, Check } from "lucide-react";

// Import wallet logos
import metamaskLogo from "@/assets/wallets/metamask.png";
import walletconnectLogo from "@/assets/wallets/walletconnect.png";
import coinbaseLogo from "@/assets/wallets/coinbase.png";
import trustLogo from "@/assets/wallets/trust.png";
import rainbowLogo from "@/assets/wallets/rainbow-new.png";
import phantomLogo from "@/assets/wallets/phantom.png";
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

export function ConnectWalletDialog({ open, onOpenChange }: ConnectWalletDialogProps) {
  const { toast } = useToast();
  const { addWallet, setLoading, setLastUpdated, connectedWallets } = useWalletStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // EVM hooks
  const { connectors, connectAsync } = useConnect();
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();

  // Solana hooks
  const { wallets, select, connect: connectSolana } = useWallet();

  const handleEVMConnect = async (walletName: string, connectorType: string) => {
    setIsConnecting(true);
    setConnectingWallet(walletName);
    setIsLoadingBalances(true);
    setLoading(true);
    
    try {
      // Map connector types to wagmi connectors
      let connector;
      
      if (connectorType === "walletconnect") {
        connector = connectors.find(c => c.id === "walletConnect");
        if (!connector) {
          throw new Error("WalletConnect is not configured. Please add VITE_WC_PROJECT_ID to your environment variables.");
        }
      } else if (connectorType === "coinbase") {
        connector = connectors.find(c => c.id === "coinbaseWallet");
        if (!connector) {
          throw new Error("Coinbase Wallet connector not available.");
        }
      } else {
        // injected - browser extension wallets
        connector = connectors.find(c => c.id === "injected");
        if (!connector) {
          throw new Error(`${walletName} is not installed. Please install the ${walletName} browser extension.`);
        }
      }

      console.log(`Connecting to ${walletName} using ${connector.name} connector...`);
      const result = await connectAsync({ connector });
      const address = result.accounts[0];

      if (!address) {
        throw new Error('No address returned from wallet');
      }

      console.log('Connected to EVM wallet:', address);
      
      // Fetch real blockchain balances
      console.log('Fetching balances from all EVM chains...');
      const balances = await getAllChainBalances(address, 'evm');
      console.log('Fetched balances:', balances);
      
      // Collect all unique coingecko IDs
      const coingeckoIds = new Set<string>();
      balances.forEach((token) => {
        if (!token.contractAddress) {
          const nativeId = NATIVE_COINGECKO_IDS[token.chain];
          if (nativeId) coingeckoIds.add(nativeId);
        } else {
          const list = (EVM_TOKENS as any)[token.chain] as Array<any> | undefined;
          const info = list?.find((t) => t.address.toLowerCase() === token.contractAddress?.toLowerCase());
          if (info?.coingeckoId) coingeckoIds.add(info.coingeckoId);
        }
      });
      
      // Fetch prices
      console.log('Fetching prices for tokens...');
      const prices = await fetchPricesByIds(Array.from(coingeckoIds));
      
      // Update balances with USD values
      balances.forEach((token) => {
        if (!token.contractAddress) {
          const nativeId = NATIVE_COINGECKO_IDS[token.chain];
          if (nativeId && prices[nativeId]) {
            token.priceUsd = prices[nativeId];
            token.usdValue = parseFloat(token.balance) * prices[nativeId];
          }
        } else {
          const list = (EVM_TOKENS as any)[token.chain] as Array<any> | undefined;
          const info = list?.find((t) => t.address.toLowerCase() === token.contractAddress?.toLowerCase());
          if (info?.coingeckoId && prices[info.coingeckoId]) {
            token.priceUsd = prices[info.coingeckoId];
            token.usdValue = parseFloat(token.balance) * prices[info.coingeckoId];
          }
        }
      });
      
      const totalValue = balances.reduce((sum, b) => sum + b.usdValue, 0);
      console.log('Total USD Value:', totalValue);
      
      const wallet: ConnectedWallet = {
        id: `evm-${Date.now()}`,
        address,
        type: 'evm',
        name: walletName, // Use the actual wallet name instead of connector name
        chain: 'Multi-Chain',
        balances: balances,
        totalUsdValue: totalValue,
        connectedAt: Date.now(),
      };

      addWallet(wallet);
      setLastUpdated(Date.now());
      
      toast({
        title: "Wallet Connected",
        description: `${walletName} connected successfully with real-time data`,
      });
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error connecting EVM wallet:', error);
      
      let errorMessage = error?.message || "Failed to connect wallet. Please try again.";
      
      // Provide helpful error messages for common issues
      if (error?.message?.includes('User rejected')) {
        errorMessage = "Connection request was rejected. Please try again and approve the connection.";
      } else if (error?.message?.includes('not available') || error?.message?.includes('not installed')) {
        errorMessage = `${walletName} is not installed. Please install the ${walletName} extension or app.`;
      } else if (error?.message?.includes('Chain')) {
        errorMessage = "Please switch to a supported network (Ethereum, Polygon, etc.) in your wallet.";
      }
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
      setConnectingWallet(null);
      setIsLoadingBalances(false);
      setLoading(false);
    }
  };

  const handleSolanaConnect = async (walletName: string) => {
    setIsConnecting(true);
    setConnectingWallet(walletName);
    setIsLoadingBalances(true);
    setLoading(true);
    
    try {
      const wallet = wallets.find((w) =>
        w.adapter.name.toLowerCase().includes(walletName.toLowerCase())
      );

      if (!wallet) {
        throw new Error(`${walletName} not found. Please install it.`);
      }

      // Select the wallet in the provider and request a connection (permission prompt)
      select(wallet.adapter.name);
      await connectSolana();

      const publicKey = wallet.adapter.publicKey;
      if (!publicKey) {
        throw new Error("Failed to get wallet address from adapter");
      }

      const address = publicKey.toBase58();
      console.log("Connected to Solana wallet:", address);
      
      // Fetch real Solana balances
      console.log("Fetching Solana balances...");
      const balances = await getAllChainBalances(address, "solana");
      console.log("Fetched Solana balances:", balances);
      
      // Collect coingecko IDs
      const coingeckoIds = new Set<string>(["solana"]);
      balances.forEach((token) => {
        if (token.chain === "solana" && token.contractAddress) {
          const info = SOLANA_TOKENS.find((t) => t.address === token.contractAddress);
          if (info?.coingeckoId) coingeckoIds.add(info.coingeckoId);
        }
      });

      console.log("Fetching prices for:", Array.from(coingeckoIds));
      const prices = await fetchPricesByIds(Array.from(coingeckoIds));
      console.log("Fetched prices:", prices);

      // Update balances with USD values
      balances.forEach((token) => {
        if (token.symbol === "SOL" && prices["solana"]) {
          token.priceUsd = prices["solana"];
          token.usdValue = parseFloat(token.balance) * prices["solana"];
        } else if (token.chain === "solana" && token.contractAddress) {
          const info = SOLANA_TOKENS.find((t) => t.address === token.contractAddress);
          if (info?.coingeckoId && prices[info.coingeckoId]) {
            token.priceUsd = prices[info.coingeckoId];
            token.usdValue = parseFloat(token.balance) * prices[info.coingeckoId];
          }
        }
      });
      
      const totalValue = balances.reduce((sum, b) => sum + b.usdValue, 0);
      console.log("Total USD Value:", totalValue);
      
      const connectedWallet: ConnectedWallet = {
        id: `solana-${Date.now()}`,
        address,
        type: "solana",
        name: wallet.adapter.name,
        chain: "Solana",
        balances,
        totalUsdValue: totalValue,
        connectedAt: Date.now(),
      };

      addWallet(connectedWallet);
      setLastUpdated(Date.now());
      
      toast({
        title: "Wallet Connected",
        description: `${wallet.adapter.name} connected successfully with real-time data`,
      });
      
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error connecting Solana wallet:", error);
      toast({
        title: "Connection Failed",
        description: error?.message || "Failed to connect Solana wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
      setConnectingWallet(null);
      setIsLoadingBalances(false);
      setLoading(false);
    }
  };

  const evmWallets = [
    { name: "MetaMask", logo: metamaskLogo, desc: "Most popular wallet", connector: "injected", color: "from-orange-500 to-yellow-500" },
    { name: "Coinbase Wallet", logo: coinbaseLogo, desc: "Secure & simple", connector: "coinbase", color: "from-blue-500 to-cyan-500" },
    { name: "WalletConnect", logo: walletconnectLogo, desc: "Connect any wallet", connector: "walletconnect", color: "from-blue-400 to-indigo-500" },
    { name: "Rainbow", logo: rainbowLogo, desc: "Beautiful & easy", connector: "injected", color: "from-pink-500 to-purple-500" },
    { name: "Trust", logo: trustLogo, desc: "Multi-chain wallet", connector: "injected", color: "from-cyan-500 to-blue-600" },
    { name: "OKX Wallet", logo: okxLogo, desc: "Exchange wallet", connector: "injected", color: "from-gray-700 to-black" },
    { name: "Ledger", logo: ledgerLogo, desc: "Hardware security", connector: "walletconnect", color: "from-gray-600 to-gray-800" },
    { name: "Safe", logo: safeLogo, desc: "Multi-sig wallet", connector: "walletconnect", color: "from-green-500 to-emerald-600" },
  ];

  const solanaWalletList = [
    { name: "Phantom", logo: phantomLogo, desc: "Top Solana wallet", color: "from-purple-500 to-indigo-600" },
    { name: "Solflare", logo: solflareLogo, desc: "Secure & fast", color: "from-orange-500 to-red-500" },
    { name: "Backpack", logo: backpackLogo, desc: "Modern wallet", color: "from-red-500 to-pink-500" },
    { name: "Glow", logo: glowLogo, desc: "Elegant design", color: "from-cyan-400 to-blue-500" },
    { name: "Coin98", logo: coin98Logo, desc: "Multi-chain DeFi", color: "from-yellow-500 to-orange-500" },
  ];

  const isWalletConnected = (walletName: string) => {
    return connectedWallets.some(w => 
      w.name.toLowerCase().includes(walletName.toLowerCase())
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-card/50 backdrop-blur-3xl border border-border/30 shadow-glow">
        <DialogHeader className="space-y-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-glow animate-pulse-glow">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-3xl font-display font-bold gradient-text">
                Connect Wallet
              </DialogTitle>
              <DialogDescription className="text-muted-foreground/90 text-sm mt-1">
                Choose your wallet to start tracking real-time portfolio data
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoadingBalances && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-xl z-50 flex items-center justify-center rounded-2xl">
            <div className="text-center space-y-4 p-8">
              <div className="relative">
                <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
                <div className="absolute inset-0 animate-ping">
                  <div className="h-16 w-16 rounded-full bg-primary/20 mx-auto"></div>
                </div>
              </div>
              <div>
                <p className="text-base font-semibold mb-1">Fetching wallet balances...</p>
                <p className="text-sm text-muted-foreground">Scanning blockchain networks</p>
              </div>
            </div>
          </div>
        )}

        <Tabs defaultValue="evm" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/40 backdrop-blur-sm p-1.5 rounded-xl mb-8 border border-border/20">
            <TabsTrigger 
              value="evm" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-accent/20 data-[state=active]:text-primary font-semibold transition-all duration-300 data-[state=active]:shadow-lg"
            >
              EVM Chains
            </TabsTrigger>
            <TabsTrigger 
              value="solana" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-accent/20 data-[state=active]:text-primary font-semibold transition-all duration-300 data-[state=active]:shadow-lg"
            >
              Solana
            </TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[calc(90vh-280px)] pr-3 -mr-3 custom-scrollbar">
            <TabsContent value="evm" className="mt-0">
              <div className="wallet-dialog-grid">
                {evmWallets.map((wallet) => {
                  const isConnected = isWalletConnected(wallet.name);
                  const isLoading = connectingWallet === wallet.name;
                  
                  return (
                    <button
                      key={wallet.name}
                      onClick={() => !isConnecting && !isConnected && handleEVMConnect(wallet.name, wallet.connector)}
                      disabled={isConnecting || isConnected}
                      className="group relative overflow-hidden rounded-2xl bg-card/40 backdrop-blur-sm border border-border/40 p-6 transition-all duration-500 hover:bg-card/60 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${wallet.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                      
                      <div className="flex flex-col items-center gap-4 relative z-10">
                        <div className="relative">
                          <div className={`absolute inset-0 bg-gradient-to-br ${wallet.color} rounded-2xl blur-2xl opacity-0 group-hover:opacity-60 transition-all duration-500 animate-pulse-glow`}></div>
                          <div className="relative w-20 h-20 rounded-xl bg-background/50 backdrop-blur-sm p-3 flex items-center justify-center group-hover:bg-background/80 transition-all duration-300">
                            <img 
                              src={wallet.logo} 
                              alt={wallet.name}
                              className="w-full h-full object-contain transition-all duration-500 group-hover:scale-110 drop-shadow-lg"
                            />
                          </div>
                          {isConnected && (
                            <div className={`absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br ${wallet.color} rounded-full flex items-center justify-center shadow-glow border-2 border-background animate-fade-in`}>
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="text-center space-y-1.5">
                          <p className="font-bold text-base text-foreground group-hover:text-primary transition-colors duration-300">
                            {wallet.name}
                          </p>
                          <p className="text-xs text-muted-foreground/70 leading-tight">
                            {wallet.desc}
                          </p>
                        </div>
                        
                        {isLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-card/95 backdrop-blur-md rounded-2xl">
                            <div className="relative">
                              <Loader2 className="h-10 w-10 animate-spin text-primary" />
                              <div className="absolute inset-0 animate-ping">
                                <Loader2 className="h-10 w-10 text-primary/30" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="solana" className="mt-0">
              <div className="wallet-dialog-grid">
                {solanaWalletList.map((wallet) => {
                  const isConnected = isWalletConnected(wallet.name);
                  const isLoading = connectingWallet === wallet.name;
                  
                  return (
                    <button
                      key={wallet.name}
                      onClick={() => !isConnecting && !isConnected && handleSolanaConnect(wallet.name)}
                      disabled={isConnecting || isConnected}
                      className="group relative overflow-hidden rounded-2xl bg-card/40 backdrop-blur-sm border border-border/40 p-6 transition-all duration-500 hover:bg-card/60 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${wallet.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                      
                      <div className="flex flex-col items-center gap-4 relative z-10">
                        <div className="relative">
                          <div className={`absolute inset-0 bg-gradient-to-br ${wallet.color} rounded-2xl blur-2xl opacity-0 group-hover:opacity-60 transition-all duration-500 animate-pulse-glow`}></div>
                          <div className="relative w-20 h-20 rounded-xl bg-background/50 backdrop-blur-sm p-3 flex items-center justify-center group-hover:bg-background/80 transition-all duration-300">
                            <img 
                              src={wallet.logo} 
                              alt={wallet.name}
                              className="w-full h-full object-contain transition-all duration-500 group-hover:scale-110 drop-shadow-lg"
                            />
                          </div>
                          {isConnected && (
                            <div className={`absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br ${wallet.color} rounded-full flex items-center justify-center shadow-glow border-2 border-background animate-fade-in`}>
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="text-center space-y-1.5">
                          <p className="font-bold text-base text-foreground group-hover:text-primary transition-colors duration-300">
                            {wallet.name}
                          </p>
                          <p className="text-xs text-muted-foreground/70 leading-tight">
                            {wallet.desc}
                          </p>
                        </div>
                        
                        {isLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-card/95 backdrop-blur-md rounded-2xl">
                            <div className="relative">
                              <Loader2 className="h-10 w-10 animate-spin text-primary" />
                              <div className="absolute inset-0 animate-ping">
                                <Loader2 className="h-10 w-10 text-primary/30" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="border-t border-border/30 pt-5 mt-5">
          <p className="text-xs text-muted-foreground/70 text-center leading-relaxed">
            🔒 Secure connection • Real-time blockchain data • Your keys, your crypto
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
