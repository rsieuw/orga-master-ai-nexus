import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client.ts";
import { Feature } from "@/lib/permissions.ts"; // Import Feature type
import { Button } from "@/components/ui/button.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { UserRole } from '@/contexts/AuthContext.tsx'; // Import UserRole if needed
import { GradientLoader } from '@/components/ui/loader.tsx'; // Import loader

// Define the structure of the data we fetch and manage
interface RolePermission {
  role: UserRole;
  enabled_features: Feature[];
}

// Define all available features (should match permissions.ts, but kept here for UI mapping)
// Ideally, this comes from a single source of truth later
const ALL_FEATURES: Feature[] = ['deepResearch', 'exportChat', 'adminPanel', 'choose_research_model', 'chatModes'];

// --- NIEUW: Mapping voor weergavenamen ---
const FEATURE_DISPLAY_NAMES: Record<Feature, string> = {
  deepResearch: "Diep Onderzoek",
  exportChat: "Chat Exporteren",
  adminPanel: "Admin Paneel",
  choose_research_model: "Onderzoeksmodel Kiezen",
  chatModes: "Chat Modi" // Creative/Precise is impliciet
};
// --- EINDE NIEUW ---

// --- NIEUW: Sorteer features op weergavenaam voor logische kolomvolgorde ---
const sortedFeatures = ALL_FEATURES.sort((a, b) => 
  (FEATURE_DISPLAY_NAMES[a] || a).localeCompare(FEATURE_DISPLAY_NAMES[b] || b)
);
// --- EINDE NIEUW ---

// De component die de tabel en logica bevat
export const PermissionsManagementTable: React.FC = () => {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current permissions on load
  useEffect(() => {
    const fetchPermissions = async () => {
      // Geen admin check hier, dat gebeurt in de parent (AdminDashboardPage)
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: dbError } = await supabase
          .from('role_permissions')
          .select('role, enabled_features');

        if (dbError) throw dbError;

        const fetchedPermissions: RolePermission[] = (data || []).map(p => ({
            role: p.role as UserRole,
            enabled_features: (p.enabled_features || []) as Feature[]
        }));
        setPermissions(fetchedPermissions);
      } catch (err: unknown) {
        console.error("Error fetching permissions:", err);
        const message = err instanceof Error ? err.message : String(err);
        setError("Kon permissies niet laden: " + message);
        toast({ variant: "destructive", title: "Laden Mislukt", description: message });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPermissions();
  }, [toast]); // Dependency alleen op toast nu

  // Handle switch change (type toegevoegd aan checked)
  const handlePermissionChange = (role: UserRole, feature: Feature, checked: boolean) => {
    setPermissions(currentPermissions =>
      currentPermissions.map(p => {
        if (p.role === role) {
          const updatedFeatures = checked
            ? [...p.enabled_features, feature]
            : p.enabled_features.filter(f => f !== feature);
          return { ...p, enabled_features: updatedFeatures };
        }
        return p;
      })
    );
  };

  // Save changes to the database
  const handleSaveChanges = async () => {
     // Geen admin check hier nodig, parent component regelt toegang
     setIsLoading(true); 
     try {
        for (const perm of permissions) {
            const { error: updateError } = await supabase
                .from('role_permissions')
                .update({ enabled_features: perm.enabled_features })
                .eq('role', perm.role);
            if (updateError) throw updateError;
        }
        toast({ title: "Opgeslagen", description: "Permissies succesvol bijgewerkt." });
     } catch (err: unknown) {
        console.error("Error saving permissions:", err);
        const message = err instanceof Error ? err.message : String(err);
        setError("Kon permissies niet opslaan: " + message); // Zet error state
        toast({ variant: "destructive", title: "Opslaan Mislukt", description: message });
     } finally {
        setIsLoading(false);
     }
  };

  // Render de tabel en knop, zonder AppLayout en H1
  if (isLoading) {
    return <div className="flex justify-center items-center py-10"><GradientLoader /></div>;
  }

  if (error) {
    // Toon error binnen de tab content
    return <p className="text-destructive">{error}</p>; 
  }

  return (
    <div> {/* Veranderd van p-6 naar een simpele div */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rol</TableHead>
            {sortedFeatures.map(feature => (
              <TableHead key={feature} className="text-center">
                {FEATURE_DISPLAY_NAMES[feature] || feature} 
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {permissions
            .sort((a, b) => {
                const order = { admin: 1, paid: 2, free: 3 };
                return (order[a.role] || 99) - (order[b.role] || 99);
            })
            .map(({ role, enabled_features }) => (
            <TableRow key={role}>
              <TableCell className="font-medium capitalize">{role}</TableCell>
              {sortedFeatures.map(feature => (
                <TableCell key={`${role}-${feature}`} className="text-center">
                  <Switch
                    checked={enabled_features.includes(feature)}
                    onCheckedChange={(checked: boolean) => handlePermissionChange(role, feature, checked)}
                    id={`${role}-${feature}`}
                    aria-label={`Permissie ${FEATURE_DISPLAY_NAMES[feature] || feature} voor rol ${role}`}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Wrapper div om knop naar rechts uit te lijnen */}
      <div className="flex justify-end mt-6">
        <Button 
          onClick={handleSaveChanges} 
          disabled={isLoading} 
          className="bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900"
        >
          Wijzigingen Opslaan
        </Button>
      </div>
    </div>
  );
};

// De pagina component exporteert nu alleen de tabel component
const AdminPermissionsPage: React.FC = () => {
  return <PermissionsManagementTable />;
};

export default AdminPermissionsPage; 