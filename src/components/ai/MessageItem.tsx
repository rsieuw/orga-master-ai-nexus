import { Message } from "./types.ts";
import { Bot, Copy, Sparkles, Trash2, Pin, User } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Components } from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { GradientLoader } from "@/components/ui/loader.tsx";

/**
 * Props for the MessageItem component.
 */
interface MessageItemProps {
  /** The message object to display, containing content, role, type, and other metadata. */
  message: Message;
  /** Function to call when the copy button is clicked to copy message content. */
  onCopy: (text: string) => void;
  /** Optional function to call when deleting a saved note. */
  onDeleteNote?: (noteId: string) => void;
  /** Optional function to call when deleting a research result. */
  onDeleteResearch?: (researchId: string) => void;
  /** Optional function to call when pinning or unpinning a message. */
  onTogglePin?: (messageId: string, currentIsPinned: boolean) => void;
  /** Whether the component is in a loading state (disables action buttons). */
  isLoading: boolean;
  /** Optional URL of the user's avatar to display for user messages. */
  userAvatarUrl?: string;
}

/**
 * A component that renders a single message item in the chat interface.
 * 
 * This component handles various message types (user messages, AI responses, notes, research results)
 * with different styling and functionality for each. It includes support for:
 * - Rendering markdown content with custom styling
 * - Showing user avatars or AI/research icons
 * - Action buttons for copying, deleting, and pinning messages
 * - Special formatting for research results with citations
 * - Loading state indicators
 *
 * @param {MessageItemProps} props - The props for the MessageItem component.
 * @returns {JSX.Element} The MessageItem component.
 */
