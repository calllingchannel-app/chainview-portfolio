import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useWalletStore } from "@/stores/walletStore";
import { getAllChainBalances } from "@/lib/blockchainService";
import { fetchPricesByIds } from "@/lib/priceService";
import { NATIVE_COINGECKO_IDS, EVM_TOKENS, SOLANA_TOKENS } from "@/lib/tokenLists";
import type { ConnectedWallet } from "@/stores/walletStore";
import { useConnect } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import { Loader2, Wallet } from "lucide-react";

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
  const { addWallet, setLoading, setLastUpdated } = useWalletStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Wagmi hooks for EVM
  const { connectors, connectAsync } = useConnect();

  // Solana hooks
  const { select, wallets, connect: connectSolana } = useWallet();

  const handleEVMConnect = async (connectorName: string) => {
    setIsConnecting(true);
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
      setIsLoadingBalances(false);
      setLoading(false);
    }
  };

  const handleSolanaConnect = async (walletName: string) => {
    setIsConnecting(true);
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
      setIsLoadingBalances(false);
      setLoading(false);
    }
  };

  const evmWallets = [
    { name: "MetaMask", logo: metamaskLogo, description: "Connect to MetaMask" },
    { name: "WalletConnect", logo: walletconnectLogo, description: "Scan with WalletConnect" },
    { name: "Coinbase Wallet", logo: coinbaseLogo, description: "Connect to Coinbase" },
    { name: "Trust", logo: trustLogo, description: "Connect to Trust Wallet" },
    { name: "Rainbow", logo: rainbowLogo, description: "Connect to Rainbow" },
  ];

  const solanaWallets = [
    { name: "Phantom", logo: phantomLogo, description: "Most popular Solana wallet" },
    { name: "Solflare", logo: solflareLogo, description: "Secure Solana wallet" },
    { name: "Backpack", logo: backpackLogo, description: "Modern Solana wallet" },
    { name: "Glow", logo: glowLogo, description: "Next-gen Solana wallet" },
    { name: "Coin98", logo: coin98Logo, description: "Multi-chain wallet" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-background border-border">
        <div className="p-6 border-b border-border bg-gradient-to-br from-background via-background to-accent/5">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold flex items-center gap-3">
              <Wallet className="h-8 w-8 text-primary" />
              Connect Your Wallet
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Select your preferred wallet to connect and access real-time portfolio data
            </DialogDescription>
          </DialogHeader>
        </div>

        {isLoadingBalances && (
          <div className="bg-accent/10 border-y border-border py-4 px-6">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm font-medium">Fetching real-time wallet balances...</p>
            </div>
          </div>
        )}

        <Tabs defaultValue="evm" className="w-full">
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="evm" className="text-base">EVM Chains</TabsTrigger>
              <TabsTrigger value="solana" className="text-base">Solana</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="evm" className="p-6 pt-4 space-y-3">
            {evmWallets.map((wallet) => (
              <button
                key={wallet.name}
                onClick={() => handleEVMConnect(wallet.name)}
                disabled={isConnecting || isLoadingBalances}
                className="w-full group relative overflow-hidden rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-primary/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-4 p-4">
                  <div className="relative w-12 h-12 rounded-lg bg-background border border-border flex items-center justify-center overflow-hidden group-hover:border-primary/50 transition-colors">
                    <img 
                      src={wallet.logo} 
                      alt={wallet.name} 
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                      {wallet.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {wallet.description}
                    </p>
                  </div>
                  <div className="text-muted-foreground group-hover:text-primary transition-colors">
                    →
                  </div>
                </div>
              </button>
            ))}
          </TabsContent>

          <TabsContent value="solana" className="p-6 pt-4 space-y-3">
            {solanaWallets.map((wallet) => (
              <button
                key={wallet.name}
                onClick={() => handleSolanaConnect(wallet.name)}
                disabled={isConnecting || isLoadingBalances}
                className="w-full group relative overflow-hidden rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-primary/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-4 p-4">
                  <div className="relative w-12 h-12 rounded-lg bg-background border border-border flex items-center justify-center overflow-hidden group-hover:border-primary/50 transition-colors">
                    <img 
                      src={wallet.logo} 
                      alt={wallet.name} 
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                      {wallet.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {wallet.description}
                    </p>
                  </div>
                  <div className="text-muted-foreground group-hover:text-primary transition-colors">
                    →
                  </div>
                </div>
              </button>
            ))}
          </TabsContent>
        </Tabs>

        <div className="px-6 pb-6 pt-2">
          <p className="text-xs text-muted-foreground text-center">
            By connecting your wallet, you agree to our Terms of Service. All data is fetched in real-time from the blockchain.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}