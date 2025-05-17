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

interface ChatPanelProps {
  task: Task | null;
  selectedSubtaskTitle?: string | null;
}

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
  const [isInputFocused, setIsInputFocused] = useState(false);

  const [currentResearchMode, setCurrentResearchMode] = useState<ResearchMode>('research');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchInputText, setSearchInputText] = useState("");
  const [isSearchingMessages, setIsSearchingMessages] = useState(false);

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
    }, 100);  // Korte vertraging om ervoor te zorgen dat de DOM volledig is bijgewerkt
  }, []);
  
  // Scroll naar beneden wanneer berichten veranderen
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  // Scroll naar beneden wanneer een subtaak wordt geselecteerd
  useEffect(() => {
    if (selectedSubtaskTitle) {
      scrollToBottom();
    }
  }, [selectedSubtaskTitle, scrollToBottom]);

  const handleCloseChat = () => navigate('/');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: t('chatPanel.toast.copiedTitle'), description: t('chatPanel.toast.copiedDescription') });
    }, (_err) => {
      toast({ variant: "destructive", title: t('chatPanel.toast.copyFailedTitle'), description: t('chatPanel.toast.copyFailedDescription') });
    });
  };

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

  const handleDeleteNote = (noteIdToDelete: string) => {
    if (!task?.id) return;
    deleteNote(noteIdToDelete);
  };

  const handleDeleteResearch = (researchIdToDelete: string) => {
    if (!task?.id) return;
    deleteResearch(researchIdToDelete);
  };

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

  const handleDeepResearch = useCallback(async (mode: ResearchMode = 'research', prompt?: string) => {
    if (!task) {
      return;
    }

    const researchTopic = prompt || task.title || t('chatPanel.defaultTaskTitle');
    
    if (!researchTopic) {
      toast({ variant: "default", title: t('chatPanel.toast.topicRequiredTitle'), description: t('chatPanel.toast.topicRequiredDescription') });
      return;
    }

    const userRequestMessageText = mode === 'instruction' && selectedSubtaskTitle && prompt 
      ? `${t('chatPanel.research.instructionPrefixForSubtask', { subtask: selectedSubtaskTitle })} ${prompt}`
      : prompt || `${t('chatPanel.research.userRequestPrefix')} ${task.title}${selectedSubtaskTitle ? t('chatPanel.research.forSubtaskContinuation', { subtask: selectedSubtaskTitle }) : ''}`;

    const userRequestMessage = ensureMessageHasId({
      role: 'user',
      content: userRequestMessageText,
      messageType: 'standard'
    });
    await addMessage(userRequestMessage, false);
    
    setCurrentResearchMode(mode);
    try {
      await startDeepResearch(researchTopic, mode);
    } catch (error) {
      
      const errorMessage = ensureMessageHasId({
        role: 'assistant',
        content: `${t('chatPanel.research.errorMessage')}`,
        messageType: 'error'
      });
      await addMessage(errorMessage, false);
    }
    scrollToBottom();
  }, [task, selectedSubtaskTitle, t, toast, startDeepResearch, addMessage, setCurrentResearchMode, scrollToBottom]);

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

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInputText(e.target.value);
    if (isSearchingMessages && !showSearchInput) {
      setShowSearchInput(true);
    }
  };

  const handleClearSearch = () => {
    setSearchInputText("");
    if (isSearchingMessages) {
      // Keep the search function open but clear the text
    } else {
      setShowSearchInput(false);
    }
  };

  const handleSearchBlur = () => {
    // If there's no text and we're not searching in messages, collapse the search field
    setTimeout(() => {
      if (!searchInputText.trim() && !isSearchingMessages) {
        setShowSearchInput(false);
      }
    }, 200); // Small delay to allow clicking buttons
  };

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

      const dutchVerbs = ["genere", "maak", "splits", "deel ", "aanmaken"];
      const dutchNouns = ["subta", "taken"]; 
      const englishVerbs = ["generate", "create", "split", "break "];
      const englishNouns = ["subtask", "tasks"];

      const hasDutchVerb = dutchVerbs.some(verb => inputLower.includes(verb));
      const hasEnglishVerb = englishVerbs.some(verb => inputLower.includes(verb));
      const hasDutchNoun = dutchNouns.some(noun => inputLower.includes(noun));
      const hasEnglishNoun = englishNouns.some(noun => inputLower.includes(noun));
      
      const requiresSubtaskGeneration = (hasDutchVerb && hasDutchNoun) || (hasEnglishVerb && hasEnglishNoun);
      
      const researchKeywords = ["onderzoek", "research", "zoek op", "find out", "investigate"];
      const requiresResearch = researchKeywords.some(keyword => inputLower.includes(keyword));

      if (requiresSubtaskGeneration) {
        try {
          const { data: subtaskData, error: subtaskError } = await supabase.functions.invoke('generate-subtasks', { 
            body: { 
              taskId: task.id,
              taskTitle: task.title,
              taskDescription: task.description,
              taskPriority: task.priority,
              languagePreference: user?.language_preference || i18n.language || 'nl',
              existingSubtaskTitles: task.subtasks?.map(st => st.title) || []
            } 
          });
          if (subtaskError) throw subtaskError;
          if (!subtaskData || typeof subtaskData !== 'object' || !Array.isArray(subtaskData.subtasks)) throw new Error("Invalid response structure from generate-subtasks function.");
          const existingSubtasks = task.subtasks || []; 
          const newSubtasks = subtaskData.subtasks.map((st: { title: string }) => ({ id: uuidv4(), title: st.title, completed: false, createdAt: new Date().toISOString() }));
          const combinedSubtasks = [...existingSubtasks, ...newSubtasks];
          await updateTask(task.id, { subtasks: combinedSubtasks });
          
          let confirmationContent = "Okay, I have added the following subtasks:\n<ul>\n";
          newSubtasks.forEach((st: { title: string }) => { confirmationContent += `  <li>${st.title}</li>\n`; });
          confirmationContent += "</ul>";
          
          addMessage(ensureMessageHasId({ role: "assistant", content: confirmationContent, messageType: 'action_confirm' }), true);
          toast({ title: t('chatPanel.toast.subtasksGeneratedTitle') });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          addMessage(ensureMessageHasId({ role: "assistant", content: `Sorry, generating subtasks failed: ${errorMsg}`, messageType: 'error' }), true);
          toast({ variant: "destructive", title: t('chatPanel.toast.subtaskGenerationFailedTitle'), description: errorMsg });
        }
        return;
      } else if (requiresResearch) {
        handleDeepResearch(currentResearchMode); 
        return; 
      }

      setIsAiResponding(true);
      try {
        const historyToInclude = messages.filter(msg => msg.role === 'user' || (msg.role === 'assistant' && msg.messageType === 'standard')).slice(-8).map(msg => ({ role: msg.role, content: msg.content }));
        const languagePreference = user?.language_preference || i18n.language || 'nl'; 
        const { data: aiResponseData, error: functionError } = await supabase.functions.invoke('generate-chat-response', {
          body: { query: currentInput, mode: currentResearchMode, taskId: task.id, chatHistory: historyToInclude, languagePreference: languagePreference },
        });
        if (functionError) throw functionError;
        if (!aiResponseData) throw new Error("AI function returned no data.");
        let messageToSave: Omit<Message, 'id' | 'timestamp' | 'createdAt'>;
        if (aiResponseData.action) {
          let assistantMessageContent = "";
          try {
            switch (aiResponseData.action) {
              case "UPDATE_TASK_TITLE": { if (!aiResponseData.payload?.newTitle) throw new Error("Invalid payload"); await updateTask(task.id, { title: aiResponseData.payload.newTitle }); assistantMessageContent = `Task title updated to "${aiResponseData.payload.newTitle}".`; toast({ title: t('chatPanel.toast.taskUpdatedTitle') }); break; }
              case "UPDATE_SUBTASK": { 
                if (!task?.id || !aiResponseData.payload?.subtaskId || !aiResponseData.payload?.updates?.title) throw new Error("Invalid payload"); 
                const validUpdates: Partial<Pick<SubTask, 'title' | 'completed'>> = { 
                  title: aiResponseData.payload.updates.title 
                };
                if (aiResponseData.payload.updates.completed !== undefined) { 
                  validUpdates.completed = aiResponseData.payload.updates.completed; 
                } 
                await updateSubtask(task.id, aiResponseData.payload.subtaskId, validUpdates);
                assistantMessageContent = `Subtask updated to "${aiResponseData.payload.updates.title}".`; 
                toast({ title: t('chatPanel.toast.taskUpdatedTitle') }); 
                break; 
              }
              case "ADD_SUBTASK": { if (!aiResponseData.payload?.title) throw new Error("Invalid payload"); await addSubtask(task.id, aiResponseData.payload.title); assistantMessageContent = `Subtask "${aiResponseData.payload.title}" added.`; toast({ title: t('chatPanel.toast.subtaskAddedTitle') }); break; }
              case "DELETE_SUBTASK": { if (!aiResponseData.payload?.subtaskId) throw new Error("Invalid payload"); await deleteSubtask(task.id, aiResponseData.payload.subtaskId); assistantMessageContent = `Subtask (ID: ${aiResponseData.payload.subtaskId}) deleted.`; break; }
              case "DELETE_ALL_SUBTASKS": { if (!aiResponseData.payload?.taskId || aiResponseData.payload.taskId !== task.id) throw new Error("Invalid payload"); await deleteAllSubtasks(task.id); assistantMessageContent = `All subtasks deleted.`; toast({ title: t('chatPanel.toast.allSubtasksDeletedTitle') }); break; }
              default: // console.warn("Unknown AI action:", aiResponseData.action); 
                assistantMessageContent = aiResponseData.content || `Action "${aiResponseData.action}" received, unknown how to process.`;
            }
            messageToSave = { role: "assistant", content: assistantMessageContent, messageType: 'action_confirm' };
          } catch (actionError) {
             let errorDesc = "Could not perform action."; if (actionError instanceof Error) errorDesc = actionError.message; toast({ variant: "destructive", title: t('chatPanel.toast.actionFailedTitle'), description: errorDesc });
             messageToSave = { role: "assistant", content: `Sorry, action failed: ${errorDesc}`, messageType: 'error' };
          }
        } else if (aiResponseData.response) {
           messageToSave = { role: "assistant", content: aiResponseData.response, messageType: 'standard' };
        } else {
           messageToSave = { role: "assistant", content: "Sorry, received an unexpected response.", messageType: 'error' };
        }
        if (messageToSave) {
          await addMessage(messageToSave, true);
          scrollToBottom();
        }
      } catch (error) {
        await addMessage(ensureMessageHasId({ role: "assistant", content: "Sorry, connection to AI failed.", messageType: 'error' }), true);
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

