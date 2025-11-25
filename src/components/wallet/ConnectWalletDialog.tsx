import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useWalletStore } from "@/stores/walletStore";
import { Loader2, Check } from "lucide-react";
import { useConnect, useAccount } from "wagmi";
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

const WALLETCONNECT_ENABLED = Boolean(import.meta.env.VITE_WC_PROJECT_ID);

interface ConnectWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectWalletDialog({ open, onOpenChange }: ConnectWalletDialogProps) {
  const { toast } = useToast();
  const { connectedWallets, addWallet } = useWalletStore();
  const [loadingWallet, setLoadingWallet] = useState<string | null>(null);
  
  const { connectors, connectAsync } = useConnect();
  const { address: evmAddress } = useAccount();
  const { wallets, select, connect: connectSolana, publicKey } = useWallet();

  const isWalletConnected = (address: string) => {
    return connectedWallets.some(w => w.address.toLowerCase() === address.toLowerCase());
  };

  const handleEVMConnect = async (walletName: string, connectorType: 'injected' | 'walletconnect' | 'coinbase') => {
    if (loadingWallet) return;
    setLoadingWallet(walletName);
    
    try {
      let connector;
      if (connectorType === 'walletconnect') {
        if (!WALLETCONNECT_ENABLED) {
          throw new Error("WalletConnect is not configured. Please set VITE_WC_PROJECT_ID in your environment to use WalletConnect-based wallets.");
        }
        connector = connectors.find(c => c.id === 'walletConnect');
      } else if (connectorType === 'coinbase') {
        connector = connectors.find(c => c.id === 'coinbaseWallet');
      } else {
        connector = connectors.find(c => c.id === 'injected');
      }

      if (!connector) throw new Error(`${walletName} is not available in this browser`);

      const result = await connectAsync({ connector });
      const address = result.accounts[0];
      if (!address || isWalletConnected(address)) {
        setLoadingWallet(null);
        return;
      }

      const balances = await getAllChainBalances(address, 'evm');
      const coingeckoIds = new Set(balances.map(t => NATIVE_COINGECKO_IDS[t.symbol.toUpperCase()] || t.symbol.toLowerCase()));
      const prices = await fetchPricesByIds(Array.from(coingeckoIds));
      
      const balancesWithPrices = balances.map(b => ({
        ...b,
        priceUsd: prices[NATIVE_COINGECKO_IDS[b.symbol.toUpperCase()] || b.symbol.toLowerCase()] || 0,
        usdValue: parseFloat(b.balance) * (prices[NATIVE_COINGECKO_IDS[b.symbol.toUpperCase()] || b.symbol.toLowerCase()] || 0)
      }));

      addWallet({
        id: `${walletName}-${Date.now()}`,
        address,
        name: walletName,
        chain: 'ethereum',
        type: 'evm',
        connectedAt: Date.now(),
        balances: balancesWithPrices,
        totalUsdValue: balancesWithPrices.reduce((sum, b) => sum + b.usdValue, 0),
      });

      toast({ title: "Success", description: `Connected ${walletName}` });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Connection failed", variant: "destructive" });
    } finally {
      setLoadingWallet(null);
    }
  };

  const handleSolanaConnect = async (walletName: string, walletEntry: any) => {
    if (loadingWallet) return;
    setLoadingWallet(walletName);

    try {
      if (!walletEntry) {
        throw new Error(`${walletName} wallet not available in this browser`);
      }

      const adapter: any = walletEntry.adapter as any;

      // Select and connect the chosen Solana wallet
      select(adapter.name as any);
      await connectSolana();

      const pubkey = adapter.publicKey;
      if (!pubkey) {
        throw new Error("Failed to get Solana wallet address");
      }

      const address = pubkey.toBase58();
      if (isWalletConnected(address)) {
        toast({ title: "Already connected", description: `${walletName} is already connected` });
        setLoadingWallet(null);
        return;
      }

      const balances = await getAllChainBalances(address, "solana");

      addWallet({
        id: `${walletName}-${Date.now()}`,
        address,
        name: walletName,
        type: "solana",
        chain: "solana",
        balances,
        totalUsdValue: balances.reduce((sum, b) => sum + b.usdValue, 0),
        connectedAt: Date.now(),
      });

      toast({ title: "Success", description: `Connected ${walletName}` });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Connection failed", variant: "destructive" });
    } finally {
      setLoadingWallet(null);
    }
  };

