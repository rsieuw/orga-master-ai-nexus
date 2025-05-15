import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client.ts";
import { UserProfile, UserRole, AiChatMode } from '@/types/auth.ts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Button } from '@/components/ui/button.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu.tsx';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast.ts';
import { GradientLoader } from '@/components/ui/loader.tsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog.tsx";
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { useMediaQuery } from 'react-responsive';
import UserCard from '@/components/admin/UserCard.tsx';
import { format } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils.ts';

/**
 * Interface representing the structure of user data fetched from the 'get-all-users' Edge Function.
 * This includes user profile information and their email address.
 * @interface FetchedUserData
 */
interface FetchedUserData {
    /** The unique identifier of the user. */
    id: string;
    /** The email address of the user. Can be null if not available. */
    email: string | null; 
    /** The name of the user. Can be null. */
    name: string | null;
    /** The role of the user (e.g., 'admin', 'paid', 'free'). Can be null. */
    role: string | null;
    /** The URL of the user's avatar image. Can be null. */
    avatar_url: string | null;
    /** The user's preferred language code (e.g., 'en', 'nl'). */
    language_preference: string | null;
    /** The timestamp of when the user account was created. */
    created_at: string;
    /** The timestamp of the last update to the user account. */
    updated_at: string;
    /** The status of the user account (e.g., 'active', 'inactive'). Optional. */
    status?: string;
    /** Indicates if email notifications are enabled for the user. Optional, can be null. */
    email_notifications_enabled?: boolean | null;
    /** The user's preferred AI interaction mode. Optional. */
    ai_mode_preference?: string | null;
}

/**
 * Props for the `UsersManagementTable` component.
 * Defines the filter criteria applied to the users list.
 * @interface UsersManagementTableProps
 */
interface UsersManagementTableProps {
  /** The search term to filter users by (e.g., name, email). */
  searchTerm: string;
  /** The selected role to filter users by. 'all' means no role filter. */
  selectedRole: UserRole | 'all';
  /** The selected status to filter users by (e.g., 'active', 'inactive'). 'all' means no status filter. */
  selectedStatus: string;
}

// Type for sort configuration
type SortDirection = 'asc' | 'desc';
type SortConfig = {
  key: keyof UserProfile | null;
  direction: SortDirection;
} | null;

// Component for user management table
/**
 * `UsersManagementTable` component displays a table of users with management functionalities.
 * It allows sorting, filtering by search term, role, and status.
 * Admins can change user roles, and activate/deactivate user accounts.
 * It fetches user data from a Supabase Edge Function and handles UI updates and notifications.
 * The table is responsive and adapts to mobile view by showing `UserCard` components.
 * @param {UsersManagementTableProps} props - The props for configuring the table filters.
 */
