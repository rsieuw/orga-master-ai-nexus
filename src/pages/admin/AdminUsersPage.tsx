import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client.ts";
import { UserProfile, UserRole, AiMode } from '@/contexts/AuthContext.tsx';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog.tsx";
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";

// Define the expected structure of the data returned by the Edge Function
// This should now also include the email address
interface FetchedUserData {
    id: string;
    email: string | null; // Email now comes directly from the function
    name: string | null;
    role: string | null;
    avatar_url: string | null;
    language_preference: string | null;
    created_at: string;
    updated_at: string;
    status?: string;
    email_notifications_enabled?: boolean | null;
    ai_mode_preference?: string | null;
}

// Define the props that the table component now expects
interface UsersManagementTableProps {
  searchTerm: string;
  selectedRole: UserRole | 'all';
  selectedStatus: string;
}

// Type for sort configuration
type SortDirection = 'asc' | 'desc';
type SortConfig = {
  key: keyof UserProfile | null;
  direction: SortDirection;
} | null;

// Component for user management table
export const UsersManagementTable: React.FC<UsersManagementTableProps> = ({ 
  searchTerm,
  selectedRole,
  selectedStatus 
}) => {
  const { t } = useTranslation();
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
          ai_mode_preference: (user.ai_mode_preference || 'gpt4o') as AiMode,
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
    } catch (err: unknown) {
       console.error("Error deactivating user:", err);
       const message = err instanceof Error ? err.message : t('adminUsersPage.errors.deactivateError');
       toast({ variant: "destructive", title: t('adminUsersPage.toastTitles.deactivateError'), description: message });
    }
  };

  // New function to activate user
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

  // 2. Filter users after sorting
  const filteredAndSortedUsers = React.useMemo(() => {
    return sortedUsers.filter(user => {
      const matchesSearchTerm = (
        (user.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;
      const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;

      return matchesSearchTerm && matchesRole && matchesStatus;
    });
  }, [sortedUsers, searchTerm, selectedRole, selectedStatus]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <GradientLoader />
        <span className="ml-2 text-lg">{t('adminUsersPage.loading')}</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{t('adminUsersPage.errorMessage', { error })}</div>;
  }

  if (filteredAndSortedUsers.length === 0) {
    return <div className="text-center p-4">{t('adminUsersPage.noUsersFound')}</div>;
  }

  // Function to adjust sort configuration
  const requestSort = (key: keyof UserProfile) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Helper to display sort icon
  const getSortIcon = (columnKey: keyof UserProfile) => {
     if (!sortConfig || sortConfig.key !== columnKey) {
       return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />;
     }
     return sortConfig.direction === 'asc' ? 
       <ArrowUpDown className="ml-1 h-3 w-3" /> : 
       <ArrowUpDown className="ml-1 h-3 w-3 transform rotate-180" />;
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => requestSort('name')} className="cursor-pointer">
              <div className="flex items-center">{t('adminUsersPage.tableHeaders.name')}{getSortIcon('name')}</div>
            </TableHead>
            <TableHead onClick={() => requestSort('email')} className="cursor-pointer">
              <div className="flex items-center">{t('adminUsersPage.tableHeaders.email')}{getSortIcon('email')}</div>
            </TableHead>
            <TableHead onClick={() => requestSort('role')} className="cursor-pointer">
              <div className="flex items-center">{t('adminUsersPage.tableHeaders.role')}{getSortIcon('role')}</div>
            </TableHead>
            <TableHead onClick={() => requestSort('status')} className="cursor-pointer">
             <div className="flex items-center">{t('adminUsersPage.tableHeaders.status')}{getSortIcon('status')}</div>
            </TableHead>
            <TableHead onClick={() => requestSort('created_at')} className="cursor-pointer">
              <div className="flex items-center">{t('adminUsersPage.tableHeaders.registeredAt')}{getSortIcon('created_at')}</div>
            </TableHead>
            <TableHead>{t('adminUsersPage.tableHeaders.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name || '-'}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge> 
              </TableCell>
              <TableCell>
                <Badge variant={user.status === 'active' ? 'default' : 'destructive'} className={user.status === 'active' ? 'bg-green-500' : 'bg-red-500'}>
                  {user.status === 'active' ? t('adminUsersPage.status.active') : t('adminUsersPage.status.inactive')}
                </Badge>
              </TableCell>
              <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <AlertDialog>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">{t('adminUsersPage.actions.openMenu')}</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem>{t('adminUsersPage.actions.changeRole')}</DropdownMenuItem>
                            </AlertDialogTrigger>
                            {user.status === 'active' ? (
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onClick={() => { setSelectedUserIdForAction(user.id); setIsDeactivateDialogOpen(true); }}>
                                        {t('adminUsersPage.actions.deactivate')}
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                            ) : (
                                <AlertDialogTrigger asChild>
                                     <DropdownMenuItem onClick={() => { setSelectedUserIdForAction(user.id); setIsActivateDialogOpen(true); }}>
                                        {t('adminUsersPage.actions.activate')}
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Change Role Dialog */}
      {selectedUserIdForAction && isChangeRoleDialogOpen && (
        <AlertDialog open={isChangeRoleDialogOpen} onOpenChange={setIsChangeRoleDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('adminUsersPage.dialogs.changeRole.title', { userName: users.find(u => u.id === selectedUserIdForAction)?.name || selectedUserIdForAction })}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('adminUsersPage.dialogs.changeRole.description')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                    <Select onValueChange={(value) => setNewRoleForDialog(value as UserRole)} defaultValue={users.find(u=>u.id === selectedUserIdForAction)?.role}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('adminUsersPage.dialogs.changeRole.selectPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="free">{t('adminDashboard.users.roles.free')}</SelectItem> 
                            <SelectItem value="paid">{t('adminDashboard.users.roles.paid')}</SelectItem>
                            <SelectItem value="admin">{t('adminDashboard.users.roles.admin')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsChangeRoleDialogOpen(false)}>{t('adminUsersPage.dialogs.cancelButton')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { if(newRoleForDialog) handleRoleChange(selectedUserIdForAction, newRoleForDialog); setIsChangeRoleDialogOpen(false); }}>
                        {t('adminUsersPage.dialogs.saveButton')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Deactivate User Dialog */}
      {selectedUserIdForAction && isDeactivateDialogOpen && (
          <AlertDialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('adminUsersPage.dialogs.deactivateUser.title', { userName: users.find(u => u.id === selectedUserIdForAction)?.name || selectedUserIdForAction })}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('adminUsersPage.dialogs.deactivateUser.description')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsDeactivateDialogOpen(false)}>{t('adminUsersPage.dialogs.cancelButton')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { handleDeactivateUser(selectedUserIdForAction); setIsDeactivateDialogOpen(false); }} className="bg-red-600 hover:bg-red-700">
                        {t('adminUsersPage.dialogs.deactivateUser.confirmButton')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

       {/* Activate User Dialog */}
      {selectedUserIdForAction && isActivateDialogOpen && (
          <AlertDialog open={isActivateDialogOpen} onOpenChange={setIsActivateDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('adminUsersPage.dialogs.activateUser.title', { userName: users.find(u => u.id === selectedUserIdForAction)?.name || selectedUserIdForAction })}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('adminUsersPage.dialogs.activateUser.description')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsActivateDialogOpen(false)}>{t('adminUsersPage.dialogs.cancelButton')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { handleActivateUser(selectedUserIdForAction); setIsActivateDialogOpen(false); }} >
                        {t('adminUsersPage.dialogs.activateUser.confirmButton')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

// The AdminUsersPage no longer exports anything directly, but can remain
// if you want to add specific logic for only this page later.
const AdminUsersPage: React.FC = () => {
  // This component no longer renders anything directly, the table is used in AdminDashboardPage
  return null; 
};

export default AdminUsersPage; 