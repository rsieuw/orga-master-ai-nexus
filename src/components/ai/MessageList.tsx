import { Message } from "./types.ts";
import { MessageItem } from "./MessageItem.tsx";
import { Bot } from "lucide-react";
import { useTranslation } from "react-i18next";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  isAiResponding: boolean;
  onCopy: (text: string) => void;
  onDeleteNote: (noteId: string) => void;
  onDeleteResearch: (researchId: string) => void;
}

export function MessageList({ 
  messages, 
  isLoading, 
  isAiResponding, 
  onCopy, 
  onDeleteNote, 
  onDeleteResearch 
}: MessageListProps) {
  const { t } = useTranslation();

  return (
    <div className="px-4 pt-6 pb-4">
      {messages.length === 0 && !isLoading && !isAiResponding && (
        <div className="py-8 text-center text-muted-foreground">
          <p>{t('chatPanel.startConversationPrompt')}</p>
        </div>
      )}
      
      {messages.map((message, index) => (
        <MessageItem
          key={index}
          message={message}
          index={index}
          onCopy={onCopy}
          onDeleteNote={onDeleteNote}
          onDeleteResearch={onDeleteResearch}
          isLoading={isLoading}
        />
      ))}
      
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