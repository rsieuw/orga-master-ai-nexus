import { useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout.tsx";
import { useAuth } from "@/hooks/useAuth.ts";
import { useTask } from "@/contexts/TaskContext.hooks.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Task } from "@/types/task.ts";
import { Button } from "@/components/ui/button.tsx";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

export default function Profile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tasks, isLoading: isLoadingTasks } = useTask();

  const statistics = useMemo(() => {
    if (!tasks) return { total: 0, completed: 0, todo: 0, inProgress: 0 };

    const total = tasks.length;
    const completed = tasks.filter((task: Task) => task.status === 'done').length;
    const todo = tasks.filter((task: Task) => task.status === 'todo').length;
    const inProgress = tasks.filter((task: Task) => task.status === 'in_progress').length;

    return { total, completed, todo, inProgress };
  }, [tasks]);

  if (!user) {
    return null;
  }

  const roleBadgeVariant = 
    user.role === "admin" ? "default" :
    user.role === "paid" ? "outline" : "secondary";

  const roleName = {
    admin: 'profile.role.administrator',
    paid: 'profile.role.premiumUser',
    free: 'profile.role.freeUser'
  };

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold mb-6">{t('profile.title')}</h1>

      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('profile.userInfo.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-muted-foreground">{t('profile.userInfo.nameLabel')}</span>
              <span className="font-medium">{user.name}</span>
            </div>
            
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-muted-foreground">{t('profile.userInfo.emailLabel')}</span>
              <span className="font-medium">{user.email}</span>
            </div>
            
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-muted-foreground">{t('profile.userInfo.accountTypeLabel')}</span>
              <Badge variant={roleBadgeVariant} className="w-fit">
                {t(roleName[user.role])}
              </Badge>
            </div>
            
            {user.role === 'free' && (
              <div className="pt-4">
                 <Link to="/pricing">
                   <Button 
                     className="w-full bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white"
                   >
                     {t('profile.userInfo.upgradeButton')}
                   </Button>
                 </Link>
                 <p className="text-xs text-muted-foreground mt-2 text-center">
                   {t('profile.userInfo.upgradeDescription')}
                 </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('profile.stats.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTasks ? (
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-accent/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">{t('profile.stats.totalTasks')}</p>
                  <p className="text-2xl font-bold">{statistics.total}</p>
                </div>
                <div className="p-4 bg-accent/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">{t('profile.stats.completed')}</p>
                  <p className="text-2xl font-bold">{statistics.completed}</p>
                </div>
                <div className="p-4 bg-accent/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">{t('profile.stats.todo')}</p>
                  <p className="text-2xl font-bold">{statistics.todo}</p>
                </div>
                <div className="p-4 bg-accent/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">{t('profile.stats.inProgress')}</p>
                  <p className="text-2xl font-bold">{statistics.inProgress}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
