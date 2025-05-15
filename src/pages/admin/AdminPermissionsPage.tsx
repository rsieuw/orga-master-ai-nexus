import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client.ts";
import { Feature } from "@/lib/permissions.ts"; // Import Feature type
import { Button } from "@/components/ui/button.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { UserRole } from '@/types/auth.ts'; // Import UserRole if needed
import { GradientLoader } from '@/components/ui/loader.tsx'; // Import loader
import { useTranslation } from 'react-i18next'; // Import useTranslation

/**
 * Interface defining the structure for role-based permissions.
 * Each role is associated with a list of enabled features.
 * @interface RolePermission
 */
interface RolePermission {
  /** The user role (e.g., 'admin', 'paid', 'free'). */
  role: UserRole;
  /** An array of `Feature` keys that are enabled for this role. */
  enabled_features: Feature[];
}

/**
 * Array of all available features in the application.
 * This should ideally be kept in sync with the `Feature` type in `lib/permissions.ts`.
 * Used here to iterate over all possible features for UI rendering.
 */
const ALL_FEATURES: Feature[] = ['deepResearch', 'exportChat', 'adminPanel', 'choose_research_model', 'chatModes'];

/**
 * Mapping of `Feature` keys to their corresponding i18next translation keys for display names.
 * Used to show user-friendly feature names in the UI.
 */
const FEATURE_DISPLAY_NAMES: Record<Feature, string> = {
  deepResearch: "adminPermissionsPage.features.deepResearch", // Placeholder for i18n key
  exportChat: "adminPermissionsPage.features.exportChat", // Placeholder for i18n key
  adminPanel: "adminPermissionsPage.features.adminPanel", // Placeholder for i18n key
  choose_research_model: "adminPermissionsPage.features.chooseResearchModel", // Placeholder for i18n key
  chatModes: "adminPermissionsPage.features.chatModes" // Creative/Precise is implicit // Placeholder for i18n key
};
// --- END NEW ---

/**
 * `PermissionsManagementTable` component allows administrators to manage feature permissions for different user roles.
 * It displays a table where each row represents a user role and each column a feature.
 * Admins can toggle permissions using switches.
 * Changes are saved to the Supabase 'role_permissions' table.
 * Fetches current permissions on load and handles loading/error states.
 * Provides separate table layouts for desktop and mobile views.
 */
