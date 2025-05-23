import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Task, SubTask } from "@/types/task.ts";
import { Button } from "@/components/ui/button.tsx";
import { Loader2, X, Brain, ListChecks, SparklesIcon, Search, MessageCircleMore } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTask } from "@/contexts/TaskContext.hooks.ts";
import { useAuth } from "@/hooks/useAuth.ts";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { Message } from "./types.ts";
import { MessageList } from "./MessageList.tsx";
import { ChatInput } from "./ChatInput.tsx";
import { ChatControls } from "./ChatControls.tsx";
import { useMessages, ensureMessageHasId } from "./hooks/useMessages.ts";
import { PinnedMessagesSection } from "./PinnedMessagesSection.tsx";
import { useDeepResearch, ResearchMode } from "./hooks/useDeepResearch.ts";
import { Input } from "@/components/ui/input.tsx";

/**
 * Props for the ChatPanel component.
 */
interface ChatPanelProps {
  /** The current task object, or null if no task is selected. */
  task: Task | null;
  /** The title of the currently selected subtask, if any. */
  selectedSubtaskTitle?: string | null;
}

/**
 * ChatPanel component provides the main chat interface for interacting with the AI regarding a task.
 * It handles message display, input, AI responses, research initiation, note-taking, and other chat-related functionalities.
 * 
 * @param {ChatPanelProps} props - The props for the component.
 * @returns {JSX.Element} The ChatPanel component.
 */
