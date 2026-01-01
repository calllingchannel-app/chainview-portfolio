import { useState } from "react";
import { Upload, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";
import { CryptoSelector } from "@/components/predictions/CryptoSelector";

const AIPredictor = () => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [chartImage, setChartImage] = useState<string | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState("bitcoin");
  const [isDragging, setIsDragging] = useState(false);

  const processFile = async (file: File) => {
    if (!file) return;

    setIsAnalyzing(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const imageData = event.target?.result as string;
      setChartImage(imageData);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-chart`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ image: imageData, symbol: selectedCrypto }),
          }
        );

        const data = await response.json();
        setPrediction(data);

        toast({
          title: "Analysis Complete",
          description: "AI has analyzed your chart with real-time data.",
        });
      } catch (error) {
        console.error("Error analyzing chart:", error);
        toast({
          title: "Analysis Failed",
          description: "Failed to analyze the chart. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsAnalyzing(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload an image file.",
        variant: "destructive",
      });
    }
  };

  const getSignalColor = (signal: string) => {
    if (signal?.includes("BUY")) return "text-emerald-400";
    if (signal?.includes("SELL")) return "text-red-400";
    return "text-yellow-400";
  };

  return (
    <Layout>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 gradient-bg">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8 lg:mb-10 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 gradient-text tracking-tight">AI Predictor</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Upload trading charts for instant AI analysis with real-time market data</p>
          </div>

          {/* Upload Card */}
          <Card className="stat-card p-6 sm:p-8 mb-6 animate-slide-up">
            <div className="space-y-6">
              {chartImage ? (
                <div className="rounded-xl overflow-hidden border border-border/30 bg-card/30">
                  <img src={chartImage} alt="Uploaded chart" className="w-full" />
                </div>
              ) : (
                <div 
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer ${
                    isDragging 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border/50 hover:border-primary/50 hover:bg-primary/5'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="chart-upload"
                  />
                  <label htmlFor="chart-upload" className="cursor-pointer">
                    <div className="h-14 w-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-foreground font-semibold mb-2">
                      {isDragging ? 'Drop your chart here' : 'Click or drag & drop chart image'}
                    </p>
                    <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB</p>
                  </label>
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                <CryptoSelector value={selectedCrypto} onChange={setSelectedCrypto} />
                
                {chartImage && (
                  <Button variant="outline" onClick={() => { setChartImage(null); setPrediction(null); }}>
                    Change Chart
                  </Button>
                )}
                
                <Button 
                  onClick={() => document.getElementById("chart-upload")?.click()}
                  disabled={isAnalyzing}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isAnalyzing ? "Analyzing..." : "Upload & Analyze"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Loading State */}
          {isAnalyzing && (
            <div className="text-center py-12 animate-fade-in">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mb-4"></div>
              <p className="text-muted-foreground">Analyzing chart with AI...</p>
            </div>
          )}

          {/* Prediction Results */}
          {prediction && (
            <div className="space-y-6 animate-fade-in">
              {/* Market Data */}
              <Card className="stat-card">
                <h2 className="text-lg font-semibold mb-4 text-foreground">Market Data</h2>
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-foreground">{prediction.symbol}</h3>
                  <p className="text-3xl font-bold gradient-text mt-1">
                    ${prediction.currentPrice?.toLocaleString()}
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs text-muted-foreground mb-1">24h High</p>
                    <p className="text-lg font-bold text-emerald-400">${prediction.high24h?.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-muted-foreground mb-1">24h Low</p>
                    <p className="text-lg font-bold text-red-400">${prediction.low24h?.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">Market Cap</p>
                    <p className="text-lg font-bold text-foreground">${prediction.marketCap}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">Volume 24h</p>
                    <p className="text-lg font-bold text-foreground">${prediction.volume24h}</p>
                  </div>
                </div>
              </Card>

              {/* Signal & Pattern */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="stat-card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-emerald-400" />
                    </div>
                    <h3 className={`text-xl font-bold ${getSignalColor(prediction.signal)}`}>
                      {prediction.signal?.replace(/_/g, " ")}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">Confidence Level</p>
                  <div className="relative w-full h-4 bg-muted/20 rounded-full overflow-hidden border border-border/30">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000"
                      style={{ width: `${prediction.confidence}%` }}
                    />
                  </div>
                  <p className="text-right text-2xl font-bold text-foreground mt-2">{prediction.confidence}%</p>
                </Card>

                <Card className="stat-card">
                  <p className="text-xs text-muted-foreground mb-2">Detected Pattern</p>
                  <p className="text-2xl font-bold text-foreground">{prediction.pattern}</p>
                </Card>
              </div>

              {/* Technical Indicators */}
              <Card className="stat-card">
                <h2 className="text-lg font-semibold mb-4 text-foreground">Technical Indicators</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-card/50 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">RSI (14)</p>
                    <p className="text-xl font-bold text-foreground">{prediction.rsi}</p>
                    <p className="text-xs text-muted-foreground mt-1">{prediction.rsiSignal}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-card/50 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">MACD</p>
                    <p className="text-xl font-bold text-foreground">{prediction.macd}</p>
                    <p className="text-xs text-muted-foreground mt-1">{prediction.macdSignal}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-card/50 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">SMA (50)</p>
                    <p className="text-xl font-bold text-foreground">${prediction.sma50?.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{prediction.sma50Signal}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-card/50 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">SMA (20)</p>
                    <p className="text-xl font-bold text-foreground">${prediction.sma20?.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{prediction.sma20Signal}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-card/50 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">Volume/Avg</p>
                    <p className="text-xl font-bold text-foreground">{prediction.volumeRatio}</p>
                    <p className="text-xs text-muted-foreground mt-1">{prediction.volumeSignal}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-card/50 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">Volatility</p>
                    <p className="text-xl font-bold text-foreground">{prediction.volatility}</p>
                    <p className="text-xs text-muted-foreground mt-1">{prediction.volatilitySignal}</p>
                  </div>
                </div>
              </Card>

              {/* Predictions, Support, Resistance */}
              <div className="grid sm:grid-cols-3 gap-4">
                <Card className="stat-card">
                  <h3 className="text-base font-semibold mb-4 text-foreground">Predictions</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-muted/10">
                      <span className="text-sm text-muted-foreground">24h</span>
                      <span className={`font-bold ${prediction.prediction24h?.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                        {prediction.prediction24h}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-muted/10">
                      <span className="text-sm text-muted-foreground">7d</span>
                      <span className={`font-bold ${prediction.prediction7d?.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                        {prediction.prediction7d}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-muted/10">
                      <span className="text-sm text-muted-foreground">30d</span>
                      <span className={`font-bold ${prediction.prediction30d?.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                        {prediction.prediction30d}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="stat-card">
                  <h3 className="text-base font-semibold mb-4 text-foreground">Support Levels</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <span className="text-sm text-muted-foreground">S1</span>
                      <span className="font-bold text-emerald-400">${prediction.support1?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <span className="text-sm text-muted-foreground">S2</span>
                      <span className="font-bold text-emerald-400">${prediction.support2?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <span className="text-sm text-muted-foreground">S3</span>
                      <span className="font-bold text-emerald-400">${prediction.support3?.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>

                <Card className="stat-card">
                  <h3 className="text-base font-semibold mb-4 text-foreground">Resistance Levels</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                      <span className="text-sm text-muted-foreground">R1</span>
                      <span className="font-bold text-red-400">${prediction.resistance1?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                      <span className="text-sm text-muted-foreground">R2</span>
                      <span className="font-bold text-red-400">${prediction.resistance2?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                      <span className="text-sm text-muted-foreground">R3</span>
                      <span className="font-bold text-red-400">${prediction.resistance3?.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Analysis */}
              <Card className="stat-card">
                <h3 className="text-base font-semibold mb-3 text-foreground">AI Analysis</h3>
                <p className="text-muted-foreground leading-relaxed">{prediction.analysis}</p>
              </Card>

              {/* Recommendations */}
              {prediction.recommendations && prediction.recommendations.length > 0 && (
                <Card className="stat-card">
                  <h3 className="text-base font-semibold mb-4 text-foreground">Recommendations</h3>
                  <div className="space-y-3">
                    {prediction.recommendations.map((rec: string, idx: number) => (
                      <div key={idx} className="flex gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
                          {idx + 1}
                        </span>
                        <p className="text-sm text-foreground">{rec}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AIPredictor;
