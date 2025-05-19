import { useState } from "react";
import { useAuth } from "@/hooks/useAuth.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast.ts";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from 'react-i18next';

/**
 * RegisterForm component for user registration.
 * It includes fields for name, email, and password, along with password visibility toggle.
 * Handles form submission, calls the registration API, and provides user feedback via toasts.
 */
export default function RegisterForm() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  /**
   * Handles the registration form submission.
   * Prevents default form submission, sets loading state, calls the register function,
   * and navigates to the home page on success or shows an error toast on failure.
   * @param {React.FormEvent} e - The form event.
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await register(email, password, name);
      toast({
        title: t('auth.toast.registrationSuccess.title'),
        description: t('auth.toast.registrationSuccess.description'),
      });
      navigate("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('auth.toast.registrationFailed.title'),
        description: t('auth.toast.registrationFailed.descriptionDefault'),
      });
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-2xl text-center font-bold mb-6">{t('auth.register.title')}</h2>
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t('auth.register.nameLabel')}</Label>
          <Input
            id="name"
            placeholder={t('auth.register.namePlaceholder')}
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            required
            autoComplete="name"
            className="border-gray-600 focus:border-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t('auth.register.emailLabel')}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t('auth.register.emailPlaceholder')}
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="border-gray-600 focus:border-primary"
          />
        </div>
        <div className="space-y-2 relative">
          <Label htmlFor="password">{t('auth.register.passwordLabel')}</Label>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
            // Tailwind class for padding-right to accommodate the toggle button
            className="pr-10 border-gray-600 focus:border-primary"
            autoComplete="new-password"
          />
          {/* Button to toggle password visibility */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-7 h-7 w-7 text-muted-foreground hover:text-primary"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <span className="sr-only">
              {showPassword ? t('auth.register.hidePassword') : t('auth.register.showPassword')}
            </span>
          </Button>
        </div>
        <div className="pt-2">
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white"
            disabled={isLoading}
          >
          {isLoading ? t('auth.register.submitButtonLoading') : t('auth.register.submitButton')}
        </Button>
        </div>
      </form>
    </>
  );
}
