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
import rainbowLogo from "@/assets/wallets/rainbow.png";
import phantomLogo from "@/assets/wallets/phantom.png";
import solflareLogo from "@/assets/wallets/solflare.png";
import backpackLogo from "@/assets/wallets/backpack.png";
import glowLogo from "@/assets/wallets/glow.png";
import coin98Logo from "@/assets/wallets/coin98.png";

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

  const handleEVMConnect = async (connectorName: string) => {
    setIsConnecting(true);
    setConnectingWallet(connectorName);
    setIsLoadingBalances(true);
    setLoading(true);
    
    try {
      const connector = connectors.find(c => 
        c.name.toLowerCase().includes(connectorName.toLowerCase())
      );

      if (!connector) {
        throw new Error(`${connectorName} connector not found`);
      }

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
        name: connector.name,
        chain: 'Multi-Chain',
        balances: balances,
        totalUsdValue: totalValue,
        connectedAt: Date.now(),
      };

      addWallet(wallet);
      setLastUpdated(Date.now());
      
      toast({
        title: "Wallet Connected",
        description: `${connector.name} connected successfully with real-time data`,
      });
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error connecting EVM wallet:', error);
      toast({
        title: "Connection Failed",
        description: error?.message || "Failed to connect wallet. Please try again.",
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
    { name: "MetaMask", logo: metamaskLogo, desc: "Most popular Web3 wallet" },
    { name: "WalletConnect", logo: walletconnectLogo, desc: "Connect any wallet" },
    { name: "Coinbase Wallet", logo: coinbaseLogo, desc: "Coinbase's official wallet" },
    { name: "Trust", logo: trustLogo, desc: "Multi-chain mobile wallet" },
    { name: "Rainbow", logo: rainbowLogo, desc: "Ethereum wallet for everyone" },
  ];

  const solanaWalletList = [
    { name: "Phantom", logo: phantomLogo, desc: "Leading Solana wallet" },
    { name: "Solflare", logo: solflareLogo, desc: "Secure Solana wallet" },
    { name: "Backpack", logo: backpackLogo, desc: "Multi-chain wallet" },
    { name: "Glow", logo: glowLogo, desc: "Elegant Solana wallet" },
    { name: "Coin98", logo: coin98Logo, desc: "Multi-chain DeFi wallet" },
  ];

  const isWalletConnected = (walletName: string) => {
    return connectedWallets.some(w => 
      w.name.toLowerCase().includes(walletName.toLowerCase())
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden bg-card/95 backdrop-blur-2xl border-border/60 shadow-premium">
        <DialogHeader className="space-y-3 pb-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-premium">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <DialogTitle className="text-2xl font-display font-bold gradient-text">
              Connect Your Wallet
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            Choose your preferred wallet to connect and start tracking your portfolio with real-time data
          </DialogDescription>
        </DialogHeader>

        {isLoadingBalances && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center space-y-3">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-sm font-medium">Fetching wallet balances...</p>
              <p className="text-xs text-muted-foreground">This may take a moment</p>
            </div>
          </div>
        )}

        <Tabs defaultValue="evm" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50 p-1 rounded-lg mb-6">
            <TabsTrigger 
              value="evm" 
              className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium transition-all"
            >
              EVM Wallets
            </TabsTrigger>
            <TabsTrigger 
              value="solana" 
              className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium transition-all"
            >
              Solana Wallets
            </TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[calc(85vh-240px)] pr-2 -mr-2">
            <TabsContent value="evm" className="mt-0 space-y-3">
              <div className="wallet-dialog-grid">
                {evmWallets.map((wallet) => {
                  const isConnected = isWalletConnected(wallet.name);
                  const isLoading = connectingWallet === wallet.name;
                  
                  return (
                    <button
                      key={wallet.name}
                      onClick={() => !isConnecting && !isConnected && handleEVMConnect(wallet.name)}
                      disabled={isConnecting || isConnected}
                      className="wallet-button group"
                    >
                      <div className="flex flex-col items-center gap-3 relative">
                        <div className="relative">
                          <img 
                            src={wallet.logo} 
                            alt={wallet.name}
                            className="w-12 h-12 object-contain transition-transform duration-300 group-hover:scale-110"
                          />
                          {isConnected && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                            {wallet.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 leading-tight">
                            {wallet.desc}
                          </p>
                        </div>
                        {isLoading && (
                          <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-primary" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="solana" className="mt-0 space-y-3">
              <div className="wallet-dialog-grid">
                {solanaWalletList.map((wallet) => {
                  const isConnected = isWalletConnected(wallet.name);
                  const isLoading = connectingWallet === wallet.name;
                  
                  return (
                    <button
                      key={wallet.name}
                      onClick={() => !isConnecting && !isConnected && handleSolanaConnect(wallet.name)}
                      disabled={isConnecting || isConnected}
                      className="wallet-button group"
                    >
                      <div className="flex flex-col items-center gap-3 relative">
                        <div className="relative">
                          <img 
                            src={wallet.logo} 
                            alt={wallet.name}
                            className="w-12 h-12 object-contain transition-transform duration-300 group-hover:scale-110"
                          />
                          {isConnected && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                            {wallet.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 leading-tight">
                            {wallet.desc}
                          </p>
                        </div>
                        {isLoading && (
                          <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-primary" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="border-t border-border/50 pt-4 mt-4">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            By connecting your wallet, you agree to our Terms of Service. 
            <br />
            All data is fetched in real-time from blockchain networks.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
