import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Copy, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useWalletStore, type ConnectedWallet } from "@/stores/walletStore";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface WalletCardProps {
  wallet: ConnectedWallet;
}

export function WalletCard({ wallet }: WalletCardProps) {
  const { toast } = useToast();
  const removeWallet = useWalletStore((state) => state.removeWallet);
  const [expanded, setExpanded] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    });
  };

  const handleRemove = () => {
    removeWallet(wallet.id);
    toast({
      title: "Wallet Removed",
      description: "Wallet has been disconnected",
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getExplorerUrl = (address: string, type: 'evm' | 'solana') => {
    if (type === 'solana') {
      return `https://solscan.io/account/${address}`;
    }
    return `https://etherscan.io/address/${address}`;
  };

  // Filter out zero balances
  const activeBalances = wallet.balances.filter(token => parseFloat(token.balance) > 0);

  return (
    <Card className="glass-card p-6 hover:shadow-premium transition-all duration-300 group border border-border/30">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
            <span className="text-2xl">
              {wallet.type === 'evm' ? '🦊' : '👻'}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">{wallet.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground font-mono">{formatAddress(wallet.address)}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyAddress}
                className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <a
                href={getExplorerUrl(wallet.address, wallet.type)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-secondary/30 border border-border/20">
          <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">Chain</p>
          <p className="font-bold text-foreground">{wallet.chain}</p>
        </div>
        <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20">
          <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">Total Value</p>
          <p className="font-bold text-xl gradient-text">
            ${wallet.totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {activeBalances.length > 0 ? (
        <div className="pt-4 border-t border-border/30">
          <Button
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between p-3 h-auto hover:bg-secondary/40 rounded-lg transition-colors"
          >
            <span className="text-sm font-semibold text-foreground">
              Assets ({activeBalances.length})
            </span>
            {expanded ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </Button>

          <div className={`space-y-2 mt-3 ${expanded ? '' : 'max-h-32 overflow-hidden'}`}>
            {(expanded ? activeBalances : activeBalances.slice(0, 3)).map((token, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-secondary/40 to-secondary/20 border border-border/20 hover:border-primary/30 transition-all">
                <div className="flex-1">
                  <p className="font-bold text-foreground">{token.symbol}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{token.name}</p>
                  <p className="text-xs text-primary/80 capitalize mt-0.5">{token.chain}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">{parseFloat(token.balance).toFixed(6)}</p>
                  {token.priceUsd > 0 && (
                    <>
                      <p className="text-sm font-semibold text-primary mt-0.5">
                        ${token.usdValue.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        @ ${token.priceUsd.toFixed(2)}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="pt-4 border-t border-border/30 text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted/50 mb-3">
            <span className="text-2xl opacity-50">💰</span>
          </div>
          <p className="text-sm font-medium text-muted-foreground">No assets found</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Connect a wallet with funds on supported chains
          </p>
        </div>
      )}
    </Card>
  );
}
