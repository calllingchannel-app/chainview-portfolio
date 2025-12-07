import { useState } from "react";
import { useWalletStore } from "@/stores/walletStore";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Globe, Settings2, Info } from "lucide-react";

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

  const settingsSections = [
    {
      icon: Globe,
      title: "Display Currency",
      content: (
        <div className="space-y-3">
          <Label htmlFor="currency" className="text-sm font-medium text-foreground">Preferred Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger id="currency" className="w-full sm:w-64 h-11 bg-card/50 border-border/50 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50">
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="INR">INR (₹)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      icon: Wallet,
      title: "Wallet Management",
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-card/50 border border-border/30">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Connected Wallets</p>
            <p className="text-2xl font-bold gradient-text">{connectedWallets.length}</p>
          </div>
          {connectedWallets.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleClearWallets}
              className="h-10"
            >
              Remove All Wallets
            </Button>
          )}
        </div>
      ),
    },
    {
      icon: Settings2,
      title: "RPC Configuration",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Custom RPC endpoints can be configured for better performance and reliability.
          </p>
          <Button variant="outline" disabled className="bg-card/50 border-border/50 h-10">
            Configure RPCs (Coming Soon)
          </Button>
        </div>
      ),
    },
    {
      icon: Info,
      title: "About",
      content: (
        <div className="space-y-3">
          <p className="font-semibold gradient-text">HAVX - Multi-chain Portfolio Tracker</p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Version 1.0.0</p>
            <p>Built with React, TypeScript, and Web3 technologies</p>
          </div>
          <div className="pt-3 border-t border-border/30">
            <p className="text-xs text-muted-foreground">© 2025 HAVX. All rights reserved.</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 gradient-bg">
        <div className="container mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 gradient-text tracking-tight">Settings</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your HAVX preferences</p>
          </div>

          {/* Settings Cards */}
          <div className="space-y-4 animate-slide-up">
            {settingsSections.map((section, idx) => (
              <Card 
                key={section.title} 
                className="stat-card"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground pt-2">{section.title}</h2>
                </div>
                {section.content}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;