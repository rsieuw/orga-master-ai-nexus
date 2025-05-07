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

// Definieer de verwachte structuur van de data geretourneerd door de Edge Function
// Deze moet nu ook het email adres bevatten
interface FetchedUserData {
    id: string;
    email: string | null; // Email komt nu direct van de functie
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

// Definieer de props die de tabel component nu verwacht
interface UsersManagementTableProps {
  searchTerm: string;
  selectedRole: UserRole | 'all';
  selectedStatus: string;
}

// Type voor sorteerconfiguratie
type SortDirection = 'asc' | 'desc';
type SortConfig = {
  key: keyof UserProfile | null;
  direction: SortDirection;
} | null;

// Component voor gebruikersbeheer tabel
export const UsersManagementTable: React.FC<UsersManagementTableProps> = ({ 
  searchTerm,
  selectedRole,
  selectedStatus 
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'desc'}); // Default sort
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Roep de Edge Function aan om alle gebruikersdata (inclusief emails) veilig op te halen
      const { data: usersData, error: functionError } = await supabase.functions.invoke<FetchedUserData[]>('get-all-users');

      if (functionError) {
        // Specifieke error handling voor function invocation
        if (functionError instanceof Error && functionError.message.includes('Function not found')) {
             throw new Error("Edge Function 'get-all-users' niet gevonden. Deploy de functie eerst.");
        }
        throw functionError; // Gooi andere functie-gerelateerde fouten door
      }

      if (!usersData) {
        setUsers([]);
        setIsLoading(false);
        return;
      }

      // Map de ontvangen data naar UserProfile
      // De mapping is nu simpeler omdat email al is toegevoegd door de Edge Function
      const mappedUsers = usersData.map(user => ({
          id: user.id,
          email: user.email || '-', // Email komt nu van de Edge Function data
          name: user.name || null,
          role: ((user.role === 'admin' || user.role === 'paid') ? user.role : 'free') as UserRole,
          avatar_url: user.avatar_url || null,
          language_preference: user.language_preference || 'nl',
          created_at: user.created_at,
          updated_at: user.updated_at,
          status: user.status || 'active',
          email_notifications_enabled: user.email_notifications_enabled ?? true,
          ai_mode_preference: (user.ai_mode_preference || 'gpt4o') as AiMode,
          enabled_features: [] // Behoud of pas aan indien nodig
      }));

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
      setUsers(currentUsers =>
        currentUsers.map(user =>
          user.id === userId ? { ...user, status: 'inactive' } : user
        )
      );
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