export const PermissionsManagementTable: React.FC = () => {
  const { t } = useTranslation(); // Initialize t function
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * useEffect hook to fetch current role permissions from the Supabase 'role_permissions' table when the component mounts.
   * It sets the loading state, fetches data, and updates the `permissions` state.
   * Handles errors during fetching and displays toast notifications.
   */
  useEffect(() => {
    const fetchPermissions = async () => {
      // No admin check here, this is handled in the parent (AdminDashboardPage)
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
        setError(t("adminPermissionsPage.errors.loadError", { message })); // Use t()
        toast({ variant: "destructive", title: t("adminPermissionsPage.toastTitles.loadFailed"), description: message }); // Use t()
      } finally {
        setIsLoading(false);
      }
    };
    fetchPermissions();
  }, [toast, t]); // Dependency on toast and t now

  /**
   * Handles the change of a permission switch for a specific role and feature.
   * Updates the local `permissions` state optimistically to reflect the change immediately in the UI.
   * @param {UserRole} role - The role for which the permission is being changed.
   * @param {Feature} feature - The feature whose permission is being toggled.
   * @param {boolean} checked - The new state of the permission (true if enabled, false if disabled).
   */
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

  /**
   * Saves all current permission changes to the Supabase 'role_permissions' table.
   * Iterates through the `permissions` state and updates each role's `enabled_features`.
   * Sets loading state during the save operation and displays success or error toast notifications.
   */
  const handleSaveChanges = async () => {
     // No admin check needed here, parent component handles access
     setIsLoading(true); 
     try {
        for (const perm of permissions) {
            const { error: updateError } = await supabase
                .from('role_permissions')
                .update({ enabled_features: perm.enabled_features })
                .eq('role', perm.role);
            if (updateError) throw updateError;
        }
        toast({ title: t("adminPermissionsPage.toastTitles.saveSuccess"), description: t("adminPermissionsPage.toastMessages.saveSuccess") });
     } catch (err: unknown) {
        console.error("Error saving permissions:", err);
        const message = err instanceof Error ? err.message : String(err);
        setError(t("adminPermissionsPage.errors.saveError", { message })); // Set error state (already using t())
        toast({ variant: "destructive", title: t("adminPermissionsPage.toastTitles.saveFailed"), description: message });
     } finally {
        setIsLoading(false);
     }
  };

  // Sorted roles for consistent ordering in both tables
  const sortedRoles = [...permissions].sort((a, b) => {
    const order: Record<UserRole, number> = { admin: 1, paid: 2, free: 3 };
    return (order[a.role] || 99) - (order[b.role] || 99);
  });

  // Render the table and button, without AppLayout and H1
  if (isLoading) {
    return <div className="flex justify-center items-center py-10"><GradientLoader /> <span className='ml-2'>{t("adminPermissionsPage.loading")}</span></div>;
  }

  if (error) {
    // Show error within the tab content
    return <p className="text-destructive">{error}</p>; 
  }

  // Sort features based on translated display names
  const translatedSortedFeatures = [...ALL_FEATURES].sort((a, b) => 
    (t(FEATURE_DISPLAY_NAMES[a]) || a).localeCompare(t(FEATURE_DISPLAY_NAMES[b]) || b)
  );

  return (
    <div> {/* Changed from p-6 to a simple div */}
      {/* Desktop Table (hidden on small screens (xs), visible md and up) */}
      <Table className="hidden md:table w-full">
        <TableHeader>
          <TableRow>
            <TableHead>{t("adminPermissionsPage.tableHeaders.role")}</TableHead>
            {translatedSortedFeatures.map(feature => (
              <TableHead key={feature} className="text-center">
                {t(FEATURE_DISPLAY_NAMES[feature]) || feature} 
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRoles.map(({ role, enabled_features }) => (
            <TableRow key={role}>
              <TableCell className="font-medium capitalize">{t(`adminPermissionsPage.roles.${role}`)}</TableCell>
              {translatedSortedFeatures.map(feature => (
                <TableCell key={`${role}-${feature}-desktop-cell`} className="text-center">
                  <Switch
                    checked={enabled_features.includes(feature)}
                    onCheckedChange={(checked: boolean) => handlePermissionChange(role, feature, checked)}
                    id={`${role}-${feature}-desktop`}
                    aria-label={t("adminPermissionsPage.ariaLabels.switchPermission", { featureName: t(FEATURE_DISPLAY_NAMES[feature]) || feature, roleName: t(`adminPermissionsPage.roles.${role}`) })}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Mobile Table (visible on small screens (xs), hidden md and up) */}
      <Table className="table md:hidden w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="pr-2">{t("adminPermissionsPage.tableHeaders.feature")}</TableHead>
            {sortedRoles.map(({ role }) => (
              <TableHead key={`${role}-mobile-header`} className="text-center capitalize text-xs px-0">{t(`adminPermissionsPage.roles.${role}`)}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {translatedSortedFeatures.map(feature => (
            <TableRow key={`${feature}-mobile-row`}>
              <TableCell className="font-medium whitespace-nowrap pr-2">
                {t(FEATURE_DISPLAY_NAMES[feature]) || feature}
              </TableCell>
              {sortedRoles.map(({ role }) => {
                const permissionForRole = permissions.find(p => p.role === role);
                const isChecked = permissionForRole ? permissionForRole.enabled_features.includes(feature) : false;
                return (
                  <TableCell key={`${role}-${feature}-mobile-cell`} className="text-center">
                    <Switch
                      checked={isChecked}
                      onCheckedChange={(checked: boolean) => handlePermissionChange(role, feature, checked)}
                      id={`${role}-${feature}-mobile`}
                      aria-label={t("adminPermissionsPage.ariaLabels.switchPermission", { featureName: t(FEATURE_DISPLAY_NAMES[feature]) || feature, roleName: t(`adminPermissionsPage.roles.${role}`) })}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Wrapper div to center the button */}
      <div className="flex justify-center mt-6">
        <Button 
          variant="outline"
          onClick={handleSaveChanges} 
          disabled={isLoading} 
          className="w-full h-12"
        >
          {t("adminPermissionsPage.buttons.saveChanges")}
        </Button>
      </div>
    </div>
  );
};

/**
 * `AdminPermissionsPage` is a simple wrapper component that renders the `PermissionsManagementTable`.
 * This component is typically used as the content for a tab within the main admin dashboard.
 */
const AdminPermissionsPage: React.FC = () => {
  return <PermissionsManagementTable />;
};

export default AdminPermissionsPage; 