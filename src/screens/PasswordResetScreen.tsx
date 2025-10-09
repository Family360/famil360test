
// src/screens/PasswordResetScreen.tsx
import React, { useState } from "react";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import languageService from "../services/languageService";
import { Network } from "@capacitor/network";
import { validateEmail } from "@/utils/securityUtils";
import { useAuth } from "@/hooks/useAuth"; // FIXED: Named import
import * as Sentry from "@sentry/react";
import { LocalLogger } from "@/utils/LocalLogger";

interface PasswordResetScreenProps {
  onBack: () => void;
  onLogin: () => void;
}

export default function PasswordResetScreen({ onBack, onLogin }: PasswordResetScreenProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const { toast } = useToast();
  const { resetPassword } = useAuth();
  const t = (key: string) => languageService.translate(key);

  const getEmailError = () => {
    if (!touched) return null;
    if (!email) return t("email_required");
    if (!validateEmail(email)) return t("invalid_email");
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    const emailError = getEmailError();
    if (emailError) {
      toast({
        title: t("error"),
        description: emailError,
        variant: "destructive",
      });
      return;
    }

    try {
      const { connected } = await Network.getStatus();
      if (!connected) {
        toast({
          title: t("error"),
          description: t("no_internet_auth"),
          variant: "destructive",
        });
        LocalLogger.log("Network disconnected on password reset attempt");
        return;
      }

      setIsLoading(true);
      await resetPassword(email);
      LocalLogger.log("Password reset email sent", { email });
    } catch (error: any) {
      Sentry.captureException(error, { tags: { component: "PasswordResetScreen", action: "reset_password" } });
      LocalLogger.error("Password reset error", error);

      let errorMessage = t("reset_password_failed");
      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = t("invalid_email");
          break;
        case "auth/user-not-found":
          errorMessage = t("user_not_found");
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
      setIsLoading(false);
    }
  };

  const emailError = getEmailError();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-pattern opacity-30"></div>
      <Card className="w-full max-w-md backdrop-blur-sm bg-card/80 border-border/50 shadow-xl">
        <div className="p-8">
          <button
            onClick={onBack}
            className="flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
            aria-label={t("back")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("back")}
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{t("reset_password")}</h1>
            <p className="text-muted-foreground">{t("enter_email_to_reset")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  onBlur={() => setTouched(true)}
                  placeholder={t("enter_email")}
                  className={`pl-10 ${emailError ? "border-destructive" : ""}`}
                  required
                  autoComplete="email"
                  disabled={isLoading}
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

            <Button
              type="submit"
              disabled={isLoading || !!emailError}
              className="w-full h-12 text-base font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("sending")}
                </>
              ) : (
                t("send_reset_link")
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {t("remembered_password")}
              <button
                onClick={onLogin}
                className="ml-2 text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {t("sign_in")}
              </button>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
