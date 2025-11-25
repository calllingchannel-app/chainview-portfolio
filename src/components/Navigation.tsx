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
      <nav className="glass-nav sticky top-0 z-50 w-full">
        <div className="container mx-auto px-6 md:px-10">
          <div className="flex h-24 items-center justify-between">
            <NavLink to="/dashboard" className="flex items-center gap-4 group">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-glow group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all duration-300 ring-2 ring-white/10">
                <span className="text-white font-bold text-2xl">H</span>
              </div>
              <span className="gradient-text text-3xl font-bold tracking-tight">HAVX</span>
            </NavLink>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className="text-base text-muted-foreground/80 hover:text-foreground transition-all duration-300 font-medium relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-primary after:to-accent hover:after:w-full after:transition-all after:duration-300"
                  activeClassName="text-foreground font-bold after:w-full"
                >
                  {link.label}
                </NavLink>
              ))}
            </div>

            {/* Wallet Info & Connect Button */}
            <div className="hidden md:flex items-center gap-5">
              {connectedWallets.length > 0 && (
                <div className="text-right px-5 py-2 rounded-2xl bg-card/50 backdrop-blur-2xl border border-white/5">
                  <p className="text-xs text-muted-foreground/60 uppercase tracking-wider font-bold mb-1">Total Balance</p>
                  <p className="text-base font-bold gradient-text">
                    ${totalPortfolioUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              )}
              <Button
                onClick={() => setShowConnectDialog(true)}
                className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] hover:bg-right transition-all duration-500 shadow-glow hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] font-bold px-8 h-12 text-base rounded-2xl"
              >
                <Wallet className="mr-2 h-5 w-5" />
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
            <div className="md:hidden pb-4 pt-4 border-t border-border/50 space-y-3">
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
                className="w-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] hover:bg-right transition-all duration-500 shadow-glow font-bold mt-4"
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
