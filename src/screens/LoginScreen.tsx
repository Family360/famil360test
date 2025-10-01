import React, { useState } from "react";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Lock, Mail, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import languageService from "../services/languageService";
import { Network } from "@capacitor/network";
import { validateEmail, sanitizeInput } from "@/utils/securityUtils";
import * as Sentry from "@sentry/react";

interface LoginScreenProps {
  onAuthSuccess: () => void;
  onShowForgotPassword: () => void;
  onShowSignUp: () => void;
  onBack: () => void;
}

type LoginMethod = "email" | "google" | null;

export default function LoginScreen({
  onAuthSuccess,
  onShowForgotPassword,
  onShowSignUp,
  onBack,
}: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState<LoginMethod>(null);
  const [touchedFields, setTouchedFields] = useState({
    email: false,
    password: false,
  });
  const { toast } = useToast();
  const { login, googleSignIn, authInitialized } = useAuth();

  const t = (key: string) => languageService.translate(key);

  const getEmailError = () => {
    if (!touchedFields.email) return null;
    if (!email) return t("email_required");
    if (!validateEmail(email)) return t("invalid_email");
    return null;
  };

  const getPasswordError = () => {
    if (!touchedFields.password) return null;
    if (!password) return t("password_required");
    if (password.length < 6) return t("password_too_short");
    return null;
  };

  const isFormValid = () => {
    return validateEmail(email) && password.length >= 6;
  };

  const handleFieldBlur = (field: keyof typeof touchedFields) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedFields({ email: true, password: true });

    const { connected } = await Network.getStatus();
    if (!connected) {
      toast({
        title: t("error"),
        description: t("no_internet_auth"),
        variant: "destructive",
      });
      return;
    }

    if (!isFormValid()) {
      toast({
        title: t("error"),
        description: t("please_correct_errors"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading("email");
    try {
      const sanitizedEmail = sanitizeInput(email);
      const sanitizedPassword = sanitizeInput(password);
      const user = await login(sanitizedEmail, sanitizedPassword);
      if (!user) {
        throw new Error("Login failed: No user returned");
      }
      if (!user.emailVerified) {
        toast({
          title: t("verify_email"),
          description: t("please_verify_email"),
          variant: "destructive",
        });
        return;
      }

      toast({
        title: t("success"),
        description: t("welcome_back"),
      });
      onAuthSuccess();
    } catch (error: any) {
      Sentry.captureException(error, { tags: { component: "LoginScreen", action: "email_login" } });
      let errorMessage = t("login_failed");
      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = t("invalid_email");
          break;
        case "auth/wrong-password":
          errorMessage = t("wrong_password");
          break;
        case "auth/user-not-found":
          errorMessage = t("user_not_found");
          break;
        case "auth/too-many-requests":
          errorMessage = t("too_many_attempts");
          break;
        case "auth/network-request-failed":
          errorMessage = t("network_error");
          break;
      }

      toast({
        title: t("error"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    const { connected } = await Network.getStatus();
    if (!connected) {
      toast({
        title: t("error"),
        description: t("no_internet_auth"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading("google");
    try {
      Sentry.captureMessage("Initiating Google Sign-In", { level: "info", tags: { component: "LoginScreen", action: "google_signin" } });
      const user = await googleSignIn();
      if (!user) {
        throw new Error("Google sign-in failed: No user returned");
      }
      if (!user.emailVerified) {
        toast({
          title: t("verify_email"),
          description: t("google_email_not_verified"),
          variant: "destructive",
        });
        return;
      }

      toast({
        title: t("success"),
        description: t("logged_in_google"),
      });
      onAuthSuccess();
    } catch (error: any) {
      Sentry.captureException(error, { tags: { component: "LoginScreen", action: "google_signin" } });
      let errorMessage = t("google_login_failed");
      switch (error.code) {
        case "auth/popup-closed-by-user":
          errorMessage = t("popup_closed");
          break;
        case "auth/popup-blocked":
          errorMessage = t("popup_blocked");
          break;
        case "auth/network-request-failed":
          errorMessage = t("network_error");
          break;
        case "auth/invalid-credential":
          errorMessage = t("google_invalid_credential");
          break;
        default:
          if (error.message?.includes("plugin_not_installed")) {
            errorMessage = t("google_signin_not_installed");
          } else if (error.message?.includes("12501")) {
            errorMessage = t("google_play_services_missing");
          } else if (error.message?.includes("12500")) {
            errorMessage = t("google_play_services_update_required");
          }
      }

      toast({
        title: t("error"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  if (!authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto text-primary mb-4" size={32} />
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  const emailError = getEmailError();
  const passwordError = getPasswordError();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-pattern opacity-30"></div>
      <Card className="w-full max-w-md backdrop-blur-sm bg-card/80 border-border/50 shadow-xl relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full shadow-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">
                {isLoading === "email" ? t("signing_in") : t("signing_in_google")}
              </span>
            </div>
          </div>
        )}

        <div className="p-8">
          <button
            onClick={onBack}
            disabled={!!isLoading}
            className="flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t("back")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("back")}
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{t("welcome_back")}</h1>
            <p className="text-muted-foreground">{t("sign_in_account")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                {t("email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleFieldBlur("email")}
                  placeholder={t("enter_email")}
                  className={`pl-10 ${emailError ? "border-destructive" : ""}`}
                  required
                  autoComplete="email"
                  disabled={!!isLoading}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "email-error" : undefined}
                />
              </div>
              {emailError && (
                <p id="email-error" className="text-sm text-destructive" role="alert">
                  {emailError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                {t("password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleFieldBlur("password")}
                  placeholder={t("enter_password")}
                  className={`pl-10 pr-10 ${passwordError ? "border-destructive" : ""}`}
                  required
                  autoComplete="current-password"
                  disabled={!!isLoading}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  disabled={!!isLoading}
                  aria-label={showPassword ? t("hide_password") : t("show_password")}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p id="password-error" className="text-sm text-destructive" role="alert">
                  {passwordError}
                </p>
              )}
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={onShowForgotPassword}
                className="text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!!isLoading}
              >
                {t("forgot_password")}
              </button>
            </div>

            <Button
              type="submit"
              disabled={!!isLoading || !isFormValid()}
              className="w-full h-12 text-base font-medium"
            >
              {isLoading === "email" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("signing_in")}
                </>
              ) : (
                t("sign_in")
              )}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">
                  {t("or_continue_with")}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={!!isLoading}
              className="w-full"
            >
              {isLoading === "google" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("signing_in_google")}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {t("continue_with_google")}
                </>
              )}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {t("no_account")}
              <button
                onClick={onShowSignUp}
                className="ml-2 text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!!isLoading}
              >
                {t("sign_up")}
              </button>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}