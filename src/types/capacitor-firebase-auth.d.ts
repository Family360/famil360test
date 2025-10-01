// src/types/capacitor-firebase-auth.d.ts

import type { SignInWithGoogleOptions as OriginalOptions } from "@capacitor-firebase/authentication";

declare module "@capacitor-firebase/authentication" {
  export interface SignInWithGoogleOptions extends OriginalOptions {
    /** Force usage of Chrome Custom Tabs on Android */
    useCustomTabs?: boolean;
  }
}
