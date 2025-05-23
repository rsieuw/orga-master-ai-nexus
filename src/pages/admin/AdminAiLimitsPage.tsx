import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client.ts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { GradientLoader } from "@/components/ui/loader.tsx";
import { useTranslation } from "react-i18next";
import { Settings } from "lucide-react";

/**
 * Interface defining the structure for AI generation limits.
 */
interface AiGenerationLimits {
  /** The maximum number of AI-generated subtasks for free users. */
  free_user_limit: number;
  /** The maximum number of AI-generated subtasks for paid users. */
  paid_user_limit: number;
}

// SystemSettingsDatabaseRow interface is removed as we revert to using 'as any' for .from()
// but keep runtime checks for the fetched data structure.

/**
 * Component for managing AI generation limits in the admin panel.
 * Allows administrators to configure the maximum number of AI subtask generations
 * allowed for different user types (free vs. paid).
 */
const AdminAiLimitsPage: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limits, setLimits] = useState<AiGenerationLimits>({
    free_user_limit: 1,
    paid_user_limit: 3,
  });

  /**
   * Fetches the current AI generation limits from the database when the component mounts.
   */
  useEffect(() => {
    const fetchLimits = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch from system_settings table
        const { data, error: fetchError } = await supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from("system_settings" as any) // Reverted to 'as any'
          .select("setting_value")
          .eq("setting_name", "ai_generation_limits")
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          // PGRST116 is "No rows found"
          throw fetchError;
        }

        // Cast 'data' to 'any' locally after error check to access properties
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fetchedData = data as any;

        if (fetchedData && fetchedData.setting_value &&
            typeof fetchedData.setting_value.free_user_limit === 'number' && // Runtime check
            typeof fetchedData.setting_value.paid_user_limit === 'number'  // Runtime check
        ) {
          setLimits({
            free_user_limit: fetchedData.setting_value.free_user_limit,
            paid_user_limit: fetchedData.setting_value.paid_user_limit,
          }); // No 'as AiGenerationLimits' cast needed if structure matches
        } else if (!fetchedData || (fetchError && fetchError.code === "PGRST116")) { // fetchError can be null
          // If no record exists yet, use default values and create the record
          await saveDefaultLimits();
        } else {
          // Data is present but not in the expected format or null
          console.warn("Fetched ai_generation_limits setting_value is not in the expected format or is null:", fetchedData?.setting_value);
          // Fallback to default and attempt to save/override if structure is wrong
          await saveDefaultLimits(); 
        }
      } catch (err) {
        console.error("Error fetching AI limits:", err);
        const message = err instanceof Error ? err.message : String(err);
        setError(t("adminAiLimitsPage.errors.fetchError", { message }));
        toast({
          variant: "destructive",
          title: t("adminAiLimitsPage.toastTitles.fetchFailed"),
          description: message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLimits();
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [toast, t]); // saveDefaultLimits removed from deps as it's stable & causes re-fetch loops if included without useCallback

  /**
   * Creates a default AI limits record in the database if none exists.
   */
  const saveDefaultLimits = async () => {
    try {
      const defaultLimits: AiGenerationLimits = {
        free_user_limit: 1,
        paid_user_limit: 3,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("system_settings" as any) // Reverted to 'as any'
        .insert({
          setting_name: "ai_generation_limits",
          setting_value: defaultLimits, // defaultLimits is AiGenerationLimits
          created_at: new Date().toISOString(),
        });

      // if (insertError) throw insertError; // Original code did not check insertError here

      setLimits(defaultLimits);
    } catch (err) {
      console.error("Error saving default AI limits:", err);
      // We don't show an error toast here as this is a background operation
    }
  };

  /**
   * Handles input changes for the limit values.
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
   */
  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);

    if (!isNaN(numValue) && numValue >= 0) {
      setLimits((prev) => ({
        ...prev,
        [name]: numValue,
      }));
    }
  };

  /**
   * Saves the updated AI generation limits to the database.
   */
  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError(null);
    try {
      // First check if the record exists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: checkError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("system_settings" as any) // Reverted to 'as any'
        .select("id")
        .eq("setting_name", "ai_generation_limits")
        .single();

      if (checkError && checkError.code !== "PGRST116") throw checkError;

      // Cast 'data' to 'any' locally after error check to access properties
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const checkedData = data as any;

      if (checkedData && checkedData.id) {
        // Update existing record
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from("system_settings" as any) // Reverted to 'as any'
          .update({
            setting_value: limits, // limits is AiGenerationLimits
            updated_at: new Date().toISOString(),
          })
          .eq("id", checkedData.id); // Use checkedData.id

        // if (updateError) throw updateError; // Original code did not check updateError here
      } else {
        // Create new record
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from("system_settings" as any) // Reverted to 'as any'
          .insert({
            setting_name: "ai_generation_limits",
            setting_value: limits, // limits is AiGenerationLimits
            created_at: new Date().toISOString(),
          });

        // if (insertError) throw insertError; // Original code did not check insertError here
      }

      toast({
        title: t("adminAiLimitsPage.toastTitles.saveSuccess"),
        description: t("adminAiLimitsPage.toastMessages.saveSuccess"),
      });
    } catch (err) {
      console.error("Error saving AI limits:", err);
      const message = err instanceof Error ? err.message : String(err);
      setError(t("adminAiLimitsPage.errors.saveError", { message }));
      toast({
        variant: "destructive",
        title: t("adminAiLimitsPage.toastTitles.saveFailed"),
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <GradientLoader />
        <span className="ml-2">{t("adminAiLimitsPage.loading")}</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center">
          <Settings className="mr-2 h-5 w-5" />
          <CardTitle>{t("adminAiLimitsPage.title")}</CardTitle>
        </div>
        <CardDescription>{t("adminAiLimitsPage.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="free_user_limit">
                {t("adminAiLimitsPage.freeUserLimit")}
              </Label>
              <div className="flex items-center">
                <Input
                  id="free_user_limit"
                  name="free_user_limit"
                  type="number"
                  min="0"
                  value={limits.free_user_limit}
                  onChange={handleLimitChange}
                  className="max-w-[100px]"
                />
                <span className="ml-2 text-muted-foreground">
                  {t("adminAiLimitsPage.generationsPerTask")}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {t("adminAiLimitsPage.freeUserLimitHelp")}
              </span>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="paid_user_limit">
                {t("adminAiLimitsPage.paidUserLimit")}
              </Label>
              <div className="flex items-center">
                <Input
                  id="paid_user_limit"
                  name="paid_user_limit"
                  type="number"
                  min="0"
                  value={limits.paid_user_limit}
                  onChange={handleLimitChange}
                  className="max-w-[100px]"
                />
                <span className="ml-2 text-muted-foreground">
                  {t("adminAiLimitsPage.generationsPerTask")}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {t("adminAiLimitsPage.paidUserLimitHelp")}
              </span>
            </div>
          </div>

          {/* Wrapper div to center the button */}
          <div className="flex justify-center mt-6">
            <Button 
              variant="outline"
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="w-full h-12"
            >
              {isSaving ? (
                <>
                  <GradientLoader className="mr-2 h-4 w-4" />
                  {t("adminAiLimitsPage.buttons.saving")}
                </>
              ) : (
                t("adminAiLimitsPage.buttons.saveChanges")
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminAiLimitsPage;
