import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx"; // Import Tabs
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card.tsx';
import { UsersManagementTable } from "./AdminUsersPage.tsx"; // Import the table components
import { PermissionsManagementTable } from "./AdminPermissionsPage.tsx";
import { Input } from "@/components/ui/input.tsx"; // Import Input
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx"; // Import Select
import { UserRole } from '@/contexts/AuthContext.tsx'; // Import UserRole
import { useTranslation } from 'react-i18next'; // Import useTranslation

const AdminDashboardPage: React.FC = () => {
  const { t } = useTranslation(); // Initialize t function
  // Manage state for filters here
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold mb-6">{t('adminDashboard.title')}</h1>
      
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">{t('adminDashboard.tabs.users')}</TabsTrigger>
          <TabsTrigger value="permissions">{t('adminDashboard.tabs.permissions')}</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          {/* Card wrapper for consistency */}
          <Card>
            <CardHeader className="flex flex-col space-y-2 pb-2 mb-4 md:flex-row md:items-center md:justify-between md:space-y-0 md:space-x-2">
              <div className="mb-2 md:mb-0">
                <CardTitle>{t('adminDashboard.users.title')}</CardTitle>
                <CardDescription>{t('adminDashboard.users.description')}</CardDescription>
              </div>
              <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2 w-full md:w-auto">
                <Input
                  placeholder={t('adminDashboard.users.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 w-full md:w-[150px] lg:w-[250px]"
                />
                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole | 'all')}>
                  <SelectTrigger className="h-8 w-full md:w-[120px]">
                    <SelectValue placeholder={t('adminDashboard.users.filterRolePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('adminDashboard.users.roles.all')}</SelectItem>
                    <SelectItem value="admin">{t('adminDashboard.users.roles.admin')}</SelectItem>
                    <SelectItem value="paid">{t('adminDashboard.users.roles.paid')}</SelectItem>
                    <SelectItem value="free">{t('adminDashboard.users.roles.free')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-8 w-full md:w-[120px]">
                    <SelectValue placeholder={t('adminDashboard.users.filterStatusPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('adminDashboard.users.statuses.all')}</SelectItem>
                    <SelectItem value="active">{t('adminDashboard.users.statuses.active')}</SelectItem>
                    <SelectItem value="inactive">{t('adminDashboard.users.statuses.inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {/* Pass filter state as props */}
              <UsersManagementTable
                searchTerm={searchTerm}
                selectedRole={selectedRole}
                selectedStatus={selectedStatus}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="permissions" className="mt-4">
          {/* Card wrapper for consistency */}
          <Card>
            <CardHeader>
              <CardTitle>{t('adminDashboard.permissions.title')}</CardTitle>
              <CardDescription>{t('adminDashboard.permissions.description')}</CardDescription>
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