  const evmWallets = [
    { name: "MetaMask", logo: metamaskLogo, description: "Browser & extension wallet", connector: "injected" as const, color: "from-orange-500/20 to-orange-600/20" },
    { name: "Coinbase Wallet", logo: coinbaseLogo, description: "Secure non-custodial wallet", connector: "coinbase" as const, color: "from-blue-500/20 to-blue-600/20" },
    { name: "WalletConnect", logo: walletConnectLogo, description: "Connect any mobile wallet", connector: "walletconnect" as const, color: "from-blue-400/20 to-blue-500/20" },
    { name: "Trust Wallet", logo: trustLogo, description: "Browser & mobile wallet", connector: "injected" as const, color: "from-blue-500/20 to-cyan-500/20" },
    { name: "Rainbow", logo: rainbowLogo, description: "Browser & mobile wallet", connector: "injected" as const, color: "from-purple-500/20 to-pink-500/20" },
    { name: "Safe", logo: safeLogo, description: "Multi-sig smart account", connector: "walletconnect" as const, color: "from-green-500/20 to-emerald-500/20" },
    { name: "Ledger", logo: ledgerLogo, description: "Ledger via WalletConnect", connector: "walletconnect" as const, color: "from-gray-600/20 to-gray-700/20" },
    { name: "Trezor", logo: trezorLogo, description: "Trezor via WalletConnect", connector: "walletconnect" as const, color: "from-green-600/20 to-teal-600/20" },
    { name: "OKX Wallet", logo: okxLogo, description: "Browser & mobile wallet", connector: "injected" as const, color: "from-gray-700/20 to-gray-800/20" },
  ];

  const solanaWallets = [
    { name: "Phantom", logo: phantomLogo, description: "Popular", color: "from-purple-500/20 to-indigo-500/20" },
    { name: "Solflare", logo: solflareLogo, description: "Feature-rich", color: "from-orange-500/20 to-red-500/20" },
    { name: "Backpack", logo: backpackLogo, description: "Modern", color: "from-red-500/20 to-pink-500/20" },
    { name: "Glow", logo: glowLogo, description: "Simple", color: "from-green-400/20 to-cyan-400/20" },
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

        <Tabs defaultValue="evm" className="px-8 pb-8">
          <TabsList className="grid w-full grid-cols-2 bg-card/50 backdrop-blur-xl border border-white/5 p-1 h-12 mb-6">
            <TabsTrigger value="evm" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white transition-all rounded-lg font-semibold">EVM Chains</TabsTrigger>
            <TabsTrigger value="solana" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white transition-all rounded-lg font-semibold">Solana</TabsTrigger>
          </TabsList>

          <TabsContent value="evm" className="mt-0">
            <div className="wallet-dialog-grid">
              {evmWallets.map((wallet) => (
                <button key={wallet.name} onClick={() => handleEVMConnect(wallet.name, wallet.connector)} disabled={loadingWallet !== null} className="wallet-button group">
                  <div className={`absolute inset-0 bg-gradient-to-br ${wallet.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
                  <div className="relative flex flex-col items-center gap-3">
                    <div className="h-16 w-16 rounded-xl bg-card/80 backdrop-blur-sm flex items-center justify-center p-3 group-hover:scale-110 transition-transform duration-300">
                      <img src={wallet.logo} alt={wallet.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{wallet.name}</p>
                      <p className="text-xs text-muted-foreground/80 mt-0.5">{wallet.description}</p>
                    </div>
                    {loadingWallet === wallet.name && <Loader2 className="h-5 w-5 animate-spin text-primary mt-1" />}
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="solana" className="mt-0">
            <div className="wallet-dialog-grid">
              {solanaWallets.map((wallet) => {
                const walletEntry = wallets.find((w) =>
                  w.adapter.name.toLowerCase().includes(wallet.name.toLowerCase())
                );
                const isLoading = loadingWallet === wallet.name;
                const isDisabled = !walletEntry || (!!loadingWallet && !isLoading);

                return (
                  <button
                    key={wallet.name}
                    onClick={() => walletEntry && handleSolanaConnect(wallet.name, walletEntry)}
                    disabled={isDisabled}
                    className={`wallet-button group ${!walletEntry ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="relative flex flex-col items-center gap-3">
                      <div className="h-16 w-16 rounded-xl bg-card/80 backdrop-blur-sm flex items-center justify-center p-3 group-hover:scale-110 transition-transform duration-300">
                        <img src={wallet.logo} alt={wallet.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{wallet.name}</p>
                        <p className="text-xs text-muted-foreground/80 mt-0.5">{wallet.description}</p>
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
