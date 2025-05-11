import { KeyboardEvent, ChangeEvent } from "react";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Send, Save } from "lucide-react";
import { GradientLoader } from "@/components/ui/loader.tsx";
import { useTranslation } from "react-i18next";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.tsx";

interface ChatInputProps {
  onSubmit: () => void;
  isLoading: boolean;
  isNoteMode: boolean;
  input: string;
  setInput: (input: string) => void;
}

export function ChatInput({ 
  onSubmit, 
  isLoading, 
  isNoteMode, 
  input, 
  setInput 
}: ChatInputProps) {
  const { t } = useTranslation();

  // Handle key presses like Ctrl+Enter to submit
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault(); 
      onSubmit();
    }
  };

  // Handle input changes
  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <div className="relative flex items-end gap-2">
        <Textarea
          className="chat-input flex-grow resize-none pt-3 pb-2"
          placeholder={isNoteMode ? t('chatPanel.notePlaceholder') : t('chatPanel.messagePlaceholder')}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isLoading}
        />
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                onClick={onSubmit}
                size="icon"
                disabled={isLoading || !input.trim()}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
              >
                {isLoading ? (
                  <GradientLoader size="sm" />
                ) : isNoteMode ? (
                  <Save className="h-6 w-6" />
                ) : (
                  <Send className="h-6 w-6" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" align="end" sideOffset={5} className="bg-popover/90 backdrop-blur-lg">
              <p>{isNoteMode ? t('chatPanel.saveNoteTooltip') : t('chatPanel.sendMessageTooltip')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </form>
  );
} 