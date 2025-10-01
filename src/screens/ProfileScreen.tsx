// src/screens/ProfileScreen.tsx
import React, { useState } from "react";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  updateProfile as fbUpdateProfile,
  updateEmail as fbUpdateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser,
} from "firebase/auth";

interface ProfileScreenProps {
  onBack: () => void;
  onShowSecurity: () => void;
}

export default function ProfileScreen({
  onBack,
  onShowSecurity,
}: ProfileScreenProps) {
  const { user, changePassword } = useAuth();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
    currentPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
    current: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // -------------------------------
  // Profile Update
  // -------------------------------
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!user) throw new Error("No user logged in");

      // ✅ Update displayName
      if (formData.displayName !== user.displayName) {
        await fbUpdateProfile(user as FirebaseUser, {
          displayName: formData.displayName,
        });
      }

      // ✅ Update email (reauth required)
      if (formData.email !== user.email) {
        if (!passwordData.currentPassword) {
          toast({
            title: "Error",
            description: "Please provide your current password to update email",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const credential = EmailAuthProvider.credential(
          user.email || "",
          passwordData.currentPassword
        );
        await reauthenticateWithCredential(user as FirebaseUser, credential);
        await fbUpdateEmail(user as FirebaseUser, formData.email);
      }

      // ⚠️ Phone update not implemented yet
      if (formData.phoneNumber !== user.phoneNumber) {
        console.log("⚠️ Phone number update not implemented yet");
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------
  // Password Change
  // -------------------------------
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(passwordData.newPassword);
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      setPasswordData({
        newPassword: "",
        confirmPassword: "",
        currentPassword: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------
  // Render
  // -------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Profile Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account information and security
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Info */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                Profile Information
              </h2>
              <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              {/* Display Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Display Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        displayName: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Current password for email update */}
              {isEditing && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Current Password (required for email update)
                  </label>
                  <div className="relative">
                    <Input
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      placeholder="Enter current password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          current: !prev.current,
                        }))
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.current ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phoneNumber: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>

              {isEditing && (
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Updating..." : "Update Profile"}
                </Button>
              )}
            </form>
          </Card>

          {/* Security */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Security
              </h2>
              <Button variant="outline" onClick={onShowSecurity}>
                Security Settings
              </Button>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              {/* New Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    placeholder="Enter new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        new: !prev.new,
                      }))
                    }
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Confirm new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        confirm: !prev.confirm,
                      }))
                    }
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !passwordData.newPassword}
                className="w-full"
              >
                {isLoading ? "Updating..." : "Change Password"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
