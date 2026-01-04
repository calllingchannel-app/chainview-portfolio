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
      title: "Address copied",
      description: "Wallet address copied to clipboard",
    });
  };

  const handleRemove = () => {
    removeWallet(wallet.id);
    toast({
      title: "Wallet removed",
      description: "Wallet has been disconnected from your portfolio",
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
  const walletEmoji = wallet.type === 'evm' ? '🦊' : '👻';

  return (
    <Card className="glass-card p-5 sm:p-6 group transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <span className="text-lg">{walletEmoji}</span>
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{wallet.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs text-muted-foreground font-mono bg-muted/30 px-2 py-0.5 rounded">
                {formatAddress(wallet.address)}
              </code>
              <button
                onClick={handleCopyAddress}
                className="text-muted-foreground hover:text-primary transition-colors p-1 -m-1"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <a
                href={getExplorerUrl(wallet.address, wallet.type)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors p-1 -m-1"
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
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 w-9 p-0 shrink-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Value Display */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3.5 rounded-xl bg-muted/20 border border-border/30">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Network</p>
          <p className="font-semibold text-sm text-foreground capitalize">{wallet.chain}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Value</p>
          <p className="font-bold text-lg gradient-text">
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
            className="w-full flex items-center justify-between px-0 h-auto py-0 hover:bg-transparent group/expand"
          >
            <span className="text-sm font-medium text-muted-foreground group-hover/expand:text-foreground transition-colors">
              {activeBalances.length} Asset{activeBalances.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-1 text-muted-foreground group-hover/expand:text-primary transition-colors">
              <span className="text-xs">{expanded ? 'Hide' : 'Show'}</span>
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </Button>

          <div className={`space-y-2 mt-4 transition-all duration-300 ${expanded ? '' : 'max-h-24 overflow-hidden'}`}>
            {(expanded ? activeBalances : activeBalances.slice(0, 2)).map((token, idx) => (
              <div 
                key={idx} 
                className="flex justify-between items-center p-3 rounded-xl bg-card/40 border border-border/20 hover:border-border/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{token.symbol}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-muted/30 border-border/40 text-muted-foreground uppercase">
                      {token.chain}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{token.name}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="font-semibold text-sm text-foreground">{parseFloat(token.balance).toFixed(4)}</p>
                  {token.priceUsd > 0 && (
                    <p className="text-xs text-primary font-medium">${token.usdValue.toFixed(2)}</p>
                  )}
                </div>
              </div>
            ))}
            
            {!expanded && activeBalances.length > 2 && (
              <p className="text-xs text-center text-muted-foreground pt-1">
                +{activeBalances.length - 2} more assets
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="pt-4 border-t border-border/30 text-center py-6">
          <div className="h-10 w-10 rounded-xl bg-muted/20 flex items-center justify-center mx-auto mb-2">
            <Coins className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No assets found</p>
        </div>
      )}
    </Card>
  );
}
