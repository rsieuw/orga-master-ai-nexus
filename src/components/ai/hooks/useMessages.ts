import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { useTranslation } from "react-i18next";
import { Message } from "../types.ts";
import { Database } from "@/types/supabase.ts";
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from "@/contexts/AuthContext.tsx";

// Define an alias for the specific table row type
type OriginalSavedResearchRow = Database['public']['Tables']['saved_research']['Row'];

export function useMessages(taskId: string | null, taskTitle: string | null, selectedSubtaskTitle: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();

  // Helper function to ensure a message has an ID
  const ensureMessageHasId = useCallback((message: Omit<Message, 'id'> & { id?: string }): Message => {
    return { ...message, id: message.id || uuidv4() } as Message;
  }, []);

  // Save message to database
  const saveMessageToDb = useCallback(async (message: Message) => {
    if (message.messageType === 'research_result' || message.messageType === 'research_loader') {
      return; // Do not save research results/loaders in chat_messages
    }
    if (!taskId) {
      console.warn("Attempted to save message without a valid taskId.");
      setError(t('chatPanel.errors.taskIdMissing'));
      return;
    }
    try {
      if (!user) throw new Error(t('chatPanel.errors.userNotLoggedIn'));

      const { error: dbError } = await supabase
        .from('chat_messages')
        .insert({
          id: message.id,
          task_id: taskId,
          user_id: user.id,
          role: message.role,
          content: message.content,
          message_type: message.messageType,
        });
      if (dbError) throw dbError;
    } catch (err) {
      console.error("Error saving message to DB:", err);
      setError(t('chatPanel.toast.saveMessageToDbFailed'));
    }
  }, [taskId, t, user]);

  const saveResearchToDb = useCallback(async (researchData: Pick<Message, 'content' | 'citations' | 'subtask_title' | 'prompt'>) => {
    if (!taskId || !user) {
      console.error("Cannot save research: taskId or user is not available.");
      toast({
        variant: "destructive",
        title: t('chatPanel.toast.saveFailedTitle'),
        description: t('chatPanel.errors.taskIdOrUserMissing'),
      });
      return null;
    }

    try {
      const { data, error: functionError } = await supabase.functions.invoke('save-research', {
        body: {
          taskId: taskId,
          researchContent: researchData.content,
          citations: researchData.citations,
          subtaskTitle: researchData.subtask_title,
          prompt: researchData.prompt
        }
      });

      if (functionError) {
        let errorKey = 'chatPanel.toast.saveResearchToDbFailed';
        let serverErrorMessage = functionError.message;

        if (functionError.context && typeof functionError.context === 'object' && functionError.context !== null) {
            const contextError = (functionError.context as { error?: { errorKey?: string, message?: string } }).error;
            if (contextError?.errorKey) {
                errorKey = contextError.errorKey;
            }
            if (contextError?.message) {
                serverErrorMessage = contextError.message;
            }
        }
        
        console.error("Error invoking save-research function:", functionError);
        toast({
          variant: "destructive",
          title: t('chatPanel.toast.saveFailedTitle'),
          description: t(errorKey, { error: serverErrorMessage }),
        });
        return null;
      }
      
      if (data && data.messageKey) {
          toast({
            title: t('chatPanel.toast.researchSavedTitle'), 
            description: t(data.messageKey),
          });
      } else {
           toast({
              title: t('chatPanel.toast.researchSavedTitle'),
              description: t('chatPanel.toast.researchSavedDescription'), // Fallback
          });
      }

      setReloadTrigger(prev => prev + 1); 
      return data; // Edge function returns { messageKey, savedResearchId }

    } catch (err) {
      console.error("Client-side error saving research via function:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast({
        variant: "destructive",
        title: t('chatPanel.toast.saveFailedTitle'),
        description: t('chatPanel.toast.saveResearchToDbFailed', { error: errorMessage }),
      });
      return null;
    }
  }, [taskId, user, t, toast, setReloadTrigger]);

  // Add new message to state and optionally save to DB
  const addMessage = useCallback(async (messageData: Omit<Message, 'id' | 'timestamp' | 'createdAt'> & { id?: string, timestamp?:number, createdAt?:string }, saveToDb = true) => {
    const newMessage = ensureMessageHasId({
        ...messageData,
        timestamp: messageData.timestamp || Date.now(),
        createdAt: messageData.createdAt || new Date().toISOString(),
    });
    setMessages(prev => [...prev, newMessage]);
    
    if (newMessage.messageType === 'research_result') {
      await saveResearchToDb({
        content: newMessage.content, 
        citations: newMessage.citations,
        subtask_title: newMessage.subtask_title, 
        prompt: newMessage.prompt
      });
    } else if (saveToDb) {
      await saveMessageToDb(newMessage);
    }
  }, [saveMessageToDb, saveResearchToDb, setMessages, ensureMessageHasId]);

  // Update message in state by client-side ID
  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    );
    // Optional: also update in DB if it's an existing message
    // const messageToUpdate = messages.find(m => m.id === messageId);
    // if (messageToUpdate && messageToUpdate.dbId) { /* update logic for DB */ }
  }, []);

  // Load initial messages
  useEffect(() => {
    // Functie en types voor message type validatie, bovenaan de useEffect scope geplaatst
    const validMessageTypes = ['standard', 'research_result', 'system', 'error', 'note_saved', 'action_confirm', 'saved_research_display', 'research_loader'] as const;
    type ValidMessageType = typeof validMessageTypes[number];
    function isValidMessageType(type: string | null | undefined): type is ValidMessageType {
      return !!type && (validMessageTypes as ReadonlyArray<string>).includes(type);
    }

    const loadMessagesAndNotes = async () => {
      if (!taskId) {
        setMessages([]);
        setIsLoading(false);
        setError(t('chatPanel.errors.taskIdMissing'));
        return;
      }
      setIsLoading(true);
      setError(null);

      const username = user?.name || t('chatPanel.defaultUsername');

      const initialWelcomeMessage: Message = ensureMessageHasId({
        role: "assistant",
        content: t('chatPanel.initialAssistantMessage', { 
            taskTitle: taskTitle ?? t('chatPanel.defaultTaskTitle'), 
            username: username 
        }),
        timestamp: Date.now() - 1, // Slightly earlier than loaded messages
        createdAt: new Date(Date.now() - 1).toISOString(),
        messageType: 'system'
      });

      try {
        if (!user) throw new Error(t('chatPanel.errors.userNotLoggedIn'));

        const { data: dbMessages, error: chatError } = await supabase
          .from('chat_messages')
          .select('id, role, content, created_at, message_type') // Select ID
          .eq('task_id', taskId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        if (chatError) throw chatError;

        const { data: dbNotes, error: notesError } = await supabase
          .from('task_notes')
          .select('id, content, created_at')
          .eq('task_id', taskId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        if (notesError) throw notesError;
        
        const { data: dbResearch, error: researchError } = await supabase
          .from('saved_research')
          .select('id, research_content, created_at, citations, subtask_title, prompt, task_id, user_id')
          .eq('task_id', taskId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        if (researchError) console.warn("Could not fetch saved research:", researchError.message);

        const loadedChatMessages: Message[] = (dbMessages || []).map((msg) => ensureMessageHasId({
          dbId: msg.id, // Store DB ID separately
          id: msg.id, // Client-side ID is the same as DB ID for loaded messages
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at).getTime(),
          createdAt: msg.created_at,
          messageType: isValidMessageType(msg.message_type) ? msg.message_type : 'standard' // Fallback
        }));

        const loadedNotes: Message[] = (dbNotes || []).map((note) => ensureMessageHasId({
          dbId: note.id,
          id: note.id, 
          role: 'user',
          content: note.content,
          timestamp: new Date(note.created_at).getTime(),
          createdAt: note.created_at,
          messageType: 'note_saved',
        }));

        const loadedResearch: Message[] = (dbResearch || []).map((research: OriginalSavedResearchRow) => {
          let mappedCitations: string[] | undefined = undefined;
          if (Array.isArray(research.citations)) {
            if (research.citations.every((item): item is string => typeof item === 'string')) mappedCitations = research.citations;
            else if (research.citations.length === 0) mappedCitations = [];
          }
          return ensureMessageHasId({
            dbId: research.id,
            id: research.id, 
            role: 'assistant',
            content: research.research_content ?? '', 
            timestamp: new Date(research.created_at).getTime(),
            createdAt: research.created_at,
            messageType: 'saved_research_display',
            citations: mappedCitations, 
            subtask_title: research.subtask_title, 
            prompt: research.prompt ?? null 
          });
        });

        const combinedMessages = [...loadedChatMessages, ...loadedNotes, ...loadedResearch].sort(
          (a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0)
        );
        setMessages([initialWelcomeMessage, ...combinedMessages]);
      } catch (err: unknown) {
        console.error("Error loading messages and notes:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(t('chatPanel.toast.loadMessagesAndNotesFailed') + (errorMessage ? `: ${errorMessage}`: ''));
        setMessages([initialWelcomeMessage]);
      } finally {
        setIsLoading(false);
      }
    };
    loadMessagesAndNotes();
  }, [taskId, taskTitle, reloadTrigger, t, user, ensureMessageHasId, setMessages, setIsLoading, setError]);

  // Handle selected subtask
  useEffect(() => {
    if (selectedSubtaskTitle && taskId) {
      addMessage({
        role: "assistant",
        content: t('chatPanel.subtaskSelectedMessage', { subtaskTitle: selectedSubtaskTitle ?? '' }),
        messageType: 'system'
      }, true); // Save this system message
    }
  }, [selectedSubtaskTitle, taskId, addMessage, t]);

  // Function to clear chat history
  const clearHistory = async () => {
    if (!taskId || !user) {
        console.warn("Task ID or user is missing, cannot clear history.");
        return;
    }
    setIsLoading(true);
    try {
      const { error: deleteError } = await supabase.from('chat_messages').delete().eq('task_id', taskId).eq('user_id', user.id);
      if (deleteError) throw deleteError;
      const { error: deleteNotesError } = await supabase.from('task_notes').delete().eq('task_id', taskId).eq('user_id', user.id);
      if (deleteNotesError) console.warn("Could not delete associated notes:", deleteNotesError.message); // Not fatal
      const { error: deleteResearchError } = await supabase.from('saved_research').delete().eq('task_id', taskId).eq('user_id', user.id);
      if (deleteResearchError) console.warn("Could not delete associated research:", deleteResearchError.message); // Not fatal
      setMessages([]); // Clear local state
      setReloadTrigger(prev => prev + 1); // Trigger reload to show welcome message
      toast({ title: t('chatPanel.toast.historyClearedTitle'), description: t('chatPanel.toast.historyClearedDescription') });
    } catch (err: unknown) {
      console.error("Error clearing history:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(t('chatPanel.toast.clearHistoryFailed') + (errorMessage ? `: ${errorMessage}`: ''));
    } finally {
      setIsLoading(false);
    }
  };

  // Function to delete a note
  const deleteNote = async (noteIdToDelete: string) => {
    if (!noteIdToDelete) return;

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
  };

  // Function to delete saved research
  const deleteResearch = async (researchIdToDelete: string) => {
    if (!researchIdToDelete) return;

    try {
      const { error } = await supabase.functions.invoke('delete-research', {
        body: { researchId: researchIdToDelete }
      });

      if (error) throw error;

      toast({ 
        title: t('chatPanel.toast.researchDeletedTitle'), 
        description: t('chatPanel.toast.researchDeletedDescription')
      });
      setReloadTrigger(prev => prev + 1);

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
  };

  // --- Placeholder functions --- 
  const deleteMessageFromDb = (messageId: string) => {
    console.warn("Placeholder: deleteMessageFromDb called for ID:", messageId);
    // Implement logic here to delete a specific chat message
  };

  const saveNoteToChat = (noteData: Pick<Message, 'content'>) => {
    console.warn("Placeholder: saveNoteToChat called with data:", noteData);
    // Implement logic here to add a note to the chat (perhaps via addMessage?)
    // You will need taskId and userId.
  };

  const displaySavedResearchInChat = (researchItem: Message) => {
    console.warn("Placeholder: displaySavedResearchInChat called for item:", researchItem);
    // This function should format the research data and add it via addMessage
    // with messageType 'saved_research_display'
  };
  // --- END New added placeholder functions ---

  // Make sure the names match what ChatPanel imports
  return {
    messages,
    setMessages, 
    isLoading,
    setIsLoading, 
    addMessage,
    updateMessage,
    saveMessageToDb, 
    clearHistory, 
    deleteNote, // Keep this name as handleDeleteNote in ChatPanel
    deleteResearch, // Keep this name as handleDeleteResearch in ChatPanel
    deleteMessageFromDb, // Export this function
    saveResearchToDb, // Export this function
    saveNoteToChat, // Export this function
    displaySavedResearchInChat, // Export this function
    reloadTrigger,
    error
  };
} 