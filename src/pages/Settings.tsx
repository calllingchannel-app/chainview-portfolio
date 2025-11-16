import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWalletStore } from "@/stores/walletStore";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const Settings = () => {
  const { connectedWallets, clearWallets } = useWalletStore();
  const { toast } = useToast();
  const [currency, setCurrency] = useState("USD");

  const handleClearWallets = () => {
    clearWallets();
    toast({
      title: "Wallets Cleared",
      description: "All connected wallets have been removed",
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your ChainView preferences</p>
        </div>

        <div className="space-y-6">
          {/* Currency Settings */}
          <Card className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4">Display Currency</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="currency">Preferred Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency" className="w-full md:w-64 mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Wallet Management */}
          <Card className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4">Wallet Management</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  You have {connectedWallets.length} wallet{connectedWallets.length !== 1 ? 's' : ''} connected
                </p>
                {connectedWallets.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={handleClearWallets}
                  >
                    Remove All Wallets
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* RPC Settings */}
          <Card className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4">RPC Configuration</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Custom RPC endpoints can be configured for better performance and reliability.
            </p>
            <Button variant="outline" disabled>
              Configure RPCs (Coming Soon)
            </Button>
          </Card>

          {/* About */}
          <Card className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4">About</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>ChainView - Multi-chain Portfolio Tracker</p>
              <p>Version 1.0.0</p>
              <p>Built with React, TypeScript, and Web3 technologies</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
