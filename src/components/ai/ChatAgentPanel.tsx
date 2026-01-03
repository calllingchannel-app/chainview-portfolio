import { useState, useRef, useEffect } from "react";
import { Send, Bot, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const formatMarkdown = (text: string) => {
  let html = text
    .replace(/^### (.*$)/gim, '<h3 class="text-sm font-semibold mt-2 mb-1 text-foreground">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-base font-semibold mt-3 mb-1 text-foreground">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold mt-3 mb-2 text-foreground">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-muted-foreground">$1</em>')
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-card/50 p-2 rounded-lg my-2 overflow-x-auto border border-border/30 text-xs"><code>$1</code></pre>')
    .replace(/`(.*?)`/g, '<code class="bg-primary/10 text-primary px-1 py-0.5 rounded text-xs font-medium">$1</code>')
    .replace(/^\• (.*$)/gim, '<li class="ml-3 my-0.5 text-xs">$1</li>')
    .replace(/^- (.*$)/gim, '<li class="ml-3 my-0.5 text-xs">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li class="ml-3 my-0.5 text-xs">$1</li>')
    .replace(/\n\n/g, '</p><p class="my-1.5 text-xs leading-relaxed">')
    .replace(/\n/g, '<br/>');
  
  html = html.replace(/(<li.*?<\/li>(\s*<li.*?<\/li>)*)/g, '<ul class="list-disc my-1.5 space-y-0.5">$1</ul>');
  
  if (!html.startsWith('<h') && !html.startsWith('<ul') && !html.startsWith('<pre')) {
    html = `<p class="text-xs leading-relaxed">${html}</p>`;
  }
  
  return html;
};

interface Message {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

export const ChatAgentPanel = () => {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Hi! I'm your AI trading analyst. Ask me about any crypto or stock, or upload a chart for analysis."
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
      
      if (!response.ok) {
        console.error("API error:", response.status, data);
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.response || "I encountered an error. Please try again."
        }]);
        return;
      }

      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response || "I received your message but couldn't generate a response."
      }]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm having trouble connecting to the server. Please check your connection and try again."
      }]);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the AI service.",
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
    <div className="flex flex-col h-full">
      {/* Chat Container */}
      <Card className="stat-card p-3 sm:p-4 mb-3 flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto pr-1 space-y-3 scrollbar-thin">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              {message.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div
                className={`rounded-xl px-3 py-2 max-w-[85%] ${
                  message.role === "user"
                    ? "bg-primary/10 border border-primary/30 text-foreground"
                    : "bg-card/50 border border-border/30"
                }`}
              >
                {message.imageUrl && (
                  <img
                    src={message.imageUrl}
                    alt="Uploaded chart"
                    className="rounded-lg mb-2 max-w-full max-h-32 border border-border/20"
                  />
                )}
                {message.role === "assistant" ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
                    className="text-foreground/90 [&_strong]:text-foreground [&_code]:text-primary"
                  />
                ) : (
                  <p className="text-xs leading-relaxed">{message.content}</p>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2 justify-start animate-fade-in">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="bg-card/50 border border-border/30 rounded-xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '100ms' }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '200ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </Card>

      {/* Input Area */}
      <Card className="stat-card p-3">
        <div className="flex gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="agent-image-upload-panel"
          />
          <label htmlFor="agent-image-upload-panel">
            <Button variant="outline" size="icon" className="flex-shrink-0 h-9 w-9" asChild>
              <div>
                <Upload className="w-3.5 h-3.5" />
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
            placeholder="Ask about trading, crypto, stocks..."
            className="min-h-[40px] max-h-24 resize-none bg-card/50 border-border/50 text-xs"
            disabled={isLoading}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="flex-shrink-0 h-9 w-9 bg-primary hover:bg-primary/90"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
