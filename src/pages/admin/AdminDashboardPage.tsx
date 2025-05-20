import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx"; // Import Tabs
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card.tsx';
import { UsersManagementTable } from "./AdminUsersPage.tsx"; // Import the table components
import { PermissionsManagementTable } from "./AdminPermissionsPage.tsx";
import { ThemeSettingsTable } from "./AdminThemeSettingsPage.tsx"; // Import the theme settings table
import { Input } from "@/components/ui/input.tsx"; // Import Input
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx"; // Import Select
import { UserRole } from '@/types/auth.ts'; // Import UserRole
import { useTranslation } from 'react-i18next'; // Import useTranslation
import AdminFeedbackPage from "./AdminFeedbackPage.tsx";
import AdminApiUsagePage from "./AdminApiUsagePage.tsx"; // Nieuwe import
import AdminExternalApiUsagePage from "./AdminExternalApiUsagePage.tsx"; // Nieuwe import
import AdminAiLimitsPage from "./AdminAiLimitsPage.tsx"; // Import AI Limits page
import { Users, Shield, MessageSquare, Palette, Activity, Sliders } from "lucide-react"; // Import icons for admin tabs

/**
 * `AdminDashboardPage` component serves as the main dashboard for administrators.
 * It provides a tabbed interface to navigate between different admin sections:
 * Users, Permissions, Themes, and Feedback.
 * It includes filtering options for the users table (searchTerm, role, status).
 */
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
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span className="hidden sm:inline">{t('adminDashboard.tabs.users')}</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="hidden sm:inline">{t('adminDashboard.tabs.permissions')}</span>
          </TabsTrigger>
          <TabsTrigger value="internalApiUsage" className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <span className="hidden sm:inline">{t('adminDashboard.tabs.internalApiUsage', 'Intern API Gebruik')}</span>
          </TabsTrigger>
          <TabsTrigger value="externalApiUsage" className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <span className="hidden sm:inline">{t('adminDashboard.tabs.externalApiUsage', 'Extern API Gebruik')}</span>
          </TabsTrigger>
          <TabsTrigger value="aiLimits" className="flex items-center gap-2">
            <Sliders className="h-5 w-5" />
            <span className="hidden sm:inline">{t('adminDashboard.tabs.aiLimits')}</span>
          </TabsTrigger>
          <TabsTrigger value="themes" className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <span className="hidden sm:inline">{t('adminDashboard.tabs.themes')}</span>
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <span className="hidden sm:inline">{t('adminDashboard.tabs.feedback', 'Berichten')}</span>
          </TabsTrigger>
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
                  className="h-12 md:h-8 w-full md:w-[150px] lg:w-[250px]"
                />
                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole | 'all')}>
                  <SelectTrigger className="h-12 md:h-8 w-full md:w-[120px]">
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
                  <SelectTrigger className="h-12 md:h-8 w-full md:w-[120px]">
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
        <TabsContent value="themes" className="mt-4">
          {/* Card wrapper for consistency */}
          <Card>
            <CardHeader>
              <CardTitle>{t('adminDashboard.themes.title')}</CardTitle>
              <CardDescription>{t('adminDashboard.themes.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSettingsTable />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="feedback" className="mt-4">
          <AdminFeedbackPage />
        </TabsContent>
        <TabsContent value="internalApiUsage" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('adminDashboard.internalApiUsage.title', 'Intern API Verbruik')}</CardTitle>
              <CardDescription>{t('adminDashboard.internalApiUsage.description', 'Monitor welke gebruikers de interne API functies aanroepen.')}</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminApiUsagePage />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="externalApiUsage" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('adminDashboard.externalApiUsage.title', 'Extern API Verbruik')}</CardTitle>
              <CardDescription>{t('adminDashboard.externalApiUsage.description', 'Monitor het verbruik van externe AI diensten door de API functies.')}</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminExternalApiUsagePage />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="aiLimits" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('adminDashboard.aiLimits.title', 'AI-limietinstellingen')}</CardTitle>
              <CardDescription>{t('adminDashboard.aiLimits.description', 'Beheer de limieten voor AI-functiegebruik per gebruikerstype.')}</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminAiLimitsPage />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </AppLayout>
  );
};

export default AdminDashboardPage; 