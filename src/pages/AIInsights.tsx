import { Layout } from "@/components/Layout";
import { ChartPredictorPanel } from "@/components/ai/ChartPredictorPanel";
import { ChatAgentPanel } from "@/components/ai/ChatAgentPanel";
import { BarChart3, MessageSquare } from "lucide-react";

const AIInsights = () => {
  return (
    <Layout>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 gradient-bg">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 lg:mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 gradient-text tracking-tight">AI Insights</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Chart analysis and AI-powered trading assistant in one place</p>
          </div>

          {/* Two-Column Layout */}
          <div className="grid lg:grid-cols-2 gap-4 lg:gap-6 animate-slide-up">
            {/* Left Column - Chart Predictor */}
            <div className="flex flex-col" style={{ height: "calc(100vh - 200px)", minHeight: "600px" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Chart Predictor</h2>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChartPredictorPanel />
              </div>
            </div>

            {/* Right Column - AI Chat Agent */}
            <div className="flex flex-col" style={{ height: "calc(100vh - 200px)", minHeight: "600px" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-accent" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">AI Agent</h2>
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
