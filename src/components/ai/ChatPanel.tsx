import { useState, useRef, useEffect } from "react";
import { Task } from "@/types/task.ts";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Send, Settings, Bot, BrainCircuit, PenSquare, Copy, X, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast.ts";
import { GradientLoader } from "@/components/ui/loader.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select.tsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu.tsx";
import { Message, aiModels, AIModel } from "./types.ts";
import React, { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client.ts";
import { useTask } from "@/contexts/TaskContext.tsx";
import { useAuth } from "@/contexts/AuthContext.tsx";

interface ChatPanelProps {
  task: Task;
  selectedSubtaskTitle: string | null;
  onSubtaskHandled: () => void;
}

export default function ChatPanel({ task, selectedSubtaskTitle, onSubtaskHandled }: ChatPanelProps) {
  const {
    addSubtask,
    updateSubtask,
    deleteSubtask,
    updateTask,
    deleteAllSubtasks
  } = useTask();
  const { user } = useAuth();

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
    const loadMessagesAndNotes = async () => {
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
          .select('role, content, created_at, message_type')
          .eq('task_id', task.id)
          .order('created_at', { ascending: true });

        if (chatError) throw chatError;

        // Fetch task notes
        const { data: dbNotes, error: notesError } = await supabase
          .from('task_notes')
          .select('content, created_at')
          .eq('task_id', task.id)
          .order('created_at', { ascending: true });
        
        if (notesError) throw notesError;

        // Define interfaces for fetched data to avoid 'any'
        interface DbMessage {
          role: 'user' | 'assistant';
          content: string;
          created_at: string;
          message_type: Message['messageType'];
        }
        interface DbNote {
           content: string;
           created_at: string;
        }

        // Map chat messages
        const loadedChatMessages: Message[] = (dbMessages || []).map((msg: DbMessage) => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at).getTime(),
          messageType: msg.message_type
        }));

        // Map notes
        const loadedNotes: Message[] = (dbNotes || []).map((note: DbNote) => ({
          role: 'user',
          content: note.content,
          timestamp: new Date(note.created_at).getTime(),
          messageType: 'note_saved'
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

    loadMessagesAndNotes();
  }, [task?.id, toast]);

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
      if (error instanceof Error) errorMsg = error.message;
      toast({ variant: "destructive", title: "Opslaan Mislukt", description: errorMsg });
      success = false;
    } finally {
      setIsLoading(false);
    }
    return success;
  };

  const handleSubmit = async (e?: React.FormEvent | React.KeyboardEvent) => {
    // Allow calling without event (from handleKeyDown)
    if (e) {
      e.preventDefault();
    }
    
    if (!input.trim() || !task?.id) return;
    
    const currentInput = input;
    setInput(""); 

    if (isNoteMode) {
      // --- Save Note Logic ---
      const saved = await handleSaveNote(currentInput);
      if (saved) {
        setIsNoteMode(false); // Switch back to chat mode after saving
      }
      // --- End Save Note Logic ---
    } else {
      // --- AI Chat Logic ---
      const userMessage: Message = { role: "user", content: currentInput, timestamp: Date.now(), messageType: 'standard' };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true); 
      await saveMessageToDb(userMessage); 
      
      try {
        // Prepare Chat History
        const historyToInclude = messages
          .filter(msg => msg.role === 'user' || (msg.role === 'assistant' && (msg.messageType === 'standard'))) 
          .slice(-8) 
          .map(msg => ({ role: msg.role, content: msg.content }));

        // Haal taalvoorkeur op, met fallback naar 'nl'
        const languagePreference = user?.language_preference || 'nl'; 
        console.log(`Calling generate-chat-response function with mode: ${selectedModel}, lang: ${languagePreference}, and ${historyToInclude.length} history messages.`);

        // --- Actual API Call to Supabase Edge Function --- 
        const { data: aiResponseData, error: functionError } = await supabase.functions.invoke('generate-chat-response', {
          body: {
            query: currentInput,
            mode: selectedModel,
            taskId: task.id,
            chatHistory: historyToInclude,
            languagePreference: languagePreference // Stuur taalvoorkeur mee
          },
        });

        // ----> NIEUW: Log de ontvangen data
        console.log("AI Response Received:", JSON.stringify(aiResponseData, null, 2)); 

        if (functionError) throw functionError; // Throw error from function call

        if (!aiResponseData) { 
          throw new Error("AI function returned no data.");
        }
        // --- End API Call ---
       
        // --- Process AI Response ---
        let assistantMessageContent = "";
        let messageToSave: Message | null = null;

        if (aiResponseData.action) {
          try {
            switch (aiResponseData.action) {
              case "UPDATE_TASK_TITLE": {
                 if (!aiResponseData.payload?.newTitle) {
                   throw new Error("Ongeldige payload voor UPDATE_TASK_TITLE");
                }
                await updateTask(task.id, { title: aiResponseData.payload.newTitle });
                assistantMessageContent = `Taak succesvol hernoemd naar "${aiResponseData.payload.newTitle}".`;
                toast({ title: "Taak Bijgewerkt" });
                break;
              }
              case "UPDATE_SUBTASK": {
                if (!aiResponseData.payload?.subtaskId || !aiResponseData.payload?.updates?.title) {
                   throw new Error("Ongeldige payload voor UPDATE_SUBTASK");
                }
                // Definieer een type voor de updates die we toestaan
                type AllowedSubtaskUpdates = Partial<Pick<import("@/types/task.ts").SubTask, 'title' | 'completed'>>;
                
                const validSubtaskUpdates: AllowedSubtaskUpdates = { title: aiResponseData.payload.updates.title }; 
                if (aiResponseData.payload.updates.completed !== undefined) {
                   validSubtaskUpdates.completed = aiResponseData.payload.updates.completed;
                }
                await updateSubtask(task.id, aiResponseData.payload.subtaskId, validSubtaskUpdates);
                assistantMessageContent = `Subtaak succesvol hernoemd naar "${aiResponseData.payload.updates.title}".`;
                toast({ title: "Subtaak Bijgewerkt" });
                break;
               }
              case "ADD_SUBTASK": {
                 if (!aiResponseData.payload?.title) {
                   throw new Error("Ongeldige payload voor ADD_SUBTASK");
                }
                await addSubtask(task.id, aiResponseData.payload.title);
                assistantMessageContent = `Subtaak "${aiResponseData.payload.title}" toegevoegd.`;
                 toast({ title: "Subtaak Toegevoegd" });
                break;
               }
              case "DELETE_SUBTASK": {
                 if (!aiResponseData.payload?.subtaskId) {
                   throw new Error("Ongeldige payload voor DELETE_SUBTASK");
                }
                await deleteSubtask(task.id, aiResponseData.payload.subtaskId);
                assistantMessageContent = `Subtaak (ID: ${aiResponseData.payload.subtaskId}) verwijderd.`;
                break;
               }
              case "DELETE_ALL_SUBTASKS": {
                 if (!aiResponseData.payload?.taskId || aiResponseData.payload.taskId !== task.id) {
                   throw new Error("Ongeldige of ontbrekende taskId payload voor DELETE_ALL_SUBTASKS");
                 }
                 await deleteAllSubtasks(task.id);
                 assistantMessageContent = `Alle subtaken voor deze taak zijn verwijderd.`;
                 toast({ title: "Alle subtaken verwijderd" });
                 break;
               }
              default: {
                 console.warn("Onbekende AI actie:", aiResponseData.action);
                 assistantMessageContent = aiResponseData.content || `Actie "${aiResponseData.action}" ontvangen, maar weet niet hoe te verwerken.`;
              }
            }
            // Create user-friendly message AFTER action success
            messageToSave = {
              role: "assistant",
              content: assistantMessageContent,
              timestamp: Date.now(),
              messageType: 'action_confirm' 
            };

          } catch (actionError) {
             console.error(`Fout bij uitvoeren AI actie ${aiResponseData.action}:`, actionError);
             let errorDesc = "Kon de gevraagde actie niet uitvoeren.";
             if (actionError instanceof Error) errorDesc = actionError.message;
             toast({ variant: "destructive", title: "Actie Mislukt", description: errorDesc });
             messageToSave = {
               role: "assistant",
               content: `Sorry, er ging iets mis bij het uitvoeren van de actie: ${errorDesc}`,
               timestamp: Date.now(),
               messageType: 'error'
             };
          }
        } else if (aiResponseData.response) {
           assistantMessageContent = aiResponseData.response;
            messageToSave = {
              role: "assistant",
              content: assistantMessageContent,
              timestamp: Date.now(),
              messageType: 'standard'
            };
        } else {
           console.error("Onverwachte AI response structuur (geen action of response key):", aiResponseData);
           assistantMessageContent = "Sorry, ik ontving een onverwachte reactie.";
            messageToSave = {
              role: "assistant",
              content: assistantMessageContent,
              timestamp: Date.now(),
              messageType: 'error'
            };
        }

        // Add the final message to state and save it
        if (messageToSave) {
           setMessages((prev) => [...prev, messageToSave]);
           await saveMessageToDb(messageToSave);
        }
        
      } catch (error) {
        console.error("Fout bij communicatie met AI functie:", error);
        const errorMsg: Message = { 
            role: "assistant", 
            content: "Sorry, er ging iets mis met de verbinding naar de AI functie.", 
            timestamp: Date.now(),
            messageType: 'error'
        };
        setMessages((prev) => [...prev, errorMsg]);
        await saveMessageToDb(errorMsg); 
      } finally {
        setIsLoading(false);
      }
      // --- End AI Chat Logic ---
    }
  };

  // Function to handle key presses in the textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault(); // Prevent default newline on Ctrl+Enter
      handleSubmit(); // Call submit logic
    } 
    // Enter alone will now just create a newline by default
    // No need for specific Shift+Enter handling unless we want to intercept Enter completely
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
                message.messageType === 'note_saved' 
                  ? "chat-message-note-saved"
                  : message.role === "user"
                    ? "chat-message-user"
                    : message.messageType === 'research_result' 
                      ? "chat-message-research"
                      : "chat-message-ai" // Default AI style
              }`}
            >
              {message.messageType === 'note_saved' ? (
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
      
      <form className="p-4">
        <div className="relative flex items-end gap-2">
          <Textarea
            className="chat-input flex-grow resize-none pr-10 pt-3 pb-1"
            placeholder={isNoteMode ? "Schrijf een notitie..." : "Ctrl+Enter om te sturen..."}
            value={input}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
          />
          <Button
            type="button"
            onClick={() => handleSubmit()}
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
              {React.createElement(aiModels.find((m: AIModel) => m.id === selectedModel)?.icon || Settings, { className: "h-4 w-4" })}
            </SelectTrigger>
            <SelectContent className="glass-effect min-w-[180px]">
              {aiModels.map((model: AIModel) => (
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

