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
import type { ConnectedWallet } from "@/stores/walletStore";

interface ConnectWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectWalletDialog({ open, onOpenChange }: ConnectWalletDialogProps) {
  const { toast } = useToast();
  const { addWallet, setLoading, setLastUpdated } = useWalletStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  const handleEVMConnect = async (walletName: string) => {
    if (!window.ethereum) {
      toast({
        title: "Wallet Not Found",
        description: `Please install ${walletName}`,
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    setIsLoadingBalances(true);
    setLoading(true);
    
    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      }) as string[];

      if (accounts.length > 0) {
        console.log('Connected to account:', accounts[0]);
        
        // Fetch real blockchain balances
        console.log('Fetching balances from all chains...');
        const balances = await getAllChainBalances(accounts[0], 'evm');
        console.log('Fetched balances:', balances);
        
        // Fetch prices for all tokens
        if (balances.length > 0) {
          const { fetchPricesByIds } = await import('@/lib/priceService');
          const { NATIVE_COINGECKO_IDS, EVM_TOKENS } = await import('@/lib/tokenLists');
          
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
        }
        
        const totalValue = balances.reduce((sum, b) => sum + b.usdValue, 0);
        console.log('Total USD Value:', totalValue);
        
        const wallet: ConnectedWallet = {
          id: `evm-${Date.now()}`,
          address: accounts[0],
          type: 'evm',
          name: walletName,
          chain: 'Multi-Chain',
          balances: balances,
          totalUsdValue: totalValue,
          connectedAt: Date.now(),
        };

        addWallet(wallet);
        setLastUpdated(Date.now());
        
        toast({
          title: "Wallet Connected",
          description: `${walletName} connected with ${balances.length} tokens found (${totalValue.toFixed(2)} USD)`,
        });
        
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
      setIsLoadingBalances(false);
      setLoading(false);
    }
  };

  const handleSolanaConnect = async (walletName: string) => {
    if (!window.solana) {
      toast({
        title: "Wallet Not Found",
        description: `Please install ${walletName}`,
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    setIsLoadingBalances(true);
    setLoading(true);
    
    try {
      const response = await window.solana.connect();
      const address = response.publicKey.toString();

      if (address) {
        console.log('Connected to Solana account:', address);
        
        // Fetch real Solana balances
        console.log('Fetching Solana balances for:', address);
        const balances = await getAllChainBalances(address, 'solana');
        console.log('Fetched Solana balances:', balances);
        
        if (balances.length === 0) {
          console.warn('No balances returned from Solana RPC - this may indicate an RPC error');
        }
        
        // ALWAYS fetch prices, even for empty balances
        const { fetchPricesByIds } = await import('@/lib/priceService');
        const { SOLANA_TOKENS } = await import('@/lib/tokenLists');

        const coingeckoIds = new Set<string>(['solana']); // Always include SOL
        balances.forEach((token) => {
          if (token.chain === 'solana' && token.contractAddress) {
            const info = SOLANA_TOKENS.find((t) => t.address === token.contractAddress);
            if (info?.coingeckoId) coingeckoIds.add(info.coingeckoId);
          }
        });

        console.log('Fetching prices for:', Array.from(coingeckoIds));
        const prices = await fetchPricesByIds(Array.from(coingeckoIds));
        console.log('Fetched prices:', prices);

        balances.forEach((token) => {
          if (token.symbol === 'SOL' && prices['solana']) {
            token.priceUsd = prices['solana'];
            token.usdValue = parseFloat(token.balance) * prices['solana'];
            console.log(`SOL balance: ${token.balance} SOL = $${token.usdValue.toFixed(2)}`);
          } else if (token.chain === 'solana' && token.contractAddress) {
            const info = SOLANA_TOKENS.find((t) => t.address === token.contractAddress);
            if (info?.coingeckoId && prices[info.coingeckoId]) {
              token.priceUsd = prices[info.coingeckoId];
              token.usdValue = parseFloat(token.balance) * prices[info.coingeckoId];
              console.log(`${token.symbol} balance: ${token.balance} = $${token.usdValue.toFixed(2)}`);
            }
          }
        });
        
        const totalValue = balances.reduce((sum, b) => sum + b.usdValue, 0);
        console.log('Total USD Value:', totalValue);
        
        const wallet: ConnectedWallet = {
          id: `solana-${Date.now()}`,
          address: address,
          type: 'solana',
          name: walletName,
          chain: 'Solana',
          balances: balances,
          totalUsdValue: totalValue,
          connectedAt: Date.now(),
        };

        addWallet(wallet);
        setLastUpdated(Date.now());
        
        toast({
          title: "Wallet Connected",
          description: `${walletName} connected with ${balances.length} tokens found (${totalValue.toFixed(2)} USD)`,
        });
        
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error connecting Solana wallet:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect Solana wallet. Please try again.",
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
    { name: "Backpack", icon: "🎒" },
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
          <div className="text-center py-4">
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
