import { useState, useCallback, useEffect, useRef } from 'react';
import { Task } from '@/types/task.ts';
import { supabase } from '@/integrations/supabase/client.ts';
import { Message } from "../types.ts";
import { hasPermission } from "@/lib/permissions.ts";
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from "@/hooks/useAuth.ts";
import { useToast } from '@/hooks/use-toast.ts';
import { useTranslation } from 'react-i18next';

export type ResearchMode = 'research' | 'instruction' | 'creative';

interface UseDeepResearchProps {
  task: Task | null;
  addMessage: (messageData: Omit<Message, 'id' | 'timestamp' | 'createdAt'> & { id?: string; timestamp?:number; createdAt?:string, _forceDisplay?: boolean }, saveToDb?: boolean) => Promise<Message>;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  setMessages: (updater: (prevMessages: Message[]) => Message[]) => void;
}

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
  const previousTaskId = useRef<string | null>(task?.id ?? null);
  const currentThinkingMessageId = useRef<string | null>(null);

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

  const startDeepResearch = useCallback(async (customPrompt?: string, mode: ResearchMode = 'research') => {
    // console.log("=== START Deep Research BEGIN ===");
    // console.log("startDeepResearch aangeroepen met:", { customPrompt, mode });
    // console.trace("Aanroepstack voor startDeepResearch");
    
    // Test permissions
    const hasAccess = hasPermission(user, 'deepResearch');
    // console.log("Permissie controle resultaat:", hasAccess);
    
    if (!hasAccess) {
      // console.log("❌ Geen toestemming voor deepResearch functie");
      toast({
        variant: "default", 
        title: t('chatPanel.toast.featureNotAvailableTitle'), 
        description: t('chatPanel.toast.featureNotAvailableDescription'), 
      });
      // console.log("=== START Deep Research EINDE (geen toestemming) ===");
      return; 
    }

    if (!task?.id || isResearching) {
      // console.log("❌ Geen taak ID of al bezig met onderzoek", { taskId: task?.id, isResearching });
      // console.log("=== START Deep Research EINDE (geen taak of al bezig) ===");
      return;
    }

    setIsResearching(true);
    setResearchCancelled(false); 

    // const researchTopic = customPrompt || task.title || t('chatPanel.defaultTaskTitle'); // Verwijderd, want niet meer gebruikt
    // console.log("✅ Onderzoek starten voor:", researchTopic, "met mode:", mode); // Verwijderd

    // Create and add loader message
    const tempMessageId = uuidv4();
    // console.log("✅ Nieuwe loader messageId gegenereerd:", tempMessageId);
    
    const thinkingMessage: Message = {
      id: tempMessageId,
      role: 'assistant',
      content: t('chatPanel.research.researchLoadingText'), 
      createdAt: new Date().toISOString(),
      isLoading: true,
      messageType: 'research_loader'
    };
    // console.log("✅ Loader bericht maken:", thinkingMessage);
    
    // console.log("✅ addMessage aanroepen voor loader bericht");
    await addMessage(thinkingMessage);
    // console.log("✅ Loader bericht zou toegevoegd moeten zijn met ID:", tempMessageId);

    currentThinkingMessageId.current = tempMessageId;
    // console.log("✅ currentThinkingMessageId.current bijgewerkt naar:", currentThinkingMessageId.current);

    try {
      // console.log(`[useDeepResearch] ✅ Invoking Edge Function 'deep-research'. Parameters:`, {
        // query: customPrompt || task.title,
        // taskId: task.id,
        // mode: mode,
        // localLoaderMessageId: tempMessageId
      // });
      
      // Volledig verzoek met alle nodige parameters
      const { data, error: invokeError } = await supabase.functions.invoke('deep-research', {
        body: { 
          query: customPrompt || task.title,
          taskId: task.id,
          mode: mode,
          localLoaderMessageId: tempMessageId
        }
      });

      // currentThinkingMessageId.current zou nog steeds tempMessageId moeten zijn.
      const localLoaderMessageId = currentThinkingMessageId.current;

      if (invokeError) {
        // console.error('[useDeepResearch] Error invoking deep-research. Full error object:', invokeError);
        // De context, inclusief de body van de functie-response, zit mogelijk in invokeError.context
        if (invokeError.context && typeof invokeError.context === 'object') {
          // console.error('[useDeepResearch] Error context:', invokeError.context);
          const responseText = invokeError.context.text || invokeError.context.responseText || (typeof invokeError.context.data === 'string' ? invokeError.context.data : null);
          if (responseText) {
            try {
              // const errorResponseBody = JSON.parse(responseText); // Verwijderd, want niet meer gebruikt
              // console.error('[useDeepResearch] Parsed error response body from function:', errorResponseBody); // Verwijderd
            } catch (e) {
              // console.error('[useDeepResearch] Could not parse error response body, raw text:', responseText); // Verwijderd
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
        // Stop verdere uitvoering hier als er een invokeError is
        setIsResearching(false);
        currentThinkingMessageId.current = null;
        return;
      }

      if (data && localLoaderMessageId) {
        // console.log(
          // `[useDeepResearch] Received data. Attempting to update LOCAL message. LocalLoaderID: ${localLoaderMessageId}, DB-Returned-ID: ${data.id}. Content Snippet: "${data.researchResult?.substring(0, 70)}..."`
        // );
        
        // Combineer verwijderen loader en toevoegen research_result in één transactie
        const newResearchResultId = uuidv4();
        const newResultMessage: Message = {
          id: newResearchResultId,
          role: 'assistant',
          content: data.researchResult,
          citations: data.citations,
          messageType: 'research_result',
          isLoading: false,
          timestamp: Date.now(),
          canBeSaved: true,
          subtask_title: customPrompt || null,
          _forceDisplay: true
        };
        setMessages(prevMessages => {
          const filtered = prevMessages.filter(msg => msg.id !== localLoaderMessageId);
          return [...filtered, newResultMessage];
        });
        // console.log(`[useDeepResearch] Nieuw research_result bericht toegevoegd met force en ID: ${newResearchResultId}`);
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
  }, [task, isResearching, user, addMessage, updateMessage, toast, t, setMessages]);

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