export default function ChatPanel({ task, selectedSubtaskTitle }: ChatPanelProps) {
  const { updateTask, addSubtask, deleteSubtask, deleteAllSubtasks, updateSubtask } = useTask();
  const {
    messages,
    addMessage,
    updateMessage,
    isLoading: messagesLoading,
    error: messagesError,
    clearHistory,
    deleteNote,
    deleteResearch,
    togglePinMessage,
    setMessages: setRawMessages,
  } = useMessages(task?.id ?? null, task?.title ?? null, selectedSubtaskTitle ?? null);
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false); // Tracks if the main chat input is focused

  const [currentResearchMode, setCurrentResearchMode] = useState<ResearchMode>('research');
  const [showSearchInput, setShowSearchInput] = useState(false); // Controls visibility of the search input field
  const [searchInputText, setSearchInputText] = useState(""); // Text content of the search input
  const [isSearchingMessages, setIsSearchingMessages] = useState(false); // True if search is for messages, false for research

  const filteredMessages = useMemo(() => {
    if (!isSearchingMessages || !searchInputText.trim()) {
      return messages;
    }
    const searchTerm = searchInputText.toLowerCase();
    return messages.filter(message => 
      message.content.toLowerCase().includes(searchTerm)
    );
  }, [messages, searchInputText, isSearchingMessages]);

  const {
    startDeepResearch,
    isResearching,
    cancelResearch,
  } = useDeepResearch({
    task, 
    addMessage, 
    updateMessage, 
    setMessages: setRawMessages 
  });

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    }, 100);  // Short delay to ensure the DOM is fully updated
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  // Scroll to bottom when a subtask is selected
  useEffect(() => {
    if (selectedSubtaskTitle) {
      scrollToBottom();
    }
  }, [selectedSubtaskTitle, scrollToBottom]);

  // Effect to hide the main navigation when chat input is focused on mobile
  useEffect(() => {
    // Check if we're on a mobile device
    if (typeof globalThis !== 'undefined' && typeof globalThis.innerWidth === 'number' && globalThis.innerWidth < 768) {
      if (isInputFocused) {
        // Add CSS class to body element to hide navigation
        document.body.classList.add('chat-input-focused');
      } else {
        // Remove CSS class from body element
        document.body.classList.remove('chat-input-focused');
      }
    }

    // Cleanup function to ensure the class is removed on unmount
    return () => {
      document.body.classList.remove('chat-input-focused');
    };
  }, [isInputFocused]);

  /**
   * Navigates to the home page to close the chat panel.
   */
  const handleCloseChat = () => navigate('/');

  /**
   * Copies the given text to the clipboard and shows a toast notification.
   * @param {string} text - The text to copy.
   */
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: t('chatPanel.toast.copiedTitle'), description: t('chatPanel.toast.copiedDescription') });
    }, (_err) => {
      toast({ variant: "destructive", title: t('chatPanel.toast.copyFailedTitle'), description: t('chatPanel.toast.copyFailedDescription') });
    });
  };

  /**
   * Saves a new note to the database and adds a confirmation message to the chat.
   * @param {string} noteContent - The content of the note to save.
   * @returns {Promise<boolean>} True if the note was saved successfully, false otherwise.
   */
  const handleSaveNote = async (noteContent: string) => {
    if (!task?.id) return false;
    let success = false;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('chatPanel.errors.userNotLoggedIn'));
      const { data: savedNote, error } = await supabase
        .from('task_notes')
        .insert({ task_id: task.id, user_id: user.id, content: noteContent })
        .select('id')
        .single();
      if (error) throw error;
      if (!savedNote?.id) throw new Error("Failed to retrieve ID after saving note.");
      const savedNoteMessage = ensureMessageHasId({
        role: "user",
        content: noteContent,
        messageType: 'note_saved',
        dbId: savedNote.id
      });
      addMessage(savedNoteMessage, false);
      toast({ title: t('chatPanel.toast.noteSavedTitle') });
      success = true;
    } catch (error: unknown) {
      let errorMsg = t("chatPanel.toast.saveNoteFailedDefault");
      if (error instanceof Error) errorMsg = error.message;
      toast({ variant: "destructive", title: t('chatPanel.toast.saveFailedTitle'), description: errorMsg });
      success = false;
    }
    return success;
  };

  /**
   * Deletes a note by its ID.
   * @param {string} noteIdToDelete - The ID of the note to delete.
   */
  const handleDeleteNote = (noteIdToDelete: string) => {
    if (!task?.id) return;
    deleteNote(noteIdToDelete);
  };

  /**
   * Deletes a saved research item by its ID.
   * @param {string} researchIdToDelete - The ID of the research item to delete.
   */
  const handleDeleteResearch = (researchIdToDelete: string) => {
    if (!task?.id) return;
    deleteResearch(researchIdToDelete);
  };

  /**
   * Exports the current chat conversation to a text file.
   */
  const handleExportChat = () => {
    if (!task) {
      toast({ variant: "destructive", title: t('chatPanel.toast.exportFailedTitle'), description: t('chatPanel.toast.exportFailedDescriptionNoTask') });
      return;
    }
    if (messages.length === 0) {
      toast({ variant: "destructive", title: t('chatPanel.toast.exportFailedTitle'), description: t('chatPanel.toast.exportFailedDescription') });
      return;
    }

    let exportContent = `${t('chatPanel.export.chatConversationForTask')} ${task.title}\n`;
    exportContent += `${t('chatPanel.export.exportedOn')} ${new Date().toLocaleString()}\n\n`;
    exportContent += "==================================================\n\n";

    messages.forEach(message => {
      const timestamp = message.timestamp ?? Date.now();
      const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const role = message.role === 'user' ? t('chatPanel.export.roleUser') : t('chatPanel.export.roleAssistant');
      exportContent += `[${time}] ${role}:\n`;
      exportContent += `${message.content}\n\n`;
    });

    const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = task.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `chat_${safeTitle}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: t('chatPanel.toast.exportStartedTitle'), description: t('chatPanel.toast.exportStartedDescription') });
  };

  /**
   * Initiates a deep research process based on the provided mode and prompt.
   * Adds user request and AI response/error messages to the chat.
   * This is a key function that leverages AI to do in-depth analysis on a specific topic.
   * 
   * @param {ResearchMode} [mode='research'] - The mode of research (e.g., 'research', 'instruction', 'creative').
   * @param {string} [prompt] - The specific prompt for the research. Defaults to task title or a generic title.
   */
  const handleDeepResearch = useCallback(async (mode: ResearchMode = 'research', prompt?: string) => {
    if (!task) {
      return;
    }

    const researchTopic = prompt || task.title || t('chatPanel.defaultTaskTitle');
    
    if (!researchTopic) {
      toast({ variant: "default", title: t('chatPanel.toast.topicRequiredTitle'), description: t('chatPanel.toast.topicRequiredDescription') });
      return;
    }

    setCurrentResearchMode(mode);
    try {
      await startDeepResearch(researchTopic, mode, selectedSubtaskTitle);
    } catch (error) {
      
      const errorMessage = ensureMessageHasId({
        role: 'assistant',
        content: `${t('chatPanel.research.errorMessage')}`,
        messageType: 'error'
      });
      await addMessage(errorMessage, false);
    }
    scrollToBottom();
  }, [task, t, toast, startDeepResearch, addMessage, setCurrentResearchMode, scrollToBottom, selectedSubtaskTitle]);

  /**
   * Handles the submission of the search input.
   * If in message search mode, applies the filter.
   * If in research mode, initiates deep research with the input text.
   */
  const handleSearchSubmit = () => {
    if (searchInputText.trim()) {
      if (isSearchingMessages) {
        // Search in messages
        // Filtering is already done in the useMemo above
      } else {
        // Use the old functionality for research
        handleDeepResearch(currentResearchMode, searchInputText.trim());
        setSearchInputText("");
        setShowSearchInput(false);
      }
    }
  };

  /**
   * Toggles the search mode between searching messages and initiating research.
   * Shows the search input and focuses it.
   */
  const handleSearchModeToggle = () => {
    // Force showing the search field
    setShowSearchInput(true);
    
    // Change the search mode
    const newMode = !isSearchingMessages;
    setIsSearchingMessages(newMode);
    
    if (!newMode && searchInputText.trim()) {
      // If we're switching from message search to research, clear the search
      setSearchInputText("");
    }
    
    // Focus on the search field
    setTimeout(() => {
      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }, 100);
  };

  /**
   * Updates the search input text state.
   * Shows the search input if typing and in message search mode.
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
   */
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInputText(e.target.value);
    if (isSearchingMessages && !showSearchInput) {
      setShowSearchInput(true);
    }
  };

  /**
   * Clears the search input text.
   * If not in message search mode, also hides the search input field.
   */
  const handleClearSearch = () => {
    setSearchInputText("");
    if (isSearchingMessages) {
      // Keep the search function open but clear the text
    } else {
      setShowSearchInput(false);
    }
  };

  /**
   * Handles the blur event of the search input.
   * Hides the search input if it's empty and not in message search mode.
   */
  const handleSearchBlur = () => {
    // If there's no text and we're not searching in messages, collapse the search field
    setTimeout(() => {
      if (!searchInputText.trim() && !isSearchingMessages) {
        setShowSearchInput(false);
      }
    }, 200); // Small delay to allow clicking buttons
  };

  /**
   * Handles the submission of the main chat input.
   * Processes user input for notes, research, subtask generation, or standard AI chat.
   */
  const handleSubmit = async () => {
    if (!input.trim() || !task?.id) return;
    const currentInput = input;
    setInput(""); 
    if (isNoteMode) {
      const saved = await handleSaveNote(currentInput);
      if (saved) setIsNoteMode(false); 
      scrollToBottom();
    } else {
      const userMessage = ensureMessageHasId({ role: "user", content: currentInput, messageType: 'standard' });
      await addMessage(userMessage, true);
      scrollToBottom();
      const inputLower = currentInput.toLowerCase();
      
      const customResearchTriggerNL = "onderzoek prompt:";
      const customResearchTriggerEN = "research prompt:";
      let customPrompt: string | undefined = undefined;

      if (inputLower.startsWith(customResearchTriggerNL)) customPrompt = currentInput.substring(customResearchTriggerNL.length).trim();
      else if (inputLower.startsWith(customResearchTriggerEN)) customPrompt = currentInput.substring(customResearchTriggerEN.length).trim();
      
      if (customPrompt && customPrompt.length > 0) {
        handleDeepResearch(currentResearchMode, customPrompt);
        return;
      }

      // Regex for specific subtask creation: "maak subtaak: 'titel'", "voeg subtaak 'titel' toe", "subtaak 'titel'"
      // It captures the title of the subtask.
      const specificSubtaskRegex = /(?:maak subtaak(?: aan)?|voeg subtaak toe|subtaak)[:\s]*["']?(.*?)["']?$/i;
      const specificSubtaskMatch = currentInput.match(specificSubtaskRegex);

      if (specificSubtaskMatch && specificSubtaskMatch[1] && specificSubtaskMatch[1].trim().length > 0) {
        const subtaskTitle = specificSubtaskMatch[1].trim();
        // Call generate-chat-response with ADD_SUBTASK action to create a specific subtask
        setIsAiResponding(true);
        try {
          const historyToInclude = messages.filter(msg => msg.role === 'user' || (msg.role === 'assistant' && msg.messageType === 'standard')).slice(-8).map(msg => ({ role: msg.role, content: msg.content }));
          const languagePreference = user?.language_preference || i18n.language || 'nl';
          
          // Construct a query that makes it clear to the AI what to do
          const aiQuery = `Voeg de volgende subtaak toe: "${subtaskTitle}"`;

          const { data: aiResponseData, error: functionError } = await supabase.functions.invoke('generate-chat-response', {
            body: { 
              query: aiQuery, // Pass the specific instruction to the AI
              mode: 'instruction', // Use instruction mode for direct commands
              taskId: task.id, 
              chatHistory: historyToInclude, 
              languagePreference: languagePreference,
              requestedAction: { // Explicitly request an action
                action: "ADD_SUBTASK",
                payload: { title: subtaskTitle }
              }
            },
          });

          if (functionError) throw functionError;
          if (!aiResponseData) throw new Error("AI function returned no data for specific subtask creation.");

          // The existing action handling block will process ADD_SUBTASK
          // Ensure that block uses the translated confirmation.
          // (No direct addMessage here, it's handled by the action processing switch case)

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : t("chatPanel.errors.genericAiError");
          addMessage(ensureMessageHasId({ role: "assistant", content: `${t("chatPanel.errors.specificSubtaskFailed")}: ${errorMsg}`, messageType: 'error' }), true);
          toast({ variant: "destructive", title: t('chatPanel.toast.subtaskGenerationFailedTitle'), description: errorMsg });
        } finally {
          setIsAiResponding(false);
        }
        return; // Important to return after handling specific subtask creation
      }

      // General subtask generation detection (existing logic)
      const dutchVerbs = ["genereer", "maak", "splits", "deel ", "aanmaken"];
      const englishVerbs = ["create", "split", "break "];

      const hasDutchVerb = dutchVerbs.some(verb => inputLower.includes(verb));
      const hasEnglishVerb = englishVerbs.some(verb => inputLower.includes(verb));
      
      const requiresGeneralSubtaskGeneration = 
        (inputLower.includes("genereer subtaken") || inputLower.includes("generate subtasks")) ||
        ((hasDutchVerb && inputLower.includes("subtaken")) || (hasEnglishVerb && inputLower.includes("subtasks")));
      
      // Look for research request with specific search term
      const researchPrefixes = ["onderzoek naar:", "onderzoek over:", "research:", "research about:", "zoek op over:", "find out about:", "investigate:"];
      let researchTerm: string | undefined = undefined;
      
      // Check if any of the prefixes are in the input
      for (const prefix of researchPrefixes) {
        if (inputLower.includes(prefix.toLowerCase())) {
          // Extract the text after the prefix
          const prefixIndex = inputLower.indexOf(prefix.toLowerCase());
          if (prefixIndex !== -1) {
            researchTerm = currentInput.substring(prefixIndex + prefix.length).trim();
            break;
          }
        }
      }

      // If no exact prefix is found, but the word "onderzoek" or "research" is present
      // Try to detect if there's a pattern like "do research on tax rules"
      const researchKeywords = ["onderzoek", "research", "zoek op", "find out", "investigate"];
      const requiresResearch = researchKeywords.some(keyword => inputLower.includes(keyword));

      if (requiresGeneralSubtaskGeneration) {
        try {
          const { data: subtaskResponseData, error: subtaskError } = await supabase.functions.invoke('generate-subtasks', { 
            body: { 
              taskId: task.id,
              taskTitle: task.title,
              taskDescription: task.description,
              taskPriority: task.priority,
              languagePreference: user?.language_preference || i18n.language || 'nl',
              existingSubtaskTitles: task.subtasks?.map(st => st.title) || []
            } 
          });

          if (subtaskError) throw subtaskError; // Echte functie-aanroep error

          if (subtaskResponseData && Array.isArray(subtaskResponseData.subtasks) && subtaskResponseData.subtasks.length > 0) {
            // We hebben een array met subtaken, verwerk zoals voorheen
            const existingSubtasks = task.subtasks || []; 
            const newSubtasks = subtaskResponseData.subtasks.map((st: { title: string }) => ({ id: uuidv4(), title: st.title, completed: false, createdAt: new Date().toISOString() }));
            const combinedSubtasks = [...existingSubtasks, ...newSubtasks];
            await updateTask(task.id, { subtasks: combinedSubtasks });
            
            // Create a formatted confirmation message with the list of new subtasks
            let confirmationContent = t('chatPanel.subtasksAddedConfirmation.intro') + "\n<ul>\n";
            newSubtasks.forEach((st: { title: string }) => { confirmationContent += `  <li>${st.title}</li>\n`; });
            confirmationContent += "</ul>";
            
            addMessage(ensureMessageHasId({ role: "assistant", content: confirmationContent, messageType: 'action_confirm' }), true);
            toast({ title: t('chatPanel.toast.subtasksGeneratedTitle') });

          } else if (subtaskResponseData && typeof subtaskResponseData.message === 'string' && subtaskResponseData.message.trim() !== '') {
            // De functie gaf een direct tekstbericht terug (bv. vraag om meer info)
            addMessage(ensureMessageHasId({ role: "assistant", content: subtaskResponseData.message, messageType: 'standard' }), true);
          
          } else if (subtaskResponseData && Array.isArray(subtaskResponseData.subtasks) && subtaskResponseData.subtasks.length === 0) {
            // De functie gaf een lege array subtaken terug, mogelijk met een (optioneel) bericht
            const messageToShow = subtaskResponseData.message || t('taskContext.toast.noSubtasksGeneratedDescription'); // Fallback naar een algemeen bericht
            addMessage(ensureMessageHasId({ role: "assistant", content: messageToShow, messageType: 'standard' }), true);
            toast({ title: t('taskContext.toast.noSubtasksGeneratedTitle')});

          } else {
            // Onverwachte structuur
            console.error("Unexpected response from generate-subtasks:", subtaskResponseData);
            throw new Error(t("chatPanel.errors.invalidSubtaskResponseStructure"));
          }

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : t("chatPanel.errors.genericAiError");
          addMessage(ensureMessageHasId({ role: "assistant", content: `${t("chatPanel.errors.generalSubtaskGenerationFailed")}: ${errorMsg}`, messageType: 'error' }), true);
          toast({ variant: "destructive", title: t('chatPanel.toast.subtaskGenerationFailedTitle'), description: errorMsg });
        }
        return;
      } else if (requiresResearch) {
        // If we found a specific term, use it for the research
        if (researchTerm && researchTerm.length > 0) {
          handleDeepResearch(currentResearchMode, researchTerm); 
        } else {
          // If no specific term was found, try to extract the topic after 'naar', 'over', 'about', etc.
          const postfixRegex = /(?:onderzoek|research|zoek op|find out|investigate)(?:\s+(?:naar|over|about|on|for))?\s+(.+?)(?:\?|\.|$)/i;
          const match = currentInput.match(postfixRegex);
          
          if (match && match[1] && match[1].trim().length > 0) {
            // We found a research topic
            handleDeepResearch(currentResearchMode, match[1].trim());
          } else {
            // No specific topic found, fall back to the default action
            handleDeepResearch(currentResearchMode);
          }
        }
        return; 
      }

      // Fallback to general AI chat response
      setIsAiResponding(true);
      try {
        const historyToInclude = messages.filter(msg => msg.role === 'user' || (msg.role === 'assistant' && msg.messageType === 'standard')).slice(-8).map(msg => ({ role: msg.role, content: msg.content }));
        const languagePreference = user?.language_preference || i18n.language || 'nl'; 
        const { data: aiResponseData, error: functionError } = await supabase.functions.invoke('generate-chat-response', {
          body: { query: currentInput, mode: currentResearchMode, taskId: task.id, chatHistory: historyToInclude, languagePreference: languagePreference },
        });
        if (functionError) throw functionError;
        if (!aiResponseData) throw new Error(t("chatPanel.errors.aiConnectionFailed"));
        
        // Prepare message to save, including potential citations
        let messageToSave: Omit<Message, 'id' | 'timestamp' | 'createdAt'> = {
          role: 'assistant',
          content: aiResponseData.response || t("chatPanel.errors.emptyResponseFromAI"), // Fallback for empty response
          messageType: 'standard',
          isLoading: false,
          citations: aiResponseData.citations // Add citations if present
        };

        if (aiResponseData.action) {
          let assistantMessageContent = "";
          try {
            switch (aiResponseData.action) {
              case "UPDATE_TASK_TITLE": { if (!aiResponseData.payload?.newTitle) throw new Error(t('chatPanel.errors.invalidPayloadForAction', {action: "UPDATE_TASK_TITLE"})); await updateTask(task.id, { title: aiResponseData.payload.newTitle }); assistantMessageContent = t('chatPanel.toast.taskTitleUpdatedTo', {newTitle: aiResponseData.payload.newTitle }); toast({ title: t('chatPanel.toast.taskUpdatedTitle') }); break; }
              case "UPDATE_SUBTASK": { 
                if (!task?.id || !aiResponseData.payload?.subtaskId || !aiResponseData.payload?.updates?.title) throw new Error(t('chatPanel.errors.invalidPayloadForAction', {action: "UPDATE_SUBTASK"})); 
                const validUpdates: Partial<Pick<SubTask, 'title' | 'completed'>> = { 
                  title: aiResponseData.payload.updates.title 
                };
                if (aiResponseData.payload.updates.completed !== undefined) { 
                  validUpdates.completed = aiResponseData.payload.updates.completed; 
                } 
                await updateSubtask(task.id, aiResponseData.payload.subtaskId, validUpdates);
                assistantMessageContent = t('chatPanel.toast.subtaskUpdatedTo', {newTitle: aiResponseData.payload.updates.title}); 
                toast({ title: t('chatPanel.toast.taskUpdatedTitle') }); 
                break; 
              }
              case "ADD_SUBTASK": { 
                if (!aiResponseData.payload?.title) throw new Error(t('chatPanel.errors.invalidPayloadForAction', {action: "ADD_SUBTASK"})); 
                await addSubtask(task.id, aiResponseData.payload.title); 
                assistantMessageContent = t('chatPanel.subtaskAddedConfirmation.single', { subtaskTitle: aiResponseData.payload.title }); 
                toast({ title: t('chatPanel.toast.subtaskAddedTitle') }); 
                break; 
              }
              case "DELETE_SUBTASK": { if (!aiResponseData.payload?.subtaskId) throw new Error(t('chatPanel.errors.invalidPayloadForAction', {action: "DELETE_SUBTASK"})); await deleteSubtask(task.id, aiResponseData.payload.subtaskId); assistantMessageContent = t('chatPanel.toast.subtaskDeleted', {subtaskId: aiResponseData.payload.subtaskId}); break; }
              case "DELETE_ALL_SUBTASKS": { if (!aiResponseData.payload?.taskId || aiResponseData.payload.taskId !== task.id) throw new Error(t('chatPanel.errors.invalidPayloadForAction', {action: "DELETE_ALL_SUBTASKS"})); await deleteAllSubtasks(task.id); assistantMessageContent = t('chatPanel.toast.allSubtasksDeletedMessage'); toast({ title: t('chatPanel.toast.allSubtasksDeletedTitle') }); break; }
              default: 
                assistantMessageContent = aiResponseData.content || `${t('chatPanel.errors.unknownActionReceived')}: "${aiResponseData.action}"`;
            }
            messageToSave = { role: "assistant", content: assistantMessageContent, messageType: 'action_confirm' };
          } catch (actionError) {
             let errorDesc = t("chatPanel.errors.actionFailedGeneric"); if (actionError instanceof Error) errorDesc = actionError.message; toast({ variant: "destructive", title: t('chatPanel.toast.actionFailedTitle'), description: errorDesc });
             messageToSave = { role: "assistant", content: `${t("chatPanel.errors.actionFailedSpecific")}: ${errorDesc}`, messageType: 'error' };
          }
        } else if (aiResponseData.response) {
           messageToSave = { role: "assistant", content: aiResponseData.response, messageType: 'standard' };
        } else {
           messageToSave = { role: "assistant", content: t("chatPanel.errors.unexpectedResponse"), messageType: 'error' };
        }
        if (messageToSave) {
          await addMessage(ensureMessageHasId(messageToSave), true);
          scrollToBottom();
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : t("chatPanel.errors.genericAiError");
        await addMessage(ensureMessageHasId({ role: "assistant", content: `${t("chatPanel.errors.aiConnectionFailed")}: ${errorMsg}`, messageType: 'error' }), true);
        scrollToBottom();
      } finally { 
        setIsAiResponding(false);
      }
    }
  };
  
  if (!task) {
     return (
       <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
      );
  }

  /** Options for the research mode dropdown. */
  const researchModeOptions: { labelKey: string; value: ResearchMode; icon?: React.ElementType, descriptionKey: string }[] = [
    { value: 'research', labelKey: 'chatPanel.researchModePopover.researchMode', icon: Brain, descriptionKey: 'chatPanel.researchModePopover.descriptionResearch' },
    { value: 'instruction', labelKey: 'chatPanel.researchModePopover.instructionMode', icon: ListChecks, descriptionKey: 'chatPanel.researchModePopover.descriptionInstruction' },
    { value: 'creative', labelKey: 'chatPanel.researchModePopover.creativeMode', icon: SparklesIcon, descriptionKey: 'chatPanel.researchModePopover.descriptionCreative' },
  ];

  const messagesForList = [...messages];
  
  return (
    <div className="flex flex-col h-full bg-card border-l border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border flex-shrink-0 relative z-20 bg-card">
        <div className="flex items-center gap-2 min-w-0">
          <MessageCircleMore className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <h2 className="text-base font-semibold truncate" title={task.title ?? ''}>{t('chatPanel.titleWithTask', { taskTitle: task.title ?? '' })}</h2>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="flex items-center gap-1 mr-1">
            <div className="relative flex items-center">
              <label htmlFor="chat-search-input" className="sr-only">
                {t('chatPanel.searchPlaceholder', 'Zoek berichten of start onderzoek...')}
              </label>
              <Input
                id="chat-search-input"
                name="chat-search-input"
                type="search" 
                placeholder={isSearchingMessages ? t('chatPanel.searchMessagesPlaceholder') : t('chatPanel.searchPlaceholder')}
                value={searchInputText}
                onChange={handleSearchInputChange}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSubmit();
                  }
                }}
                onBlur={handleSearchBlur}
                className={`h-7 text-xs transition-all duration-300 ease-in-out ${showSearchInput ? 'w-48 px-2 opacity-100' : 'w-0 p-0 opacity-0'} border-border`}
                style={{ borderWidth: showSearchInput ? '1px' : '0px' }}
              />
              {searchInputText && showSearchInput && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 absolute right-1"
                  onMouseDown={(e) => {
                    // Prevent onBlur from being triggered by the mouse
                    e.preventDefault();
                  }}
                  onClick={handleClearSearch}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Button 
              variant={isSearchingMessages ? "outline" : "ghost"}
              size="icon" 
              className={`h-7 w-7 ${isSearchingMessages ? 'bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white' : ''}`}
              title={isSearchingMessages ? t('chatPanel.searchingMessages') : t('chatPanel.searchingResearch')}
              onClick={handleSearchModeToggle}
              onMouseDown={(e) => {
                // Prevent onBlur from being triggered by the mouse
                e.preventDefault();
              }}
            >
              <Search className={`h-4 w-4 ${isSearchingMessages ? "text-primary-foreground" : "text-muted-foreground"}`} />
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={handleCloseChat} className="h-7 w-7 lg:hidden">
            <X className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">{t('common.closeSR')}</span>
          </Button>
        </div>
      </div>

      <div className="flex-grow min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-transparent scrollbar-thumb-rounded relative" ref={scrollAreaRef}>
        <PinnedMessagesSection 
          messages={messages.filter(m => m.isPinned)} 
          onTogglePin={togglePinMessage} 
          onCopy={handleCopy}
          isLoading={messagesLoading}
        />
        <MessageList 
            messages={isSearchingMessages && searchInputText.trim() ? filteredMessages : messagesForList}
            onDeleteNote={handleDeleteNote} 
            onDeleteResearch={handleDeleteResearch} 
            onTogglePin={togglePinMessage}
            onCopy={handleCopy} 
            isLoading={messagesLoading}
            isAiResponding={isAiResponding}
            userAvatarUrl={user?.avatar_url || undefined}
        />
      </div>
      
      {isSearchingMessages && searchInputText.trim() && filteredMessages.length === 0 && (
        <div className="p-4 text-center text-muted-foreground">
          {t('chatPanel.noSearchResults')}
        </div>
      )}

      {messagesError && (
        <div className="p-4 border-t border-destructive bg-destructive/10 text-destructive-foreground text-sm flex-shrink-0">
          {String(messagesError)} 
        </div>
      )}

      {messagesLoading && (
        <div className="p-2 text-sm text-muted-foreground flex items-center justify-center flex-shrink-0">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {t('chatPanel.loadingHistory')}
        </div>
      )}

      <div className="border-t border-border flex flex-col flex-shrink-0">
        <div className="py-2 px-0 sm:px-0 relative">
          <ChatInput
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            isLoading={isAiResponding || isResearching}
            isNoteMode={isNoteMode}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
          />
        </div>
        <div className={`px-0 sm:px-0 ${isInputFocused && globalThis.innerWidth < 768 ? 'chat-actions-hidden-on-mobile-focus' : ''}`}>
          <ChatControls
            isNoteMode={isNoteMode}
            setIsNoteMode={setIsNoteMode}
            onClearHistory={clearHistory}
            onExport={handleExportChat}
            onResearch={handleDeepResearch}
            researchModeOptions={researchModeOptions}
            currentResearchMode={currentResearchMode}
            user={user}
            isLoading={messagesLoading}
            isGenerating={isResearching || isAiResponding}
            onCancelResearch={cancelResearch}
            showCancelButton={isResearching}
          />
        </div>
      </div>
    </div>
  );
}

