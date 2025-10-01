import React, { useState } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import languageService from "../services/languageService";
import { Network } from '@capacitor/network';

interface PasswordResetScreenProps {
  onBack: () => void;
  onLogin: () => void;
}

export default function PasswordResetScreen({ onBack, onLogin }: PasswordResetScreenProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();
  const { resetPassword } = useAuth();

  const t = (key: string) => languageService.translate(key);

  const handleResetPassword = async (e: React.FormEvent) => {
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
    
    if (!email) {
      toast({
        title: t("error"),
        description: t("enter_email"),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(email);
      setEmailSent(true);
      toast({
        title: t("reset_email_sent"),
        description: t("check_email_reset")
      });
    } catch (error: any) {
      let errorMessage = t("reset_failed");
      if (error.code === "auth/invalid-email") {
        errorMessage = t("invalid_email");
      } else if (error.code === "auth/user-not-found") {
        errorMessage = t("user_not_found");
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = t("network_error");
      }
      toast({
        title: t("error"),
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md backdrop-blur-sm bg-card/80 border-border/50 shadow-xl">
          <div className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {t("check_email")}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t("reset_instructions_sent")} <strong>{email}</strong>
            </p>
            <Button onClick={onLogin} className="w-full">
              {t("back_to_login")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md backdrop-blur-sm bg-card/80 border-border/50 shadow-xl">
        <div className="p-8">
          <button
            onClick={onBack}
            className="flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("back_to_login")}
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {t("reset_password")}
            </h1>
            <p className="text-muted-foreground">
              {t("enter_email_reset")}
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-6">
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
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email}
              className="w-full h-12 text-base font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("sending")}
                </>
              ) : (
                t("send_reset_instructions")
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}