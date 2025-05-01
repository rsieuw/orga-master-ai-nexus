
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Profile() {
  const { user } = useAuth();

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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gebruikers Statistieken</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-accent/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Totaal Taken</p>
              <p className="text-2xl font-bold">6</p>
            </div>
            <div className="p-4 bg-accent/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Voltooid</p>
              <p className="text-2xl font-bold">2</p>
            </div>
            <div className="p-4 bg-accent/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Te doen</p>
              <p className="text-2xl font-bold">3</p>
            </div>
            <div className="p-4 bg-accent/50 rounded-lg">
              <p className="text-sm text-muted-foreground">In Behandeling</p>
              <p className="text-2xl font-bold">1</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
