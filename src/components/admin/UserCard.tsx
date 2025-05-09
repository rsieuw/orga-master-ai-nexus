import React from 'react';
import { UserProfile, UserRole } from '@/contexts/AuthContext.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu.tsx';
import { MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils.ts';

interface UserCardProps {
  user: UserProfile;
  onRoleChange: (userId: string, newRole: UserRole) => void;
  onDeactivateUser: (userId: string) => void;
  onActivateUser: (userId: string) => void;
  openChangeRoleDialog: (userId: string) => void;
  openDeactivateDialog: (userId: string) => void;
  openActivateDialog: (userId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  // onRoleChange, // Kept for potential direct actions if dialogs are bypassed later
  // onDeactivateUser, // Kept for potential direct actions
  // onActivateUser, // Kept for potential direct actions
  openChangeRoleDialog,
  openDeactivateDialog,
  openActivateDialog
}) => {
  const { t, i18n } = useTranslation();
  const currentLocale = i18n.language === 'nl' ? nl : enUS;

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'paid': return 'outline';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'P', { locale: currentLocale });
    } catch (e) {
      console.error("Invalid date string:", dateString, e);
      return t('common.invalidDate');
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{user.name || user.email}</h3>
          {user.name && <p className="text-sm text-muted-foreground -mt-1">{user.email}</p>}
        </div>
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
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('adminUsersPage.tableHeaders.role')}:</span>
          <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
            {t(`adminDashboard.users.roles.${user.role}` as const) || user.role}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('adminUsersPage.tableHeaders.status')}:</span>
          <Badge 
            variant={user.status === 'active' ? 'default' : 'destructive'} 
            className={cn(
              "capitalize",
              user.status === 'active' && "bg-green-600 hover:bg-green-700 text-white",
              user.status !== 'active' && "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            )}
          >
            {t(`adminUsersPage.status.${user.status}` as const) || user.status}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('adminUsersPage.tableHeaders.created_at')}:</span>
          <span>{formatDate(user.created_at)}</span>
        </div>
      </div>
    </div>
  );
};

export default UserCard; 