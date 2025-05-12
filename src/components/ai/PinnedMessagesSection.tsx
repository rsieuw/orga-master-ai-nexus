import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Message } from "./types.ts";
import { MessageItem } from "./MessageItem.tsx";
import { ChevronDown, ChevronUp, Pin } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

interface PinnedMessagesSectionProps {
  messages: Message[];
  onCopy: (text: string) => void;
  onTogglePin: (messageId: string, currentIsPinned: boolean) => void;
  isLoading: boolean;
  userAvatarUrl?: string;
}

export function PinnedMessagesSection({ 
  messages, 
  onCopy, 
  onTogglePin,
  isLoading,
  userAvatarUrl
}: PinnedMessagesSectionProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const pinnedMessages = messages.filter(msg => msg.isPinned);

  if (pinnedMessages.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-border">
      <div className="flex items-center justify-between px-4 py-2">
        <Button 
          variant="ghost" 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium"
        >
          <Pin className="h-4 w-4 text-primary" />
          <span>{t('chatPanel.pinnedMessages', 'Vastgepinde berichten')} ({pinnedMessages.length})</span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-2">
          {pinnedMessages.map((message, index) => (
            <MessageItem
              key={message.id || index}
              message={message}
              onCopy={onCopy}
              onTogglePin={onTogglePin}
              isLoading={isLoading}
              userAvatarUrl={userAvatarUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
} 