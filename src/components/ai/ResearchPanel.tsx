import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "@/components/ui/loader";

interface ResearchPanelProps {
  deepResearch: boolean;
  setDeepResearch: (value: boolean) => void;
  setActiveTab: (tab: string) => void;
  loading: boolean;
  error: string | null;
  handleResearch: () => void;
}

export default function ResearchPanel({ deepResearch, setDeepResearch, setActiveTab, loading, error, handleResearch }: ResearchPanelProps) {
  const { toast } = useToast();

  const handleResearchActivation = () => {
    setActiveTab("chat");
    toast({
      title: deepResearch ? "Diep onderzoek geactiveerd" : "Diep onderzoek gedeactiveerd",
      description: deepResearch ? "De AI zal nu diep onderzoek uitvoeren" : "De AI zal geen diep onderzoek uitvoeren",
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Diep onderzoek met Perplexity</h3>
      <p className="text-sm text-muted-foreground">
        Met diep onderzoek kan de AI-assistent het internet doorzoeken voor gedetailleerde informatie over deze taak en gerelateerde onderwerpen.
      </p>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="deepResearch"
          checked={deepResearch}
          onChange={() => setDeepResearch(!deepResearch)}
          className="rounded border-white/10 bg-secondary/50"
        />
        <label htmlFor="deepResearch" className="text-sm">
          Activeer diep onderzoek
        </label>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Wanneer geactiveerd, zal de AI-assistent Perplexity gebruiken om gerelateerde bronnen te vinden en te analyseren voor betere antwoorden.
        </p>
      </div>
      
      {loading && <Loader size="sm" />}
      {error && <p className="text-red-500">{error}</p>}
      <Button
        onClick={handleResearch}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900"
      >
        {loading ? 'Researching...' : 'Start Research'}
        <Search className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
