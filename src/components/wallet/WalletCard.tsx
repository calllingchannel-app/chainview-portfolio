import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Copy } from "lucide-react";
import { useWalletStore, type ConnectedWallet } from "@/stores/walletStore";
import { useToast } from "@/hooks/use-toast";

interface WalletCardProps {
  wallet: ConnectedWallet;
}

export function WalletCard({ wallet }: WalletCardProps) {
  const { toast } = useToast();
  const removeWallet = useWalletStore((state) => state.removeWallet);

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

  return (
    <Card className="glass-card p-6 hover:neon-glow transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-xl">
              {wallet.type === 'evm' ? '🦊' : '👻'}
            </span>
          </div>
          <div>
            <h3 className="font-semibold">{wallet.name}</h3>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">{formatAddress(wallet.address)}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyAddress}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Chain</p>
          <p className="font-semibold">{wallet.chain}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Total Value</p>
          <p className="font-semibold gradient-text">
            ${wallet.totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {wallet.balances.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-sm text-muted-foreground mb-2">Assets ({wallet.balances.length})</p>
          <div className="space-y-2">
            {wallet.balances.slice(0, 3).map((token, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span>{token.symbol}</span>
                <span className="text-muted-foreground">
                  ${token.usdValue.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