  // Nieuwe functie om gebruiker te activeren
  const handleActivateUser = async (userId: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    const userName = userToUpdate?.name || userToUpdate?.email || userId;
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ status: 'active' }) // Zet status terug naar active
        .eq('id', userId);
      if (updateError) throw updateError;
      // Update state:
      setUsers(currentUsers =>
        currentUsers.map(user =>
          user.id === userId ? { ...user, status: 'active' } : user
        )
      );
      toast({
        title: "Gebruiker geactiveerd",
        description: `Gebruiker ${userName} is succesvol geactiveerd.`
      });
    } catch (err: unknown) {
       console.error("Error activating user:", err);
       const message = err instanceof Error ? err.message : "Kon gebruiker niet activeren.";
       toast({ variant: "destructive", title: "Fout bij activeren", description: message });
    }
  };

  // Verplaats sorteer- en filterlogica naar boven de returns
  // 1. Sorteer de gebruikers eerst
  const sortedUsers = React.useMemo(() => {
    const sortableUsers = [...users]; // Gebruik const
    if (sortConfig !== null && sortConfig.key) { // Check ook of key niet null is
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

  // 2. Filter de gesorteerde gebruikers
  const filteredUsers = sortedUsers.filter(user => {
    const matchesSearchTerm = (
      (user.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;

    return matchesSearchTerm && matchesRole && matchesStatus;
  });

  if (isLoading) {
    return <div className="flex justify-center items-center py-10"><GradientLoader /></div>;
  }

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }
  
  // Functie om sorteerconfiguratie aan te passen
  const requestSort = (key: keyof UserProfile) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Helper om sorteericoon te tonen
  const getSortIcon = (columnKey: keyof UserProfile) => {
     if (!sortConfig || sortConfig.key !== columnKey) {
       return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" />; 
     }
     return sortConfig.direction === 'asc' ? 
       <ArrowUpDown className="ml-2 h-3 w-3" /> : 
       <ArrowUpDown className="ml-2 h-3 w-3 transform rotate-180" />;
  };

  return (
    <div className="rounded-md border">
      {/* Desktop Table (hidden on small screens, visible md and up) */}
      <Table className="hidden md:table min-w-full">
        <TableHeader>
          <TableRow>
            {/* Maak koppen klikbaar en zet tekst/icoon naast elkaar */}
            <TableHead onClick={() => requestSort('name')} className="cursor-pointer hover:bg-muted/50 transition-colors">
               <div className="flex items-center"> {/* Flex container */} 
                 Naam {getSortIcon('name')}
               </div>
            </TableHead>
            <TableHead onClick={() => requestSort('email')} className="cursor-pointer hover:bg-muted/50 transition-colors">
               <div className="flex items-center"> {/* Flex container */} 
                 Email {getSortIcon('email')}
               </div>
            </TableHead>
            <TableHead onClick={() => requestSort('role')} className="cursor-pointer hover:bg-muted/50 transition-colors">
               <div className="flex items-center"> {/* Flex container */} 
                 Rol {getSortIcon('role')}
               </div>
            </TableHead>
            <TableHead onClick={() => requestSort('status')} className="cursor-pointer hover:bg-muted/50 transition-colors">
               <div className="flex items-center"> {/* Flex container */} 
                 Status {getSortIcon('status')}
               </div>
            </TableHead>
            <TableHead onClick={() => requestSort('created_at')} className="cursor-pointer hover:bg-muted/50 transition-colors">
               <div className="flex items-center"> {/* Flex container */} 
                 Geregistreerd op {getSortIcon('created_at')}
               </div>
            </TableHead>
            <TableHead className="text-right">Acties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="hidden md:table-row-group">
          {filteredUsers.length > 0 ? filteredUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.name || '-'}
              </TableCell>
              <TableCell className="font-medium">
                {user.email || '-'}
              </TableCell>
              <TableCell className="font-medium">
                <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
              </TableCell>
              <TableCell className="font-medium">
                <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                  {user.status || 'active'}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
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
                    
                    {/* Conditioneel tonen van Activeren/Deactiveren */}
                    {user.status === 'active' ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onSelect={(e: Event) => e.preventDefault()} // Voorkom sluiten menu bij selectie
                          >
                            Deactiveer Gebruiker
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Deze actie zal gebruiker {user.name || user.email || user.id} deactiveren.
                              Ze kunnen niet meer inloggen.
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
                    ) : (
                       <DropdownMenuItem
                          className="text-green-600 focus:text-green-700 focus:bg-green-100" // Geef een positieve kleur
                          onClick={() => handleActivateUser(user.id)}
                       >
                         Activeer Gebruiker
                       </DropdownMenuItem>
                    )}
                    
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24">
                Geen gebruikers gevonden die aan de criteria voldoen.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Mobile Card View (visible on small screens, hidden md and up) */}
      <div className="md:hidden space-y-4 p-4">
        {filteredUsers.length > 0 ? filteredUsers.map((user) => (
          <div key={`${user.id}-mobile`} className="border rounded-lg p-4 shadow space-y-3 bg-card">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-lg capitalize">{user.name || 'N/A'}</h3>
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
                  
                  {user.status === 'active' ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          onSelect={(e: Event) => e.preventDefault()} // Voorkom sluiten menu bij selectie
                        >
                          Deactiveer Gebruiker
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Deze actie zal gebruiker {user.name || user.email} deactiveren. Ze zullen niet meer kunnen inloggen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuleren</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeactivateUser(user.id)} className="bg-destructive hover:bg-destructive/90">Deactiveren</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <DropdownMenuItem onClick={() => handleActivateUser(user.id)}>Activeer Gebruiker</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Rol</p>
                <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">{user.role}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={user.status === 'active' ? 'default' : 'destructive'} className="capitalize">{user.status}</Badge>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Geregistreerd op</p>
              <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        )) : (
          <div className="text-center py-10">
            <p>Geen gebruikers gevonden die aan de criteria voldoen.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// De AdminUsersPage exporteert nu niets meer direct, maar kan blijven bestaan
// als je later specifieke logica voor alleen deze pagina wilt toevoegen.
const AdminUsersPage: React.FC = () => {
  // Deze component rendert nu niets meer direct, de tabel wordt gebruikt in AdminDashboardPage
  return null; 
};

export default AdminUsersPage; 