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
import { supabase } from "@/integrations/supabase/client";

interface ChatPanelProps {
  task: Task;
  setActiveTab: Dispatch<SetStateAction<string>>;
  selectedSubtaskTitle: string | null;
  onSubtaskHandled: () => void;
}

export default function ChatPanel({ task, setActiveTab, selectedSubtaskTitle, onSubtaskHandled }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState("default");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to save a message to the database
  const saveMessageToDb = async (message: Message) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Gebruiker niet ingelogd");

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          task_id: task.id,
          user_id: user.id,
          role: message.role,
          content: message.content,
          message_type: message.messageType // Kan null zijn
        });

      if (error) throw error;

    } catch (error) {
      console.error("Fout bij opslaan bericht:", error);
      // Optioneel: Toon een toast aan de gebruiker
      toast({
        variant: "destructive",
        title: "Opslaan mislukt",
        description: "Kon het bericht niet opslaan in de database.",
      });
    }
  };

  // Effect to load messages on component mount
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true); // Indicate loading state

      // Define the initial welcome message here
      const initialMessage: Message = {
        role: "assistant",
        content: `Hallo! Ik ben je AI assistent. Wat wil je weten over de taak "${task.title}"?`,
        timestamp: Date.now(),
        messageType: 'system'
       };

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Gebruiker niet ingelogd");

        const { data: dbMessages, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('task_id', task.id)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (dbMessages && dbMessages.length > 0) {
          // Map DB structure to Message interface
          const loadedMessages: Message[] = dbMessages.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at).getTime(), // Use DB timestamp
            messageType: msg.message_type as Message['messageType']
          }));
          // Set initial message + loaded messages
          setMessages([initialMessage, ...loadedMessages]);
        } else {
          // No messages found in DB, only set the initial welcome message
          setMessages([initialMessage]);
        }

      } catch (error) {
        console.error("Fout bij laden berichten:", error);
        toast({
          variant: "destructive",
          title: "Laden mislukt",
          description: "Kon chatgeschiedenis niet ophalen.",
        });
        // Fallback to only the initial message on error
        setMessages([initialMessage]);
      } finally {
        setIsLoading(false); // Finish loading
      }
    };

    if (task?.id) { // Only load if task ID is available
        loadMessages();
    } else {
        // Handle case where task ID is not yet available (e.g., set empty messages and stop loading)
        setMessages([]);
        setIsLoading(false);
        console.warn("Task ID not available, skipping message loading.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]); // Reload messages if the task ID changes

  // Effect to handle selected subtask
  useEffect(() => {
    if (selectedSubtaskTitle && task?.id) { // Ensure task.id is available
      const handleSubtaskSelection = async () => {
          const systemMessage: Message = {
            role: "assistant",
            content: `Je hebt subtaak "${selectedSubtaskTitle}" geselecteerd. Wat wil je hierover weten of bespreken?`,
            timestamp: Date.now(),
            messageType: 'system'
          };
          setMessages((prev) => [...prev, systemMessage]);
          await saveMessageToDb(systemMessage); // Save the system message
          onSubtaskHandled();
      };
      handleSubtaskSelection();
    }
    // No dependency on saveMessageToDb as it's stable if defined outside useEffect
  }, [selectedSubtaskTitle, onSubtaskHandled, task?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || !task?.id) return; // Ensure task.id is available
    
    // Add user message with timestamp
    const userMessage: Message = { role: "user", content: input, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    await saveMessageToDb(userMessage); // Save user message
    setInput("");
    setIsLoading(true);
    
    try {
      // Simulating API response delay
      // Replace this section with your actual API call logic
      setTimeout(async () => { // Make timeout callback async to await saveMessageToDb
        let responseContent = `Ik bekijk de taak "${task.title}". `;
        
        responseContent += Math.random() > 0.5 
          ? "Op basis van de beschrijving lijkt dit een belangrijke taak die aandacht vereist." 
          : "Ik kan je helpen met vragen over deze taak of het organiseren van je subtaken.";
        
        const aiResponse: Message = { 
          role: "assistant", 
          content: responseContent,
          timestamp: Date.now(),
          messageType: 'standard' // Mark as standard response
        };
        
        setMessages((prev) => [...prev, aiResponse]);
        await saveMessageToDb(aiResponse); // Save AI response
        setIsLoading(false);
        
        // Toast notification remains unchanged
        // toast({ ... });
      }, 1500);
    } catch (error) {
      // Error handling remains unchanged
      // toast({ ... });
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

  // Function to trigger deep research
  const handleDeepResearch = async () => {
    if (!task?.id) return; // Ensure task.id is available
    
    const researchQuery = task.title;
    const researchInitiationMessage: Message = {
      role: "assistant",
      content: `Oké, ik start een diep onderzoek naar: "${researchQuery}"`,
      timestamp: Date.now(),
      messageType: 'system'
    };
    setMessages(prev => [...prev, researchInitiationMessage]);
    await saveMessageToDb(researchInitiationMessage); // Save initiation message
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('deep-research', {
        body: { query: researchQuery },
      });

      if (error) throw error;

      const resultMessage: Message = {
        role: "assistant",
        content: data?.researchResult || "Kon geen onderzoeksresultaten vinden.",
        timestamp: Date.now(),
        messageType: 'research_result'
      };
      setMessages(prev => [...prev, resultMessage]);
      await saveMessageToDb(resultMessage); // Save result message

    } catch (error: unknown) {
      console.error('Error calling deep-research function:', error);
      let errorDescription = "Kon de deep-research functie niet aanroepen.";
      if (error instanceof Error) {
        errorDescription = error.message;
      }
      const errorMessage: Message = {
        role: "assistant",
        content: `Sorry, er is een fout opgetreden tijdens het onderzoek: ${errorDescription}`,
        timestamp: Date.now(),
        messageType: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
      await saveMessageToDb(errorMessage); // Save error message
      toast({
        variant: "destructive",
        title: "Onderzoek Mislukt",
        description: errorDescription,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="chat-window p-4 flex-grow relative overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 hover:scrollbar-thumb-gray-500 scrollbar-track-transparent">
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
            className={`group flex items-start gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
          >
            {message.role === 'assistant' && (
              <div className="mt-1 flex-shrink-0">
                <Bot className="h-5 w-5 text-muted-foreground" /> 
              </div>
            )}
            <div
              className={`chat-message ${ 
                message.role === "user"
                  ? "chat-message-user"
                  : message.messageType === 'research_result' 
                    ? "chat-message-research"
                    : "chat-message-ai"
              } relative p-3 rounded-lg max-w-[80%] group`}
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
            onClick={handleDeepResearch}
            disabled={isLoading}
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
