import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { useTranslation } from "react-i18next";
import { Message, MessageType, Citation } from "../types.ts";
import { Database } from "@/types/supabase.ts";
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from "@/hooks/useAuth.ts";

// Helper function to ensure a message has an ID
export const ensureMessageHasId = (message: Omit<Message, 'id'> & { id?: string }): Message => {
  return { ...message, id: message.id || uuidv4() } as Message;
};

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

  // Save message to database
  const saveMessageToDb = useCallback(async (message: Message) => {
    if (message.messageType === 'research_result' || message.messageType === 'research_loader') {
      return; // Do not save research results/loaders in chat_messages
    }
    if (!taskId) {
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
      setError(t('chatPanel.toast.saveMessageToDbFailed'));
    }
  }, [taskId, t, user]);

  const saveResearchToDb = useCallback(async (researchData: Pick<Message, 'content' | 'citations' | 'subtask_title' | 'prompt'>) => {
    if (!taskId || !user) {
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
  const addMessage = useCallback(async (messageData: Omit<Message, 'id' | 'timestamp' | 'createdAt'> & { 
    id?: string, 
    timestamp?:number, 
    createdAt?:string,
    _forceDisplay?: boolean
  }, saveToDb = true) => {
    const newMessage = ensureMessageHasId({
        ...messageData,
        timestamp: messageData.timestamp || Date.now(),
        createdAt: messageData.createdAt || new Date().toISOString(),
    });

    const currentMessageType: MessageType = newMessage.messageType;
    if (currentMessageType === 'research_result') {
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, newMessage];
        try {
          if (typeof window !== 'undefined') {
            const localStorageKey = `useMessages_${taskId || 'default'}_research_messages`;
            const existingResearch = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
            localStorage.setItem(localStorageKey, JSON.stringify([...existingResearch, newMessage]));
          }
        } catch (e) {
          // Error during localStorage synchronization for research
        }
        return updatedMessages;
      });
      await saveResearchToDb({
        content: newMessage.content, 
        citations: newMessage.citations,
        subtask_title: newMessage.subtask_title, 
        prompt: newMessage.prompt
      });
      return newMessage;
    } else {
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages, newMessage];
        try {
          if (typeof window !== 'undefined') {
            const localStorageKey = `useMessages_${taskId || 'default'}_state`;
            localStorage.setItem(localStorageKey, JSON.stringify(updatedMessages));
          }
        } catch (e) {
          // Error during localStorage synchronization
        }
        return updatedMessages;
      });
    }

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

    return newMessage;
  }, [taskId, saveMessageToDb, saveResearchToDb, setMessages]);

  // Update message in state by client-side ID
  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    if (updates.messageType === 'research_result') {
      if (typeof updates.content !== 'string') {
        updates.content = String(updates.content || '');
      }
    }
    setMessages(prevMessages => {
      const msgIndex = prevMessages.findIndex(msg => msg.id === messageId);
      
      if (msgIndex === -1) {
        return prevMessages; // No change if message does not exist
      }

      const updatedMessage = {
        ...prevMessages[msgIndex],
        ...updates
      };

      const newMessages = [
        ...prevMessages.slice(0, msgIndex),
        updatedMessage,
        ...prevMessages.slice(msgIndex + 1)
      ];
      
      try {
        if (typeof window !== 'undefined') {
          const localStorageKey = `useMessages_${taskId || 'default'}_state`;
          localStorage.setItem(localStorageKey, JSON.stringify(newMessages));
        }
      } catch (e) {
        // Error during localStorage synchronization
      }
      
      return newMessages;
    });
    
    setTimeout(() => {
      setMessages(prev => [...prev]);
    }, 800);
    
    return null;
  }, [taskId]);

  // Load initial messages
  useEffect(() => {
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
          .select('id, role, content, created_at, message_type, is_pinned')
          .eq('task_id', taskId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        if (chatError) throw chatError;

        // Specifically fetch all pinned messages, even if they are not in the standard query
        const { data: pinnedMessages, error: pinnedError } = await supabase
          .from('chat_messages')
          .select('id, role, content, created_at, message_type, is_pinned')
          .eq('task_id', taskId)
          .eq('user_id', user.id)
          .eq('is_pinned', true)
          .order('created_at', { ascending: true });
        if (pinnedError) console.warn(t('chatPanel.errors.fetchPinnedMessagesGeneric'), pinnedError);

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
        if (researchError) console.warn(t('chatPanel.errors.couldNotFetchSavedResearch'));

        const loadedChatMessages: Message[] = (dbMessages || []).map((msg) => ensureMessageHasId({
          dbId: msg.id,
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at).getTime(),
          createdAt: msg.created_at,
          messageType: isValidMessageType(msg.message_type) ? msg.message_type : 'standard',
          isPinned: msg.is_pinned ?? false
        }));

        // Specifically process pinned messages (these take precedence)
        const pinnedMessageIds = new Set((pinnedMessages || []).map(msg => msg.id));
        
        // Update existing messages if they are pinned
        const updatedChatMessages = loadedChatMessages.map(msg => {
          // If this message is in the pinnedMessages list, but not marked as pinned
          if (pinnedMessageIds.has(msg.id) && !msg.isPinned) {
            return { ...msg, isPinned: true };
          }
          return msg;
        });

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
          let mappedFrontendCitations: Citation[] | undefined = undefined;

          if (research.citations && Array.isArray(research.citations)) {
            const tempMapped = research.citations.map((dbCitation: unknown): Citation | undefined => {
              if (typeof dbCitation === 'object' && dbCitation !== null) {
                const pc = dbCitation as Partial<Citation>; // Potential Citation
                // Alleen teruggeven als het de essentiële velden heeft (bijv. text of url)
                if (pc.text || pc.url || pc.title) {
                    return {
                        number: pc.number,
                        text: pc.text,
                        title: pc.title,
                        url: pc.url,
                    } as Citation;
                }
              } else if (typeof dbCitation === 'string') {
                // Fallback voor pure string URLs
                return { url: dbCitation, text: dbCitation, title: dbCitation } as Citation;
              }
              return undefined;
            });
            // Filter alle undefined entries eruit
            mappedFrontendCitations = tempMapped.filter((c): c is Citation => c !== undefined);
            
            if (mappedFrontendCitations.length === 0 && research.citations.length > 0) {
               console.warn(`[useMessages] Research ID ${research.id}: DB citations present but mapping resulted in empty array. Original:`, JSON.stringify(research.citations));
               mappedFrontendCitations = undefined; // Zet op undefined als het resultaat leeg is
            } else if (mappedFrontendCitations.length === 0) {
                mappedFrontendCitations = undefined; // Ook hier, als leeg na filteren
            }
          } else if (research.citations) {
            console.warn(`[useMessages] Research ID ${research.id}: DB citations is not an array:`, research.citations);
          }

          return ensureMessageHasId({
            dbId: research.id,
            id: research.id, 
            role: 'assistant',
            content: research.research_content ?? '', 
            timestamp: new Date(research.created_at).getTime(),
            createdAt: research.created_at,
            messageType: 'saved_research_display',
            citations: mappedFrontendCitations, 
            subtask_title: research.subtask_title, 
            prompt: research.prompt ?? null 
          });
        });

        const combinedMessages = [...updatedChatMessages, ...loadedNotes, ...loadedResearch].sort(
          (a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0)
        );
        setMessages([initialWelcomeMessage, ...combinedMessages]);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(t('chatPanel.toast.loadMessagesAndNotesFailed') + (errorMessage ? `: ${errorMessage}`: ''));
        setMessages([initialWelcomeMessage]);
      } finally {
        setIsLoading(false);
      }
    };
    loadMessagesAndNotes();
  }, [taskId, taskTitle, reloadTrigger, t, user, setMessages, setIsLoading, setError]);

  // Handle selected subtask
  useEffect(() => {
    if (selectedSubtaskTitle && taskId) {
      const expectedMessageContent = t('chatPanel.subtaskSelectedMessage', { subtaskTitle: selectedSubtaskTitle ?? '' });
      
        addMessage({
          role: "assistant",
        content: expectedMessageContent,
          messageType: 'system'
        }, true); // Save this system message
      }
  }, [selectedSubtaskTitle, taskId, addMessage, t]);

  // Function to clear chat history
  const clearHistory = async () => {
    if (!taskId || !user) {
        return;
    }
    setIsLoading(true);
    try {
      // Delete only non-pinned chat messages
      await supabase
        .from('chat_messages')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .eq('is_pinned', false);
      
      // Reload the pinned chat messages
      const { data: pinnedChatMessages, error: fetchPinnedError } = await supabase
        .from('chat_messages')
        .select('id, role, content, created_at, message_type, is_pinned')
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .eq('is_pinned', true);
        
      if (fetchPinnedError) throw fetchPinnedError;
      
      const pinnedMessagesFormatted = (pinnedChatMessages || []).map((msg) => {
        const messageType = msg.message_type as 'standard' | 'system' | 'error' | 'note_saved' | 'action_confirm' | 'saved_research_display' | 'research_loader' | 'research_result';
        return ensureMessageHasId({
          dbId: msg.id,
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at).getTime(),
          createdAt: msg.created_at,
          messageType: messageType,
          isPinned: true
        });
      });

      // Reload notes
      const { data: dbNotes, error: notesError } = await supabase
        .from('task_notes')
        .select('id, content, created_at')
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (notesError) throw notesError;

      const loadedNotes: Message[] = (dbNotes || []).map((note) => ensureMessageHasId({
        dbId: note.id,
        id: note.id, 
        role: 'user', // Notes are considered 'user' role in the Message interface
        content: note.content,
        timestamp: new Date(note.created_at).getTime(),
        createdAt: note.created_at,
        messageType: 'note_saved',
      }));

      // Reload saved research
      const { data: dbResearch, error: researchError } = await supabase
        .from('saved_research')
        .select('id, research_content, created_at, citations, subtask_title, prompt, task_id, user_id')
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (researchError) console.warn(t('chatPanel.errors.couldNotFetchSavedResearchAfterClear', { error: researchError.message }));
      
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
      
      // Add welcome message
      const username = user?.name || t('chatPanel.defaultUsername');
      const welcomeMessage = ensureMessageHasId({
        role: "assistant",
        content: t('chatPanel.initialAssistantMessage', { 
          taskTitle: taskTitle ?? t('chatPanel.defaultTaskTitle'), 
          username: username 
        }),
        timestamp: Date.now() -1, // Ensure it's slightly before other messages if timestamps are too close
        createdAt: new Date(Date.now() -1).toISOString(),
        messageType: 'system'
      });
      
      // Combine all messages: pinned chat messages, notes, and research
      const combinedMessages = [
        ...pinnedMessagesFormatted, 
        ...loadedNotes, 
        ...loadedResearch
      ].sort(
        (a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0)
      );
      
      // Add the welcome message before the sorted messages
      setMessages([welcomeMessage, ...combinedMessages]);
      
      // Show a confirmation
      const pinnedCount = pinnedMessagesFormatted.length;
      const notesCount = loadedNotes.length;
      const researchCount = loadedResearch.length;
      
      let message = t('chatPanel.toast.historyClearedDescription');
      const keptItems: string[] = [];
      if (pinnedCount > 0) keptItems.push(t('chatPanel.toast.pinnedItemsKept', { count: pinnedCount }));
      if (notesCount > 0) keptItems.push(t('chatPanel.toast.notesItemsKept', { count: notesCount }));
      if (researchCount > 0) keptItems.push(t('chatPanel.toast.researchItemsKept', { count: researchCount }));

      if (keptItems.length > 0) {
        message = t('chatPanel.toast.historyClearedWithKeptItemsDescription', { items: keptItems.join(', ') });
      }
        
      toast({ 
        title: t('chatPanel.toast.historyClearedTitle'), 
        description: message
      });
    } catch (err: unknown) {
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
  const deleteResearch = async (researchIdOrMessageId: string) => {
    if (!researchIdOrMessageId) return;

    // Controleren of het een message ID is van een niet-opgeslagen onderzoek of een database ID van opgeslagen onderzoek
    const messageWithId = messages.find(msg => msg.id === researchIdOrMessageId);
    
    // Als het een message ID is, dan verwijderen we het uit de lokale state
    if (messageWithId && messageWithId.messageType === 'research_result') {
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== researchIdOrMessageId));
      
      try {
        if (typeof window !== 'undefined') {
          // Ook uit localStorage verwijderen als het daar is opgeslagen
          const localStorageKey = `useMessages_${taskId || 'default'}_research_messages`;
          const storedResearch = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
          const updatedResearch = storedResearch.filter((msg: Message) => msg.id !== researchIdOrMessageId);
          localStorage.setItem(localStorageKey, JSON.stringify(updatedResearch));
        }
      } catch (e) {
        // Fout bij lokale opslag bewerkingen negeren
      }
      
      toast({ 
        title: t('chatPanel.toast.researchDeletedTitle'), 
        description: t('chatPanel.toast.researchDeletedDescription')
      });
      
      return;
    }
    
    // Anders is het waarschijnlijk een database ID, probeer het te verwijderen uit de database
    try {
      const { error } = await supabase.functions.invoke('delete-research', {
        body: { researchId: researchIdOrMessageId }
      });

      if (error) throw error;

      // Ook verwijderen uit lokale state als het bestaat als opgeslagen onderzoek
      setMessages(prevMessages => prevMessages.filter(msg => 
        !(msg.dbId === researchIdOrMessageId || 
          (msg.id === researchIdOrMessageId && msg.messageType === 'saved_research_display'))
      ));

      toast({ 
        title: t('chatPanel.toast.researchDeletedTitle'), 
        description: t('chatPanel.toast.researchDeletedDescription')
      });
      setReloadTrigger(prev => prev + 1);

    } catch (error: unknown) {
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
  const deleteMessageFromDb = (_messageId: string) => {
    // Implement logic here to delete a specific chat message
  };

  const saveNoteToChat = (_noteData: Pick<Message, 'content'>) => {
    // Implement logic here to add a note to the chat (perhaps via addMessage?)
    // You will need taskId and userId.
  };

  const displaySavedResearchInChat = (_researchItem: Message) => {
    // This function should format the research data and add it via addMessage
    // with messageType 'saved_research_display'
  };
  // --- END New added placeholder functions ---

  // Functie om een bericht te pinnen/los te maken
  const togglePinMessage = useCallback(async (messageId: string, currentIsPinned: boolean) => {
    if (!taskId || !user) {
      toast({ variant: "destructive", title: t('common.error'), description: t('chatPanel.toast.cannotChangePinStatusDescription') });
      return;
    }

    const newPinnedStatus = !currentIsPinned;

    // Update locally for immediate UI feedback
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === messageId ? { ...msg, isPinned: newPinnedStatus } : msg
      )
    );

    try {
      const message = messages.find(msg => msg.id === messageId);
      if (!message) {
        throw new Error(t('chatPanel.errors.messageNotFoundInState'));
      }

      if (newPinnedStatus) {
        // Use the pin_message function
        const { error: rpcError } = await supabase.rpc('pin_message', {
          p_message_id: messageId,
          p_task_id: taskId,
          p_user_id: user.id,
          p_role: message.role,
          p_content: message.content,
          p_message_type: typeof message.messageType === 'string' ? message.messageType : 'standard',
          p_created_at: message.createdAt || new Date().toISOString()
        });

        if (rpcError) throw rpcError;

        toast({ 
          title: t('chatPanel.toast.messagePinnedTitle', 'Bericht pinned'),
          description: t('chatPanel.toast.messagePinnedDescription', 'The message is pinned and remains in the history.')
        });
      } else {
        // Use the unpin_message function
        const { error: rpcError } = await supabase.rpc('unpin_message', {
          p_message_id: messageId,
          p_task_id: taskId,
          p_user_id: user.id
        });

        if (rpcError) throw rpcError;
      }
    } catch (err) {
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId ? { ...msg, isPinned: currentIsPinned } : msg
        )
      );
      toast({ 
        variant: "destructive", 
        title: t('common.error'), 
        description: t('chatPanel.toast.togglePinFailedDescription', 'Could not update message pin status in database.') 
      });
    }
  }, [taskId, user, t, toast, setMessages, messages]);

  // Hier voegen we een effect toe om de berichten te laden vanuit localStorage als nodig
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && !isLoading && messages.length === 0) {
        const localStorageKey = `useMessages_${taskId || 'default'}_state`;
        const storedMessages = localStorage.getItem(localStorageKey);
        
        if (storedMessages) {
          const parsedMessages = JSON.parse(storedMessages) as Message[];
          // Controleren op onderzoeksberichten
          // const researchMsgs = parsedMessages.filter(m => // Deze variabele wordt niet meer gebruikt
          // m.messageType === 'research_result' || m.messageType === 'research_loader');
          
          // if (researchMsgs.length > 0) {} // Leeg if block verwijderd
          
          // Zorg ervoor dat dit alleen uitgevoerd wordt als we echt berichten hebben om te laden
          if (parsedMessages.length > 0) {
            setMessages(parsedMessages);
          }
        }
      }
    } catch (e) {
      // Leeg catch block verwijderd
    }
  }, [taskId, isLoading, messages.length]);

  // Return the messages, addMessage, isLoading and error
  return {
    messages,
    isLoading,
    error,
    addMessage,
    updateMessage,
    clearHistory,
    deleteNote,
    deleteResearch,
    deleteMessageFromDb,
    saveResearchToDb,
    saveNoteToChat,
    displaySavedResearchInChat,
    reloadTrigger,
    togglePinMessage,
    setMessages,
  };
} 