export function MessageItem({ 
  message, 
  onCopy, 
  onDeleteNote, 
  onDeleteResearch,
  onTogglePin,
  isLoading,
  userAvatarUrl
}: MessageItemProps) {
  const { t } = useTranslation();

  // Define container classes based on message role
  const messageContainerClasses = `group/message flex items-start gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4` + (message.messageType === 'research_result' ? ' DBG-RESEARCH-CONTAINER' : '');
  
  /**
   * Custom component overrides for ReactMarkdown to apply specialized styling to markdown elements.
   * These ensure that markdown content is rendered with consistent styling that matches the application theme.
   */
  const markdownComponents: Partial<Components> = {
    p: ({node, ...props}) => <p className="mb-2" {...props} />,
    h1: ({node, ...props}) => <h1 className="text-xl font-semibold mb-3 mt-4 text-foreground" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-lg font-semibold mb-3 mt-3 leading-snug text-foreground" {...props} />,
    h3: ({node, ...props}) => <h3 className="text-base font-semibold mb-2 mt-3 leading-snug text-foreground" {...props} />,
    ul: ({node, ...props}) => <ul className="list-disc list-outside mb-2 ml-6" {...props} />,
    ol: ({node, ...props}) => <ol className="list-decimal list-outside mb-2 ml-6" {...props} />,
    li: ({node, ...props}) => <li className="mb-1" {...props} />,
    a: ({node, children, ...props}) => <a className="text-blue-400 hover:underline" {...props} target="_blank" rel="noopener noreferrer">{children}</a>,
    table: ({node, ...props}) => (
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-400 hover:scrollbar-thumb-slate-500 dark:scrollbar-thumb-slate-600 dark:hover:scrollbar-thumb-slate-500 scrollbar-track-slate-200 dark:scrollbar-track-slate-700/50 scrollbar-thumb-rounded-md my-4 shadow-lg rounded-xl bg-white dark:bg-slate-800">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700" {...props} />
      </div>
    ),
    thead: ({node, ...props}) => <thead className="bg-slate-50 dark:bg-slate-700/50" {...props} />,
    th: ({node, ...props}) => <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-600 whitespace-normal break-words" {...props} />,
    td: ({node, ...props}) => <td className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 whitespace-normal break-words" {...props} />,
    hr: ({node, ...props}) => <hr style={{ borderTop: '0.5px solid #1e5593', marginTop: '1rem', marginBottom: '1rem' }} {...props} />
  };

  // Render specifically for research_loader
  if (message.messageType === 'research_loader') {
    return (
      <div className={messageContainerClasses}>
        <div className="mt-1 flex-shrink-0">
          <Bot className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="chat-message relative px-6 pt-3 pb-2 rounded-lg max-w-[80%] group chat-message-ai">
          <div className="flex items-center text-sm text-muted-foreground pb-2">
            <GradientLoader size="sm" className="mr-2" /> 
            <span>{message.content}</span>
          </div>
        </div>
      </div>
    );
  }

  // Render for all other message types
  return (
    <div className={messageContainerClasses}>
      {(message.role === 'assistant' && 
        message.messageType !== 'saved_research_display' && 
        message.messageType !== 'research_result') && (
        <div className="mt-1 flex-shrink-0">
          <Bot className="h-5 w-5 text-muted-foreground" /> 
        </div>
      )}
      {(message.messageType === 'saved_research_display' || message.messageType === 'research_result') && (
        <div className="mt-1 flex-shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
      )}
      {message.role === 'user' && (
        <div className="mt-1 flex-shrink-0 order-2 ml-2">
          {userAvatarUrl ? (
            <div className="h-5 w-5 rounded-full overflow-hidden">
              <img src={userAvatarUrl} alt="User" className="h-full w-full object-cover" />
            </div>
          ) : (
            <User className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      )}
      <div
        id={`message-${message.id}`}
        data-message-id={message.id}
        data-message-type={message.messageType}
        className={`chat-message relative px-6 py-3 rounded-lg max-w-[80%] group ${ 
          message.messageType === 'note_saved' 
            ? "chat-message-note-saved"
            : message.messageType === 'saved_research_display'
              ? "chat-message-saved-research"
              : message.role === "user"
                ? "chat-message-user"
                : message.messageType === 'research_result' 
                  ? "chat-message-research"
                  : "chat-message-ai"
        }`}
      >
        {(message.messageType === 'saved_research_display' || message.messageType === 'research_result') && (message.subtask_title || message.prompt) && (
          <p className="text-xs text-blue-600 dark:text-blue-300 mb-2 border-b border-blue-500/30 pb-1.5">
            {message.prompt
              ? t('chatPanel.researchForPromptLabel', { prompt: message.prompt })
              : message.subtask_title
                  ? t('chatPanel.researchForSubtaskLabel', { subtaskTitle: message.subtask_title })
                  : null
            }
          </p>
        )}
        
        {(message.messageType === 'note_saved' || message.messageType === 'saved_research_display' || message.messageType === 'research_result' || 
          // Extra detectie voor niet-getagde onderzoeksresultaten
          (message.role === 'assistant' && typeof message.content === 'string' && message.content.length > 100 && (message.citations !== undefined || message.content.includes('#')))) ? (
          // Research result rendering
          <div>
            {(message.messageType === 'research_result' || 
              // Extra detectie voor niet-getagde onderzoeksresultaten
              (message.role === 'assistant' && typeof message.content === 'string' && message.content.length > 100 && (message.citations !== undefined || message.content.includes('#')))) ? (
              <div className="text-sm">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={markdownComponents}
                >
                  {typeof message.content === 'string' ? message.content : 'Geen inhoud beschikbaar'}
                </ReactMarkdown>
              </div>
            ) : message.messageType === 'note_saved' || message.messageType === 'saved_research_display' ? (
              // Bestaande notitie rendering
              <div className="text-sm">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={markdownComponents}
                >
                  {typeof message.content === 'string' ? message.content : ''}
                </ReactMarkdown>
              </div>
            ) : null}
          </div>
        ) : message.role === 'assistant' ? (
          <div className="text-sm">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        )}

        {/* Wrapper for action buttons and timestamp at the bottom */}      
        <div className="flex items-center justify-end mt-1 space-x-1 relative">
          {/* Action buttons container */} 
          <div className={`flex items-center gap-0.5 opacity-0 group-hover/message:opacity-75 transition-opacity duration-200 order-1`}>
            {message.messageType === 'note_saved' && message.dbId && onDeleteNote && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-current hover:bg-transparent hover:text-foreground"
                onClick={() => onDeleteNote(message.dbId!)}
                title={t('chatPanel.deleteNoteTitle')}
                disabled={isLoading} 
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="sr-only">{t('chatPanel.deleteNoteSR')}</span>
              </Button>
            )}
            {(message.messageType === 'saved_research_display' || message.messageType === 'research_result') && message.id && onDeleteResearch && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-current hover:bg-transparent hover:text-foreground"
                onClick={() => onDeleteResearch(message.id)}
                title={t('chatPanel.deleteResearchTitle')}
                disabled={isLoading}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="sr-only">{t('chatPanel.deleteResearchSR')}</span>
              </Button>
            )}
            {message.role === 'assistant' && 
              (message.messageType === 'standard' || message.messageType === 'action_confirm') && 
              onTogglePin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-current hover:bg-transparent hover:text-foreground"
                onClick={() => onTogglePin(message.id, !!message.isPinned)}
                title={message.isPinned ? t('chatPanel.unpinMessageTitle') : t('chatPanel.pinMessageTitle')}
              >
                {message.isPinned ? 
                  <Pin className="h-3.5 w-3.5 text-primary" /> : 
                  <Pin className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                }
                <span className="sr-only">{message.isPinned ? t('chatPanel.unpinMessageSR') : t('chatPanel.pinMessageSR')}</span>
              </Button>
            )}
            <Button 
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-current hover:bg-transparent"
              onClick={() => onCopy(message.content)}
              title={t('chatPanel.copyMessageTitle')}
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="sr-only">{t('chatPanel.copyMessageSR')}</span>
            </Button>
          </div>

          {/* Timestamp container */} 
          {message.timestamp && (
            <div className={`text-xs opacity-60 order-2`}>
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 