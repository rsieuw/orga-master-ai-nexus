import { useState, useRef, useEffect, useCallback } from "react";
import { Task } from "@/types/task.ts";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Send, Settings, Bot, BrainCircuit, PenSquare, Copy, X, Save, Trash2, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast.ts";
import { GradientLoader } from "@/components/ui/loader.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select.tsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu.tsx";
import { Message, aiModels, AIModel } from "./types.ts";
import React, { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client.ts";
import { useTask } from "@/contexts/TaskContext.hooks.ts";
import { useAuth } from "@/contexts/AuthContext.tsx";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { hasPermission } from "@/lib/permissions.ts";
import { Database } from "@/types/supabase.ts"; // Wijzig .tsx naar .ts
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import { useTranslation } from 'react-i18next';

// Definieer een alias voor het specifieke tabelrij type
type SavedResearchRow = Database['public']['Tables']['saved_research']['Row'];

// ---> NIEUW: Helper functie voor MessageType validatie <---
const validMessageTypes = [
  'standard', 'research_result', 'system', 'error', 'note_saved', 'action_confirm', 'saved_research_display'
] as const; // Gebruik 'as const' voor een tuple type

type ValidMessageType = typeof validMessageTypes[number]; // Maak een type van de waarden

function isValidMessageType(type: string | null | undefined): type is ValidMessageType {
  if (!type) return false;
  // Cast type naar string voor de includes check (null/undefined zijn al gefilterd)
  return (validMessageTypes as ReadonlyArray<string>).includes(type);
}
// ---> EINDE NIEUW <---

interface ChatPanelProps {
  task: Task;
  selectedSubtaskTitle: string | null;
}

export default function ChatPanel({ task, selectedSubtaskTitle }: ChatPanelProps) {
  const {
    addSubtask,
    updateSubtask,
    deleteSubtask,
    updateTask,
    deleteAllSubtasks
  } = useTask();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState("default");
  const [isResearching, setIsResearching] = useState(false);
  const [researchCancelled, setResearchCancelled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // --- Define saveMessageToDb with useCallback --- 
  const saveMessageToDb = useCallback(async (message: Message) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('chatPanel.errors.userNotLoggedIn'));

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          task_id: task.id, // Use task.id from component scope
          user_id: user.id,
          role: message.role,
          content: message.content,
          message_type: message.messageType
        });

      if (error) throw error;

    } catch (error) {
      console.error("Fout bij opslaan bericht:", error);
      toast({
        variant: "destructive",
        title: t('chatPanel.toast.saveFailedTitle'),
        description: t('chatPanel.toast.saveMessageToDbFailed'),
      });
    }
  }, [task?.id, toast, t]); // Dependencies for useCallback
  // --- End saveMessageToDb definition ---

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
        content: t('chatPanel.initialAssistantMessage', { taskTitle: task.title }),
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

        // Fetch task notes - voeg id toe aan select
        const { data: dbNotes, error: notesError } = await supabase
          .from('task_notes')
          .select('id, content, created_at')
          .eq('task_id', task.id)
          .order('created_at', { ascending: true });
        
        if (notesError) throw notesError;

        // ---> NIEUW: Fetch saved research (inclusief citations) <---
        const { data: dbResearch, error: researchError } = await supabase
          .from('saved_research')
          // ---> NIEUW: Selecteer ook 'citations' en 'subtask_title' <---
          .select('id, research_content, created_at, citations, subtask_title') 
          .eq('task_id', task.id)
          .order('created_at', { ascending: true });
        
        // Typeer dbResearch expliciet
        const typedDbResearch = dbResearch as SavedResearchRow[] | null;

        if (researchError) {
          // Log de fout, maar ga verder, misschien is er geen onderzoek
          console.warn("Could not fetch saved research:", researchError.message);
        }
        // ---> EINDE NIEUW <---

        // Define interfaces for fetched data to avoid 'any'
        interface DbNote {
           id: string; // <-- Interface klopt al
           content: string;
           created_at: string;
        }

        // Map chat messages
        const loadedChatMessages: Message[] = (dbMessages || []).map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at).getTime(),
          messageType: isValidMessageType(msg.message_type) ? msg.message_type : undefined
        })) as Message[];

        // Map notes
        const loadedNotes: Message[] = (dbNotes || []).map((note: DbNote) => ({
          role: 'user',
          content: note.content,
          timestamp: new Date(note.created_at).getTime(),
          messageType: 'note_saved',
          dbId: note.id
        }));

        // ---> NIEUW: Map saved research <--- 
        const loadedResearch: Message[] = (typedDbResearch || []).map((research: SavedResearchRow) => { 
          // Type assertion en validatie voor citations
          let mappedCitations: string[] | undefined = undefined;
          // Check of het een array is
          if (Array.isArray(research.citations)) {
              // Check of alle elementen strings zijn
              if (research.citations.every((item) => typeof item === 'string')) {
                  // Cast naar string[] als beide checks slagen
                  mappedCitations = research.citations as string[];
              }
          } 
          
          return {
              role: 'assistant',
              content: research.research_content,
              timestamp: new Date(research.created_at).getTime(),
              messageType: 'saved_research_display',
              dbId: research.id,
              citations: mappedCitations, // Gebruik de gevalideerde/gemapte array
              subtask_title: research.subtask_title // <-- NIEUW: subtask_title toevoegen
          };
        });
        // ---> EINDE NIEUW <---

        // Combine and sort messages, notes, and research
        const combinedMessages = [...loadedChatMessages, ...loadedNotes, ...loadedResearch].sort(
          (a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0)
        );

        // Set initial welcome message + combined history
        setMessages([initialMessage, ...combinedMessages]);

      } catch (error) {
        console.error("Fout bij laden berichten en notities:", error);
        toast({
          variant: "destructive",
          title: t('chatPanel.toast.loadFailedTitle'),
          description: t('chatPanel.toast.loadMessagesAndNotesFailed'),
        });
        setMessages([initialMessage]); // Fallback to only welcome message
      } finally {
        setIsLoading(false);
      }
    };

    loadMessagesAndNotes();
  }, [task?.id, task?.title, toast, reloadTrigger, t]);

  // Effect to handle selected subtask
  useEffect(() => {
    if (selectedSubtaskTitle && task?.id) {
      const handleSubtaskSelection = async () => {
          const systemMessage: Message = {
            role: "assistant",
            content: t('chatPanel.subtaskSelectedMessage', { subtaskTitle: selectedSubtaskTitle }),
            timestamp: Date.now(),
            messageType: 'system'
          };
          setMessages((prev) => [...prev, systemMessage]);
          await saveMessageToDb(systemMessage);
      };
      handleSubtaskSelection();
    }
  }, [selectedSubtaskTitle, task?.id, saveMessageToDb, t]);

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
      // Save user message *before* potential AI interaction
      await saveMessageToDb(userMessage);

      // ---> Nogmaals Aangepaste Check voor Trigger Phrases (NL/EN) <---
      const inputLower = currentInput.toLowerCase();

      // Definieer keywords per taal voor Subtaken
      const dutchVerbs = ["genere", "maak", "splits", "deel ", "aanmaken"];
      // Voeg 'taken' toe aan de nouns
      const dutchNouns = ["subta", "taken"]; 
      const englishVerbs = ["generate", "create", "split", "break "];
      // Voeg 'tasks' toe aan de nouns
      const englishNouns = ["subtask", "tasks"];

      // Check voor Subtaken
      const hasDutchVerb = dutchVerbs.some(verb => inputLower.includes(verb));
      const hasEnglishVerb = englishVerbs.some(verb => inputLower.includes(verb));

      // Check of een van de zelfstandige naamwoorden aanwezig is
      const hasDutchNoun = dutchNouns.some(noun => inputLower.includes(noun));
      const hasEnglishNoun = englishNouns.some(noun => inputLower.includes(noun));

      // Combineer de checks: (NL Werkwoord EN NL Noun) OF (EN Werkwoord EN EN Noun)
      const requiresSubtaskGeneration = (hasDutchVerb && hasDutchNoun) || (hasEnglishVerb && hasEnglishNoun);

      // ---> NIEUW: Definieer keywords voor Onderzoek <---
      const researchKeywords = ["onderzoek", "research", "zoek op", "find out", "investigate"];
      const requiresResearch = researchKeywords.some(keyword => inputLower.includes(keyword));

      // Gedetailleerde logging (uitgebreid)
      // console.log(`[DEBUG] Checking input: "${inputLower}"`);
      // console.log(`[DEBUG] NL Check: Verb? ${hasDutchVerb}, Noun? ${hasDutchNoun}. EN Check: Verb? ${hasEnglishVerb}, Noun? ${hasEnglishNoun}.`);
      // console.log(`[DEBUG] Requires Subtask Generation? ${requiresSubtaskGeneration}`);
      // console.log(`[DEBUG] Requires Research? ${requiresResearch}`); // <-- Nieuwe log

      if (requiresSubtaskGeneration) {
        // console.log("[DEBUG] *** Subtask generation keywords DETECTED ***");
        setIsLoading(true); // Toon laadindicator
        try {
          // Roep de nieuwe Edge Function aan
          // console.log(`[DEBUG] Invoking generate-subtasks for taskId: ${task.id}`); // Log function call
          const { data: subtaskData, error: subtaskError } = await supabase.functions.invoke('generate-subtasks', {
            body: { taskId: task.id }
          });

          // console.log("[DEBUG] Response from generate-subtasks:", { subtaskData, subtaskError }); // Log response

          if (subtaskError) throw subtaskError;
          // Extra check op de structuur van subtaskData
          if (!subtaskData || typeof subtaskData !== 'object' || !Array.isArray(subtaskData.subtasks)) {
            console.error("[DEBUG] Invalid subtaskData structure:", subtaskData);
            throw new Error("Ongeldige response structuur ontvangen van generate-subtasks functie.");
          }

          // Haal huidige taak data op om subtaken te mergen (via context)
          // We gaan ervan uit dat 'task' prop up-to-date is, of we moeten opnieuw fetchen.
          // Laten we aannemen dat task.subtasks de huidige array bevat.
          const existingSubtasks = task.subtasks || []; 
          const newSubtasks = subtaskData.subtasks.map((st: { title: string }) => ({ // <-- Type hier expliciet maken
            id: crypto.randomUUID(), // Genereer een unieke ID aan de frontend kant
            title: st.title,
            completed: false,
            created_at: new Date().toISOString() // Optioneel: timestamp toevoegen?
          }));
          
          const combinedSubtasks = [...existingSubtasks, ...newSubtasks];
          // console.log("[DEBUG] Combined subtasks to save:", combinedSubtasks); // Log data to save

          // Update de taak in de database via TaskContext
          await updateTask(task.id, { subtasks: combinedSubtasks });

          // Maak een bevestigingsbericht met expliciete HTML lijst
          let confirmationContent = "Oké, ik heb de volgende subtaken toegevoegd:\n<ul>\n"; // Start HTML lijst
          newSubtasks.forEach((st: { title: string }) => {
            // Wrap elk item in <li> tags
            confirmationContent += `  <li>${st.title}</li>\n`; 
          });
          confirmationContent += "</ul>"; // Sluit HTML lijst

          const confirmationMessage: Message = {
            role: "assistant",
            content: confirmationContent,
            timestamp: Date.now(),
            messageType: 'action_confirm'
          };
          setMessages((prev) => [...prev, confirmationMessage]);
          await saveMessageToDb(confirmationMessage);

          toast({ title: "Subtaken gegenereerd en toegevoegd!" });
          // Optioneel: Forceer refresh van taakdetails/lijst als context niet automatisch update

        } catch (error) {
          console.error("[DEBUG] Fout in generate-subtasks catch block:", error); // Log de specifieke error
          const errorMsg = error instanceof Error ? error.message : "Onbekende fout";
          const errorMessage: Message = { 
            role: "assistant", 
            content: `Sorry, het genereren van subtaken is mislukt: ${errorMsg}`,
            timestamp: Date.now(),
            messageType: 'error'
          };
          setMessages((prev) => [...prev, errorMessage]);
          await saveMessageToDb(errorMessage); 
          toast({ variant: "destructive", title: "Subtaak Generatie Mislukt", description: errorMsg });
        } finally {
          setIsLoading(false);
        }
        // Sla de normale chat AI aanroep over
        return; // Belangrijk: stop hier de executie voor dit bericht
      } else if (requiresResearch) { // <-- Nieuwe ELSE IF voor Onderzoek
        // console.log("[DEBUG] *** Research keywords DETECTED ***");
        // Roep de bestaande handleDeepResearch functie aan
        handleDeepResearch(); 
        // Belangrijk: Sla de normale chat AI aanroep over
        return; 
      } else {
        // Aangepaste log voor als geen enkele trigger matcht
        // console.log("[DEBUG] Geen speciale keywords gedetecteerd. Door naar normale chat."); 
      }
      // ---> EINDE Checks <---

      // Als GEEN trigger is gedetecteerd, ga door met de normale chat flow
      setIsLoading(true); // Zet isLoading hier, na de checks
      
      try {
        // Prepare Chat History
        const historyToInclude = messages
          .filter(msg => msg.role === 'user' || (msg.role === 'assistant' && (msg.messageType === 'standard'))) 
          .slice(-8) 
          .map(msg => ({ role: msg.role, content: msg.content }));

        // Haal taalvoorkeur op, met fallback naar 'nl'
        const languagePreference = user?.language_preference || 'nl'; 
        // console.log(`Calling generate-chat-response function with mode: ${selectedModel}, lang: ${languagePreference}, and ${historyToInclude.length} history messages.`);

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
        // console.log("AI Response Received:", JSON.stringify(aiResponseData, null, 2)); 

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

  // --- NIEUW: Function to save research result ---
  const handleSaveResearch = async (message: Message) => {
    if (message.messageType !== 'research_result' || !task?.id) return;
    setIsLoading(true); // Show loading indicator while saving

    // DEBUG: Controleer de waarde van selectedSubtaskTitle bij opslaan
    console.log('[DEBUG] handleSaveResearch - selectedSubtaskTitle:', selectedSubtaskTitle); 

    try {
      const { data, error } = await supabase.functions.invoke('save-research', {
        body: {
          taskId: task.id,
          researchContent: message.content,
          citations: message.citations,
          subtaskTitle: selectedSubtaskTitle // <-- NIEUW: Stuur geselecteerde subtaak mee
        },
      });

      if (error) throw error;

      // ---> NIEUW: Haal ID op en voeg bericht toe aan state <--- 
      const savedResearchId = data?.savedResearchId; // Haal de ID op uit de response
      if (!savedResearchId) {
          console.warn("Did not receive savedResearchId from function, cannot update display message.");
          toast({ 
            title: t('chatPanel.toast.researchSavedTitle'), 
            description: data?.message || t('chatPanel.toast.researchSavedDescription')
          });
      } else {
          // ---> NIEUW: Zoek en update het bestaande bericht in state <---
          setMessages(prevMessages => 
            prevMessages.map(msg => {
              // Identificeer het originele bericht (aanname: object referentie is stabiel)
              if (msg === message) { 
                // Retourneer het bijgewerkte bericht
                return {
                  ...msg, // Behoud andere properties zoals content, timestamp, citations
                  messageType: 'saved_research_display',
                  dbId: savedResearchId
                };
              }
              // Geef andere berichten ongewijzigd terug
              return msg;
            })
          );
          // ---> EINDE NIEUW <---

          toast({ 
            title: t('chatPanel.toast.researchSavedTitle'), 
            description: data?.message || t('chatPanel.toast.researchSavedDescription')
          });
      }
      // ---> EINDE NIEUW <---

    } catch (error: unknown) {
      console.error('Error calling save-research function:', error);
      let errorDescription = t('chatPanel.toast.saveResearchFailedDescriptionDefault');
      if (error instanceof Error) {
        errorDescription = error.message;
      }
      toast({
        variant: "destructive",
        title: t('chatPanel.toast.saveFailedTitle'),
        description: errorDescription,
      });
    } finally {
      setIsLoading(false);
    }
  };
  // --- Einde NIEUW ---

  // Function to handle closing the chat view
  const handleCloseChat = () => {
    navigate('/'); // Navigeer naar de dashboard pagina
  };

  // Function to trigger deep research
  const handleDeepResearch = async () => {
    // --- Use hasPermission check --- 
    if (!hasPermission(user, 'deepResearch')) { // Check using the new function
      toast({
        variant: "default", 
        title: "Feature niet beschikbaar",
        description: "Deep Research is alleen beschikbaar voor uw account type.", // Adjusted message slightly
      });
      return; 
    }
    // --- End permission check ---

    if (!task?.id || isResearching) return; // Voorkom dubbel starten

    // ---> NIEUW: Reset cancel state <---
    setResearchCancelled(false);
    // ---> EINDE NIEUW <---
    setIsResearching(true);
    
    // ---> NIEUW: Bepaal de query en context o.b.v. geselecteerde subtaak <---
    let researchQuery = task.title; // Standaard: hoofdtaak titel
    let researchDescription = task.description || "";
    let contextQuery: string | undefined = undefined;
    let userMessageContent = `Oké, ik start een diep onderzoek naar: "${researchQuery}"`;

    if (selectedSubtaskTitle) {
      researchQuery = selectedSubtaskTitle; // Gebruik subtaak als hoofdquery
      researchDescription = ""; // Hoofdbeschrijving is minder relevant voor subtaak onderzoek
      contextQuery = task.title; // Geef hoofdtaak mee als context
      userMessageContent = `Oké, ik start een diep onderzoek naar subtaak: "${researchQuery}" (voor hoofdtaak: "${contextQuery}")`;
    }
    // ---> EINDE NIEUW <---

    const researchInitiationMessage: Message = {
      role: "assistant",
      content: userMessageContent, // Gebruik de dynamische boodschap
      timestamp: Date.now(),
      messageType: 'system'
    };
    setMessages(prev => [...prev, researchInitiationMessage]);
    await saveMessageToDb(researchInitiationMessage);
    setIsLoading(true);
    
    try {
      const languagePreference = user?.language_preference || 'nl';
      // ---> NIEUW: Stuur juiste parameters mee <---
      const requestBody: { 
        query: string;
        description?: string;
        contextQuery?: string;
        languagePreference: string;
      } = {
        query: researchQuery,
        languagePreference: languagePreference,
      };
      // Voeg description of contextQuery conditioneel toe
      if (contextQuery) {
        requestBody.contextQuery = contextQuery;
      } else if (researchDescription) {
        requestBody.description = researchDescription;
      }
      // ---> NIEUW: Log de waarden vlak voor de API call <---
      // console.log('[DEBUG] handleDeepResearch - Values before invoke:', {
      //   selectedSubtaskTitle, 
      //   researchQuery, 
      //   researchDescription, 
      //   contextQuery,
      //   languagePreference,
      //   requestBody 
      // });
      // ---> EINDE NIEUW <---
      
      const { data, error } = await supabase.functions.invoke('deep-research', {
        body: requestBody, 
      });

      if (error) throw error;

      // ---> NIEUW: Check of onderzoek geannuleerd is <---
      if (researchCancelled) {
        // console.log("[DEBUG] Research was cancelled by user. Discarding result.");
        return; // Stop verwerking als geannuleerd
      }
      // ---> EINDE NIEUW <---

      const resultMessage: Message = {
        role: "assistant",
        content: data?.researchResult || "Kon geen onderzoeksresultaten vinden.",
        citations: data?.citations,
        timestamp: Date.now(),
        messageType: 'research_result'
      };
      setMessages(prev => [...prev, resultMessage]);
      await saveMessageToDb(resultMessage); // Save result message

    } catch (error: unknown) {
      console.error('Error calling deep-research function:', error);
      let errorDescription = t('chatPanel.toast.deepResearchFailedDescriptionDefault');
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
        title: t('chatPanel.toast.deepResearchFailedTitle'),
        description: errorDescription,
      });
    } finally {
      setIsLoading(false);
      setIsResearching(false);
       // ---> NIEUW: Reset cancel state ook in finally <---
       setResearchCancelled(false);
       // ---> EINDE NIEUW <---
    }
  };

  // ---> NIEUW: Functie voor annuleren <---
  const handleCancelResearch = () => {
    // console.log("[DEBUG] Cancelling research...");
    setResearchCancelled(true); // Zet de vlag
    setIsResearching(false); // Stop de laadindicator
    setIsLoading(false); // Stop ook algemene laadindicator
    // Optioneel: Toon een toast
    toast({ title: t('chatPanel.toast.researchCancelledTitle'), description: t('chatPanel.toast.researchCancelledDescription'), variant: "default" });
  };
  // ---> EINDE NIEUW <---

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
        content: t('chatPanel.initialAssistantMessage', { taskTitle: task.title }),
        timestamp: Date.now(),
        messageType: 'system'
       };
      // Filter de huidige berichten: behoud de initialMessage (als die er is) 
      // en alle berichten die een notitie zijn (type 'note_saved') of opgeslagen onderzoek ('saved_research_display').
      setMessages(prevMessages => [
          initialMessage, 
          ...prevMessages.filter(msg => msg.messageType === 'note_saved' || msg.messageType === 'saved_research_display')
      ]);

      toast({ title: t('chatPanel.toast.historyClearedTitle'), description: t('chatPanel.toast.historyClearedDescription') });

    } catch (error: unknown) {
      console.error("Fout bij wissen geschiedenis:", error);
      let errorMsg = t('chatPanel.toast.clearHistoryFailedDefault');
      if (error instanceof Error) {
        errorMsg = error.message;
      }
      toast({ variant: "destructive", title: t('chatPanel.toast.clearHistoryFailedTitle'), description: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to export chat
  const handleExportChat = () => {
    if (messages.length === 0) {
      toast({ variant: "destructive", title: t('chatPanel.toast.exportFailedTitle'), description: t('chatPanel.toast.exportFailedDescription') });
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

    toast({ title: t('chatPanel.toast.exportStartedTitle'), description: t('chatPanel.toast.exportStartedDescription') });
  };

  // ---> NIEUW: Function to delete a note <--- 
  const handleDeleteNote = async (noteIdToDelete: string) => {
    if (!noteIdToDelete) return;

    // Optimistic UI update: Remove message immediately
    const originalMessages = messages;
    setMessages(prev => prev.filter(msg => msg.dbId !== noteIdToDelete));

    try {
      const { error } = await supabase
        .from('task_notes')
        .delete()
        .eq('id', noteIdToDelete);

      if (error) throw error;

      toast({ 
        title: t('chatPanel.toast.noteDeletedTitle'), 
        description: t('chatPanel.toast.noteDeletedDescription')
      });

    } catch (error: unknown) {
      console.error('Error deleting note:', error);
      // Revert optimistic update on error
      setMessages(originalMessages);
      let errorDescription = t('chatPanel.toast.deleteNoteFailedDefault');
      if (error instanceof Error) {
        errorDescription = error.message;
      }
      toast({
        variant: "destructive",
        title: t('chatPanel.toast.deleteFailedTitle'),
        description: errorDescription,
      });
    } 
    // Geen setIsLoading nodig hier, tenzij we een aparte laadindicator per bericht willen
  };
  // ---> EINDE NIEUW <--- 

  // ---> NIEUW: Function to delete saved research <--- 
  const handleDeleteResearch = async (researchIdToDelete: string) => {
    if (!researchIdToDelete) return;

    try {
      // Roep de nieuwe Edge Function aan
      const { error } = await supabase.functions.invoke('delete-research', {
        body: { researchId: researchIdToDelete }
      });

      if (error) throw error; // Gooi de fout zodat de catch het oppakt

      toast({ 
        title: t('chatPanel.toast.researchDeletedTitle'), 
        description: t('chatPanel.toast.researchDeletedDescription')
      });
      setReloadTrigger(prev => prev + 1); // <-- TRIGGER HERLADEN NA SUCCES

    } catch (error: unknown) {
      console.error('Error deleting saved research:', error);
      let errorDescription = t('chatPanel.toast.deleteResearchFailedDescriptionDefault');
      if (error instanceof Error) {
        errorDescription = error.message;
      }
      toast({
        variant: "destructive",
        title: t('chatPanel.toast.deleteFailedTitle'),
        description: errorDescription,
      });
    } 
    // Optioneel: setIsLoading state toevoegen als het lang duurt?
  };
  // ---> EINDE NIEUW <--- 

  // DEBUG: Log messages state before returning JSX
  // console.log('[DEBUG] ChatPanel messages state before render:', messages);

  useEffect(() => {
    // console.log('[DEBUG] ChatPanel messages state before render:', messages);
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]);

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
          <span className="sr-only">{t('chatPanel.closeSR')}</span>
        </Button>

        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`group flex items-start gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
          >
            {/* Conditionally render icons based on role and messageType */}
            {/* Toon Bot icon voor assistent, BEHALVE voor opgeslagen onderzoek */}
            {(message.role === 'assistant' && message.messageType !== 'saved_research_display') && (
              <div className="mt-1 flex-shrink-0">
                <Bot className="h-5 w-5 text-muted-foreground" /> 
              </div>
            )}
            {/* Toon BookOpen icon ALLEEN voor opgeslagen onderzoek */}
            {message.messageType === 'saved_research_display' && (
              <div className="mt-1 flex-shrink-0">
                <BookOpen className="h-5 w-5 text-purple-400" /> 
              </div>
            )}
            <div
              className={`chat-message relative p-3 rounded-lg max-w-[80%] group ${ 
                message.messageType === 'note_saved' 
                  ? "chat-message-note-saved"
                  : message.messageType === 'saved_research_display'
                    ? "chat-message-saved-research"
                    : message.role === "user"
                      ? "chat-message-user"
                      : message.messageType === 'research_result' 
                        ? "chat-message-research"
                        : "chat-message-ai"
              }`}
            >
              {/* ---> NIEUW: Toon subtaak referentie indien aanwezig <--- */}
              {message.messageType === 'saved_research_display' && message.subtask_title && (
                <p className="text-xs text-muted-foreground/80 mb-2 border-b border-white/10 pb-1.5 italic">
                  {t('chatPanel.researchForSubtaskLabel', { subtaskTitle: message.subtask_title })}
                </p>
              )}
              {/* ---> EINDE NIEUW <--- */}
              
              {(message.messageType === 'note_saved' || message.messageType === 'saved_research_display') ? (
                <div className="text-sm">
                  <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        p: ({node, ...props}) => <p className="mb-2" {...props} />,
                        h1: ({node, ...props}) => <h1 className="text-xl font-semibold mb-3 mt-4" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-lg font-semibold mb-3 mt-4" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-base font-semibold mb-2 mt-4" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 ml-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 ml-1" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        a: ({node, ...props}) => <a className="text-blue-400 hover:underline" {...props} target="_blank" rel="noopener noreferrer" /> 
                      }}
                    >
                      {message.content} 
                  </ReactMarkdown>
                </div>
              ) : message.role === 'assistant' ? (
                <div className="text-sm">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      p: ({node, ...props}) => <p className="mb-2" {...props} />,
                      h1: ({node, ...props}) => <h1 className="text-xl font-semibold mb-3 mt-4" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-lg font-semibold mb-3 mt-4" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-base font-semibold mb-2 mt-4" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 ml-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 ml-1" {...props} />,
                      li: ({node, ...props}) => <li className="mb-1" {...props} />,
                      a: ({node, ...props}) => <a className="text-blue-400 hover:underline" {...props} target="_blank" rel="noopener noreferrer" /> 
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              )}

              {/* ---> NIEUW: Toon citaties voor ELK bericht dat ze heeft <---
              Dit blok staat nu BUITEN de conditionele rendering voor messageType/role,
              dus het wordt getoond als message.citations bestaat, ongeacht bericht type. */}
              {message.citations && message.citations.length > 0 && (
                <div className="mt-4 border-t border-white/10 pt-2">
                  <h4 className="text-xs font-semibold mb-1 text-muted-foreground">{t('chatPanel.sourcesLabel')}</h4>
                  <ol className="list-decimal list-inside text-xs space-y-1">
                    {message.citations.map((url, index) => (
                      <li key={index}>
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline break-all"
                        >
                          {url}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {/* ---> EINDE NIEUW <--- */}

              {message.timestamp && (
                <div className="text-xs opacity-60 mt-1 text-right">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              <Button 
                variant="ghost"
                size="icon"
                className={`absolute h-5 w-5 opacity-0 group-hover:opacity-75 transition-opacity duration-200 text-current hover:bg-transparent ${
                  message.role === 'user' ? 'bottom-1.5 left-1.5' : 'bottom-1.5 right-12'
                }`} 
                onClick={() => handleCopy(message.content)}
                title={t('chatPanel.copyMessageTitle')}
              >
                <Copy className="h-4 w-4" />
                <span className="sr-only">{t('chatPanel.copyMessageSR')}</span>
              </Button>
              {message.messageType === 'research_result' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`absolute h-5 w-5 opacity-0 group-hover:opacity-75 transition-opacity duration-200 text-current hover:bg-transparent ${
                    message.role === 'user' ? 'bottom-1.5 left-8' : 'bottom-1.5 right-[4.5rem]'
                  }`}
                  onClick={() => handleSaveResearch(message)}
                  title={t('chatPanel.saveResearchTitle')}
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4" />
                  <span className="sr-only">{t('chatPanel.saveResearchSR')}</span>
                </Button>
              )}
              {message.messageType === 'note_saved' && message.dbId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`absolute h-5 w-5 opacity-0 group-hover:opacity-75 transition-opacity duration-200 text-current hover:bg-transparent hover:text-foreground ${
                    'bottom-1.5 left-8' 
                  }`}
                  onClick={() => handleDeleteNote(message.dbId!)}
                  title={t('chatPanel.deleteNoteTitle')}
                  disabled={isLoading} 
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">{t('chatPanel.deleteNoteSR')}</span>
                </Button>
              )}
              {message.messageType === 'saved_research_display' && message.dbId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`absolute h-5 w-5 opacity-0 group-hover:opacity-75 transition-opacity duration-200 text-current hover:bg-transparent hover:text-foreground ${
                    'bottom-1.5 right-[4.5rem]'
                  }`}
                  onClick={() => handleDeleteResearch(message.dbId!)}
                  title={t('chatPanel.deleteResearchTitle')}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">{t('chatPanel.deleteResearchSR')}</span>
                </Button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="group flex items-start gap-2 justify-start mb-4">
             <div className="mt-1 flex-shrink-0">
               <Bot className="h-5 w-5 text-muted-foreground" />
             </div>
            <div className="chat-message chat-message-ai p-3 rounded-lg max-w-[80%]">
              <div className="flex items-center gap-2">
                <GradientLoader size="sm" />
                <p>{isResearching ? t('chatPanel.researchingText') : t('chatPanel.typingText')}</p>
              </div>
            </div>
          </div>
        )}
        {/* ---> NIEUW: Toon Annuleerknop tijdens onderzoek <--- */}
        {isResearching && (
           <div className="flex justify-center my-2">
              <Button variant="destructive" size="sm" onClick={handleCancelResearch}>
                {t('chatPanel.cancelResearchButton')}
              </Button>
           </div>
        )}
        {/* ---> EINDE NIEUW <--- */}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="p-4">
        <div className="relative flex items-end gap-2">
          <Textarea
            className="chat-input flex-grow resize-none pr-10 pt-3 pb-1"
            placeholder={isNoteMode ? t('chatPanel.notePlaceholder') : t('chatPanel.messagePlaceholder')}
            value={input}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
          />
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent side="top" align="end" sideOffset={5} className="bg-popover/90 backdrop-blur-lg">
                <p>{isNoteMode ? t('chatPanel.saveNoteTooltip') : t('chatPanel.sendMessageTooltip')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </form>

      <div className="p-2 px-4 border-t border-white/5 flex items-center justify-between gap-2 bg-background/50">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className={`gap-1 border-white/10 hover:bg-secondary bg-secondary/50 ${!hasPermission(user, 'deepResearch') ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleDeepResearch}
            disabled={isLoading || isNoteMode || !hasPermission(user, 'deepResearch')}
            title={!hasPermission(user, 'deepResearch') ? t('chatPanel.deepResearchDisabledTooltip') : t('chatPanel.deepResearchTooltip')}
          >
            <BrainCircuit className="h-4 w-4" />
            <span className="hidden sm:inline">{t('chatPanel.researchButton')}</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={`gap-1 border-white/10 hover:bg-secondary ${isNoteMode ? 'bg-yellow-600/30 border-yellow-500/50 text-yellow-300' : 'bg-secondary/50'}`}
            onClick={() => setIsNoteMode(!isNoteMode)}
            disabled={isLoading}
          >
            <PenSquare className="h-4 w-4" />
            <span className="hidden sm:inline">{isNoteMode ? t('chatPanel.stopNoteButton') : t('chatPanel.newNoteButton')}</span>
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isNoteMode || isLoading}>
            <SelectTrigger 
              className="w-auto h-8 px-2 bg-secondary/50 border-white/10 hover:bg-secondary focus:ring-0 focus:ring-offset-0 disabled:opacity-50"
              aria-label={t('chatPanel.selectModelAriaLabel')}
            >
              {React.createElement(aiModels.find((m: AIModel) => m.id === selectedModel)?.icon || Settings, { className: "h-4 w-4" })}
            </SelectTrigger>
            <SelectContent align="end" side="top" className="glass-effect min-w-[180px]">
              {aiModels.map((model: AIModel) => {
                // Determine if the option should be disabled based on permission
                const isDisabled = 
                  (model.id === 'creative' || model.id === 'precise') && 
                  !hasPermission(user, 'chatModes');
                
                // Determine if the tooltip should be shown
                const showTooltip = isDisabled && (model.id === 'creative' || model.id === 'precise');

                const selectItemContent = (
                  <SelectItem 
                    key={model.id} 
                    value={model.id}
                    disabled={isDisabled}
                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                    // Prevent closing the dropdown when a disabled item is clicked
                    onSelect={(e) => { if (isDisabled) e.preventDefault(); }}
                  >
                    <div className="flex items-center gap-2">
                      {React.createElement(model.icon, { className: "h-4 w-4" })}
                      <span>{model.name}</span>
                    </div>
                  </SelectItem>
                );

                // Wrap with Tooltip only if needed
                return showTooltip ? (
                  <TooltipProvider key={model.id} delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>{selectItemContent}</TooltipTrigger>
                      <TooltipContent side="left" align="center" className="bg-popover/90 backdrop-blur-lg">
                        <p>{t('chatPanel.chatModesDisabledTooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  selectItemContent
                );
              })}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
                {/* sr-only for settings button if needed */}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="glass-effect">
              {/* DEBUG Logs verwijderd */}
              
              <DropdownMenuItem onClick={handleClearHistory} disabled={isLoading}>
                {t('chatPanel.clearHistoryButton')}
              </DropdownMenuItem>
              {/* Separator alleen tonen als Export ook getoond wordt */}
              {(user && user.enabled_features && user.enabled_features.includes('exportChat')) && (
                <DropdownMenuSeparator />
              )}
              {/* Directe check i.p.v. hasPermission */}
              {(user && user.enabled_features && user.enabled_features.includes('exportChat')) && ( 
                <DropdownMenuItem onClick={handleExportChat}>
                  {t('chatPanel.exportChatButton')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </>
  );
}

