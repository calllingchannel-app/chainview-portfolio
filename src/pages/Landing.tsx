import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap, TrendingDown, Sparkles } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 group">
              <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-premium transition-all duration-300 group-hover:scale-105">
                <span className="text-xl font-bold font-display text-white">H</span>
              </div>
              <span className="text-2xl font-bold font-display gradient-text tracking-tight">HAVX</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link to="/portfolio" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Portfolio
              </Link>
              <Link to="/analytics" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Analytics
              </Link>
              <Link to="/prices" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Live Prices
              </Link>
              <Link to="/settings" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Settings
              </Link>
            </div>

            <Link to="/dashboard">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow">
                Connect Wallet
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-block mb-4 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-sm text-primary animate-fade-in">
            They trust us ⭐ ⭐ ⭐ ⭐ ⭐ 4.9
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
            Take Control of
            <br />
            <span className="gradient-text">Your Digital Assets</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in">
            HAVX offers institutional-grade portfolio management with real-time insights.
            Professional tools for serious crypto investors and traders.
          </p>

          <Link to="/dashboard">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow group">
              Get started now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          {/* Dashboard Preview */}
          <div className="mt-16 glass-card rounded-2xl p-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-left">
                <div className="text-sm text-muted-foreground mb-2">Total Balance</div>
                <div className="text-3xl font-bold gradient-text">$22,193.05</div>
                <div className="text-sm text-emerald-400 mt-1">+47.3%</div>
              </div>
              <div className="text-left">
                <div className="text-sm text-muted-foreground mb-2">24h Change</div>
                <div className="text-3xl font-bold text-emerald-400">+$1,284</div>
                <div className="text-sm text-muted-foreground mt-1">Last 24 hours</div>
              </div>
              <div className="text-left">
                <div className="text-sm text-muted-foreground mb-2">Total Assets</div>
                <div className="text-3xl font-bold">12</div>
                <div className="text-sm text-muted-foreground mt-1">Across 5 chains</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-display mb-4">Why Choose HAVX?</h2>
            <p className="text-muted-foreground">
              Benefits designed to provide a seamless, secure, and accessible experience for all users.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card rounded-xl p-6 hover:neon-glow transition-all">
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Maximum Security</h3>
              <p className="text-sm text-muted-foreground">
                Your assets are protected with cutting-edge security protocols.
              </p>
            </div>

            <div className="glass-card rounded-xl p-6 hover:neon-glow transition-all">
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-Time Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Monitor your portfolio with live price updates every 15 seconds.
              </p>
            </div>

            <div className="glass-card rounded-xl p-6 hover:neon-glow transition-all">
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <TrendingDown className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Multi-Chain Support</h3>
              <p className="text-sm text-muted-foreground">
                Track assets across Ethereum, Solana, Polygon, and 6+ more chains.
              </p>
            </div>

            <div className="glass-card rounded-xl p-6 hover:neon-glow transition-all">
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Premium Interface</h3>
              <p className="text-sm text-muted-foreground">
                An elegant, intuitive design that's easy to use, even for beginners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="glass-card rounded-2xl p-12 text-center neon-glow">
            <h2 className="text-4xl font-bold mb-4">All Chains, One Platform</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Track, analyze, and manage all your crypto assets on a single platform.
              A seamless experience with no compromises.
            </p>
            <Link to="/dashboard">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Start Tracking Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
