import React from 'react';
import AppLayout from '@/components/layout/AppLayout'; // Gebruik dezelfde layout als de rest vd app, of maak een AdminLayout
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Importeer Button
import { Link } from 'react-router-dom'; // Importeer Link
import { Users } from 'lucide-react'; // Importeer Users icoon

const AdminDashboardPage: React.FC = () => {
  return (
    <AppLayout>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Beheer Opties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Selecteer een optie om te beheren:</p>
          <Button asChild variant="outline">
            <Link to="/admin/users">
              <Users className="mr-2 h-4 w-4" />
              Gebruikers Beheren
            </Link>
          </Button>
          {/* Voeg hier knoppen/links toe voor andere beheersecties */}
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default AdminDashboardPage; 