import { useState } from "react";
import { useWalletStore } from "@/stores/walletStore";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Wallet } from "lucide-react";

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
    <Layout>
      <div className="min-h-screen p-4 md:p-8 gradient-bg">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-10 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 gradient-text">Settings</h1>
            <p className="text-muted-foreground/90 text-base md:text-lg">Manage your HAVX preferences</p>
          </div>

          <div className="space-y-6 animate-slide-up">
            {/* Currency Settings */}
            <Card className="stat-card">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <span className="text-xl">💱</span>
                </div>
                Display Currency
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currency" className="text-base font-semibold">Preferred Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency" className="w-full md:w-64 mt-3 h-12 bg-card/40 backdrop-blur-xl border-border/40 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card/95 backdrop-blur-xl border-border/40">
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
            <Card className="stat-card">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                Wallet Management
              </h2>
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-card/30 backdrop-blur-xl border border-border/40">
                  <p className="text-base text-muted-foreground/90 mb-1">
                    Connected Wallets
                  </p>
                  <p className="text-3xl font-bold">{connectedWallets.length}</p>
                </div>
                {connectedWallets.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={handleClearWallets}
                    className="shadow-lg"
                  >
                    Remove All Wallets
                  </Button>
                )}
              </div>
            </Card>

            {/* RPC Settings */}
            <Card className="stat-card">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <span className="text-xl">⚙️</span>
                </div>
                RPC Configuration
              </h2>
              <p className="text-base text-muted-foreground/90 mb-6">
                Custom RPC endpoints can be configured for better performance and reliability.
              </p>
              <Button variant="outline" disabled className="bg-card/40 backdrop-blur-xl border-border/40">
                Configure RPCs (Coming Soon)
              </Button>
            </Card>

            {/* About */}
            <Card className="stat-card">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <span className="text-xl">ℹ️</span>
                </div>
                About
              </h2>
              <div className="space-y-3 text-base text-muted-foreground/90">
                <p className="font-semibold text-foreground">HAVX - Multi-chain Portfolio Tracker</p>
                <p>Version 1.0.0</p>
                <p>Built with React, TypeScript, and Web3 technologies</p>
                <p className="text-sm pt-2 border-t border-border/40 mt-4">
                  © 2025 HAVX. All rights reserved.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
