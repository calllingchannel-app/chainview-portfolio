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
          description: `${walletName} connected with ${balances.length} tokens found`,
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
        console.log('Fetching Solana balances...');
        const balances = await getAllChainBalances(address, 'solana');
        console.log('Fetched Solana balances:', balances);
        
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
          description: `${walletName} connected with ${balances.length} tokens found`,
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
