import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx"; // Importeer Tabs
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card.tsx';
import { UsersManagementTable } from "./AdminUsersPage.tsx"; // Importeer de tabel componenten
import { PermissionsManagementTable } from "./AdminPermissionsPage.tsx";
import { Input } from "@/components/ui/input.tsx"; // Importeer Input
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx"; // Importeer Select
import { UserRole } from '@/contexts/AuthContext.tsx'; // Importeer UserRole

const AdminDashboardPage: React.FC = () => {
  // State voor filters hier beheren
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Gebruikers</TabsTrigger>
          <TabsTrigger value="permissions">Permissies</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          {/* Card wrapper voor consistentie */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mb-4"> {/* Maak header flexibel */}
              <div> {/* Container voor titel en beschrijving */}
                <CardTitle>Gebruikersbeheer</CardTitle>
                <CardDescription>Bekijk en beheer alle geregistreerde gebruikers.</CardDescription>
              </div>
              <div className="flex items-center space-x-2"> {/* Container voor filters/zoek */}
                  <Input
                      placeholder="Zoek..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-8 w-[150px] lg:w-[250px]"
                  />
                  <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole | 'all')}>
                      <SelectTrigger className="h-8 w-[120px]">
                          <SelectValue placeholder="Filter Rol" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">Alle Rollen</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="paid">Betaald</SelectItem>
                          <SelectItem value="free">Gratis</SelectItem>
                      </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="h-8 w-[120px]">
                          <SelectValue placeholder="Filter Status" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">Alle Statussen</SelectItem>
                          <SelectItem value="active">Actief</SelectItem>
                          <SelectItem value="inactive">Inactief</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
            </CardHeader>
            <CardContent>
              {/* Geef filter state door als props */}
              <UsersManagementTable
                searchTerm={searchTerm}
                selectedRole={selectedRole}
                selectedStatus={selectedStatus}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="permissions" className="mt-4">
          {/* Card wrapper voor consistentie */}
          <Card>
            <CardHeader>
              <CardTitle>Rol Permissies Beheren</CardTitle>
              <CardDescription>Schakel features in of uit per gebruikersrol.</CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionsManagementTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </AppLayout>
  );
};

export default AdminDashboardPage; 