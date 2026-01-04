import { useState } from "react";
import { NavLink } from "./NavLink";
import { Button } from "./ui/button";
import { Wallet, Menu, X, ChevronDown } from "lucide-react";
import { ConnectWalletDialog } from "./wallet/ConnectWalletDialog";
import { useWalletStore } from "@/stores/walletStore";

export function Navigation() {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { connectedWallets, totalPortfolioUSD } = useWalletStore();

  const navLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/prices", label: "Live Prices" },
    { to: "/ai-insights", label: "AI Insights" },
    { to: "/settings", label: "Settings" },
  ];

  return (
    <>
      <nav className="glass-nav sticky top-0 z-50 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-glow transition-all duration-300 group-hover:shadow-glow-lg group-hover:scale-105">
                <span className="text-sm font-bold text-white tracking-tight">H</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground hidden sm:inline">HAVX</span>
            </NavLink>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center">
              <div className="flex items-center bg-muted/30 rounded-xl p-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg transition-all duration-200 hover:bg-muted/50"
                    activeClassName="text-foreground bg-background shadow-sm"
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Balance Display */}
              {connectedWallets.length > 0 && (
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/30 border border-border/40">
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Portfolio</p>
                    <p className="text-sm font-bold text-foreground">
                      ${totalPortfolioUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )}

              {/* Connect Button */}
              <Button
                onClick={() => setShowConnectDialog(true)}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10 px-5 rounded-xl shadow-glow hover:shadow-glow-lg transition-all duration-200"
              >
                <Wallet className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">
                  {connectedWallets.length > 0 ? 'Add Wallet' : 'Connect'}
                </span>
                <span className="sm:hidden">
                  {connectedWallets.length > 0 ? '+' : 'Connect'}
                </span>
              </Button>

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-border/30 animate-fade-in">
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl px-4 py-3 transition-all"
                    activeClassName="text-foreground bg-muted/50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      <ConnectWalletDialog open={showConnectDialog} onOpenChange={setShowConnectDialog} />
    </>
  );
}
