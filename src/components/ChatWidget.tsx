import { useState } from "react";
import { MessageCircle, X, Send, AlertTriangle, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  isEmergency?: boolean;
}

const QUICK_QUESTIONS = [
  "What to do if AQ drops?",
  "How to reduce smoke exposure",
  "Report an incident",
  "Emergency contacts",
];

const EMERGENCY_KEYWORDS = ["fire", "smoke", "collapse", "unconscious", "urgent", "emergency", "help"];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi — I'm Safi, your safety assistant. How can I help?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const checkEmergency = (text: string): boolean => {
    return EMERGENCY_KEYWORDS.some((keyword) => text.toLowerCase().includes(keyword));
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    const isEmergency = checkEmergency(input);

    // Simulate bot response delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: isEmergency
          ? "🚨 This sounds urgent. Here are immediate steps to take:\n\n1. Move to fresh air immediately\n2. Call emergency services if needed\n3. Alert nearby people\n4. Share your location with emergency contacts"
          : "I understand your concern. Let me help you with that. You can also report incidents using the Report button if you're witnessing something concerning.",
        sender: "bot",
        timestamp: new Date(),
        isEmergency,
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, Math.random() * 900 + 600);
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    handleSend();
  };

  return (
    <>
      {/* Collapsed Widget */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-primary text-primary-foreground rounded-full px-6 py-4 shadow-lg hover:shadow-xl transition-all hover:scale-105"
          aria-label="Open chat with Safi"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-secondary text-secondary-foreground">🌱</AvatarFallback>
          </Avatar>
          <span className="font-medium">Chat with Safi</span>
          <MessageCircle className="h-5 w-5" />
        </button>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">🌱</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-foreground">Safi</h3>
                <p className="text-xs text-muted-foreground">Safety Assistant</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.sender === "bot" && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        🌱
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-3",
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : msg.isEmergency
                        ? "bg-destructive/10 border border-destructive/20 text-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {msg.isEmergency && (
                      <AlertTriangle className="h-4 w-4 inline-block mr-2 text-destructive" />
                    )}
                    <p className="text-sm whitespace-pre-line">{msg.text}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      🌱
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Questions */}
            {messages.length === 1 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-muted-foreground">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_QUESTIONS.map((q) => (
                    <Button
                      key={q}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickQuestion(q)}
                      className="text-xs"
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Emergency Actions */}
          {messages.some((m) => m.isEmergency) && (
            <div className="px-4 py-3 border-t border-border bg-destructive/5">
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" className="flex-1">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Emergency
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <MapPin className="h-4 w-4 mr-2" />
                  Share Location
                </Button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-border">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
                aria-label="Chat message"
              />
              <Button type="submit" size="icon" disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
