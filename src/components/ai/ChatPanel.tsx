import { useState, useEffect, useRef } from "react";
import { Task, SubTask } from "@/types/task.ts";
import { Button } from "@/components/ui/button.tsx";
import { Loader2, X, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTask } from "@/contexts/TaskContext.hooks.ts";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { Message } from "./types.ts";
import { MessageList } from "./MessageList.tsx";
import { ChatInput } from "./ChatInput.tsx";
import { ChatControls } from "./ChatControls.tsx";
// import { ChatSettingsDialog } from "./ChatSettingsDialog.tsx";
// import { DeepResearchDialog } from "./DeepResearchDialog.tsx";
import { useMessages } from "./hooks/useMessages.ts";
import { PinnedMessagesSection } from "./PinnedMessagesSection.tsx";

interface ChatPanelProps {
  task: Task | null;
  selectedSubtaskTitle?: string | null;
}

export default function ChatPanel({ task, selectedSubtaskTitle }: ChatPanelProps) {
  const { updateTask, addSubtask, deleteSubtask, deleteAllSubtasks, updateSubtask } = useTask();
  const { messages, addMessage, updateMessage, isLoading: isLoadingMessages, error: historyError, clearHistory, deleteNote, deleteResearch, togglePinMessage } = useMessages(task?.id ?? null, task?.title ?? '', selectedSubtaskTitle ?? null);
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState("default");
  const [isResearching, setIsResearching] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);

  const ensureMessageHasId = (message: Omit<Message, 'id'> & { id?: string }): Message => {
    return { ...message, id: message.id || uuidv4() } as Message;
  };

  useEffect(() => {
    // Use setTimeout to ensure layout is calculated before scrolling
    const timer = setTimeout(() => {
      if (scrollAreaRef.current) { 
        scrollAreaRef.current.scrollTo({ 
          top: scrollAreaRef.current.scrollHeight, 
          behavior: 'smooth' 
        });
      }
    }, 100); // Use 100ms delay for more reliable scrolling
    
    // Cleanup function to clear the timeout if component unmounts or messages change again quickly
    return () => clearTimeout(timer);
  }, [messages]);

  const handleCloseChat = () => navigate('/');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: t('chatPanel.toast.copiedTitle'), description: t('chatPanel.toast.copiedDescription') });
    }, (err) => {
      toast({ variant: "destructive", title: t('chatPanel.toast.copyFailedTitle'), description: t('chatPanel.toast.copyFailedDescription') });
      console.error('Could not copy text: ', err);
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
      console.error("Fout bij opslaan notitie:", error);
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

  const handleDeepResearch = async (customPrompt?: string) => {
    if (!task?.id) return;
    const { hasPermission } = await import("@/lib/permissions.ts");

    if (!hasPermission(user, 'deepResearch')) {
      toast({ variant: "default", title: t('chatPanel.toast.featureNotAvailableTitle'), description: t('chatPanel.toast.featureNotAvailableDescription') });
      return; 
    }
    if (isResearching) return;
    setIsResearching(true);
    let contextDetailKey = "";
    let contextDetailParams: Record<string, string> = {};
    if (customPrompt) {
        contextDetailKey = 'chatPanel.research.contextPrompt';
        contextDetailParams = { prompt: customPrompt.substring(0, 100) + (customPrompt.length > 100 ? "..." : "") };
    } else if (selectedSubtaskTitle) {
        contextDetailKey = 'chatPanel.research.contextSubtaskForMain';
        contextDetailParams = { subtaskTitle: selectedSubtaskTitle, mainTaskTitle: task.title || '' };
    } else {
        contextDetailKey = 'chatPanel.research.contextMainTask';
        contextDetailParams = { mainTaskTitle: task.title || '' };
    }
    const contextForUserMessage = t(contextDetailKey, contextDetailParams);
    const userMessageContentForDisplay = t('chatPanel.research.startingDeepResearchOn', { topic: contextForUserMessage });
    const detailedAiPrompt = `
  Generate a comprehensive and well-structured answer on the following topic: "${customPrompt || (selectedSubtaskTitle ? selectedSubtaskTitle : (task.title || ''))}".
  Write in an objective and informative tone, similar to how Perplexity AI generates answers.
  ${customPrompt ? `Use the following specific instructions from the user: "${customPrompt}"` : (selectedSubtaskTitle ? `Focus specifically on the subtask "${selectedSubtaskTitle}" in the context of the main task "${task.title || ''}".` : (task.description ? `Consider the following task description: "${task.description}"` : ""))}
  
  Return the answer in Markdown format and follow this structure:
  1.  Start with a general introduction.
  2.  Use clear headings (e.g., ## Title) for each important section.
  3.  Use bullet points (*, -, +) for details and lists.
  4.  If relevant and useful for the topic, include a comparative table in Markdown format.
  5.  Reference sources in the text with simple numbered anchors, for example: "This is a fact [1]. Another fact [2].".
  6.  Conclude with a section named "Sources". Below this, provide a numbered list of the used sources. Use the page title as the clickable link text and link to the full URL. For example:
      1. [Page Title of Source 1](https://example.com/source1)
      2. [Title of Article 2](https://othersite.net/article2)
  
  Ensure the output is directly usable as Markdown.
  `;
    addMessage(ensureMessageHasId({
      role: "assistant",
      content: userMessageContentForDisplay,
      messageType: 'system'
    }), true); 
    const loaderMessage = ensureMessageHasId({
      role: "assistant",
      content: t('chatPanel.research.researchLoadingText'),
      messageType: 'research_loader'
    });
    addMessage(loaderMessage, false);
    try {
      const languagePreference = user?.language_preference || 'nl';
      const { data: researchResponseData, error: researchError } = await supabase.functions.invoke('deep-research', {
        body: { query: detailedAiPrompt, languagePreference: languagePreference, taskId: task.id },
      });
      if (researchError) throw researchError;
      if (!researchResponseData || typeof researchResponseData !== 'object') throw new Error("Invalid response structure from deep-research function.");
      if (researchResponseData.error) throw new Error(researchResponseData.error);
      const researchContent = researchResponseData.researchResult;
      let researchCitations: string[] | undefined = undefined;
      if (Array.isArray(researchResponseData.citations) && researchResponseData.citations.every((c: unknown): c is string => typeof c === 'string')) {
        researchCitations = researchResponseData.citations;
      }

      if (typeof researchContent === 'string' && researchContent.trim().length > 0) {
        updateMessage(loaderMessage.id, {
          content: t('chatPanel.research.researchCompleted'),
          messageType: 'system',
          citations: undefined,
          subtask_title: undefined,
          prompt: undefined,
          isError: false 
        });
        addMessage(ensureMessageHasId({ 
          role: "assistant",
          content: researchContent,
          messageType: 'research_result',
          citations: researchCitations,
          subtask_title: selectedSubtaskTitle,
          prompt: customPrompt
        }));
        toast({ title: t('chatPanel.toast.deepResearchSuccessTitle') });
      } else {
        updateMessage(loaderMessage.id, {
          content: t('chatPanel.error.noResearchContent'), 
          messageType: 'system',
          isError: true
        });
      }
    } catch (error) {
      console.error("Error in deep research:", error);
      const errorContent = t('chatPanel.error.deepResearch') + (error instanceof Error ? `: ${error.message}`: '');
      updateMessage(loaderMessage.id, { content: errorContent, isError: true, messageType: 'system' });
      toast({ variant: "destructive", title: t('chatPanel.toast.deepResearchFailedTitle'), description: error instanceof Error ? error.message : t('chatPanel.toast.deepResearchFailedDescriptionDefault') });
    } finally {
      setIsResearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || !task?.id) return;
    const currentInput = input;
    setInput(""); 
    if (isNoteMode) {
      const saved = await handleSaveNote(currentInput);
      if (saved) setIsNoteMode(false); 
    } else {
      const userMessage = ensureMessageHasId({ role: "user", content: currentInput, messageType: 'standard' });
      addMessage(userMessage, true);
      const inputLower = currentInput.toLowerCase();
      const customResearchTriggerNL = "onderzoek prompt:";
      const customResearchTriggerEN = "research prompt:";
      let customPrompt: string | undefined = undefined;
      if (inputLower.startsWith(customResearchTriggerNL)) customPrompt = currentInput.substring(customResearchTriggerNL.length).trim();
      else if (inputLower.startsWith(customResearchTriggerEN)) customPrompt = currentInput.substring(customResearchTriggerEN.length).trim();
      if (customPrompt && customPrompt.length > 0) {
        handleDeepResearch(customPrompt);
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
          const { data: subtaskData, error: subtaskError } = await supabase.functions.invoke('generate-subtasks', { body: { taskId: task.id } });
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
        } finally { /* setIsLoading(false); */ }
        return;
      } else if (requiresResearch) {
        handleDeepResearch(currentInput); 
        return; 
      }
      setIsAiResponding(true);
      try {
        const historyToInclude = messages.filter(msg => msg.role === 'user' || (msg.role === 'assistant' && msg.messageType === 'standard')).slice(-8).map(msg => ({ role: msg.role, content: msg.content }));
        const languagePreference = user?.language_preference || 'nl'; 
        const { data: aiResponseData, error: functionError } = await supabase.functions.invoke('generate-chat-response', {
          body: { query: currentInput, mode: selectedModel, taskId: task.id, chatHistory: historyToInclude, languagePreference: languagePreference },
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
              default: console.warn("Unknown AI action:", aiResponseData.action); assistantMessageContent = aiResponseData.content || `Action "${aiResponseData.action}" received, unknown how to process.`;
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
        if (messageToSave) addMessage(messageToSave, true);
      } catch (error) {
        addMessage(ensureMessageHasId({ role: "assistant", content: "Sorry, connection to AI failed.", messageType: 'error' }), true);
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

  return (
    <div className="flex flex-col h-full bg-card border-l border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Brain className="h-4 w-4 text-primary flex-shrink-0" /> 
          <h2 className="text-base font-semibold truncate" title={task.title ?? ''}>{t('chatPanel.titleWithTask', { taskTitle: task.title ?? '' })}</h2>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7 lg:hidden" onClick={handleCloseChat}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-grow min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-transparent scrollbar-thumb-rounded relative" ref={scrollAreaRef}>
        <PinnedMessagesSection 
          messages={messages} 
          onTogglePin={togglePinMessage} 
          onCopy={handleCopy}
          isLoading={isLoadingMessages}
        />
        <MessageList 
            messages={messages} 
            onDeleteNote={handleDeleteNote} 
            onDeleteResearch={handleDeleteResearch} 
            onTogglePin={togglePinMessage}
            onCopy={handleCopy} 
            isLoading={isLoadingMessages}
            isAiResponding={isAiResponding}
        />
      </div>

      {historyError && (
        <div className="p-4 border-t border-destructive bg-destructive/10 text-destructive-foreground text-sm flex-shrink-0">
          {String(historyError)} 
        </div>
      )}

      {isLoadingMessages && (
        <div className="p-2 text-sm text-muted-foreground flex items-center justify-center flex-shrink-0">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {t('chatPanel.loadingHistory')}
        </div>
      )}

      <div className="border-t border-border flex flex-col gap-2 flex-shrink-0">
        <ChatInput 
          onSubmit={handleSubmit} 
          isLoading={isLoadingMessages || isResearching || isAiResponding}
          isNoteMode={isNoteMode}
          input={input}
          setInput={setInput}
        />
        <ChatControls
          isNoteMode={isNoteMode}
          setIsNoteMode={setIsNoteMode}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          onClearHistory={clearHistory}
          onExport={handleExportChat}
          onResearch={() => handleDeepResearch()} 
          user={user}
          isLoading={isLoadingMessages || isResearching || isAiResponding}
        />
      </div>

      {/* <ChatSettingsDialog 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        onClearHistory={clearHistory}
      />
      <DeepResearchDialog 
        isOpen={isDeepResearchOpen} 
        onClose={() => setIsDeepResearchOpen(false)} 
        onStartResearch={handleDeepResearch}
        taskTitle={task.title ?? ''}
        isResearching={isResearching}
      /> */}
    </div>
  );
}

