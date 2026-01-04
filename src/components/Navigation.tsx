import { useState } from "react";
import { NavLink } from "./NavLink";
import { Button } from "./ui/button";
import { Wallet, Menu, X, LayoutDashboard, TrendingUp, Brain, Settings } from "lucide-react";
import { ConnectWalletDialog } from "./wallet/ConnectWalletDialog";
import { useWalletStore } from "@/stores/walletStore";

export function Navigation() {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { connectedWallets, totalPortfolioUSD } = useWalletStore();

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/prices", label: "Markets", icon: TrendingUp },
    { to: "/ai-insights", label: "AI Insights", icon: Brain },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      <nav className="glass-nav sticky top-0 z-50 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 lg:h-18 items-center justify-between">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-3 group">
              <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-glow transition-all duration-300 group-hover:shadow-glow-lg group-hover:scale-105 overflow-hidden">
                <span className="text-base font-bold text-white tracking-tight relative z-10">H</span>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-lg font-bold tracking-tight text-foreground leading-none">HAVX</span>
                <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">Portfolio</span>
              </div>
            </NavLink>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center">
              <div className="flex items-center bg-muted/40 rounded-xl p-1.5 gap-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-lg transition-all duration-200 hover:bg-muted/60"
                    activeClassName="text-foreground bg-background shadow-sm border border-border/50"
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Balance Display */}
              {connectedWallets.length > 0 && (
                <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-xl bg-muted/40 border border-border/50">
                  <div className="relative">
                    <div className="h-2.5 w-2.5 rounded-full bg-success status-dot-success" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Portfolio</p>
                    <p className="text-sm font-bold text-foreground font-mono tabular-nums">
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
                    className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl px-4 py-3.5 transition-all"
                    activeClassName="text-foreground bg-muted/50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <link.icon className="h-4 w-4" />
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