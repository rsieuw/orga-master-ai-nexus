import { useState, useRef, useEffect } from "react";
import { Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Settings, Bot, BrainCircuit, PenSquare, Copy, X, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GradientLoader } from "@/components/ui/loader";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Message, aiModels } from "./types";
import React, { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ChatPanelProps {
  task: Task;
  selectedSubtaskTitle: string | null;
  onSubtaskHandled: () => void;
}

export default function ChatPanel({ task, selectedSubtaskTitle, onSubtaskHandled }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isNoteMode, setIsNoteMode] = useState(false);
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
    const loadMessagesAndNotes = async () => { // Renamed function
      if (!task?.id) {
        setMessages([]);
        setIsLoading(false);
        console.warn("Task ID not available, skipping message/note loading.");
        return;
      }
      setIsLoading(true);

      const initialMessage: Message = {
        role: "assistant",
        content: `Hallo! Ik ben je AI assistent. Wat wil je weten over de taak "${task.title}"?`,
        timestamp: Date.now(),
        messageType: 'system'
       };

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Gebruiker niet ingelogd");

        // Fetch chat messages
        const { data: dbMessages, error: chatError } = await supabase
          .from('chat_messages')
          .select('role, content, created_at, message_type') // Select specific columns
          .eq('task_id', task.id)
          .order('created_at', { ascending: true });

        if (chatError) throw chatError;

        // Fetch task notes
        const { data: dbNotes, error: notesError } = await supabase
          .from('task_notes')
          .select('content, created_at') // Select specific columns
          .eq('task_id', task.id)
          // .eq('user_id', user.id) // Only load own notes? Depends on requirements
          .order('created_at', { ascending: true });
        
        if (notesError) throw notesError;

        // Map chat messages
        const loadedChatMessages: Message[] = (dbMessages || []).map((msg: any) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at).getTime(),
          messageType: msg.message_type as Message['messageType']
        }));

        // Map notes
        const loadedNotes: Message[] = (dbNotes || []).map((note: any) => ({
          role: 'user', // Notes are from the user
          content: note.content,
          timestamp: new Date(note.created_at).getTime(),
          messageType: 'note_saved' // Use the specific type
        }));

        // Combine and sort messages and notes
        const combinedMessages = [...loadedChatMessages, ...loadedNotes].sort(
          (a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0)
        );

        // Set initial welcome message + combined history
        setMessages([initialMessage, ...combinedMessages]);

      } catch (error) {
        console.error("Fout bij laden berichten en notities:", error);
        toast({
          variant: "destructive",
          title: "Laden mislukt",
          description: "Kon chatgeschiedenis en notities niet ophalen.",
        });
        setMessages([initialMessage]); // Fallback to only welcome message
      } finally {
        setIsLoading(false);
      }
    };

    loadMessagesAndNotes(); // Call the combined function

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

  // Function to save a note (called from handleSubmit)
  const handleSaveNote = async (noteContent: string) => {
    if (!task?.id) return false;
    setIsLoading(true); // Use same loading state for saving notes
    let success = false;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Gebruiker niet ingelogd");

      const { error } = await supabase
        .from('task_notes')
        .insert({ task_id: task.id, user_id: user.id, content: noteContent });

      if (error) throw error;

      // Add the saved note to the chat display
      const savedNoteMessage: Message = {
        role: "user", // Changed role to 'user' for right alignment
        content: noteContent,
        timestamp: Date.now(),
        messageType: 'note_saved' // Keep type for styling
      };
      setMessages(prev => [...prev, savedNoteMessage]);
      // No need to save this display message to chat_messages table

      toast({ title: "Notitie Opgeslagen" });
      success = true;
    } catch (error: unknown) {
      console.error("Fout bij opslaan notitie:", error);
      let errorMsg = "Kon notitie niet opslaan.";
      if (error instanceof Error) { errorMsg = error.message; }
      toast({ variant: "destructive", title: "Opslaan Mislukt", description: errorMsg });
      success = false;
    } finally {
      setIsLoading(false);
    }
    return success;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || !task?.id) return;
    
    const currentInput = input; // Save input before potentially clearing
    setInput(""); // Clear input immediately

    if (isNoteMode) {
      // --- Save Note Logic ---
      const saved = await handleSaveNote(currentInput);
      if (saved) {
        setIsNoteMode(false); // Switch back to chat mode after saving
      }
      // --- End Save Note Logic ---
    } else {
      // --- Existing AI Chat Logic ---
      const userMessage: Message = { role: "user", content: currentInput, timestamp: Date.now() };
      setMessages((prev) => [...prev, userMessage]);
      // Set loading state *before* saving user message to DB for faster feedback
      setIsLoading(true); 
      await saveMessageToDb(userMessage); // Save user message after setting loading
      // Input is already cleared above
      
      try {
        // Prepare Chat History
        const historyToInclude = messages
          .slice(1) 
          .filter(msg => msg.role === 'user' || (msg.role === 'assistant' && (msg.messageType === 'standard' || msg.messageType === 'note_saved'))) // Include saved notes in context? Maybe not.
          .slice(-8)
          .map(msg => ({ role: msg.role, content: msg.content }));

        console.log(`Calling generate-chat-response with mode: ${selectedModel} and ${historyToInclude.length} history messages.`);

        // API Call
        const { data, error } = await supabase.functions.invoke('generate-chat-response', {
          body: {
            query: currentInput,
            mode: selectedModel,
            taskId: task.id,
            chatHistory: historyToInclude
          },
        });

        if (error) throw error;

        let responseContent = "Sorry, kon geen antwoord genereren.";
        if (data?.response) { 
          responseContent = data.response;
        } else {
          console.warn("Received no response content from function");
        }
          
        const aiResponse: Message = { 
          role: "assistant", 
          content: responseContent,
          timestamp: Date.now(),
          messageType: 'standard'
        };
          
        setMessages((prev) => [...prev, aiResponse]);
        await saveMessageToDb(aiResponse);
          
      } catch (error: unknown) {
        console.error('Error calling generate-chat-response function:', error);
        let errorDescription = "Kon de AI functie niet aanroepen.";
        if (error instanceof Error) {
          errorDescription = error.message;
        }
        const errorMessage: Message = {
          role: "assistant",
          content: `Sorry, er is een fout opgetreden: ${errorDescription}`,
          timestamp: Date.now(),
          messageType: 'error'
        };
        setMessages(prev => [...prev, errorMessage]);
        await saveMessageToDb(errorMessage);
        toast({
          variant: "destructive",
          title: "AI Fout",
          description: errorDescription,
        });
      } finally {
        setIsLoading(false);
      }
      // --- End AI Chat Logic ---
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

  // Function to clear chat history
  const handleClearHistory = async () => {
    if (!task?.id) return;

    // Optional: Add confirmation dialog here
    // if (!confirm("Weet je zeker dat je de chatgeschiedenis voor deze taak wilt wissen?")) {
    //   return;
    // }

    setIsLoading(true); // Show loading state while deleting
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Gebruiker niet ingelogd");

      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('task_id', task.id);

      if (error) throw error;

      // Reset local messages to initial state (or just the welcome message)
      const initialMessage: Message = {
        role: "assistant",
        content: `Hallo! Ik ben je AI assistent. Wat wil je weten over de taak "${task.title}"?`,
        timestamp: Date.now(),
        messageType: 'system'
       };
      setMessages([initialMessage]);

      toast({ title: "Geschiedenis gewist", description: "Chatgeschiedenis voor deze taak is verwijderd." });

    } catch (error: unknown) {
      console.error("Fout bij wissen geschiedenis:", error);
      let errorMsg = "Kon chatgeschiedenis niet wissen.";
      if (error instanceof Error) {
        errorMsg = error.message;
      }
      toast({ variant: "destructive", title: "Wissen Mislukt", description: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to export chat
  const handleExportChat = () => {
    if (messages.length === 0) {
      toast({ variant: "destructive", title: "Exporteren Mislukt", description: "Er zijn geen berichten om te exporteren." });
      return;
    }

    let exportContent = `Chatgesprek voor Taak: ${task.title}\n`;
    exportContent += `Geëxporteerd op: ${new Date().toLocaleString()}\n\n`;
    exportContent += "==================================================\n\n";

    messages.forEach(message => {
      const timestamp = message.timestamp ?? Date.now(); // Use current time if timestamp is undefined
      const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const role = message.role === 'user' ? 'Gebruiker' : 'Assistent';
      exportContent += `[${time}] ${role}:\n`;
      exportContent += `${message.content}\n\n`;
    });

    const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Sanitize task title for filename
    const safeTitle = task.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `chat_${safeTitle}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: "Export Gestart", description: "Chat wordt gedownload als tekstbestand." });
  };

  return (
    <>
      <div className="chat-window p-4 flex-grow relative overflow-y-auto scrollbar-thin">
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
              className={`chat-message relative p-3 rounded-lg max-w-[80%] group ${ 
                // Apply specific style for saved notes first
                message.messageType === 'note_saved' 
                  ? "chat-message-note-saved"
                // Then apply styles based on role or other types
                  : message.role === "user"
                    ? "chat-message-user"
                    : message.messageType === 'research_result' 
                      ? "chat-message-research"
                      : message.messageType === 'notes_display'
                        ? "chat-message-notes" 
                        : "chat-message-ai" // Default AI style
              }`}
            >
              {message.messageType === 'notes_display' || message.messageType === 'note_saved' ? (
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              ) : (
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              )}
              {message.timestamp && (
                <div className="text-xs opacity-60 mt-1 text-right">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              <Button 
                variant="ghost"
                size="icon"
                className={`absolute h-5 w-5 opacity-0 group-hover:opacity-75 transition-opacity duration-200 text-current hover:bg-transparent ${ // Reduced hover opacity
                  // User icon left, AI icon right (adjusted further)
                  message.role === 'user' ? 'bottom-1.5 left-1.5' : 'bottom-1.5 right-12' // Moved AI icon further left again
                }`} 
                onClick={() => handleCopy(message.content)}
              >
                <Copy className="h-4 w-4" />
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
            placeholder={isNoteMode ? "Schrijf een notitie..." : "Stel een vraag over deze taak..."}
            value={input}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
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
            ) : isNoteMode ? (
              <Save className="h-4 w-4" />
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
            className={`gap-1 border-white/10 hover:bg-secondary ${!isNoteMode ? 'bg-primary/20 border-primary/50' : 'bg-secondary/50'}`}
            onClick={() => { /* setActiveTab("chat"); // No need to set activeTab here */ setIsNoteMode(false); }}
            disabled={isNoteMode} // Disable chat button in note mode
          >
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">Chat</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={`gap-1 border-white/10 hover:bg-secondary bg-secondary/50`}
            onClick={handleDeepResearch}
            disabled={isLoading || isNoteMode}
          >
            <BrainCircuit className="h-4 w-4" />
            <span className="hidden sm:inline">Onderzoek</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={`gap-1 border-white/10 hover:bg-secondary ${isNoteMode ? 'bg-yellow-600/30 border-yellow-500/50 text-yellow-300' : 'bg-secondary/50'}`}
            onClick={() => setIsNoteMode(!isNoteMode)}
            disabled={isLoading}
          >
            <PenSquare className="h-4 w-4" />
            <span className="hidden sm:inline">{isNoteMode ? "Stop Notitie" : "Nieuwe Notitie"}</span>
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isNoteMode || isLoading}>
            <SelectTrigger 
              className="w-auto h-8 px-2 bg-secondary/50 border-white/10 hover:bg-secondary focus:ring-0 focus:ring-offset-0 disabled:opacity-50"
              aria-label="Kies AI Model"
            >
              {React.createElement(aiModels.find((m: any) => m.id === selectedModel)?.icon || Settings, { className: "h-4 w-4" })}
            </SelectTrigger>
            <SelectContent className="glass-effect min-w-[180px]">
              {aiModels.map((model: any) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    {React.createElement(model.icon, { className: "h-4 w-4" })}
                    <span>{model.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-effect min-w-[180px]">
              <DropdownMenuItem onClick={handleClearHistory} disabled={isLoading}>
                {/* Optional: Add an icon like Trash2 */} 
                Wis Geschiedenis
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportChat}>
                {/* Optional: Add an icon like Download */} 
                Exporteer Gesprek (.txt)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </>
  );
}

