import React from "react";
import { Button } from "@/components/ui/button.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select.tsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu.tsx";
import { BookOpen, FileText, Settings } from "lucide-react";
import { AIModel, aiModels } from "./types.ts";
import { useTranslation } from "react-i18next";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import { hasPermission } from "@/lib/permissions.ts";
import { UserProfile } from "@/contexts/AuthContext.tsx";

interface ChatControlsProps {
  isNoteMode: boolean;
  setIsNoteMode: (isNoteMode: boolean) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  onClearHistory: () => void;
  onExport?: () => void;
  onResearch: () => void;
  user: UserProfile | null;
  isLoading: boolean;
}

export function ChatControls({
  isNoteMode,
  setIsNoteMode,
  selectedModel,
  setSelectedModel,
  onClearHistory,
  onExport,
  onResearch,
  user,
  isLoading
}: ChatControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="p-2 px-4 border-t border-white/5 flex items-center justify-between gap-2 bg-background/50">
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className={`px-3 py-2 gap-1 hover:bg-secondary ${
            !hasPermission(user, 'deepResearch') 
              ? 'opacity-50 cursor-not-allowed bg-secondary/50' 
              : 'border-0 bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white'
          }`}
          onClick={onResearch}
          disabled={isLoading || isNoteMode || !hasPermission(user, 'deepResearch')}
          title={!hasPermission(user, 'deepResearch') ? t('chatPanel.deepResearchDisabledTooltip') : t('chatPanel.deepResearchTooltip')}
        >
          <BookOpen className="h-[20px] w-[20px]" />
          <span className="hidden sm:inline">{t('chatPanel.researchButton')}</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className={`px-3 py-2 gap-1 border-white/10 hover:bg-secondary ${
            isNoteMode 
              ? 'bg-gradient-to-r from-amber-500/30 to-yellow-600/30 border-amber-500/50 text-amber-300 hover:from-amber-500/40 hover:to-yellow-600/40 hover:border-amber-500/60 hover:text-amber-200' 
              : 'bg-secondary/50'
          }`}
          onClick={() => setIsNoteMode(!isNoteMode)}
          disabled={isLoading}
        >
          <FileText className="h-[18px] w-[18px]" />
          <span className="hidden sm:inline">{isNoteMode ? t('chatPanel.stopNoteButton') : t('chatPanel.newNoteButton')}</span>
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isNoteMode || isLoading}>
          <SelectTrigger 
            className="w-auto h-8 px-2 bg-secondary/50 border-white/10 hover:bg-secondary focus:ring-0 focus:ring-offset-0 disabled:opacity-50"
            aria-label={t('chatPanel.selectModelAriaLabel')}
          >
            {React.createElement(aiModels.find((m: AIModel) => m.id === selectedModel)?.icon || Settings, { className: "h-4 w-4" })}
          </SelectTrigger>
          <SelectContent align="end" side="top" className="glass-effect min-w-[180px]">
            {aiModels.map((model: AIModel) => {
              const isDisabled = 
                (model.id === 'creative' || model.id === 'precise') && 
                !hasPermission(user, 'chatModes');
              
              const showTooltip = isDisabled && (model.id === 'creative' || model.id === 'precise');

              const selectItemContent = (
                <SelectItem 
                  key={model.id} 
                  value={model.id}
                  disabled={isDisabled}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                  onSelect={(e) => { if (isDisabled) e.preventDefault(); }}
                >
                  <div className="flex items-center gap-2">
                    {React.createElement(model.icon, { className: "h-4 w-4" })}
                    <span>{model.name}</span>
                  </div>
                </SelectItem>
              );

              return showTooltip ? (
                <TooltipProvider key={model.id} delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>{selectItemContent}</TooltipTrigger>
                    <TooltipContent side="left" align="center" className="bg-popover/90 backdrop-blur-lg">
                      <p>{t('chatPanel.chatModesDisabledTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                selectItemContent
              );
            })}
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="glass-effect">
            <DropdownMenuItem onClick={onClearHistory} disabled={isLoading}>
              {t('chatPanel.clearHistoryButton')}
            </DropdownMenuItem>
            {(user && user.enabled_features && user.enabled_features.includes('exportChat')) && (
              <DropdownMenuSeparator />
            )}
            {(user && user.enabled_features && user.enabled_features.includes('exportChat') && onExport) && ( 
              <DropdownMenuItem onClick={onExport}>
                {t('chatPanel.exportChatButton')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 