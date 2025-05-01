
import { useState, useRef, useEffect } from "react";
import { Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
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
        
        const aiResponse = { 
          role: "assistant" as const, 
          content: `Ik bekijk de taak "${task.title}". ${
            Math.random() > 0.5 
              ? "Op basis van de beschrijving lijkt dit een belangrijke taak die aandacht vereist." 
              : "Ik kan je helpen met vragen over deze taak of het organiseren van je subtaken."
          }`
        };
        
        setMessages((prev) => [...prev, aiResponse]);
        setIsLoading(false);
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
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold">AI Assistent</h2>
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
            <p>Aan het typen...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
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
          className="self-end" 
          size="icon"
          disabled={isLoading || !input.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
