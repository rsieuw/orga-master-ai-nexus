import { useState, useCallback, useEffect, useRef } from 'react';
import { Task } from '@/types/task.ts';
import { supabase } from '@/integrations/supabase/client.ts';
import { Message } from "../types.ts";
import { hasPermission, PermissionResult } from "@/lib/permissions.ts";
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from "@/hooks/useAuth.ts";
import { useToast } from '@/hooks/use-toast.ts';
import { useTranslation } from 'react-i18next';
import { useTask } from "@/contexts/TaskContext.hooks.ts";

export type ResearchMode = 'research' | 'instruction' | 'creative';

interface UseDeepResearchProps {
  task: Task | null;
  addMessage: (messageData: Omit<Message, 'id' | 'timestamp' | 'createdAt'> & { id?: string; timestamp?:number; createdAt?:string, _forceDisplay?: boolean }, saveToDb?: boolean) => Promise<Message>;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  setMessages: (updater: (prevMessages: Message[]) => Message[]) => void;
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
  setMessages
}: UseDeepResearchProps) {
  const [isResearching, setIsResearching] = useState(false);
  const [researchCancelled, setResearchCancelled] = useState(false);

  // DEBUG: Log isResearching state changes
  useEffect(() => {
    // console.log(`[useDeepResearch] isResearching state changed to: ${isResearching}`);
  }, [isResearching]);

  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { setLastResearchOutput } = useTask();
  const previousTaskId = useRef<string | null>(task?.id ?? null);
  const currentThinkingMessageId = useRef<string | null>(null);

  // Effect om onderzoek te stoppen wanneer researchCancelled true wordt
  useEffect(() => {
    if (researchCancelled && currentThinkingMessageId.current) {
      // Update de loading message om aan te geven dat het onderzoek is gestopt
      updateMessage(currentThinkingMessageId.current, {
        content: t('chatPanel.research.cancelledByUser'),
        isLoading: false,
        messageType: 'error'
      });
      
      // Reset de states
      setIsResearching(false);
      setResearchCancelled(false);
      currentThinkingMessageId.current = null;
    }
  }, [researchCancelled, updateMessage, t]);

  useEffect(() => {
    if (isResearching && previousTaskId.current !== null && task?.id !== previousTaskId.current) {
      // console.log("Task changed during research, cancelling...",
        // { previous: previousTaskId.current, current: task?.id });
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
        // console.warn("Did not receive savedResearchId from function, cannot update message.");
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

  const startDeepResearch = useCallback(async (
    customPrompt?: string, 
    mode: ResearchMode = 'research',
    subtaskDescription?: string | null | undefined
  ) => {
    // console.log("=== START Deep Research BEGIN ===");
    // console.log("startDeepResearch called with:", { customPrompt, mode });
    // console.trace("Call stack for startDeepResearch");
    
    const permissionCheck: PermissionResult = hasPermission(user, 'deepResearch');
    // console.log("Permission check result:", permissionCheck);
    
    if (!permissionCheck.hasAccess) {
      if (permissionCheck.reason === 'NEEDS_PAID') {
        // console.log("❌ Deep research requires a paid plan.");
        const upgradeMessageId = uuidv4();
        await addMessage({
          id: upgradeMessageId,
          role: 'assistant',
          content: t('chat.research.upgradeNeeded.description'), // Using a generic content for now, will use specific title/desc from translations
          messageType: 'error', // Or a new messageType like 'upgrade_prompt'
          isLoading: false,
          isError: true, // To make it visually distinct if 'error' type is used
          // We can add a title property to Message type if we want to display a title like in toasts
        });
        setIsResearching(false); // Ensure isResearching is reset
        currentThinkingMessageId.current = null; // Ensure loader is cleared if one was set
        // console.log("=== START Deep Research END (needs paid plan) ===");
        return;
      } else {
        // Handle other reasons for no access (e.g., 'NOT_IN_ENABLED_FEATURES', 'NO_USER') with a generic toast
        // console.log(`❌ Permission denied for deepResearch. Reason: ${permissionCheck.reason || 'Unknown'}`);
      toast({
        variant: "default", 
        title: t('chatPanel.toast.featureNotAvailableTitle'), 
        description: t('chatPanel.toast.featureNotAvailableDescription'), 
      });
        setIsResearching(false); // Ensure isResearching is reset
        currentThinkingMessageId.current = null; // Ensure loader is cleared
        // console.log("=== START Deep Research END (other permission issue) ===");
      return; 
      }
    }

    if (!task?.id || isResearching) {
      // console.log("❌ No task ID or already researching", { taskId: task?.id, isResearching });
      // console.log("=== START Deep Research END (no task or already busy) ===");
      return;
    }

    setIsResearching(true);
    setResearchCancelled(false); 

    const researchTopic = customPrompt || task.title || t('chatPanel.defaultTaskTitle');
    let displayResearchTopic = researchTopic;
    if (subtaskDescription && subtaskDescription.trim() !== "") {
      displayResearchTopic = `${researchTopic} (${t('chatPanel.research.regardingSubtask', 'inzake subtaak')}: ${subtaskDescription})`;
    }
    // console.log("✅ Starting research for:", displayResearchTopic, "with mode:", mode);

    // Create and add loader message
    const tempMessageId = uuidv4();
    // console.log("✅ New loader messageId generated:", tempMessageId);
    
    const thinkingMessage: Message = {
      id: tempMessageId,
      role: 'assistant',
      content: t('chatPanel.research.researchLoadingTextInterpolated', { topic: displayResearchTopic }), 
      createdAt: new Date().toISOString(),
      isLoading: true,
      messageType: 'research_loader'
    };
    // console.log("✅ Creating loader message:", thinkingMessage);
    
    // console.log("✅ Calling addMessage for loader message");
    await addMessage(thinkingMessage);
    // console.log("✅ Loader message should have been added with ID:", tempMessageId);

    currentThinkingMessageId.current = tempMessageId;
    // console.log("✅ currentThinkingMessageId.current updated to:", currentThinkingMessageId.current);

    try {
      // console.log(`[useDeepResearch] ✅ Invoking Edge Function 'deep-research'. Parameters:`, {
        // query: customPrompt || task.title,
        // taskId: task.id,
        // mode: mode,
        // localLoaderMessageId: tempMessageId
      // });
      
      // Full request with all necessary parameters
      const { data, error: invokeError } = await supabase.functions.invoke('deep-research', {
        body: { 
          query: customPrompt || task.title,
          description: subtaskDescription,
          taskId: task.id,
          mode: mode,
          localLoaderMessageId: tempMessageId
        }
      });

      // Controleer of het onderzoek is geannuleerd tijdens het uitvoeren
      if (researchCancelled) {
        // Als het onderzoek is geannuleerd, stoppen we met de verwerking
        // De effectHook zal de cleanup afhandelen
        return;
      }

      // currentThinkingMessageId.current should still be tempMessageId.
      const localLoaderMessageId = currentThinkingMessageId.current;

      if (invokeError) {
        // console.error('[useDeepResearch] Error invoking deep-research. Full error object:', invokeError);
        // The context, including the body of the function response, might be in invokeError.context
        if (invokeError.context && typeof invokeError.context === 'object') {
          // console.error('[useDeepResearch] Error context:', invokeError.context);
          const responseText = invokeError.context.text || invokeError.context.responseText || (typeof invokeError.context.data === 'string' ? invokeError.context.data : null);
          if (responseText) {
            try {
              // const errorResponseBody = JSON.parse(responseText); // Removed, as no longer used
              // console.error('[useDeepResearch] Parsed error response body from function:', errorResponseBody); // Removed
            } catch (e) {
              // console.error('[useDeepResearch] Could not parse error response body, raw text:', responseText); // Removed
            }
          } else {
            // console.error('[useDeepResearch] No parsable text found in error context. Context data:', invokeError.context.data);
          }
        }
        
        const errorMessage = invokeError.context?.message || invokeError.message || "Unknown error invoking function";

        if (localLoaderMessageId) {
          updateMessage(localLoaderMessageId, {
            content: `Error during research: ${errorMessage}`,
            isLoading: false,
            messageType: 'error',
          });
        }
        // Stop further execution here if there is an invokeError
        setIsResearching(false);
        currentThinkingMessageId.current = null;
        return;
      }

      if (data && localLoaderMessageId) {
        // Controleer nog een keer of het onderzoek is geannuleerd 
        // voordat we de resultaten gaan verwerken
        if (researchCancelled) {
          return;
        }
      
        // console.log(
          // `[useDeepResearch] Received data. Attempting to update LOCAL message. LocalLoaderID: ${localLoaderMessageId}, DB-Returned-ID: ${data.id}. Content Snippet: "${data.researchResult?.substring(0, 70)}..."`
        // );
        
        // Combine removing loader and adding research_result in one transaction
        const newResearchResultId = uuidv4();
        // Determine the effective prompt that was used for the research
        const effectivePrompt = customPrompt || task?.title || 'Unknown Topic';

        const newResultMessage: Message = {
          id: newResearchResultId,
          role: 'assistant',
          content: data.researchResult,
          citations: data.citations,
          messageType: 'research_result',
          isLoading: false,
          timestamp: Date.now(),
          createdAt: new Date().toISOString(), // Ensure createdAt is set
          canBeSaved: true, // Remains useful if manual save is also an option later
          subtask_title: null, // Explicitly null, or derive if possible. For now, research is on main task/custom prompt.
                               // If customPrompt might be a subtask title, this could be:
                               // (mode === 'instruction' && customPrompt) ? customPrompt : null;
                               // Or, if selectedSubtaskTitle is available in this hook's scope.
                               // For now, let's assume research is general or tied to main task title via prompt.
          prompt: effectivePrompt, // The actual query sent for research
          _forceDisplay: true
        };

        // 1. Remove the loader message from local state
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== localLoaderMessageId));
        
        // 2. Add the new research result message, which will also trigger saveResearchToDb via addMessage's internal logic
        await addMessage(newResultMessage); // `addMessage` handles `research_result` and calls `saveResearchToDb`

        // Store the research output in TaskContext (this is for other UI elements, not for persistence here)
        if (task?.id && data.researchResult) {
          setLastResearchOutput(task.id, data.researchResult);
          // console.log(`[useDeepResearch] Stored research output for task ${task.id}`);
        }

      } else if (data && !localLoaderMessageId) {
        // console.warn("[useDeepResearch] Received data from deep-research, but no localLoaderMessageId was found. Adding as new message. DB-Returned-ID:", data.id);
        addMessage({
          id: data.id || uuidv4(),
          role: 'assistant',
          content: data.researchResult,
          citations: data.citations,
          messageType: 'research_result',
          isLoading: false,
          timestamp: Date.now(),
          canBeSaved: true,
        });
      } else if (!data && localLoaderMessageId) {
          // console.warn(`[useDeepResearch] No data from deep-research, but had a localLoaderMessageId (${localLoaderMessageId}). Updating to error state.`);
          updateMessage(localLoaderMessageId, {
            content: 'Research completed but no data was returned by the function.',
            isLoading: false,
            messageType: 'error',
          });
      } else {
        // console.warn('[useDeepResearch] Unexpected state: No data and no localLoaderMessageId, or data received but localLoaderMessageId missing.');
      }

    } catch (error: unknown) {
      const messageText = error instanceof Error ? error.message : t('chatPanel.toast.deepResearchFailedDescriptionDefault');
      // console.error("Catch block in startDeepResearch:", error);
      if (currentThinkingMessageId.current) {
        updateMessage(currentThinkingMessageId.current, {
          content: `Error during research: ${messageText}`,
          isLoading: false,
          isError: true,
          messageType: 'error'
        });
      }
      toast({
        variant: "destructive",
        title: t('chatPanel.toast.deepResearchFailedTitle'),
        description: messageText,
      });
    } finally {
      setIsResearching(false);
      setResearchCancelled(false);
    }
  }, [task, isResearching, user, addMessage, updateMessage, toast, t, setMessages, setLastResearchOutput, researchCancelled]);

  const cancelResearch = useCallback(() => {
    // console.log("Attempting to cancel research...");
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