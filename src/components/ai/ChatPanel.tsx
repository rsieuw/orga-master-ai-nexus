
import { useState, useRef, useEffect } from "react";
import { Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GradientLoader } from "@/components/ui/loader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Message, aiModels, AIModel } from "./types";

interface ChatPanelProps {
  task: Task;
  deepResearch: boolean;
}

export default function ChatPanel({ task, deepResearch }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: `Hallo! Ik ben je AI assistent. Wat wil je weten over de taak "${task.title}"?` },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("default");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message
    const userMessage = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      // This would be replaced with actual API call in a real implementation
      // Simulating API response delay
      setTimeout(() => {
        const taskInfo = `Taak: ${task.title}\nBeschrijving: ${task.description || "Geen beschrijving"}\nStatus: ${task.status}\nPrioriteit: ${task.priority}\nDeadline: ${new Date(task.deadline).toLocaleDateString()}`;
        
        let responseContent = `Ik bekijk de taak "${task.title}". `;
        
        if (deepResearch) {
          responseContent += "Ik heb diep onderzoek gedaan en op basis daarvan ";
        }
        
        responseContent += Math.random() > 0.5 
          ? "Op basis van de beschrijving lijkt dit een belangrijke taak die aandacht vereist." 
          : "Ik kan je helpen met vragen over deze taak of het organiseren van je subtaken.";
        
        const aiResponse = { 
          role: "assistant" as const, 
          content: responseContent
        };
        
        setMessages((prev) => [...prev, aiResponse]);
        setIsLoading(false);
        
        toast({
          title: "AI Antwoord ontvangen",
          description: "Het antwoord is toegevoegd aan de chat",
        });
      }, 1500);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fout bij het laden van de AI reactie",
        description: "Probeer het later opnieuw",
      });
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="p-3 bg-secondary/30 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[180px] bg-secondary/50 border-white/10">
              <SelectValue placeholder="Kies AI Model" />
            </SelectTrigger>
            <SelectContent className="glass-effect">
              {aiModels.map(model => (
                <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground hidden md:block">
            {aiModels.find(m => m.id === selectedModel)?.description}
          </div>
        </div>
        <Button variant="outline" size="sm" className="border-white/10">
          <Settings className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Instellingen</span>
        </Button>
      </div>
      
      <div className="chat-window p-4 flex-grow">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-message ${
              message.role === "user" ? "chat-message-user" : "chat-message-ai"
            }`}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}
        {isLoading && (
          <div className="chat-message chat-message-ai">
            <div className="flex items-center gap-2">
              <GradientLoader size="sm" />
              <p>Aan het typen...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 flex gap-2">
        <Textarea
          className="chat-input flex-grow resize-none"
          placeholder="Stel een vraag over deze taak..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={1}
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          className="self-end bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          size="icon"
          disabled={isLoading || !input.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </>
  );
}
