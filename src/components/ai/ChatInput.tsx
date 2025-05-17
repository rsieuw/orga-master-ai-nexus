import { KeyboardEvent, ChangeEvent, FocusEvent } from "react";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Send, Save } from "lucide-react";
import { GradientLoader } from "@/components/ui/loader.tsx";
import { useTranslation } from "react-i18next";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.tsx";

/**
 * Props for the ChatInput component.
 */
interface ChatInputProps {
  /** Function to call when the user submits a message or saves a note. */
  onSubmit: () => void;
  /** Whether the component is in a loading state (disables input). */
  isLoading: boolean;
  /** Whether the component is in note-taking mode. */
  isNoteMode: boolean;
  /** The current input text value. */
  input: string;
  /** Function to update the input text value. */
  setInput: (input: string) => void;
  /** Optional: Handler for when the input field receives focus. */
  onFocus?: (event: FocusEvent<HTMLTextAreaElement>) => void;
  /** Optional: Handler for when the input field loses focus. */
  onBlur?: (event: FocusEvent<HTMLTextAreaElement>) => void;
}

/**
 * Input component for the chat interface that handles both message input and note-taking.
 *
 * Features:
 * - Adapts UI and behavior based on note-taking or chat messaging mode
 * - Shows different icon (Save/Send) based on the current mode
 * - Supports keyboard shortcuts (Ctrl+Enter) for submission
 * - Shows tooltips explaining the action
 * - Disables input during loading states
 * 
 * @param {ChatInputProps} props - The props for the ChatInput component.
 * @returns {JSX.Element} The ChatInput component.
 */
export function ChatInput({ 
  onSubmit, 
  isLoading, 
  isNoteMode, 
  input, 
  setInput,
  onFocus,
  onBlur
}: ChatInputProps) {
  const { t } = useTranslation();

  /**
   * Handles keyboard events, allowing submission via Ctrl+Enter.
   *
   * @param {KeyboardEvent<HTMLTextAreaElement>} e - The keyboard event.
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault(); 
      onSubmit();
    }
  };

  /**
   * Updates the input state when the textarea content changes.
   *
   * @param {ChangeEvent<HTMLTextAreaElement>} e - The change event.
   */
  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <div className="relative flex flex-grow items-end gap-2 px-2 sm:px-3">
        <label htmlFor="chat-message-input" className="sr-only">
          {t('chatInput.messagePlaceholder', 'Type je bericht...')}
        </label>
        <Textarea
          id="chat-message-input"
          name="chat-message-input"
          className="chat-input flex-grow resize-none p-1"
          placeholder={isNoteMode ? t('chatPanel.notePlaceholder') : t('chatInput.messagePlaceholder')}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isLoading}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                onClick={onSubmit}
                size="icon"
                disabled={isLoading || !input.trim()}
                className="absolute right-6 sm:right-8 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
              >
                {isLoading ? (
                  <GradientLoader size="sm" />
                ) : isNoteMode ? (
                  <Save className="h-5 w-5" />
                ) : (
                  <Send className="h-5 w-5" />
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