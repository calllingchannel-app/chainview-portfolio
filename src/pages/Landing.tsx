import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap, Layers, Sparkles } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[60vh] bg-gradient-to-b from-primary/10 via-accent/5 to-transparent blur-3xl" />
        <div className="absolute top-1/4 right-0 w-[40%] h-[40vh] bg-gradient-to-l from-accent/8 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[30vh] bg-gradient-to-tr from-primary/5 to-transparent blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex h-16 lg:h-20 items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative h-8 w-8 lg:h-9 lg:w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow transition-transform duration-300 group-hover:scale-105">
                <span className="text-base lg:text-lg font-bold text-primary-foreground">H</span>
              </div>
              <span className="text-xl lg:text-2xl font-bold gradient-text tracking-tight">HAVX</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              {[
                { to: "/dashboard", label: "Dashboard" },
                { to: "/portfolio", label: "Portfolio" },
                { to: "/analytics", label: "Analytics" },
                { to: "/prices", label: "Live Prices" },
                { to: "/settings", label: "Settings" },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <Link to="/dashboard">
              <Button 
                size="sm" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow font-medium px-4 lg:px-6"
              >
                Connect Wallet
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 lg:pt-36 pb-16 lg:pb-24 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm animate-fade-in">
            <div className="flex -space-x-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-sm">⭐</span>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">Trusted by 10,000+ users</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-5 lg:mb-6 animate-slide-up leading-[1.1]">
            Take Control of
            <br />
            <span className="gradient-text">Your Digital Assets</span>
          </h1>
          
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-8 lg:mb-10 max-w-2xl mx-auto animate-fade-in leading-relaxed">
            HAVX offers institutional-grade portfolio management with real-time insights.
            Professional tools for serious crypto investors.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <Link to="/dashboard">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow group w-full sm:w-auto px-8"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
            <Link to="/prices">
              <Button 
                variant="outline" 
                size="lg"
                className="border-border/60 bg-card/30 backdrop-blur-sm hover:bg-card/50 hover:border-border w-full sm:w-auto px-8"
              >
                View Live Prices
              </Button>
            </Link>
          </div>

          {/* Dashboard Preview Card */}
          <div className="mt-14 lg:mt-20 glass-card p-6 lg:p-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
              <div className="text-left">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Balance</p>
                <p className="text-2xl lg:text-3xl font-bold gradient-text">$22,193.05</p>
                <p className="text-sm text-emerald-400 mt-1 font-medium">+47.3%</p>
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">24h Change</p>
                <p className="text-2xl lg:text-3xl font-bold text-emerald-400">+$1,284</p>
                <p className="text-sm text-muted-foreground mt-1">Last 24 hours</p>
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Assets</p>
                <p className="text-2xl lg:text-3xl font-bold text-foreground">12</p>
                <p className="text-sm text-muted-foreground mt-1">Across 5 chains</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="relative py-16 lg:py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Why Choose HAVX?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Benefits designed to provide a seamless, secure, and accessible experience for all users.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[
              { icon: Shield, title: "Maximum Security", desc: "Your assets are protected with cutting-edge security protocols." },
              { icon: Zap, title: "Real-Time Tracking", desc: "Monitor your portfolio with live price updates every 15 seconds." },
              { icon: Layers, title: "Multi-Chain Support", desc: "Track assets across Ethereum, Solana, Polygon, and 6+ more chains." },
              { icon: Sparkles, title: "Premium Interface", desc: "An elegant, intuitive design that's easy to use for everyone." },
            ].map((item, idx) => (
              <div 
                key={item.title} 
                className="stat-card p-5 lg:p-6 animate-fade-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
                </div>
                <h3 className="text-base lg:text-lg font-semibold mb-2 text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 lg:py-24 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="glass-card p-8 lg:p-12 text-center neon-glow">
            <h2 className="text-2xl lg:text-4xl font-bold mb-4">All Chains, One Platform</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Track, analyze, and manage all your crypto assets on a single platform.
              A seamless experience with no compromises.
            </p>
            <Link to="/dashboard">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow px-8"
              >
                Start Tracking Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 px-6 border-t border-border/30">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">H</span>
              </div>
              <span className="text-sm font-semibold gradient-text">HAVX</span>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2025 HAVX. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;