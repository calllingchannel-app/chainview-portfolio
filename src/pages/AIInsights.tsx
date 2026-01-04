import { Layout } from "@/components/Layout";
import { ChartPredictorPanel } from "@/components/ai/ChartPredictorPanel";
import { ChatAgentPanel } from "@/components/ai/ChatAgentPanel";
import { BarChart3, MessageSquare, Sparkles } from "lucide-react";

const AIInsights = () => {
  return (
    <Layout>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 gradient-bg">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 lg:mb-10 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-primary" />
              </div>
              <p className="text-xs font-semibold text-primary uppercase tracking-widest">Artificial Intelligence</p>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold gradient-text tracking-tight">AI Insights</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">Chart analysis and AI-powered trading assistant</p>
          </div>

          {/* Two-Column Layout */}
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 animate-slide-up">
            {/* Left Column - Chart Predictor */}
            <div className="flex flex-col" style={{ height: "calc(100vh - 220px)", minHeight: "650px" }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-display font-semibold text-foreground">Chart Predictor</h2>
                  <p className="text-xs text-muted-foreground">Upload charts for AI analysis</p>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChartPredictorPanel />
              </div>
            </div>

            {/* Right Column - AI Chat Agent */}
            <div className="flex flex-col" style={{ height: "calc(100vh - 220px)", minHeight: "650px" }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-display font-semibold text-foreground">AI Agent</h2>
                  <p className="text-xs text-muted-foreground">Ask about any crypto or market</p>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatAgentPanel />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AIInsights;