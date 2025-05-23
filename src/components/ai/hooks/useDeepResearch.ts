import { useState, useCallback, useEffect, useRef } from 'react';
import { Task } from '@/types/task.ts';
import { supabase } from '@/integrations/supabase/client.ts';
import { Message, ResearchMode } from "../types.ts";
import { hasPermission, PermissionResult } from "@/lib/permissions.ts";
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from "@/hooks/useAuth.ts";
import { useToast } from '@/hooks/use-toast.ts';
import { useTranslation } from 'react-i18next';
import { useTask } from "@/contexts/TaskContext.hooks.ts";

interface UseDeepResearchProps {
  task: Task | null;
  addMessage: (messageData: Omit<Message, 'id' | 'timestamp' | 'createdAt'> & { id?: string; timestamp?:number; createdAt?:string, _forceDisplay?: boolean }, saveToDb?: boolean) => Promise<Message>;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
}

// Interface voor de Supabase error context
interface SupabaseErrorContext {
  error?: string;
  message?: string;
  details?: string;
  // Voeg eventueel andere bekende properties toe die in de context kunnen zitten
}

/**
 * Custom hook to manage deep research functionality.
 * It handles starting research, saving results, and managing related state.
 *
 * @param {UseDeepResearchProps} props - The properties for the hook.
 * @returns {{
 *  isResearching: boolean,
 *  researchCancelled: boolean,
 *  startDeepResearch: (customPrompt?: string, mode?: ResearchMode) => Promise<void>,
 *  cancelResearch: () => void,
 *  handleSaveResearch: (message: Message) => Promise<void>
 * }}
 *  An object containing the research state and functions.
 */
