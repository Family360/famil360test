import React, { useState, useCallback, useEffect, useMemo } from "react";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, User, Phone, Mail, Lock, Eye, EyeOff, Shield, Loader } from "lucide-react";
import languageService from "../services/languageService";
import { useAuth } from "@/hooks/useAuth";
import { Preferences } from "@capacitor/preferences";
import { debounce } from "lodash";

interface ProfileSetupProps {
  onNext: (profileData: any) => void;
  onBack: () => void;
  initialData?: Partial<ProfileData>;
}

interface ProfileData {
  fullName: string;
  phoneNumber: string;
  email: string;
  securityQuestion: string;
  securityAnswer: string;
}

interface Errors {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  securityAnswer?: string;
  general?: string;
}

interface ValidationState {
  isValid: boolean;
  isTouched: boolean;
}

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What is your mother's maiden name?",
  "What was the name of your elementary school?",
  "What is your favorite book?",
  "What city were you born in?",
];

const PHONE_REGEX = /^[\d\s\-\+\(\)]{10,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

const ProfileSetup = ({ onNext, onBack, initialData }: ProfileSetupProps) => {
  const { toast } = useToast();
  const { user, authInitialized, updateProfileCompletion } = useAuth();
  const [formData, setFormData] = useState<ProfileData>({
    fullName: initialData?.fullName || user?.displayName || "",
    phoneNumber: initialData?.phoneNumber || user?.phoneNumber || "",
    email: initialData?.email || user?.email || "",
    securityQuestion: initialData?.securityQuestion || SECURITY_QUESTIONS[0],
    securityAnswer: initialData?.securityAnswer || "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSecurityAnswer, setShowSecurityAnswer] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>({ 
    isValid: false, 
    isTouched: false 
  });
  const [fieldTouched, setFieldTouched] = useState<Partial<Record<keyof Errors, boolean>>>({});

  const debouncedValidate = useMemo(
    () =>
      debounce((data: ProfileData, touched: boolean) => {
        const { isValid, newErrors } = validateFormData(data);
        setErrors(newErrors);
        setValidationState({ isValid, isTouched: touched });
      }, 300),
    []
  );

  const t = (key: string) => languageService.translate(key);

  const validateFormData = useCallback((data: ProfileData): { isValid: boolean; newErrors: Errors } => {
    const newErrors: Errors = {};

    if (!data.fullName.trim()) {
      newErrors.fullName = t("full_name_required");
    } else if (data.fullName.trim().length < 2) {
      newErrors.fullName = t("full_name_too_short");
    } else if (data.fullName.trim().length > 50) {
      newErrors.fullName = t("full_name_too_long");
    }

    if (!data.phoneNumber.trim()) {
      newErrors.phoneNumber = t("phone_required");
    } else if (!PHONE_REGEX.test(data.phoneNumber.replace(/\s/g, ""))) {
      newErrors.phoneNumber = t("invalid_phone_format");
    }

    if (data.email && !EMAIL_REGEX.test(data.email)) {
      newErrors.email = t("invalid_email_format");
    }

    if (!data.securityAnswer.trim()) {
      newErrors.securityAnswer = t("security_answer_required");
    } else if (data.securityAnswer.trim().length < 2) {
      newErrors.securityAnswer = t("security_answer_too_short");
    }

    return { isValid: Object.keys(newErrors).length === 0, newErrors };
  }, [t]);

  useEffect(() => {
    debouncedValidate(formData, validationState.isTouched);
    return () => {
      debouncedValidate.cancel();
    };
  }, [formData, debouncedValidate, validationState.isTouched]);

  useEffect(() => {
    try {
      localStorage.setItem('profileSetup_draft', JSON.stringify(formData));
    } catch (error) {
      console.warn('Could not save draft to localStorage:', error);
    }
  }, [formData]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      setValidationState(prev => ({ ...prev, isTouched: true }));
      const { isValid, newErrors } = validateFormData(formData);
      if (!isValid) {
        setErrors(newErrors);
        toast({
          title: t("validation_error"),
          description: t("please_fix_errors"),
          variant: "destructive",
        });
        return;
      }

      if (!user) {
        setErrors({ general: t("auth_required") });
        toast({
          title: t("auth_error"),
          description: t("please_sign_in_again"),
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      setErrors({});

      try {
        const sanitizedData = {
          ...formData,
          fullName: sanitizeInput(formData.fullName.trim()),
          phoneNumber: formData.phoneNumber.replace(/\s/g, ""),
          email: formData.email ? sanitizeInput(formData.email.trim()) : "",
          securityAnswer: sanitizeInput(formData.securityAnswer.trim()),
          profileComplete: true,
          updatedAt: new Date().toISOString(),
        };

        await Preferences.set({
          key: `user_profile_${user.uid}`,
          value: JSON.stringify(sanitizedData),
        });

        await updateProfileCompletion(true);
        localStorage.removeItem('profileSetup_draft');

        toast({
          title: t("profile_saved"),
          description: t("profile_updated_success"),
        });

        onNext(sanitizedData);
      } catch (error: any) {
        console.error("Profile save error:", error);
        let message = t("save_failed");
        if (error.code === 'unavailable' || !navigator.onLine) {
          message = t("offline_mode");
          localStorage.setItem('profileSetup_pending', JSON.stringify(formData));
        } else if (error.code === 'permission-denied') {
          message = t("permission_denied");
        } else if (error.code === 'already-exists') {
          message = t("profile_exists");
        }

        setErrors({ general: message });
        toast({
          title: t("error_occurred"),
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [formData, onNext, toast, t, validateFormData, user, updateProfileCompletion]
  );

  const handleChange = (field: keyof ProfileData, value: string) => {
    let sanitizedValue = sanitizeInput(value);
    if (field === 'fullName' && sanitizedValue.length > 50) {
      sanitizedValue = sanitizedValue.slice(0, 50);
    }
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    setFieldTouched(prev => ({ ...prev, [field]: true }));
  };

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\s+/g, ' ').trim();
    handleChange("phoneNumber", cleaned);
  };

  const handleBlur = (field: keyof ProfileData) => {
    setFieldTouched(prev => ({ ...prev, [field]: true }));
  };

  const getInputErrorClass = (field: keyof Errors) => {
    return fieldTouched[field] && errors[field] ? 'border-red-500 focus:border-red-500' : '';
  };

  if (!authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-[#1A1A2E] dark:via-[#16213E] dark:to-[#0F3460]">
        <div className="text-center">
          <Loader className="animate-spin mx-auto text-[#ff7043] mb-4" size={32} />
          <p className="text-gray-600 dark:text-gray-300">{t("loading")}</p>
        </div>
      </div>
    );
  }

  const canSubmit = validationState.isValid && !isLoading && authInitialized;

  return (
    <div className="min-h-screen flex flex-col justify-between px-4 py-6 bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-[#1A1A2E] dark:via-[#16213E] dark:to-[#0F3460]">
      <div className="flex-1 max-w-md mx-auto w-full">
        <div className="mb-6 sm:mb-8 text-center sm:text-left">
          <button
            onClick={onBack}
            className="flex items-center text-[#ff7043] mb-4 hover:text-[#ff8a5b] transition-colors p-2 rounded-lg hover:bg-[#ff7043]/10 focus:outline-none focus:ring-2 focus:ring-[#ff7043] focus:ring-offset-2"
            aria-label={t("go_back")}
          >
            <ArrowLeft size={20} className="mr-2" />
            {t("back")}
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            {t("tell_us_about_yourself")}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t("we_will_help_you_setup")}
          </p>
        </div>

        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{errors.general}</p>
          </div>
        )}

        <Card className="space-y-4 p-4 sm:p-6 glass-card">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <Input
                label={t("full_name")}
                value={formData.fullName}
                onChange={(value) => handleChange("fullName", value)}
                required
                icon={<User size={18} className="text-[#ff7043]" />}
                autoComplete="name"
                autoFocus
                className={getInputErrorClass("fullName")}
                aria-describedby={errors.fullName ? "fullName-error" : undefined}
              />
              <div className="flex justify-between mt-1">
                {errors.fullName ? (
                  <p id="fullName-error" className="text-red-500 text-xs" role="alert">
                    {errors.fullName}
                  </p>
                ) : (
                  <div />
                )}
                <span className="text-xs text-gray-500">
                  {formData.fullName.length}/50
                </span>
              </div>
            </div>

            <div>
              <Input
                label={t("phone_number")}
                value={formData.phoneNumber}
                onChange={handlePhoneChange}
                type="tel"
                required
                icon={<Phone size={18} className="text-[#ff7043]" />}
                autoComplete="tel"
                className={getInputErrorClass("phoneNumber")}
                placeholder="+1234567890"
                aria-describedby={errors.phoneNumber ? "phoneNumber-error" : undefined}
              />
              {errors.phoneNumber && (
                <p id="phoneNumber-error" className="text-red-500 text-xs mt-1" role="alert">
                  {errors.phoneNumber}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {t("phone_format_hint")}
              </p>
            </div>

            <div>
              <Input
                label={`${t("email")} (${t("optional")})`}
                value={formData.email}
                onChange={(value) => handleChange("email", value)}
                type="email"
                icon={<Mail size={18} className="text-[#ff7043]" />}
                autoComplete="email"
                className={getInputErrorClass("email")}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-red-500 text-xs mt-1" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="security-question"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                <Shield size={16} className="inline mr-2 text-[#ff7043]" />
                {t("security_question")}
              </label>
              <select
                id="security-question"
                value={formData.securityQuestion}
                onChange={(e) => handleChange("securityQuestion", e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ff7043] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                aria-describedby="security-question-help"
              >
                {SECURITY_QUESTIONS.map((q, i) => (
                  <option key={i} value={q}>
                    {q}
                  </option>
                ))}
              </select>
              <p id="security-question-help" className="text-xs text-gray-500 mt-1">
                {t("security_question_help")}
              </p>
            </div>

            <div className="relative">
              <Input
                label={t("security_answer")}
                value={formData.securityAnswer}
                onChange={(value) => handleChange("securityAnswer", value)}
                required
                icon={<Lock size={18} className="text-[#ff7043]" />}
                type={showSecurityAnswer ? "text" : "password"}
                autoComplete="off"
                className={getInputErrorClass("securityAnswer")}
                aria-describedby={errors.securityAnswer ? "securityAnswer-error" : undefined}
                placeholder={t("enter_your_answer")}
              />
              <button
                type="button"
                onClick={() => setShowSecurityAnswer(!showSecurityAnswer)}
                className="absolute right-3 top-[2.75rem] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                aria-label={showSecurityAnswer ? t("hide_answer") : t("show_answer")}
              >
                {showSecurityAnswer ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
              <div className="flex justify-between mt-1">
                {errors.securityAnswer ? (
                  <p id="securityAnswer-error" className="text-red-500 text-xs" role="alert">
                    {errors.securityAnswer}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    {t("security_answer_hint")}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={!canSubmit}
              className={`w-full bg-gradient-to-r from-[#ff7043] to-[#ff9f43] text-white mt-6 min-h-[48px] text-base sm:text-lg transition-all duration-200 ${
                !canSubmit
                  ? "opacity-50 cursor-not-allowed grayscale"
                  : "hover:from-[#ff8a5b] hover:to-[#ffb86c] transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#ff7043] focus:ring-offset-2"
              }`}
              aria-live="polite"
            >
              {isLoading ? (
                <>
                  <Loader className="animate-spin mr-2" size={18} />
                  {t("saving")}
                </>
              ) : (
                t("next")
              )}
            </Button>
          </form>
        </Card>
      </div>

      <div className="h-6 sm:h-8" />
      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .dark .glass-card {
          background: rgba(26, 26, 46, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        @media (max-width: 640px) {
          .glass-card {
            margin: 0 -0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfileSetup;