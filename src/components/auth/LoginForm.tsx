import { useState } from "react";
import { useAuth } from "@/hooks/useAuth.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast.ts";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * A login form component that handles user authentication.
 * 
 * This component provides a form with email and password inputs,
 * "remember me" functionality, password visibility toggle,
 * and links to the forgot password page.
 * It uses the authentication context to handle the login process.
 * 
 * @returns {JSX.Element} The login form component.
 */
export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  /**
   * Handles the login form submission.
   * 
   * This function prevents the default form submission behavior,
   * attempts to authenticate the user with the provided credentials,
   * displays appropriate toast notifications based on the result,
   * and navigates to the home page on successful login.
   * 
   * @param {React.FormEvent} e - The form submission event.
   * @returns {Promise<void>} A promise that resolves when the login process is complete.
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: t('auth.login.success.title'),
        description: t('auth.login.success.description'),
      });
      navigate("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('auth.login.error.title'),
        description: t('auth.login.error.description'),
      });
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">{t('auth.login.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.login.emailLabel')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('auth.login.emailPlaceholder')}
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2 relative">
            <Label htmlFor="password">{t('auth.login.passwordLabel')}</Label>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              className="pr-10"
              autoComplete="current-password"
            />
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
                {showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
              </span>
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                name="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked: boolean | 'indeterminate') => setRememberMe(Boolean(checked))}
              />
              <Label htmlFor="remember-me" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {t('auth.login.rememberMe')}
              </Label>
            </div>
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              {t('auth.login.forgotPassword')}
            </Link>
          </div>
          <Button
            type="submit"
            className="w-full mt-8 bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? t('auth.login.loading') : t('auth.login.submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