export const UsersManagementTable: React.FC<UsersManagementTableProps> = ({ 
  searchTerm,
  selectedRole,
  selectedStatus 
}) => {
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'desc'}); // Default sort
  const { toast } = useToast();
  const [selectedUserIdForAction, setSelectedUserIdForAction] = useState<string | null>(null);
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
  const [newRoleForDialog, setNewRoleForDialog] = useState<UserRole | null>(null);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);

  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
  const currentLocale = i18n.language === 'nl' ? nl : enUS;

  // Callback functions for dialogs
  /**
   * Opens the dialog to change a user's role.
   * @param {string} userId - The ID of the user whose role is to be changed.
   */
  const openChangeRoleDialog = (userId: string) => {
    setSelectedUserIdForAction(userId);
    const user = users.find(u => u.id === userId);
    setNewRoleForDialog(user?.role || null);
    setIsChangeRoleDialogOpen(true);
  };

  /**
   * Opens the dialog to confirm deactivation of a user account.
   * @param {string} userId - The ID of the user to be deactivated.
   */
  const openDeactivateDialog = (userId: string) => {
    setSelectedUserIdForAction(userId);
    setIsDeactivateDialogOpen(true);
  };

  /**
   * Opens the dialog to confirm activation of a user account.
   * @param {string} userId - The ID of the user to be activated.
   */
  const openActivateDialog = (userId: string) => {
    setSelectedUserIdForAction(userId);
    setIsActivateDialogOpen(true);
  };

  /**
   * Fetches the list of users from the 'get-all-users' Supabase Edge Function.
   * Maps the fetched data to the `UserProfile` interface.
   * Handles loading states, error reporting via toasts, and updates the component's user state.
   * This function is memoized using `useCallback` to prevent unnecessary re-renders.
   */
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Call the Edge Function to securely fetch all user data (including emails)
      const { data: usersData, error: functionError } = await supabase.functions.invoke<FetchedUserData[]>('get-all-users');

      if (functionError) {
        // Specific error handling for function invocation
        if (functionError instanceof Error && functionError.message.includes('Function not found')) {
             throw new Error(t('adminUsersPage.errors.edgeFunctionNotFound'));
        }
        throw functionError; // Re-throw other function-related errors
      }

      if (!usersData) {
        setUsers([]);
        setIsLoading(false);
        return;
      }

      // Map the received data to UserProfile
      // The mapping is now simpler because email is already added by the Edge Function
      const mappedUsers = usersData.map(user => ({
          id: user.id,
          email: user.email || '-', // Email now comes from the Edge Function data
          name: user.name || null,
          role: ((user.role === 'admin' || user.role === 'paid') ? user.role : 'free') as UserRole,
          avatar_url: user.avatar_url || null,
          language_preference: user.language_preference || 'nl', // Keep 'nl' as default language code, UI text will be translated
          created_at: user.created_at,
          updated_at: user.updated_at,
          status: user.status || 'active',
          email_notifications_enabled: user.email_notifications_enabled ?? true,
          ai_mode_preference: (user.ai_mode_preference || 'gpt4o') as AiChatMode,
          enabled_features: [] // Keep or adjust if needed
      }));

      setUsers(mappedUsers);

    } catch (err: unknown) {
      console.error("Error fetching users:", err);
      setError(t('adminUsersPage.errors.fetchUsersError'));
      const message = err instanceof Error ? err.message : t('adminUsersPage.errors.unknownFetchError');
      toast({
        variant: "destructive",
        title: t('adminUsersPage.toastTitles.fetchError'),
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  /**
   * useEffect hook to call `fetchUsers` when the component mounts or `fetchUsers` itself changes.
   */
  useEffect(() => {
    fetchUsers(); 
  }, [fetchUsers]);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'paid': return 'outline';
      default: return 'secondary';
    }
  };
  
  /**
   * Handles the change of a user's role.
   * Updates the user's role in the Supabase 'profiles' table and optimistically updates the local state.
   * Shows success or error toast notifications.
   * Closes the role change dialog on success.
   * @param {string} userId - The ID of the user whose role is to be changed.
   * @param {'free' | 'paid' | 'admin'} newRole - The new role to assign to the user.
   */
  const handleRoleChange = async (userId: string, newRole: 'free' | 'paid' | 'admin') => {
     const userToUpdate = users.find(u => u.id === userId);
     const userName = userToUpdate?.name || userToUpdate?.email || userId;
     try {
        const { error: updateError } = await supabase
           .from('profiles')
           .update({ role: newRole })
           .eq('id', userId);
        if (updateError) {
            throw updateError;
        }
        setUsers(currentUsers => 
            currentUsers.map(user => 
                user.id === userId ? { ...user, role: newRole } : user
            )
        );
        toast({
            title: t('adminUsersPage.toastTitles.roleChangeSuccess'),
            description: t('adminUsersPage.toastMessages.roleChangeSuccess', { userName, newRole }),
        });
        setIsChangeRoleDialogOpen(false);
     } catch (err: unknown) {
        console.error("Error updating role:", err);
        const message = err instanceof Error ? err.message : t('adminUsersPage.errors.roleUpdateError');
        toast({
            variant: "destructive",
            title: t('adminUsersPage.toastTitles.roleChangeError'),
            description: message,
        });
     }
  };

  /**
   * Handles the deactivation of a user account.
   * Updates the user's status to 'inactive' in the Supabase 'profiles' table and optimistically updates local state.
   * Shows success or error toast notifications.
   * Closes the deactivation confirmation dialog on success.
   * @param {string} userId - The ID of the user to be deactivated.
   */
  const handleDeactivateUser = async (userId: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    const userName = userToUpdate?.name || userToUpdate?.email || userId;
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ status: 'inactive' })
        .eq('id', userId);
      if (updateError) throw updateError;
      setUsers(currentUsers =>
        currentUsers.map(user =>
          user.id === userId ? { ...user, status: 'inactive' } : user
        )
      );
      toast({
        title: t('adminUsersPage.toastTitles.deactivateSuccess'),
        description: t('adminUsersPage.toastMessages.deactivateSuccess', { userName })
      });
      setIsDeactivateDialogOpen(false);
    } catch (err: unknown) {
       console.error("Error deactivating user:", err);
       const message = err instanceof Error ? err.message : t('adminUsersPage.errors.deactivateError');
       toast({ variant: "destructive", title: t('adminUsersPage.toastTitles.deactivateError'), description: message });
    }
  };

  // New function to activate user
  /**
   * Handles the activation of a user account.
   * Updates the user's status to 'active' in the Supabase 'profiles' table and optimistically updates local state.
   * Shows success or error toast notifications.
   * Closes the activation confirmation dialog on success.
   * @param {string} userId - The ID of the user to be activated.
   */
  const handleActivateUser = async (userId: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    const userName = userToUpdate?.name || userToUpdate?.email || userId;
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ status: 'active' }) // Set status back to active
        .eq('id', userId);
      if (updateError) throw updateError;
      // Update state:
      setUsers(currentUsers =>
        currentUsers.map(user =>
          user.id === userId ? { ...user, status: 'active' } : user
        )
      );
      toast({
        title: t('adminUsersPage.toastTitles.activateSuccess'),
        description: t('adminUsersPage.toastMessages.activateSuccess', { userName })
      });
      setIsActivateDialogOpen(false);
    } catch (err: unknown) {
       console.error("Error activating user:", err);
       const message = err instanceof Error ? err.message : t('adminUsersPage.errors.activateError');
       toast({ variant: "destructive", title: t('adminUsersPage.toastTitles.activateError'), description: message });
    }
  };

  // Move sort and filter logic above returns
  // 1. Sort users first
  const sortedUsers = React.useMemo(() => {
    const sortableUsers = [...users]; // Use const
    if (sortConfig !== null && sortConfig.key) { // Also check if key is not null
      sortableUsers.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        // Handle null/undefined strings
        const valA = aValue ?? ""; 
        const valB = bValue ?? "";

        if (sortConfig.key === 'created_at') {
            // Date comparison
            const dateA = new Date(valA as string).getTime();
            const dateB = new Date(valB as string).getTime();
            // Handle potential NaN from invalid dates
            const validDateA = isNaN(dateA) ? (sortConfig.direction === 'asc' ? Infinity : -Infinity) : dateA;
            const validDateB = isNaN(dateB) ? (sortConfig.direction === 'asc' ? Infinity : -Infinity) : dateB;
            if (validDateA < validDateB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (validDateA > validDateB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        } else {
           // String/Role/Status comparison (case-insensitive)
           const strA = String(valA).toLowerCase();
           const strB = String(valB).toLowerCase();
           if (strA < strB) {
             return sortConfig.direction === 'asc' ? -1 : 1;
           }
           if (strA > strB) {
             return sortConfig.direction === 'asc' ? 1 : -1;
           }
           return 0;
        }
      });
    }
    return sortableUsers;
  }, [users, sortConfig]);

  // 2. Then filter users
  const filteredUsers = React.useMemo(() => {
    return sortedUsers.filter(user => {
      const nameMatch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const emailMatch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const roleMatch = selectedRole === 'all' || user.role === selectedRole;
      const statusMatch = selectedStatus === 'all' || user.status === selectedStatus;

      return (nameMatch || emailMatch) && roleMatch && statusMatch;
    });
  }, [sortedUsers, searchTerm, selectedRole, selectedStatus]);

  /**
   * Requests a sort configuration change for a specific column.
   * If the column is already being sorted, it toggles the sort direction.
   * Otherwise, it sets the new column to be sorted in ascending order.
   * @param {keyof UserProfile} key - The key of the `UserProfile` object to sort by.
   */
  const requestSort = (key: keyof UserProfile) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey: keyof UserProfile) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />;
    }
    return sortConfig.direction === 'desc' ? 
        <ArrowUpDown className="ml-2 h-3 w-3 transform rotate-180" /> : 
        <ArrowUpDown className="ml-2 h-3 w-3" />;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'P', { locale: currentLocale });
    } catch (e) {
      console.error("Invalid date string for table:", dateString, e);
      return t('common.invalidDate');
    }
  };

  if (isLoading) {
    return <GradientLoader />;
  }

  if (error) {
    return <p className="text-red-500">{t('adminUsersPage.errorMessage', { error })}</p>;
  }

  if (filteredUsers.length === 0) {
    return <p>{t('adminUsersPage.noUsersFound')}</p>;
  }

  return (
    <>
      {isMobile ? (
        <div className="mt-4">
          {filteredUsers.map(user => (
            <UserCard 
              key={user.id} 
              user={user} 
              onRoleChange={handleRoleChange}
              onDeactivateUser={handleDeactivateUser}
              onActivateUser={handleActivateUser}
              openChangeRoleDialog={openChangeRoleDialog}
              openDeactivateDialog={openDeactivateDialog}
              openActivateDialog={openActivateDialog}
            />
          ))}
        </div>
      ) : (
        <Table className="min-w-full divide-y divide-border">
          <TableHeader>
            <TableRow className="hover:bg-muted/50">
              {[ 'name', 'email', 'role', 'status', 'created_at', 'actions'].map((headerKey) => (
                <TableHead 
                  key={headerKey}
                  onClick={() => headerKey !== 'actions' && requestSort(headerKey as keyof UserProfile)}
                  className={headerKey !== 'actions' ? 'cursor-pointer' : ''}
                >
                  <div className="flex items-center">
                    {t(`adminUsersPage.tableHeaders.${headerKey}` as const)}
                    {headerKey !== 'actions' && getSortIcon(headerKey as keyof UserProfile)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium text-foreground">{user.name || '-'}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                    {t(`adminDashboard.users.roles.${user.role}` as const) || user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={user.status === 'active' ? 'default' : 'destructive'} 
                    className={cn(
                      "capitalize",
                      user.status === 'active' && "bg-green-600 hover:bg-green-700 text-white"
                    )}
                  >
                     {t(`adminUsersPage.status.${user.status}` as const) || user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">{t('adminUsersPage.actions.openMenu')}</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-muted border-border shadow-lg">
                      <DropdownMenuItem onClick={() => openChangeRoleDialog(user.id)} className="hover:bg-primary/10">
                        {t('adminUsersPage.actions.changeRole')}
                      </DropdownMenuItem>
                      {user.status === 'active' ? (
                        <DropdownMenuItem onClick={() => openDeactivateDialog(user.id)} className="hover:bg-destructive/10 text-destructive">
                           {t('adminUsersPage.actions.deactivate')}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => openActivateDialog(user.id)} className="hover:bg-green-500/10 text-green-600">
                           {t('adminUsersPage.actions.activate')}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Change Role Dialog */}
      {selectedUserIdForAction && (
        <AlertDialog open={isChangeRoleDialogOpen} onOpenChange={setIsChangeRoleDialogOpen}>
            <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('adminUsersPage.dialogs.changeRole.title', { userName: users.find(u => u.id === selectedUserIdForAction)?.name || users.find(u => u.id === selectedUserIdForAction)?.email })}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('adminUsersPage.dialogs.changeRole.description')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Select 
                    value={newRoleForDialog || undefined}
                    onValueChange={(value) => setNewRoleForDialog(value as UserRole)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={t('adminUsersPage.dialogs.changeRole.selectPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent className="bg-muted border-border">
                        <SelectItem value="free">{t('adminDashboard.users.roles.free')}</SelectItem>
                        <SelectItem value="paid">{t('adminDashboard.users.roles.paid')}</SelectItem>
                        <SelectItem value="admin">{t('adminDashboard.users.roles.admin')}</SelectItem>
                    </SelectContent>
                </Select>
                <AlertDialogFooter>
                    <AlertDialogCancel className="hover:bg-muted/80">{t('adminUsersPage.dialogs.cancelButton')}</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={() => selectedUserIdForAction && newRoleForDialog && handleRoleChange(selectedUserIdForAction, newRoleForDialog)}
                        disabled={!newRoleForDialog || newRoleForDialog === users.find(u => u.id === selectedUserIdForAction)?.role}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        {t('adminUsersPage.dialogs.saveButton')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Deactivate User Dialog */}
       {selectedUserIdForAction && (
        <AlertDialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
            <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('adminUsersPage.dialogs.deactivateUser.title', { userName: users.find(u => u.id === selectedUserIdForAction)?.name || users.find(u => u.id === selectedUserIdForAction)?.email })}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('adminUsersPage.dialogs.deactivateUser.description')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="hover:bg-muted/80">{t('adminUsersPage.dialogs.cancelButton')}</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={() => selectedUserIdForAction && handleDeactivateUser(selectedUserIdForAction)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {t('adminUsersPage.dialogs.deactivateUser.confirmButton')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
       )}

      {/* Activate User Dialog */}
      {selectedUserIdForAction && (
        <AlertDialog open={isActivateDialogOpen} onOpenChange={setIsActivateDialogOpen}>
            <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('adminUsersPage.dialogs.activateUser.title', { userName: users.find(u => u.id === selectedUserIdForAction)?.name || users.find(u => u.id === selectedUserIdForAction)?.email })}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('adminUsersPage.dialogs.activateUser.description')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="hover:bg-muted/80">{t('adminUsersPage.dialogs.cancelButton')}</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={() => selectedUserIdForAction && handleActivateUser(selectedUserIdForAction)}
                        className="bg-green-600 text-white hover:bg-green-700"
                    >
                        {t('adminUsersPage.dialogs.activateUser.confirmButton')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

/**
 * `AdminUsersPage` is a simple wrapper component that renders the `UsersManagementTable`.
 * It provides default filter values (show all users) to the table.
 * This component might be used if navigating directly to a users management page
 * separate from the main admin dashboard tabs.
 */
const AdminUsersPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6 text-foreground">{t('adminDashboard.users.title')}</h1>
      <p className="text-muted-foreground mb-8">
        {t('adminDashboard.users.description')}
      </p>

      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
        <input 
          type="text" 
          placeholder={t('adminDashboard.users.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow p-2 border border-border rounded-md bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
        />
        <div className="flex gap-4 w-full md:w-auto">
          <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole | 'all')}>
            <SelectTrigger className="w-full md:w-[180px] bg-input border-border text-foreground">
              <SelectValue placeholder={t('adminDashboard.users.filterRolePlaceholder')} />
            </SelectTrigger>
            <SelectContent className="bg-muted border-border">
              <SelectItem value="all">{t('adminDashboard.users.roles.all')}</SelectItem>
              <SelectItem value="admin">{t('adminDashboard.users.roles.admin')}</SelectItem>
              <SelectItem value="paid">{t('adminDashboard.users.roles.paid')}</SelectItem>
              <SelectItem value="free">{t('adminDashboard.users.roles.free')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full md:w-[180px] bg-input border-border text-foreground">
              <SelectValue placeholder={t('adminDashboard.users.filterStatusPlaceholder')} />
            </SelectTrigger>
            <SelectContent className="bg-muted border-border">
              <SelectItem value="all">{t('adminDashboard.users.statuses.all')}</SelectItem>
              <SelectItem value="active">{t('adminDashboard.users.statuses.active')}</SelectItem>
              <SelectItem value="inactive">{t('adminDashboard.users.statuses.inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <UsersManagementTable 
        searchTerm={searchTerm} 
        selectedRole={selectedRole} 
        selectedStatus={selectedStatus}
      />
    </div>
  );
};

export default AdminUsersPage; 