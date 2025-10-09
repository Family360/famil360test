
// src/screens/ProfileSetup.tsx
import React, { useState, useEffect } from "react";
import Card from "@/components/Card";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, User, Mail, Briefcase, Loader2 } from "lucide-react";
import languageService from "../services/languageService";
import { Preferences } from "@capacitor/preferences";
import { useAuth } from "@/hooks/useAuth";

interface ProfileSetupProps {
  onNext: (profileData: ProfileData) => void;
  onBack: () => void;
  initialData?: Partial<ProfileData>;
}

interface ProfileData {
  name: string;
  email: string;
  businessName: string;
}

interface Errors {
  name?: string;
  email?: string;
  businessName?: string;
}

const ProfileSetup = ({ onNext, onBack, initialData }: ProfileSetupProps) => {
  const { toast } = useToast();
  const { user, authInitialized, updateProfileCompletion } = useAuth();
  const [formData, setFormData] = useState<ProfileData>({
    name: initialData?.name || "",
    email: initialData?.email || "",
    businessName: initialData?.businessName || "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);

  const t = (key: string) => languageService.translate(key);

  useEffect(() => {
    if (user && user.email) {
      setFormData((prev) => ({ ...prev, email: user.email || "" })); // FIXED: Handle null with fallback
    }
  }, [user]);

  const validateForm = () => {
    const newErrors: Errors = {};
    if (!formData.name.trim()) newErrors.name = t("name_required");
    if (!formData.email.trim()) newErrors.email = t("email_required");
    if (!formData.businessName.trim()) newErrors.businessName = t("business_name_required");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      if (!user) throw new Error("No user logged in");
      await Preferences.set({
        key: `user_profile_${user.uid}`,
        value: JSON.stringify({ ...formData, profileComplete: true }),
      });
      await updateProfileCompletion();
      onNext(formData);
    } catch (error) {
      toast({
        title: t("error"),
        description: t("save_failed"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof ProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      <Card className="w-full max-w-md">
        <div className="p-8">
          <button onClick={onBack} className="flex items-center text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("back")}
          </button>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">{t("setup_profile")}</h1>
          </div>

          <form className="space-y-6">
            <Input
              label={t("name")}
              value={formData.name}
              onChange={(value) => handleChange("name", value)}
              icon={<User className="w-4 h-4" />}
              placeholder={t("enter_name")}
              error={errors.name}
            />
            <Input
              label={t("email")}
              value={formData.email}
              onChange={(value) => handleChange("email", value)}
              icon={<Mail className="w-4 h-4" />}
              placeholder={t("enter_email")}
              error={errors.email}
              disabled={true}
            />
            <Input
              label={t("business_name")}
              value={formData.businessName}
              onChange={(value) => handleChange("businessName", value)}
              icon={<Briefcase className="w-4 h-4" />}
              placeholder={t("enter_business_name")}
              error={errors.businessName}
            />
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : t("next")}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default ProfileSetup;
