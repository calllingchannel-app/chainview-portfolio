import { useState } from "react";
import { Upload, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CryptoSelector } from "@/components/predictions/CryptoSelector";

export const ChartPredictorPanel = () => {
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
        
        if (!response.ok) {
          console.error("API error:", response.status, data);
          toast({
            title: "Analysis Error",
            description: data.analysis || "Failed to analyze the chart. Please try again.",
            variant: "destructive",
          });
          setPrediction(null);
          return;
        }

        if (data.error && data.symbol === 'ERROR') {
          toast({
            title: "Analysis Failed",
            description: data.analysis || "Could not analyze the chart.",
            variant: "destructive",
          });
          setPrediction(null);
          return;
        }

        setPrediction(data);

        toast({
          title: "Analysis Complete",
          description: "AI has analyzed your chart with real-time data.",
        });
      } catch (error) {
        console.error("Error analyzing chart:", error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to the analysis service. Please try again.",
          variant: "destructive",
        });
        setPrediction(null);
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
    <div className="flex flex-col h-full">
      {/* Upload Card */}
      <Card className="stat-card p-4 sm:p-6 mb-4">
        <div className="space-y-4">
          {chartImage ? (
            <div className="rounded-xl overflow-hidden border border-border/30 bg-card/30">
              <img src={chartImage} alt="Uploaded chart" className="w-full max-h-48 object-contain" />
            </div>
          ) : (
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
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
                id="chart-upload-panel"
              />
              <label htmlFor="chart-upload-panel" className="cursor-pointer">
                <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <p className="text-foreground font-semibold mb-1 text-sm">
                  {isDragging ? 'Drop your chart here' : 'Click or drag & drop chart'}
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
              </label>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <CryptoSelector value={selectedCrypto} onChange={setSelectedCrypto} />
            
            {chartImage && (
              <Button variant="outline" size="sm" onClick={() => { setChartImage(null); setPrediction(null); }}>
                Change
              </Button>
            )}
            
            <Button 
              onClick={() => document.getElementById("chart-upload-panel")?.click()}
              disabled={isAnalyzing}
              size="sm"
              className="bg-primary hover:bg-primary/90"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isAnalyzing && (
        <div className="text-center py-8 animate-fade-in">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-3"></div>
          <p className="text-sm text-muted-foreground">Analyzing chart...</p>
        </div>
      )}

      {/* Prediction Results - Scrollable */}
      {prediction && (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
          {/* Market Data */}
          <Card className="stat-card p-4">
            <h2 className="text-sm font-semibold mb-3 text-foreground">Market Data</h2>
            <div className="mb-3">
              <h3 className="text-lg font-bold text-foreground">{prediction.symbol}</h3>
              <p className="text-2xl font-bold gradient-text">
                ${prediction.currentPrice?.toLocaleString()}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-[10px] text-muted-foreground mb-0.5">24h High</p>
                <p className="text-sm font-bold text-emerald-400">${prediction.high24h?.toLocaleString()}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-[10px] text-muted-foreground mb-0.5">24h Low</p>
                <p className="text-sm font-bold text-red-400">${prediction.low24h?.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          {/* Signal & Pattern */}
          <div className="grid grid-cols-2 gap-2">
            <Card className="stat-card p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <h3 className={`text-sm font-bold ${getSignalColor(prediction.signal)}`}>
                  {prediction.signal?.replace(/_/g, " ")}
                </h3>
              </div>
              <p className="text-[10px] text-muted-foreground mb-1">Confidence</p>
              <div className="relative w-full h-2 bg-muted/20 rounded-full overflow-hidden border border-border/30">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000"
                  style={{ width: `${prediction.confidence}%` }}
                />
              </div>
              <p className="text-right text-lg font-bold text-foreground mt-1">{prediction.confidence}%</p>
            </Card>

            <Card className="stat-card p-3">
              <p className="text-[10px] text-muted-foreground mb-1">Detected Pattern</p>
              <p className="text-sm font-bold text-foreground">{prediction.pattern}</p>
            </Card>
          </div>

          {/* Technical Indicators */}
          <Card className="stat-card p-4">
            <h2 className="text-sm font-semibold mb-3 text-foreground">Technical Indicators</h2>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-card/50 border border-border/30">
                <p className="text-[10px] text-muted-foreground mb-0.5">RSI (14)</p>
                <p className="text-sm font-bold text-foreground">{prediction.rsi}</p>
              </div>
              <div className="p-2 rounded-lg bg-card/50 border border-border/30">
                <p className="text-[10px] text-muted-foreground mb-0.5">MACD</p>
                <p className="text-sm font-bold text-foreground">{prediction.macd}</p>
              </div>
              <div className="p-2 rounded-lg bg-card/50 border border-border/30">
                <p className="text-[10px] text-muted-foreground mb-0.5">SMA (50)</p>
                <p className="text-sm font-bold text-foreground">${prediction.sma50?.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          {/* Predictions */}
          <Card className="stat-card p-4">
            <h3 className="text-sm font-semibold mb-3 text-foreground">Predictions</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 rounded-lg bg-muted/10">
                <span className="text-xs text-muted-foreground">24h</span>
                <span className={`text-sm font-bold ${prediction.prediction24h?.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {prediction.prediction24h}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-muted/10">
                <span className="text-xs text-muted-foreground">7d</span>
                <span className={`text-sm font-bold ${prediction.prediction7d?.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {prediction.prediction7d}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-muted/10">
                <span className="text-xs text-muted-foreground">30d</span>
                <span className={`text-sm font-bold ${prediction.prediction30d?.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {prediction.prediction30d}
                </span>
              </div>
            </div>
          </Card>

          {/* Support/Resistance */}
          <div className="grid grid-cols-2 gap-2">
            <Card className="stat-card p-3">
              <h3 className="text-xs font-semibold mb-2 text-foreground">Support</h3>
              <div className="space-y-1">
                <div className="flex justify-between items-center p-1.5 rounded bg-emerald-500/5 border border-emerald-500/20">
                  <span className="text-[10px] text-muted-foreground">S1</span>
                  <span className="text-xs font-bold text-emerald-400">${prediction.support1?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-1.5 rounded bg-emerald-500/5 border border-emerald-500/20">
                  <span className="text-[10px] text-muted-foreground">S2</span>
                  <span className="text-xs font-bold text-emerald-400">${prediction.support2?.toLocaleString()}</span>
                </div>
              </div>
            </Card>

            <Card className="stat-card p-3">
              <h3 className="text-xs font-semibold mb-2 text-foreground">Resistance</h3>
              <div className="space-y-1">
                <div className="flex justify-between items-center p-1.5 rounded bg-red-500/5 border border-red-500/20">
                  <span className="text-[10px] text-muted-foreground">R1</span>
                  <span className="text-xs font-bold text-red-400">${prediction.resistance1?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-1.5 rounded bg-red-500/5 border border-red-500/20">
                  <span className="text-[10px] text-muted-foreground">R2</span>
                  <span className="text-xs font-bold text-red-400">${prediction.resistance2?.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Analysis */}
          <Card className="stat-card p-4">
            <h3 className="text-sm font-semibold mb-2 text-foreground">AI Analysis</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{prediction.analysis}</p>
          </Card>

          {/* Recommendations */}
          {prediction.recommendations && prediction.recommendations.length > 0 && (
            <Card className="stat-card p-4">
              <h3 className="text-sm font-semibold mb-3 text-foreground">Recommendations</h3>
              <div className="space-y-2">
                {prediction.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                  <div key={idx} className="flex gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-foreground">{rec}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
