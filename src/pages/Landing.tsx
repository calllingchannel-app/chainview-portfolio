import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap, Layers, Sparkles, ChevronRight, BarChart3 } from "lucide-react";
import { Navigation } from "@/components/Navigation";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[70vh] bg-gradient-to-b from-primary/12 via-accent/6 to-transparent blur-3xl" />
        <div className="absolute top-1/4 right-0 w-[50%] h-[50vh] bg-gradient-to-l from-accent/10 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[60%] h-[40vh] bg-gradient-to-tr from-primary/6 to-transparent blur-3xl" />
      </div>

      {/* Global Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-16 lg:pt-28 pb-20 lg:pb-32 px-6">
        <div className="container mx-auto text-center max-w-5xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-3 mb-8 px-5 py-2.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm animate-fade-in">
            <div className="flex -space-x-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-400 text-sm">★</span>
              ))}
            </div>
            <span className="text-sm text-muted-foreground font-medium">Trusted by 10,000+ investors</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-display font-bold mb-6 lg:mb-8 animate-slide-up leading-[1.05] tracking-tight">
            Take Control of
            <br />
            <span className="gradient-text">Your Digital Assets</span>
          </h1>
          
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-10 lg:mb-12 max-w-2xl mx-auto animate-fade-in leading-relaxed">
            HAVX offers institutional-grade portfolio management with real-time insights.
            Professional tools for serious crypto investors.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <Link to="/dashboard">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow hover:shadow-glow-lg group w-full sm:w-auto px-8 h-12 text-base font-semibold"
              >
                Launch App
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/prices">
              <Button 
                variant="outline" 
                size="lg"
                className="border-border/60 bg-card/40 backdrop-blur-sm hover:bg-card/60 hover:border-border w-full sm:w-auto px-8 h-12 text-base"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                View Markets
              </Button>
            </Link>
          </div>

          {/* Dashboard Preview Card */}
          <div className="mt-16 lg:mt-24 glass-card p-8 lg:p-10 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12">
              <div className="text-left">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 font-medium">Total Balance</p>
                <p className="text-3xl lg:text-4xl font-display font-bold gradient-text font-mono tabular-nums">$22,193.05</p>
                <p className="text-base text-success mt-2 font-semibold flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  +47.3%
                </p>
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 font-medium">24h Change</p>
                <p className="text-3xl lg:text-4xl font-display font-bold text-success font-mono tabular-nums">+$1,284</p>
                <p className="text-sm text-muted-foreground mt-2">Last 24 hours</p>
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 font-medium">Total Assets</p>
                <p className="text-3xl lg:text-4xl font-display font-bold text-foreground font-mono">12</p>
                <p className="text-sm text-muted-foreground mt-2">Across 5 chains</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 lg:py-32 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 lg:mb-20">
            <h2 className="text-3xl lg:text-5xl font-display font-bold mb-5">Why Choose HAVX?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              Benefits designed to provide a seamless, secure, and accessible experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            {[
              { icon: Shield, title: "Maximum Security", desc: "Your assets are protected with cutting-edge security protocols.", color: "primary" },
              { icon: Zap, title: "Real-Time Tracking", desc: "Monitor your portfolio with live price updates every 12 seconds.", color: "accent" },
              { icon: Layers, title: "Multi-Chain Support", desc: "Track assets across Ethereum, Solana, Polygon, and 6+ more chains.", color: "success" },
              { icon: Sparkles, title: "AI-Powered Insights", desc: "Get intelligent market analysis and predictions from our AI.", color: "primary" },
            ].map((item, idx) => (
              <div 
                key={item.title} 
                className="stat-card p-6 lg:p-7 animate-fade-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className={`h-12 w-12 lg:h-14 lg:w-14 rounded-2xl bg-${item.color}/10 border border-${item.color}/20 flex items-center justify-center mb-5`}>
                  <item.icon className={`h-6 w-6 lg:h-7 lg:w-7 text-${item.color}`} />
                </div>
                <h3 className="text-lg lg:text-xl font-display font-semibold mb-2 text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 lg:py-32 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="glass-card p-10 lg:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
            <div className="relative">
              <h2 className="text-3xl lg:text-5xl font-display font-bold mb-5">All Chains, One Platform</h2>
              <p className="text-muted-foreground mb-10 max-w-xl mx-auto text-lg">
                Track, analyze, and manage all your crypto assets on a single platform.
                A seamless experience with no compromises.
              </p>
              <Link to="/dashboard">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow hover:shadow-glow-lg px-10 h-12 text-base font-semibold"
                >
                  Start Tracking Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-10 px-6 border-t border-border/30">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
                <span className="text-sm font-bold text-primary-foreground">H</span>
              </div>
              <span className="text-base font-display font-bold gradient-text">HAVX</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 HAVX. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Import needed for the feature cards
import { TrendingUp } from "lucide-react";

export default Landing;