import { useState } from "react";
import { NavLink } from "./NavLink";
import { Button } from "./ui/button";
import { Wallet, Menu, X } from "lucide-react";
import { ConnectWalletDialog } from "./wallet/ConnectWalletDialog";
import { useWalletStore } from "@/stores/walletStore";

export function Navigation() {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { connectedWallets, totalPortfolioUSD } = useWalletStore();

  const navLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/prices", label: "Live Prices" },
    { to: "/predictor", label: "AI Predictor" },
    { to: "/agent", label: "AI Agent" },
    { to: "/settings", label: "Settings" },
  ];

  return (
    <>
      <nav className="glass-nav sticky top-0 z-50 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            {/* Logo */}
            <NavLink to="/dashboard" className="flex items-center gap-2 group">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow transition-transform duration-200 group-hover:scale-105">
                <span className="text-sm font-bold text-primary-foreground">H</span>
              </div>
              <span className="gradient-text text-xl font-bold tracking-tight hidden sm:inline">HAVX</span>
            </NavLink>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  activeClassName="text-foreground font-medium"
                >
                  {link.label}
                </NavLink>
              ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Balance Display */}
              {connectedWallets.length > 0 && (
                <div className="hidden sm:block text-right px-3 py-1.5 rounded-lg bg-card/50 border border-border/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Balance</p>
                  <p className="text-sm font-semibold gradient-text">
                    ${totalPortfolioUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              )}

              {/* Connect Button */}
              <Button
                onClick={() => setShowConnectDialog(true)}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow font-medium h-9 px-4"
              >
                <Wallet className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">
                  {connectedWallets.length > 0 ? 'Add Wallet' : 'Connect'}
                </span>
                <span className="sm:hidden">
                  {connectedWallets.length > 0 ? '+' : 'Connect'}
                </span>
              </Button>

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-3 border-t border-border/30 animate-fade-in">
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className="text-sm text-muted-foreground hover:text-foreground hover:bg-card/50 rounded-lg px-3 py-2.5 transition-colors"
                    activeClassName="text-foreground bg-card/50 font-medium"
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