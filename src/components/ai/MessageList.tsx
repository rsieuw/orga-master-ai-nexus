import { Message } from "./types.ts";
import { MessageItem } from "./MessageItem.tsx";
import { Bot } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  isAiResponding: boolean;
  onCopy: (text: string) => void;
  onDeleteNote?: (noteId: string) => void;
  onDeleteResearch?: (researchId: string) => void;
  onTogglePin?: (messageId: string, currentIsPinned: boolean) => void;
  userAvatarUrl?: string;
}

export function MessageList({ 
  messages, 
  isLoading, 
  isAiResponding, 
  onCopy, 
  onDeleteNote, 
  onDeleteResearch, 
  onTogglePin,
  userAvatarUrl
}: MessageListProps) {
  const { t } = useTranslation();
  
  // Create local copy of messages that applies research detection
  const enhancedMessages = useMemo(() => {
    return messages.map(msg => {
      // If the message looks like a research result but isn't correctly tagged
      if (msg.role === 'assistant' && 
          typeof msg.content === 'string' && 
          msg.content.length > 100 && 
          (msg.citations !== undefined || msg.content.includes('#')) && 
          msg.messageType !== 'research_result') {
        
        return {
          ...msg,
          messageType: 'research_result' as const
        };
      }
      return msg;
    });
  }, [messages]);
  
  const messageElements = useMemo(() => {
    return enhancedMessages.map((message) => {
      return (
        <MessageItem
          key={message.id}
          message={message}
          isLoading={isLoading}
          onCopy={onCopy}
          onDeleteNote={onDeleteNote}
          onDeleteResearch={onDeleteResearch}
          onTogglePin={onTogglePin}
          userAvatarUrl={userAvatarUrl}
        />
      );
    });
  }, [enhancedMessages, isLoading, onCopy, onDeleteNote, onDeleteResearch, onTogglePin, userAvatarUrl]);

  return (
    <div className="px-4 pt-6 pb-4">
      {messages.length === 0 && !isLoading && !isAiResponding && (
        <div className="py-8 text-center text-muted-foreground">
          <p>{t('chatPanel.startConversationPrompt')}</p>
        </div>
      )}
      
      {messageElements}
      
      {/* Loading indicator for assistant typing */}
      {isAiResponding && (
        <div className="flex items-start space-x-2 p-4 animate-pulse">
          <div className="rounded-full bg-muted h-8 w-8 flex items-center justify-center">
            <Bot className="h-5 w-5 text-foreground" />
          </div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      )}
    </div>
  );
} 