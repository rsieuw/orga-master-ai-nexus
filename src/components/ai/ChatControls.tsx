import { Button } from "@/components/ui/button.tsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu.tsx";
import { BookOpen, FileText, Settings, Trash2, Download, X } from "lucide-react";
import { AIModel, aiModels } from "./types.ts";
import { useTranslation } from "react-i18next";
import { hasPermission } from "@/lib/permissions.ts";
import { UserProfile } from "@/types/auth.ts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { useAuth } from "@/hooks/useAuth.ts";
import { ResearchMode } from "./hooks/useDeepResearch.ts";
import { useState } from "react";

interface ChatControlsProps {
  isNoteMode: boolean;
  setIsNoteMode: (isNoteMode: boolean) => void;
  onClearHistory: () => void;
  onExport?: () => void;
  onResearch: (mode: ResearchMode) => void;
  researchModeOptions: { labelKey: string; value: ResearchMode; icon?: React.ElementType, descriptionKey: string }[];
  currentResearchMode: ResearchMode;
  user: UserProfile | null;
  isLoading: boolean;
  isGenerating: boolean;
  onCancelResearch?: () => void;
  showCancelButton?: boolean;
}

export function ChatControls({
  isNoteMode,
  setIsNoteMode,
  onClearHistory,
  onExport,
  onResearch,
  researchModeOptions,
  currentResearchMode,
  user,
  isLoading,
  isGenerating,
  onCancelResearch,
  showCancelButton
}: ChatControlsProps) {
  const { t } = useTranslation();
  const { aiMode, setAiMode } = useAuth();
  const [isResearchPopoverOpen, setIsResearchPopoverOpen] = useState(false);

  const handleAiModelSelect = (modelId: AIModel['id']) => {
    if (user?.role === 'free' && (modelId === 'creative' || modelId === 'precise')) {
      console.log("Creative and Precise modes are premium features.");
      return;
    }
    setAiMode(modelId);
  };

  const activeModel = aiModels.find(model => model.id === aiMode) || aiModels[0];

  return (
    <div className="p-2 border-t border-white/5 flex items-center justify-between gap-2 bg-background/50">
      <div className="flex gap-2">
        <Popover open={isResearchPopoverOpen} onOpenChange={setIsResearchPopoverOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className={`px-3 py-2 gap-1 hover:bg-secondary ${
                !hasPermission(user, 'deepResearch') 
                  ? 'opacity-50 cursor-not-allowed bg-secondary/50' 
                  : 'border-0 bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white'
              }`}
              disabled={isLoading || isNoteMode || !hasPermission(user, 'deepResearch')}
              title={!hasPermission(user, 'deepResearch') ? t('chatPanel.deepResearchDisabledTooltip') : t('chatPanel.deepResearchTooltip')}
            >
              <BookOpen className="h-[20px] w-[20px]" />
              <span className="hidden sm:inline">{t('chatPanel.researchButton')}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2 glass-effect" side="top" align="start" alignOffset={-100} sideOffset={5}>
            <div className="space-y-1">
              {researchModeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={currentResearchMode === option.value ? "secondary" : "ghost"}
                  className="w-full justify-start space-x-2 h-auto whitespace-normal text-left"
                  onClick={() => {
                    console.log("Klik op onderzoek modus:", option.value);
                    try {
                      onResearch(option.value);
                      console.log("Na onResearch aanroep");
                    } catch (error) {
                      console.error("Fout bij uitvoeren onResearch:", error);
                    }
                    setIsResearchPopoverOpen(false);
                  }}
                >
                  {option.icon && <option.icon className="h-4 w-4 flex-shrink-0 mr-2" />}
                  <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{t(option.labelKey)}</span>
                      <span className="text-xs text-muted-foreground">
                        {t(option.descriptionKey)}
                      </span>
                  </div>
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        
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
        {showCancelButton && onCancelResearch && (
          <Button 
            variant="ghost"
            size="icon"
            onClick={onCancelResearch}
            className="text-destructive hover:text-destructive-foreground hover:bg-destructive/80 h-8 w-8"
            title={t("chatPanel.research.stopResearch")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center space-x-2 px-2" title={t(activeModel.nameKey)}>
              <activeModel.icon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2 glass-effect" side="top" align="start" alignOffset={-100} sideOffset={5}>
            <div className="space-y-1">
              {aiModels.map((model) => (
                <Button
                  key={model.id}
                  variant={aiMode === model.id ? "secondary" : "ghost"}
                  className="w-full justify-start space-x-2 h-auto whitespace-normal text-left"
                  onClick={() => handleAiModelSelect(model.id)}
                  disabled={isGenerating || (user?.role === 'free' && (model.id === 'creative' || model.id === 'precise'))}
                >
                  <model.icon className="h-4 w-4 flex-shrink-0 mr-2" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{t(model.nameKey)}</span>
                    <span className="text-xs text-muted-foreground">{t(model.descriptionKey)}</span>
                  </div>
                </Button>
              ))}
            </div>
             {user?.role === 'free' && (
                <p className="mt-2 text-xs text-center text-muted-foreground px-2">
                  {t('settings.freeUserPremiumFeatureChat')}
                </p>
              )}
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="glass-effect">
            <DropdownMenuItem onClick={onClearHistory} disabled={isLoading} className="space-x-2">
              <Trash2 className="h-4 w-4" />
              <span>{t('chatPanel.clearHistoryButton')}</span>
            </DropdownMenuItem>
            {(user && user.enabled_features && user.enabled_features.includes('exportChat')) && (
              <DropdownMenuSeparator />
            )}
            {(user && user.enabled_features && user.enabled_features.includes('exportChat') && onExport) && ( 
              <DropdownMenuItem onClick={onExport} className="space-x-2">
                <Download className="h-4 w-4" />
                <span>{t('chatPanel.exportChatButton')}</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 