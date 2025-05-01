
import { useState, useRef, useEffect } from "react";
import { Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Search, Bot, BrainCircuit, PenSquare, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GradientLoader } from "@/components/ui/loader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIModel {
  id: string;
  name: string;
  description: string;
}

interface TaskAIChatProps {
  task: Task;
}

export default function TaskAIChat({ task }: TaskAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: `Hallo! Ik ben je AI assistent. Wat wil je weten over de taak "${task.title}"?` },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [selectedModel, setSelectedModel] = useState("default");
  const [deepResearch, setDeepResearch] = useState(false);
  const [note, setNote] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const aiModels: AIModel[] = [
    { id: "default", name: "Standaard", description: "Snelle antwoorden voor algemene vragen" },
    { id: "advanced", name: "Geavanceerd", description: "Meer gedetailleerde en diepgaande analyses" },
    { id: "creative", name: "Creatief", description: "Creatieve ideeën en suggesties" }
  ];

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

  const handleSaveNote = () => {
    if (note.trim()) {
      toast({
        title: "Notitie opgeslagen",
        description: "De notitie is succesvol opgeslagen bij deze taak",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Lege notitie",
        description: "Voeg eerst tekst toe aan je notitie",
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/5 flex justify-between items-center">
        <h2 className="font-semibold">AI Assistent</h2>
        <Tabs defaultValue="chat" className="w-[400px]" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 bg-secondary/50 backdrop-blur-sm">
            <TabsTrigger value="chat" className="flex items-center gap-1">
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="research" className="flex items-center gap-1">
              <BrainCircuit className="w-4 h-4" />
              <span className="hidden sm:inline">Onderzoek</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-1">
              <PenSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Notities</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <TabsContent value="chat" className="flex-grow flex flex-col p-0 m-0">
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
      </TabsContent>
      
      <TabsContent value="research" className="flex-grow flex flex-col p-4 m-0 gap-4">
        <div className="space-y-4">
          <h3 className="font-medium">Diep onderzoek met Perplexity</h3>
          <p className="text-sm text-muted-foreground">
            Met diep onderzoek kan de AI-assistent het internet doorzoeken voor gedetailleerde informatie over deze taak en gerelateerde onderwerpen.
          </p>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="deepResearch"
              checked={deepResearch}
              onChange={() => setDeepResearch(!deepResearch)}
              className="rounded border-white/10 bg-secondary/50"
            />
            <label htmlFor="deepResearch" className="text-sm">
              Activeer diep onderzoek
            </label>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Wanneer geactiveerd, zal de AI-assistent Perplexity gebruiken om gerelateerde bronnen te vinden en te analyseren voor betere antwoorden.
            </p>
          </div>
          
          <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700" 
            onClick={() => {
              setActiveTab("chat");
              toast({
                title: deepResearch ? "Diep onderzoek geactiveerd" : "Diep onderzoek gedeactiveerd",
                description: deepResearch ? "De AI zal nu diep onderzoek uitvoeren" : "De AI zal geen diep onderzoek uitvoeren",
              });
            }}>
            <Search className="mr-2 h-4 w-4" />
            Terug naar chat
          </Button>
        </div>
      </TabsContent>
      
      <TabsContent value="notes" className="flex-grow flex flex-col p-4 m-0 gap-4">
        <div className="space-y-4">
          <h3 className="font-medium">Notities voor "{task.title}"</h3>
          <p className="text-sm text-muted-foreground">
            Voeg notities toe aan deze taak om belangrijke informatie bij te houden.
          </p>
          
          <Textarea
            className="min-h-[200px] border-white/10 bg-secondary/30 focus:ring-primary/40"
            placeholder="Schrijf hier je notities..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setNote("")}>
              Wissen
            </Button>
            <Button 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              onClick={handleSaveNote}
            >
              Opslaan
            </Button>
          </div>
        </div>
      </TabsContent>
    </div>
  );
}