export function useDeepResearch({
  task,
  addMessage,
  updateMessage,
}: UseDeepResearchProps) {
  const [isResearching, setIsResearching] = useState(false);
  const [researchCancelled, setResearchCancelled] = useState(false);

  const { toast } = useToast();
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const { setLastResearchOutput } = useTask();
  const previousTaskId = useRef<string | null>(task?.id ?? null);
  const currentThinkingMessageId = useRef<string | null>(null);

  /**
   * Effect to stop research when `researchCancelled` becomes true.
   * Updates the loading message to indicate cancellation and resets states.
   */
  useEffect(() => {
    if (researchCancelled && currentThinkingMessageId.current) {
      updateMessage(currentThinkingMessageId.current, {
        content: i18n.t('chatPanel.research.cancelledByUser'),
        isLoading: false,
        messageType: 'error'
      });
      setIsResearching(false);
      setResearchCancelled(false);
      currentThinkingMessageId.current = null;
    }
  }, [researchCancelled, updateMessage, i18n]);

  useEffect(() => {
    if (isResearching && previousTaskId.current !== null && task?.id !== previousTaskId.current) {
      setResearchCancelled(true);
    }
    previousTaskId.current = task?.id ?? null;
  }, [task?.id, isResearching]);

  const handleSaveResearch = useCallback(async (message: Message) => {
    if (message.messageType !== 'research_result' || !task?.id) return;
    setIsResearching(true);

    try {
      const { data, error } = await supabase.functions.invoke('save-research', {
        body: {
          taskId: task.id,
          researchContent: message.content,
          citations: message.citations || [],
          subtaskTitle: task.subtasks.find(st => st.id === message.subtaskId)?.title
        },
      });

      if (error) throw error;

      const savedResearchId = data?.savedResearchId;
      if (!savedResearchId) {
        return;
      }

      updateMessage(message.id, { savedResearchId: savedResearchId });

      toast({
        title: i18n.t('chatPanel.toast.researchSavedTitle'),
        description: i18n.t('chatPanel.toast.researchSavedDescription')
      });
    } catch (error: unknown) {
      const messageText = error instanceof Error ? error.message : i18n.t('chatPanel.toast.saveResearchFailedDescriptionDefault');
      toast({
        variant: "destructive",
        title: i18n.t('chatPanel.toast.saveFailedTitle'),
        description: messageText,
      });
    } finally {
      setIsResearching(false);
    }
  }, [task, updateMessage, toast, i18n]);

  const executeResearch = useCallback(async (
    query: string,
    mode: ResearchMode = 'research',
    subtaskDescription?: string | null | undefined
  ) => {
    if (!task?.id || isResearching) {
      return;
    }

    setIsResearching(true);
    setResearchCancelled(false);

    const researchTopic = query || task.title || i18n.t('chatPanel.defaultTaskTitle');
    let displayResearchTopic = researchTopic;
    if (subtaskDescription && subtaskDescription.trim() !== "") {
      displayResearchTopic = `${researchTopic} (${i18n.t('chatPanel.research.regardingSubtask', 'inzake subtaak')}: ${subtaskDescription})`;
    }

    const tempMessageId = uuidv4();
    currentThinkingMessageId.current = tempMessageId;

    await addMessage({
      id: tempMessageId,
      role: 'assistant',
      content: i18n.t('chatPanel.research.researchLoadingTextInterpolated', {
        topic: displayResearchTopic,
      }),
      createdAt: new Date().toISOString(),
      isLoading: true,
      messageType: 'research_loader'
    });

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('deep-research', {
        body: {
          query: query || task.title,
          description: subtaskDescription,
          taskId: task.id,
          mode: mode,
          languagePreference: i18n.language.startsWith('nl') ? 'nl' : 'en',
          localLoaderMessageId: tempMessageId
        }
      });

      if (researchCancelled) {
        return;
      }
      
      const localLoaderMessageId = currentThinkingMessageId.current;

      if (invokeError) {
        let detailedErrorMessage = invokeError.message;
        if (invokeError.context && typeof invokeError.context === 'object') {
          const errorContext = invokeError.context as SupabaseErrorContext | undefined;
          if (errorContext?.error) {
            detailedErrorMessage = errorContext.error;
          } else if (errorContext?.message) {
            detailedErrorMessage = errorContext.message;
          } else if (errorContext?.details) {
            detailedErrorMessage = errorContext.details;
          }
        }

        if (localLoaderMessageId === tempMessageId) {
          updateMessage(tempMessageId, {
            content: i18n.t('chat.research.error') + (detailedErrorMessage ? `: ${detailedErrorMessage}` : ''),
            isLoading: false,
            messageType: 'error'
          });
        }
        toast({
          variant: "destructive",
          title: i18n.t('chatPanel.toast.researchFailedTitle'),
          description: detailedErrorMessage || i18n.t('chatPanel.toast.researchFailedDescriptionDefault'),
        });
        return;
      }

      if (data && localLoaderMessageId === tempMessageId) {
        const researchResultText = data.researchResult || '';
        const citations = data.citations;
        const modelUsed = data.modelUsed;
        const modeUsed = data.modeUsed;
        
        // DEBUG LOGGING START
        console.log(
          '[useDeepResearch|executeResearch] About to update message.',
          'Message ID:', tempMessageId,
          'Prompt (researchTopic):', researchTopic,
          'Subtask Title (subtaskDescription):', subtaskDescription
        );
        // DEBUG LOGGING END
        await updateMessage(tempMessageId, {
          content: researchResultText,
          citations: citations,
          model: modelUsed,
          messageType: 'research_result',
          mode: modeUsed,
          query: data.query,
          prompt: researchTopic,
          subtask_title: subtaskDescription,
          isLoading: false,
          canBeSaved: true,
        });
        
        if (task?.id && researchResultText) {
            const messageToSave: Message = {
                id: tempMessageId,
                content: researchResultText,
                citations: citations,
                model: modelUsed,
                messageType: 'research_result',
                mode: modeUsed,
                query: data.query,
                prompt: researchTopic,
                subtask_title: subtaskDescription,
                subtaskId: task.subtasks.find(st => st.title === subtaskDescription)?.id,
                role: 'assistant',
                createdAt: new Date().toISOString(),
                canBeSaved: true
            };
            await handleSaveResearch(messageToSave);
        }
        
        if (task?.id) {
            setLastResearchOutput(task.id, researchResultText);
        }
      } else if (localLoaderMessageId === tempMessageId) {
        updateMessage(tempMessageId, {
          content: i18n.t('chat.research.noDataError'),
          isLoading: false,
          messageType: 'error'
        });
        toast({
          variant: "default",
          title: i18n.t('chatPanel.toast.researchNoDataTitle'),
          description: i18n.t('chatPanel.toast.researchNoDataDescription'),
        });
      }
    } catch (error: unknown) {
      if (currentThinkingMessageId.current === tempMessageId) {
        updateMessage(tempMessageId, {
          content: i18n.t('chat.research.unexpectedError'),
          isLoading: false,
          messageType: 'error'
        });
      }
      toast({
        variant: "destructive",
        title: i18n.t('chatPanel.toast.researchFailedTitle'),
        description: error instanceof Error ? error.message : i18n.t('chatPanel.toast.researchFailedDescriptionDefault')
      });
    } finally {
      setIsResearching(false);
      if (currentThinkingMessageId.current === tempMessageId) {
         currentThinkingMessageId.current = null;
      }
    }
  }, [task, isResearching, addMessage, updateMessage, i18n, researchCancelled, toast, setLastResearchOutput, handleSaveResearch]);

  const startDeepResearch = useCallback(async (
    customPrompt?: string,
    mode: ResearchMode = 'research',
    subtaskDescription?: string | null | undefined,
    needsConfirmationIfChat: boolean = false
  ) => {
    const permissionCheck: PermissionResult = hasPermission(user, 'deepResearch');
    if (!permissionCheck.hasAccess) {
      if (permissionCheck.reason === 'NEEDS_PAID') {
        await addMessage({
          id: uuidv4(),
          role: 'assistant',
          content: i18n.t('chat.research.upgradeNeeded.description'),
          messageType: 'error',
          isLoading: false,
          isError: true,
        });
        return;
      } else {
        toast({
          variant: "default",
          title: i18n.t('chatPanel.toast.featureNotAvailableTitle'),
          description: i18n.t('chatPanel.toast.featureNotAvailableDescription'),
        });
        return;
      }
    }

    if (!task?.id) return;

    const queryToResearch = customPrompt || task.title;

    if (needsConfirmationIfChat && customPrompt) {
      if (globalThis.confirm(i18n.t('chatPanel.research.confirmationMessage', { topic: queryToResearch }))) {
        await executeResearch(queryToResearch, mode, subtaskDescription);
      } else {
        await addMessage({
          role: 'assistant',
          content: i18n.t('chatPanel.research.confirmationCancelled'),
          messageType: 'system' 
        });
      }
    } else {
      await executeResearch(queryToResearch, mode, subtaskDescription);
    }
  }, [task, user, executeResearch, i18n, addMessage, toast]);

  const cancelResearch = useCallback(() => {
    setResearchCancelled(true);
  }, []);

  return {
    isResearching,
    researchCancelled,
    startDeepResearch,
    cancelResearch,
    handleSaveResearch
  };
} 