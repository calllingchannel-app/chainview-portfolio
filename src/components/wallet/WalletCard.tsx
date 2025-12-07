import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Copy, ExternalLink, ChevronDown, ChevronUp, Coins } from "lucide-react";
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

  const activeBalances = wallet.balances.filter(token => parseFloat(token.balance) > 0);

  return (
    <Card className="glass-card p-5 sm:p-6 group">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <span className="text-lg">
              {wallet.type === 'evm' ? '🦊' : '👻'}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{wallet.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-xs text-muted-foreground font-mono">{formatAddress(wallet.address)}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyAddress}
                className="h-6 w-6 p-0 hover:bg-primary/10 text-muted-foreground hover:text-primary"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <a
                href={getExplorerUrl(wallet.address, wallet.type)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3 rounded-lg bg-card/50 border border-border/30">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Chain</p>
          <p className="font-medium text-sm text-foreground">{wallet.chain}</p>
        </div>
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Value</p>
          <p className="font-semibold text-base gradient-text">
            ${wallet.totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Assets */}
      {activeBalances.length > 0 ? (
        <div className="pt-4 border-t border-border/30">
          <Button
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-0 h-auto py-0 hover:bg-transparent"
          >
            <span className="text-sm font-medium text-muted-foreground">
              Assets ({activeBalances.length})
            </span>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-primary" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>

          <div className={`space-y-2 mt-3 ${expanded ? '' : 'max-h-28 overflow-hidden'}`}>
            {(expanded ? activeBalances : activeBalances.slice(0, 2)).map((token, idx) => (
              <div 
                key={idx} 
                className="flex justify-between items-center p-3 rounded-lg bg-card/40 border border-border/20"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-foreground">{token.symbol}</p>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-card/50 border-border/40">
                      {token.chain}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{token.name}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="font-medium text-sm text-foreground">{parseFloat(token.balance).toFixed(4)}</p>
                  {token.priceUsd > 0 && (
                    <p className="text-xs text-primary font-medium">${token.usdValue.toFixed(2)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="pt-4 border-t border-border/30 text-center py-6">
          <div className="h-10 w-10 rounded-xl bg-muted/30 flex items-center justify-center mx-auto mb-2">
            <Coins className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No assets found</p>
        </div>
      )}
    </Card>
  );
}