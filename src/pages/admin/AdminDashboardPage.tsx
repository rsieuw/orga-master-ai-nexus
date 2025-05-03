import React from 'react';
import AppLayout from '@/components/layout/AppLayout.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx"; // Importeer Tabs
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card.tsx';
import { UsersManagementTable } from "./AdminUsersPage.tsx"; // Importeer de tabel componenten
import { PermissionsManagementTable } from "./AdminPermissionsPage.tsx";

const AdminDashboardPage: React.FC = () => {
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
            <CardHeader>
              <CardTitle>Gebruikersbeheer</CardTitle>
              <CardDescription>Bekijk en beheer alle geregistreerde gebruikers.</CardDescription>
            </CardHeader>
            <CardContent>
              <UsersManagementTable />
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