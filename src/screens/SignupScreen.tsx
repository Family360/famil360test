import React, { useState } from "react";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Lock, Mail, ArrowLeft, User, Loader2 } from "lucide-react";
import languageService from "../services/languageService";
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

interface SignupScreenProps {
  onAuthSuccess: () => void;
  onShowLogin: () => void;
  onBack: () => void;
}

export default function SignupScreen({
  onAuthSuccess,
  onShowLogin,
  onBack,
}: SignupScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { signUp, authInitialized } = useAuth();

  const t = (key: string) => languageService.translate(key);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { connected } = await Network.getStatus();
    if (!connected) {
      toast({
        title: t("error"),
        description: t("no_internet_auth"),
        variant: "destructive",
      });
      return;
    }

    if (!email || !password || !confirmPassword) {
      toast({
        title: t("error"),
        description: t("fill_all_fields"),
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: t("error"),
        description: t("passwords_not_match"),
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: t("error"),
        description: t("password_too_short"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const user = await signUp(email, password);
      if (!user) {
        throw new Error("Signup failed: No user returned");
      }

      // Handle email verification based on platform
      if (Capacitor.isNativePlatform()) {
        // Use Capacitor Firebase Authentication plugin
        await FirebaseAuthentication.sendEmailVerification();
      } else {
        // Use Firebase JS SDK for web
        const { getAuth, sendEmailVerification } = await import("firebase/auth");
        const auth = getAuth();
        const firebaseUser = auth.currentUser;
        if (firebaseUser) {
          await sendEmailVerification(firebaseUser);
        } else {
          throw new Error("No Firebase user found after signup");
        }
      }

      // Success toast
      toast({
        title: t("account_created"),
        description: t("account_created_verify_email"),
        className: "bg-gradient-to-r from-green-400 to-teal-500 text-white shadow-lg rounded-lg",
      });
      onAuthSuccess();
    } catch (error: any) {
      let errorMessage = t("signup_failed");
      if (error.code === "auth/email-already-in-use") {
        errorMessage = t("email_already_in_use");
      } else if (error.code === "auth/invalid-email") {
        errorMessage = t("invalid_email");
      } else if (error.code === "auth/weak-password") {
        errorMessage = t("weak_password");
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = t("network_error");
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
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {t("create_account")}
            </h1>
            <p className="text-muted-foreground">{t("sign_up_account")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("email")}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("enter_email")}
                  className="pl-10"
                  required
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("password")}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("enter_password")}
                  className="pl-10 pr-10"
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? t("hide_password") : t("show_password")}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("confirm_password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("confirm_password")}
                  className="pl-10 pr-10"
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirmPassword ? t("hide_password") : t("show_password")}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("signing_up")}
                </>
              ) : (
                t("sign_up")
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {t("already_have_account")}
              <button
                onClick={onShowLogin}
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