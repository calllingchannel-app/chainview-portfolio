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
      <div className="min-h-screen p-6 md:p-10 gradient-bg">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-12 animate-fade-in">
            <h1 className="text-6xl md:text-7xl font-bold mb-4 gradient-text tracking-tight">Settings</h1>
            <p className="text-muted-foreground/80 text-lg md:text-xl">Manage your HAVX preferences</p>
          </div>

          <div className="space-y-8 animate-slide-up">
            {/* Currency Settings */}
            <Card className="stat-card relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ring-2 ring-white/5">
                    <span className="text-2xl">💱</span>
                  </div>
                  Display Currency
                </h2>
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="currency" className="text-base font-semibold text-foreground">Preferred Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger id="currency" className="w-full md:w-72 mt-3 h-14 bg-card/50 backdrop-blur-2xl border-white/5 rounded-2xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card/95 backdrop-blur-2xl border-white/10">
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Wallet Management */}
            <Card className="stat-card relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center ring-2 ring-white/5">
                    <Wallet className="h-6 w-6 text-accent" />
                  </div>
                  Wallet Management
                </h2>
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-2xl border border-white/5">
                    <p className="text-base text-muted-foreground/80 mb-2">
                      Connected Wallets
                    </p>
                    <p className="text-4xl font-bold gradient-text">{connectedWallets.length}</p>
                  </div>
                  {connectedWallets.length > 0 && (
                    <Button
                      variant="destructive"
                      onClick={handleClearWallets}
                      className="shadow-lg h-12 px-6"
                    >
                      Remove All Wallets
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* RPC Settings */}
            <Card className="stat-card relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ring-2 ring-white/5">
                    <span className="text-2xl">⚙️</span>
                  </div>
                  RPC Configuration
                </h2>
                <p className="text-base text-muted-foreground/80 mb-8">
                  Custom RPC endpoints can be configured for better performance and reliability.
                </p>
                <Button variant="outline" disabled className="bg-card/50 backdrop-blur-2xl border-white/5 h-12 px-6">
                  Configure RPCs (Coming Soon)
                </Button>
              </div>
            </Card>

            {/* About */}
            <Card className="stat-card relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center ring-2 ring-white/5">
                    <span className="text-2xl">ℹ️</span>
                  </div>
                  About
                </h2>
                <div className="space-y-4 text-base text-muted-foreground/80">
                  <p className="font-bold text-lg gradient-text">HAVX - Multi-chain Portfolio Tracker</p>
                  <p>Version 1.0.0</p>
                  <p>Built with React, TypeScript, and Web3 technologies</p>
                  <p className="text-sm pt-4 border-t border-white/5 mt-6 text-muted-foreground/60">
                    © 2025 HAVX. All rights reserved.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
