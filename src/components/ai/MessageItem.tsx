import { Message } from "./types.ts";
import { Bot, Copy, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Components } from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { GradientLoader } from "@/components/ui/loader.tsx";

interface MessageItemProps {
  message: Message;
  index: number;
  onCopy: (text: string) => void;
  onDeleteNote?: (noteId: string) => void;
  onDeleteResearch?: (researchId: string) => void;
  isLoading: boolean;
}

export function MessageItem({ 
  message, 
  index, 
  onCopy, 
  onDeleteNote, 
  onDeleteResearch,
  isLoading 
}: MessageItemProps) {
  const { t } = useTranslation();
  
  // Define container classes based on message role
  const messageContainerClasses = `group flex items-start gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`;
  
  // Define Markdown components for rendering
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
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-blue-600 hover:scrollbar-thumb-blue-500 scrollbar-track-blue-200 scrollbar-thumb-rounded-md">
        <table className="table-auto w-full border-collapse border border-blue-500/30 mb-4" {...props} />
      </div>
    ),
    thead: ({node, ...props}) => <thead className="bg-blue-200 dark:bg-blue-800/70" {...props} />,
    th: ({node, ...props}) => <th className="border border-blue-500/30 font-semibold p-2 text-left whitespace-normal break-words" {...props} />,
    td: ({node, ...props}) => <td className="border border-blue-500/30 p-2 whitespace-normal break-words" {...props} />,
    hr: ({node, ...props}) => <hr className="border-t border-blue-500/30 my-4" {...props} />
  };

  // Render specifically for research_loader
  if (message.messageType === 'research_loader') {
    return (
      <div key={index} className={messageContainerClasses}>
        <div className="mt-1 flex-shrink-0">
          <Bot className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="chat-message relative p-3 rounded-lg max-w-[80%] group chat-message-ai">
          <div className="flex items-center text-sm text-muted-foreground">
            <GradientLoader size="sm" className="mr-2" /> 
            <span>{message.content}</span>
          </div>
        </div>
      </div>
    );
  }

  // Render for all other message types
  return (
    <div key={index} className={messageContainerClasses}>
      {(message.role === 'assistant' && message.messageType !== 'saved_research_display') && (
        <div className="mt-1 flex-shrink-0">
          <Bot className="h-5 w-5 text-muted-foreground" /> 
        </div>
      )}
      {message.messageType === 'saved_research_display' && (
        <div className="mt-1 flex-shrink-0">
          <Sparkles className="h-5 w-5 text-primary" /> 
        </div>
      )}
      <div
        className={`chat-message relative p-3 rounded-lg max-w-[80%] group ${ 
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
        
        {(message.messageType === 'note_saved' || message.messageType === 'saved_research_display' || message.messageType === 'research_result') ? (
          <div className="text-sm">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={markdownComponents} 
              >
                {message.content || ''}
            </ReactMarkdown>
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

        {/* Wrapper voor actieknoppen en tijdstempel onderaan */}      
        <div className="flex items-center justify-end mt-1 space-x-1 relative">
          {/* Actieknoppen container */} 
          <div className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-75 transition-opacity duration-200 order-1`}>
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
            {message.messageType === 'saved_research_display' && message.dbId && onDeleteResearch && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-current hover:bg-transparent hover:text-foreground"
                onClick={() => onDeleteResearch(message.dbId!)}
                title={t('chatPanel.deleteResearchTitle')}
                disabled={isLoading}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="sr-only">{t('chatPanel.deleteResearchSR')}</span>
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

          {/* Tijdstempel container */} 
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