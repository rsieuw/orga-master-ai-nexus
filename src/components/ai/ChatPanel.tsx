import { useState, useRef, useEffect, Dispatch, SetStateAction } from "react";
import { Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Settings, Bot, BrainCircuit, PenSquare, ClipboardCopy, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GradientLoader } from "@/components/ui/loader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Message, aiModels, AIModel } from "./types";
import React from "react";
import { useNavigate } from "react-router-dom";

interface ChatPanelProps {
  task: Task;
  setActiveTab: Dispatch<SetStateAction<string>>;
  selectedSubtaskTitle: string | null;
  onSubtaskHandled: () => void;
}

export default function ChatPanel({ task, setActiveTab, selectedSubtaskTitle, onSubtaskHandled }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: `Hallo! Ik ben je AI assistent. Wat wil je weten over de taak "${task.title}"?`, timestamp: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("default");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effect to handle selected subtask
  useEffect(() => {
    if (selectedSubtaskTitle) {
      const systemMessage: Message = {
        role: "assistant",
        content: `Je hebt subtaak "${selectedSubtaskTitle}" geselecteerd. Wat wil je hierover weten of bespreken?`,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, systemMessage]);
      // Reset the selection in the parent component
      onSubtaskHandled(); 
    }
  }, [selectedSubtaskTitle, onSubtaskHandled]); // Dependency array includes the props

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message with timestamp
    const userMessage = { role: "user" as const, content: input, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      // This would be replaced with actual API call in a real implementation
      // Simulating API response delay
      setTimeout(() => {
        const taskInfo = `Taak: ${task.title}\nBeschrijving: ${task.description || "Geen beschrijving"}\nStatus: ${task.status}\nPrioriteit: ${task.priority}\nDeadline: ${new Date(task.deadline).toLocaleDateString()}`;
        
        let responseContent = `Ik bekijk de taak "${task.title}". `;
        
        responseContent += Math.random() > 0.5 
          ? "Op basis van de beschrijving lijkt dit een belangrijke taak die aandacht vereist." 
          : "Ik kan je helpen met vragen over deze taak of het organiseren van je subtaken.";
        
        const aiResponse = { 
          role: "assistant" as const, 
          content: responseContent,
          timestamp: Date.now()
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

  // Function to copy text
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Gekopieerd!", description: "Bericht gekopieerd naar klembord." });
    }, (err) => {
      toast({ variant: "destructive", title: "Kopiëren mislukt", description: "Kon bericht niet kopiëren." });
      console.error('Could not copy text: ', err);
    });
  };

  // Function to handle closing the chat view
  const handleCloseChat = () => {
    navigate('/'); // Navigeer naar de dashboard pagina
  };

  return (
    <>
      <div className="chat-window p-4 flex-grow relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-foreground z-10"
          onClick={handleCloseChat}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Sluiten</span>
        </Button>

        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`flex items-start gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="mt-1 flex-shrink-0">
                <Bot className="h-5 w-5 text-muted-foreground" /> 
              </div>
            )}
            <div
              className={`chat-message ${ 
                message.role === "user" ? "chat-message-user" : "chat-message-ai"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              {message.timestamp && (
                <div className="text-xs opacity-60 mt-1 text-right">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              <Button 
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-current"
                onClick={() => handleCopy(message.content)}
              >
                <ClipboardCopy className="h-4 w-4" />
                <span className="sr-only">Kopieer bericht</span>
              </Button>
            </div>
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
      
      <form onSubmit={handleSubmit} className="p-4">
        <div className="relative flex items-end gap-2">
          <Textarea
            className="chat-input flex-grow resize-none pr-10 pt-3 pb-1"
            placeholder="Stel een vraag over deze taak..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={1}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
          >
            {isLoading ? (
              <GradientLoader size="sm" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      <div className="p-2 px-4 border-t border-white/5 flex items-center justify-between gap-2 bg-background/50">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 bg-secondary/50 border-white/10 hover:bg-secondary"
            onClick={() => setActiveTab("chat")}
          >
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">Chat</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 bg-secondary/50 border-white/10 hover:bg-secondary"
            onClick={() => setActiveTab("research")}
          >
            <BrainCircuit className="h-4 w-4" />
            <span className="hidden sm:inline">Onderzoek</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 bg-secondary/50 border-white/10 hover:bg-secondary"
            onClick={() => setActiveTab("notes")}
          >
            <PenSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Notities</span>
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger 
              className="w-auto h-8 px-2 bg-secondary/50 border-white/10 hover:bg-secondary focus:ring-0 focus:ring-offset-0"
              aria-label="Kies AI Model"
            >
              {React.createElement(aiModels.find(m => m.id === selectedModel)?.icon || Settings, { className: "h-4 w-4" })}
            </SelectTrigger>
            <SelectContent className="glass-effect min-w-[180px]">
              {aiModels.map(model => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    {React.createElement(model.icon, { className: "h-4 w-4" })}
                    <span>{model.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
