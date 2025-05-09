import { useState, useCallback, useEffect } from 'react';
import { Task } from '@/types/task.ts';
import { supabase } from '@/integrations/supabase/client.ts';
import { useMessages } from './useMessages.ts';
import { Message } from "../types.ts";
import { hasPermission } from "@/lib/permissions.ts";
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from "@/contexts/AuthContext.tsx";
import { useToast } from '@/hooks/use-toast.ts';
import { useTranslation } from 'react-i18next';

export function useDeepResearch(task: Task | null) {
  const [isResearching, setIsResearching] = useState(false);
  const [researchCancelled, setResearchCancelled] = useState(false);
  const { messages, addMessage, updateMessage } = useMessages(task?.id ?? null, task?.title ?? null, null); 
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();

  useEffect(() => {
    if (isResearching) {
      console.log("Task changed during research, cancelling...");
      setResearchCancelled(true); 
    }
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
        console.warn("Did not receive savedResearchId from function, cannot update message.");
        return;
      }

      updateMessage(message.id, { savedResearchId: savedResearchId });

      toast({
        title: t('chatPanel.toast.researchSavedTitle'),
        description: t('chatPanel.toast.researchSavedDescription')
      });
    } catch (error: unknown) {
      const messageText = error instanceof Error ? error.message : t('chatPanel.toast.saveResearchFailedDescriptionDefault');
      toast({
        variant: "destructive",
        title: t('chatPanel.toast.saveFailedTitle'),
        description: messageText,
      });
    } finally {
      setIsResearching(false);
    }
  }, [task, updateMessage, toast, t]);

  const startDeepResearch = useCallback(async (customPrompt?: string) => {
    if (!hasPermission(user, 'deepResearch')) {
      toast({
        variant: "default", 
        title: t('chatPanel.toast.featureNotAvailableTitle'), 
        description: t('chatPanel.toast.featureNotAvailableDescription'), 
      });
      return; 
    }

    if (!task?.id || isResearching) return;

    setIsResearching(true);
    setResearchCancelled(false); 

    let contextDetailKey = "";
    let contextDetailParams: Record<string, string> = {};
    const mainTaskTitle = task.title || "this task";

    if (customPrompt) {
        contextDetailKey = 'chatPanel.research.contextPrompt';
        contextDetailParams = { prompt: customPrompt };
    } else {
        contextDetailKey = 'chatPanel.research.contextMainTask';
        contextDetailParams = { mainTaskTitle };
    }

    const contextForUserMessage = t(contextDetailKey, contextDetailParams);
    const userMessageContentForDisplay = t('startingDeepResearchOn', { context: contextForUserMessage });

    const userDisplayMessage: Message = {
      id: uuidv4(),
      taskId: task.id,
      role: 'assistant', 
      content: userMessageContentForDisplay,
      createdAt: new Date().toISOString(),
      messageType: 'status'
    };
    addMessage(userDisplayMessage);

    const thinkingMessageId = uuidv4();
    const thinkingMessage: Message = {
      id: thinkingMessageId,
      taskId: task.id,
      role: 'assistant',
      content: t('chatPanel.researchingText'), 
      createdAt: new Date().toISOString(),
      isLoading: true,
      messageType: 'status'
    };
    addMessage(thinkingMessage);

    try {
      const { data, error } = await supabase.functions.invoke('deep-research', {
        body: { 
          taskId: task.id,
          customPrompt: customPrompt,
          languagePreference: user?.language_preference || 'en'
        }
      });

      if (researchCancelled) {
        console.log("Research was cancelled, discarding results.");
        return;
      }

      if (error) {
        throw error;
      }
      
      if (data?.error) {
          throw new Error(data.error);
      }

      if (!data?.researchResult) {
        throw new Error("No research result received from function.");
      }

      updateMessage(thinkingMessageId, {
        content: data.researchResult,
        citations: data.citations || [],
        isLoading: false,
        messageType: 'research_result',
        canBeSaved: true
      });

    } catch (error: unknown) {
      const messageText = error instanceof Error ? error.message : t('chatPanel.toast.deepResearchFailedDescriptionDefault');
      updateMessage(thinkingMessageId, {
        content: `Error during research: ${messageText}`,
        isLoading: false,
        isError: true,
        messageType: 'status'
      });
      toast({
        variant: "destructive",
        title: t('chatPanel.toast.deepResearchFailedTitle'),
        description: messageText,
      });
    } finally {
      setIsResearching(false);
      setResearchCancelled(false);
    }
  }, [task, isResearching, researchCancelled, user, addMessage, updateMessage, toast, t, handleSaveResearch]);

  const cancelResearch = useCallback(() => {
    console.log("Attempting to cancel research...");
    setResearchCancelled(true);
  }, []);

  return {
    messages,
    isResearching,
    researchCancelled,
    startDeepResearch,
    cancelResearch,
    handleSaveResearch
  };
} 