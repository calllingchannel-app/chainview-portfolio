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
import type { ConnectedWallet } from "@/stores/walletStore";

interface ConnectWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectWalletDialog({ open, onOpenChange }: ConnectWalletDialogProps) {
  const { toast } = useToast();
  const addWallet = useWalletStore((state) => state.addWallet);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectEVMWallet = async (walletType: string) => {
    setIsConnecting(true);
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        toast({
          title: "Wallet Not Found",
          description: "Please install MetaMask or another Web3 wallet",
          variant: "destructive",
        });
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts[0]) {
        const wallet: ConnectedWallet = {
          id: `evm-${Date.now()}`,
          address: accounts[0],
          type: "evm",
          name: walletType,
          chain: "Ethereum",
          balances: [],
          totalUsdValue: 0,
          connectedAt: Date.now(),
        };

        addWallet(wallet);
        toast({
          title: "Wallet Connected",
          description: `${walletType} connected successfully`,
        });
        onOpenChange(false);
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const connectSolanaWallet = async (walletType: string) => {
    setIsConnecting(true);
    try {
      const { solana } = window as any;
      
      if (!solana) {
        toast({
          title: "Wallet Not Found",
          description: "Please install Phantom or another Solana wallet",
          variant: "destructive",
        });
        return;
      }

      const response = await solana.connect();
      
      if (response.publicKey) {
        const wallet: ConnectedWallet = {
          id: `solana-${Date.now()}`,
          address: response.publicKey.toString(),
          type: "solana",
          name: walletType,
          chain: "Solana",
          balances: [],
          totalUsdValue: 0,
          connectedAt: Date.now(),
        };

        addWallet(wallet);
        toast({
          title: "Wallet Connected",
          description: `${walletType} connected successfully`,
        });
        onOpenChange(false);
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect Solana wallet",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Connect Wallet</DialogTitle>
          <DialogDescription>
            Choose your wallet type to connect and track your portfolio
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="evm" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="evm">EVM Wallets</TabsTrigger>
            <TabsTrigger value="solana">Solana Wallets</TabsTrigger>
          </TabsList>

          <TabsContent value="evm" className="space-y-3 mt-4">
            <Button
              onClick={() => connectEVMWallet("MetaMask")}
              disabled={isConnecting}
              className="w-full justify-start bg-secondary hover:bg-secondary/80"
              variant="outline"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  🦊
                </div>
                <span>MetaMask</span>
              </div>
            </Button>

            <Button
              onClick={() => connectEVMWallet("WalletConnect")}
              disabled={isConnecting}
              className="w-full justify-start bg-secondary hover:bg-secondary/80"
              variant="outline"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  🔗
                </div>
                <span>WalletConnect</span>
              </div>
            </Button>

            <Button
              onClick={() => connectEVMWallet("Coinbase Wallet")}
              disabled={isConnecting}
              className="w-full justify-start bg-secondary hover:bg-secondary/80"
              variant="outline"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                  💼
                </div>
                <span>Coinbase Wallet</span>
              </div>
            </Button>

            <Button
              onClick={() => connectEVMWallet("Brave Wallet")}
              disabled={isConnecting}
              className="w-full justify-start bg-secondary hover:bg-secondary/80"
              variant="outline"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-orange-600/20 flex items-center justify-center">
                  🦁
                </div>
                <span>Brave Wallet</span>
              </div>
            </Button>
          </TabsContent>

          <TabsContent value="solana" className="space-y-3 mt-4">
            <Button
              onClick={() => connectSolanaWallet("Phantom")}
              disabled={isConnecting}
              className="w-full justify-start bg-secondary hover:bg-secondary/80"
              variant="outline"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  👻
                </div>
                <span>Phantom</span>
              </div>
            </Button>

            <Button
              onClick={() => connectSolanaWallet("Solflare")}
              disabled={isConnecting}
              className="w-full justify-start bg-secondary hover:bg-secondary/80"
              variant="outline"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  🔥
                </div>
                <span>Solflare</span>
              </div>
            </Button>

            <Button
              onClick={() => connectSolanaWallet("Backpack")}
              disabled={isConnecting}
              className="w-full justify-start bg-secondary hover:bg-secondary/80"
              variant="outline"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                  🎒
                </div>
                <span>Backpack</span>
              </div>
            </Button>

            <Button
              onClick={() => connectSolanaWallet("Glow")}
              disabled={isConnecting}
              className="w-full justify-start bg-secondary hover:bg-secondary/80"
              variant="outline"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  ✨
                </div>
                <span>Glow</span>
              </div>
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
