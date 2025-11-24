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
import { useConnect, useAccount } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import { Loader2 } from "lucide-react";

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
  const { address: evmAddress } = useAccount();

  // Solana hooks
  const { select, wallets, publicKey, connect: connectSolana } = useWallet();

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
        description: `${connector.name} connected successfully`,
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
      const wallet = wallets.find(w => 
        w.adapter.name.toLowerCase().includes(walletName.toLowerCase())
      );

      if (!wallet) {
        throw new Error(`${walletName} not found. Please install it.`);
      }

      select(wallet.adapter.name);
      await connectSolana();

      // Wait for publicKey to be available
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!publicKey) {
        throw new Error('Failed to get wallet address');
      }

      const address = publicKey.toString();
      console.log('Connected to Solana wallet:', address);
      
      // Fetch real Solana balances
      console.log('Fetching Solana balances...');
      const balances = await getAllChainBalances(address, 'solana');
      console.log('Fetched Solana balances:', balances);
      
      // Collect coingecko IDs
      const coingeckoIds = new Set<string>(['solana']);
      balances.forEach((token) => {
        if (token.chain === 'solana' && token.contractAddress) {
          const info = SOLANA_TOKENS.find((t) => t.address === token.contractAddress);
          if (info?.coingeckoId) coingeckoIds.add(info.coingeckoId);
        }
      });

      console.log('Fetching prices for:', Array.from(coingeckoIds));
      const prices = await fetchPricesByIds(Array.from(coingeckoIds));
      console.log('Fetched prices:', prices);

      // Update balances with USD values
      balances.forEach((token) => {
        if (token.symbol === 'SOL' && prices['solana']) {
          token.priceUsd = prices['solana'];
          token.usdValue = parseFloat(token.balance) * prices['solana'];
        } else if (token.chain === 'solana' && token.contractAddress) {
          const info = SOLANA_TOKENS.find((t) => t.address === token.contractAddress);
          if (info?.coingeckoId && prices[info.coingeckoId]) {
            token.priceUsd = prices[info.coingeckoId];
            token.usdValue = parseFloat(token.balance) * prices[info.coingeckoId];
          }
        }
      });
      
      const totalValue = balances.reduce((sum, b) => sum + b.usdValue, 0);
      console.log('Total USD Value:', totalValue);
      
      const connectedWallet: ConnectedWallet = {
        id: `solana-${Date.now()}`,
        address: address,
        type: 'solana',
        name: wallet.adapter.name,
        chain: 'Solana',
        balances: balances,
        totalUsdValue: totalValue,
        connectedAt: Date.now(),
      };

      addWallet(connectedWallet);
      setLastUpdated(Date.now());
      
      toast({
        title: "Wallet Connected",
        description: `${wallet.adapter.name} connected successfully`,
      });
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error connecting Solana wallet:', error);
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
    { name: "MetaMask", icon: "🦊" },
    { name: "WalletConnect", icon: "🔗" },
    { name: "Coinbase Wallet", icon: "🔵" },
  ];

  const solanaWallets = [
    { name: "Phantom", icon: "👻" },
    { name: "Solflare", icon: "☀️" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Connect Wallet</DialogTitle>
          <DialogDescription>
            Choose your wallet type to connect and track your portfolio
          </DialogDescription>
        </DialogHeader>

        {isLoadingBalances && (
          <div className="text-center py-4 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm text-muted-foreground">Fetching wallet balances...</p>
          </div>
        )}

        <Tabs defaultValue="evm" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="evm">EVM Wallets</TabsTrigger>
            <TabsTrigger value="solana">Solana Wallets</TabsTrigger>
          </TabsList>

          <TabsContent value="evm" className="space-y-3 mt-4">
            {evmWallets.map((wallet) => (
              <Button
                key={wallet.name}
                onClick={() => handleEVMConnect(wallet.name)}
                disabled={isConnecting || isLoadingBalances}
                className="w-full justify-start bg-secondary hover:bg-secondary/80"
              >
                <span className="text-2xl mr-3">{wallet.icon}</span>
                <span>{wallet.name}</span>
              </Button>
            ))}
          </TabsContent>

          <TabsContent value="solana" className="space-y-3 mt-4">
            {solanaWallets.map((wallet) => (
              <Button
                key={wallet.name}
                onClick={() => handleSolanaConnect(wallet.name)}
                disabled={isConnecting || isLoadingBalances}
                className="w-full justify-start bg-secondary hover:bg-secondary/80"
              >
                <span className="text-2xl mr-3">{wallet.icon}</span>
                <span>{wallet.name}</span>
              </Button>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
