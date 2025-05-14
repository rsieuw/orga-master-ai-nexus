import { Task } from "@/types/task.ts";
import { Button } from "@/components/ui/button.tsx";
import { Edit, Trash2, X, MoreVertical } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog.tsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu.tsx";
import EditTaskDialog from "@/components/tasks/EditTaskDialog.tsx";
import { cn } from "@/lib/utils.ts";
import { TFunction } from "i18next";

interface TaskActionsProps {
  task: Task;
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (isOpen: boolean) => void;
  handleDelete: () => void;
  isInfoCollapsed?: boolean; // Optional, for mobile layout adjustments
  t: TFunction;
}

export default function TaskActions({
  task,
  isEditDialogOpen,
  setIsEditDialogOpen,
  handleDelete,
  isInfoCollapsed,
  t,
}: TaskActionsProps) {
  return (
    <div className="absolute top-3 right-[14px] z-20">
      <div className="hidden lg:flex gap-1">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Edit className="h-4 w-4" />
              <span className="sr-only">{t('taskDetail.editTaskSR')}</span>
            </Button>
          </DialogTrigger>
          <DialogPortal>
            <DialogOverlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <DialogContent className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 border bg-card/90 backdrop-blur-md border-white/10 p-6 shadow-lg sm:rounded-lg z-50 sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-2xl">{t('taskDetail.editTaskDialog.title')}</DialogTitle>
                <DialogDescription>
                  {t('taskDetail.editTaskDialog.description')}
                </DialogDescription>
              </DialogHeader>
              <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">{t('common.closeSR')}</span>
              </DialogClose>
              <EditTaskDialog task={task} setOpen={setIsEditDialogOpen} />
            </DialogContent>
          </DialogPortal>
        </Dialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80">
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">{t('taskDetail.deleteTaskSR')}</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogPortal>
            <AlertDialogOverlay className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm" />
            <AlertDialogContent className="bg-card/90 border border-white/5 z-[90]">
              <AlertDialogHeader>
                <AlertDialogTitle>{t('taskDetail.deleteTaskConfirmation.title')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('taskDetail.deleteTaskConfirmation.description')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-secondary/80 border-white/10">{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {t('common.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogPortal>
        </AlertDialog>
      </div>
      <div className="lg:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-7 w-7 transition-all duration-300 ease-in-out",
                isInfoCollapsed ? "mt-[0.2rem]" : "mt-[0.9rem]"
              )}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">{t('taskDetail.taskOptionsSR')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover/90 backdrop-blur-lg border border-white/10">
            <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              <span>{t('taskDetail.editTask')}</span>
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-sm focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                  <span>{t('taskDetail.deleteTask')}</span>
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogPortal>
                <AlertDialogOverlay className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <AlertDialogContent className="bg-card/90 backdrop-blur-md border-white/10 z-[90]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('taskDetail.deleteTaskConfirmation.title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('taskDetail.deleteTaskConfirmation.description')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-secondary/80 border-white/10">{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {t('common.delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialogPortal>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 