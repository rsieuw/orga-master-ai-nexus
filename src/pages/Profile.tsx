import { useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout.tsx";
import { useAuth } from "@/hooks/useAuth.ts";
import { useTask } from "@/contexts/TaskContext.hooks.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Task } from "@/types/task.ts";
import { useTranslation } from "react-i18next";

/**
 * `Profile` page component displays user-specific information and task statistics.
 * It shows the user's name, email, account type (with a badge),
 * and provides a button to upgrade for free users.
 * It also displays task statistics: total tasks, completed, to-do, and in-progress.
 * Shows skeleton loaders while task data is being fetched.
 */
export default function Profile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tasks, isLoading: isLoadingTasks } = useTask();

  /**
   * Calculates task statistics based on the current tasks list.
   * This hook is memoized with `useMemo` to recompute only when the `tasks` array changes.
   * @returns {object} An object containing total, completed, todo, and inProgress task counts.
   *                   Returns zero for all counts if tasks are not yet loaded.
   */
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
                  <p className="text-sm text-muted-foreground">{t('profile.stats.in_progress')}</p>
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
