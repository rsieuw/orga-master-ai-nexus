import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client.ts";
import { UserProfile, UserRole } from '@/contexts/AuthContext.tsx';
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
import { MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast.ts';
import { GradientLoader } from '@/components/ui/loader.tsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog.tsx";

// Definieer de verwachte structuur
interface FetchedProfileData {
    id: string;
    name: string | null;
    role: string | null; 
    avatar_url: string | null;
    language_preference: string | null;
    created_at: string;
    updated_at: string;
    status?: string; 
}

// Component voor gebruikersbeheer tabel
export const UsersManagementTable: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, name, role, avatar_url, language_preference, created_at, updated_at, status');

      if (fetchError) {
        throw fetchError;
      }
      
      const profileData = data as unknown as FetchedProfileData[] | null;

      const mappedUsers = profileData ? profileData.map(profile => ({
          id: profile.id,
          email: '-', 
          name: profile.name || null,
          role: ((profile.role === 'admin' || profile.role === 'paid') ? profile.role : 'free') as UserRole,
          avatar_url: profile.avatar_url || null,
          language_preference: profile.language_preference || 'nl',
          created_at: profile.created_at, 
          updated_at: profile.updated_at,
          status: profile.status || 'active',
          enabled_features: []
      })) : [];
      
      setUsers(mappedUsers);

    } catch (err: unknown) {
      console.error("Error fetching users:", err);
      setError("Kon gebruikers niet ophalen. Controleer RLS policies en netwerk.");
      const message = err instanceof Error ? err.message : "Er is een onbekende fout opgetreden.";
      toast({
        variant: "destructive",
        title: "Fout bij ophalen gebruikers",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

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
            title: "Rol succesvol gewijzigd",
            description: `Gebruiker ${userName} is nu een ${newRole}.`,
        });
     } catch (err: unknown) {
        console.error("Error updating role:", err);
        const message = err instanceof Error ? err.message : "Kon rol niet bijwerken.";
        toast({
            variant: "destructive",
            title: "Fout bij rol wijzigen",
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
      setUsers(currentUsers => currentUsers.filter(user => user.id !== userId)); 
      toast({ 
        title: "Gebruiker gedeactiveerd", 
        description: `Gebruiker ${userName} is succesvol gedeactiveerd.` 
      });
    } catch (err: unknown) {
       console.error("Error deactivating user:", err);
       const message = err instanceof Error ? err.message : "Kon gebruiker niet deactiveren.";
       toast({ variant: "destructive", title: "Fout bij deactiveren", description: message });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center py-10"><GradientLoader /></div>;
  }

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Naam</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Geregistreerd op</TableHead>
          <TableHead className="text-right">Acties</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length > 0 ? users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.name || '-'}</TableCell>
            <TableCell>
              <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                {user.status || 'active'}
              </Badge>
            </TableCell>
            <TableCell>
              {user.created_at ? new Date(user.created_at).toLocaleDateString('nl-NL') : '-'}
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')}>Promoveer tot Admin</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'paid')}>Maak Betaalde Gebruiker</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'free')}>Maak Gratis Gebruiker</DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        onSelect={(e: Event) => e.preventDefault()}
                      >
                        Deactiveer Gebruiker
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Deze actie zal gebruiker {user.name || user.email || user.id} deactiveren.
                          Ze kunnen niet meer inloggen. Dit kan meestal niet ongedaan gemaakt worden via de UI.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuleren</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDeactivateUser(user.id)}
                        >
                          Deactiveren
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        )) : (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground">Geen gebruikers gevonden.</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

const AdminUsersPage: React.FC = () => {
  return <UsersManagementTable />;
};

export default AdminUsersPage; 