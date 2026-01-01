import { useState, useRef, useEffect } from "react";
import { Send, Bot, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";

const formatMarkdown = (text: string) => {
  let html = text
    .replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold mt-3 mb-2 text-foreground">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-lg font-semibold mt-4 mb-2 text-foreground">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold mt-4 mb-3 text-foreground">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-muted-foreground">$1</em>')
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-card/50 p-3 rounded-lg my-2 overflow-x-auto border border-border/30 text-sm"><code>$1</code></pre>')
    .replace(/`(.*?)`/g, '<code class="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm font-medium">$1</code>')
    .replace(/^\• (.*$)/gim, '<li class="ml-4 my-1 text-sm">$1</li>')
    .replace(/^- (.*$)/gim, '<li class="ml-4 my-1 text-sm">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 my-1 text-sm">$1</li>')
    .replace(/\n\n/g, '</p><p class="my-2 text-sm leading-relaxed">')
    .replace(/\n/g, '<br/>');
  
  html = html.replace(/(<li.*?<\/li>(\s*<li.*?<\/li>)*)/g, '<ul class="list-disc my-2 space-y-1">$1</ul>');
  
  if (!html.startsWith('<h') && !html.startsWith('<ul') && !html.startsWith('<pre')) {
    html = `<p class="text-sm leading-relaxed">${html}</p>`;
  }
  
  return html;
};

interface Message {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

const AIAgent = () => {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Hi! I'm your AI trading analyst. Ask me about any crypto or stock, or upload a chart for technical analysis."
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (messageText?: string, imageData?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() && !imageData) return;

    const userMessage: Message = {
      role: "user",
      content: textToSend,
      imageUrl: imageData
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trading-agent`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            image: imageData
          })
        }
      );

      const data = await response.json();
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response
      }]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to get response from AI agent. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const imageData = event.target?.result as string;
      sendMessage("Analyze this trading chart", imageData);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Layout>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 gradient-bg">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-6 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 gradient-text tracking-tight">AI Agent</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Your intelligent assistant for market analysis and trading insights</p>
          </div>

          {/* Chat Container */}
          <Card className="stat-card p-4 sm:p-6 mb-4 animate-slide-up" style={{ height: "calc(100vh - 340px)", minHeight: "400px" }}>
            <div className="h-full overflow-y-auto pr-2 space-y-4 scrollbar-thin">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  {message.role === "assistant" && (
                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`rounded-xl px-4 py-3 max-w-[85%] ${
                      message.role === "user"
                        ? "bg-primary/10 border border-primary/30 text-foreground"
                        : "bg-card/50 border border-border/30"
                    }`}
                  >
                    {message.imageUrl && (
                      <img
                        src={message.imageUrl}
                        alt="Uploaded chart"
                        className="rounded-lg mb-3 max-w-full border border-border/20"
                      />
                    )}
                    {message.role === "assistant" ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
                        className="text-foreground/90 [&_strong]:text-foreground [&_code]:text-primary"
                      />
                    ) : (
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start animate-fade-in">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-card/50 border border-border/30 rounded-xl px-5 py-4">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '100ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '200ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </Card>

          {/* Input Area */}
          <Card className="stat-card p-4 animate-fade-in">
            <div className="flex gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="agent-image-upload"
              />
              <label htmlFor="agent-image-upload">
                <Button variant="outline" size="icon" className="flex-shrink-0 h-11 w-11" asChild>
                  <div>
                    <Upload className="w-4 h-4" />
                  </div>
                </Button>
              </label>
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask me anything about trading, crypto, or stocks..."
                className="min-h-[48px] max-h-32 resize-none bg-card/50 border-border/50 text-sm"
                disabled={isLoading}
              />
              <Button
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="flex-shrink-0 h-11 w-11 bg-primary hover:bg-primary/90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AIAgent;
