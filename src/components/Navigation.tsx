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
    { to: "/portfolio", label: "Portfolio" },
    { to: "/analytics", label: "Analytics" },
    { to: "/prices", label: "Live Prices" },
    { to: "/settings", label: "Settings" },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <NavLink to="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <span className="text-xl font-bold text-white">C</span>
              </div>
              <span className="text-xl font-bold gradient-text">ChainView</span>
            </NavLink>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  activeClassName="text-foreground font-medium"
                >
                  {link.label}
                </NavLink>
              ))}
            </div>

            {/* Wallet Info & Connect Button */}
            <div className="hidden md:flex items-center gap-4">
              {connectedWallets.length > 0 && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Balance</p>
                  <p className="text-sm font-semibold gradient-text">
                    ${totalPortfolioUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              )}
              <Button
                onClick={() => setShowConnectDialog(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow"
              >
                <Wallet className="mr-2 h-4 w-4" />
                {connectedWallets.length > 0 ? 'Add Wallet' : 'Connect Wallet'}
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-border/50 space-y-3">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  activeClassName="text-foreground font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}
              <Button
                onClick={() => {
                  setShowConnectDialog(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 neon-glow mt-4"
              >
                <Wallet className="mr-2 h-4 w-4" />
                {connectedWallets.length > 0 ? 'Add Wallet' : 'Connect Wallet'}
              </Button>
            </div>
          )}
        </div>
      </nav>

      <ConnectWalletDialog open={showConnectDialog} onOpenChange={setShowConnectDialog} />
    </>
  );
}
