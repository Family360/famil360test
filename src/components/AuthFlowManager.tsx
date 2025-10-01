// src/components/AuthFlowManager.tsx
import React, { useState } from 'react';
import WelcomeScreen from '@/screens/WelcomeScreen';
import LoginScreen from '@/screens/LoginScreen';
import SignupScreen from '@/screens/SignupScreen.tsx'; // Use @ alias with .tsx
import PasswordResetScreen from '@/screens/PasswordResetScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import SecuritySetup from '@/screens/SecuritySetup';

type AuthScreen = 'welcome' | 'login' | 'signup' | 'forgot-password' | 'profile' | 'security';

const AuthFlowManager = () => {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('welcome');

  const screens = {
    welcome: <WelcomeScreen onGetStarted={() => setCurrentScreen('login')} />,
    login: (
      <LoginScreen 
        onAuthSuccess={() => setCurrentScreen('profile')}
        onShowForgotPassword={() => setCurrentScreen('forgot-password')}
        onShowSignUp={() => setCurrentScreen('signup')}
        onBack={() => setCurrentScreen('welcome')}
      />
    ),
    signup: (
      <SignupScreen 
        onAuthSuccess={() => setCurrentScreen('security')} // Navigate to security after signup
        onShowLogin={() => setCurrentScreen('login')}
        onBack={() => setCurrentScreen('welcome')}
      />
    ),
    'forgot-password': (
      <PasswordResetScreen 
        onBack={() => setCurrentScreen('login')}
        onLogin={() => setCurrentScreen('login')}
      />
    ),
    profile: (
      <ProfileScreen 
        onBack={() => setCurrentScreen('login')}
        onShowSecurity={() => setCurrentScreen('security')}
      />
    ),
    security: (
      <SecuritySetup 
        onBack={() => setCurrentScreen('profile')}
        onNext={(securityData) => {
          console.log('Security setup completed:', securityData);
          setCurrentScreen('profile');
        }}
      />
    )
  };

  return screens[currentScreen] || screens.welcome;
};

export default AuthFlowManager;