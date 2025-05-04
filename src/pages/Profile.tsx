import { useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout.tsx";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { useTask } from "@/contexts/TaskContext.hooks.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Task } from "@/types/task.ts";
import { Button } from "@/components/ui/button.tsx";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { Loader2 } from "lucide-react";

export default function Profile() {
  const { user, session } = useAuth();
  const { tasks, isLoading: isLoadingTasks } = useTask();
  const { toast } = useToast();
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const statistics = useMemo(() => {
    if (!tasks) return { total: 0, completed: 0, todo: 0, inProgress: 0 };

    const total = tasks.length;
    const completed = tasks.filter((task: Task) => task.status === 'done').length;
    const todo = tasks.filter((task: Task) => task.status === 'todo').length;
    const inProgress = tasks.filter((task: Task) => task.status === 'in_progress').length;

    return { total, completed, todo, inProgress };
  }, [tasks]);

  if (!user) {
    return null;
  }

  const roleBadgeVariant = 
    user.role === "admin" ? "default" :
    user.role === "paid" ? "outline" : "secondary";

  const roleName = {
    admin: "Administrator",
    paid: "Premium Gebruiker",
    free: "Gratis Gebruiker"
  };

  const handleUpgradeClick = async () => {
    if (!session) {
      toast({ variant: "destructive", title: "Fout", description: "Sessie niet gevonden. Log opnieuw in." });
      return;
    }

    setIsCheckoutLoading(true);
    try {
      const priceId = "price_1RLCFyGgSHdyoLfIYftH2itQ";

      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { priceId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (error) throw error;

      if (data && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Geen checkout URL ontvangen.");
      }

    } catch (error: unknown) {
      console.error("Stripe checkout error:", error);
      const message = error instanceof Error ? error.message : "Kon geen checkout sessie starten.";
      toast({
        variant: "destructive",
        title: "Upgrade Mislukt",
        description: message,
      });
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold mb-6">Profiel</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Gebruiker Informatie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-1">
            <span className="text-sm text-muted-foreground">Naam</span>
            <span className="font-medium">{user.name}</span>
          </div>
          
          <div className="flex flex-col space-y-1">
            <span className="text-sm text-muted-foreground">E-mail</span>
            <span className="font-medium">{user.email}</span>
          </div>
          
          <div className="flex flex-col space-y-1">
            <span className="text-sm text-muted-foreground">Account Type</span>
            <Badge variant={roleBadgeVariant} className="w-fit">
              {roleName[user.role]}
            </Badge>
          </div>
          
          {user.role === 'free' && (
            <div className="pt-4">
               <Button 
                 onClick={handleUpgradeClick} 
                 disabled={isCheckoutLoading}
                 className="w-full bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white"
               >
                 {isCheckoutLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                 {isCheckoutLoading ? 'Bezig...' : 'Upgrade naar Premium'}
               </Button>
               <p className="text-xs text-muted-foreground mt-2 text-center">
                 Krijg toegang tot alle premium functies.
               </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gebruikers Statistieken</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTasks ? (
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-accent/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Totaal Taken</p>
                <p className="text-2xl font-bold">{statistics.total}</p>
              </div>
              <div className="p-4 bg-accent/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Voltooid</p>
                <p className="text-2xl font-bold">{statistics.completed}</p>
              </div>
              <div className="p-4 bg-accent/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Te doen</p>
                <p className="text-2xl font-bold">{statistics.todo}</p>
              </div>
              <div className="p-4 bg-accent/50 rounded-lg">
                <p className="text-sm text-muted-foreground">In Behandeling</p>
                <p className="text-2xl font-bold">{statistics.inProgress}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
