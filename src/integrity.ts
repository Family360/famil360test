import { registerPlugin } from '@capacitor/core';  // Now resolves after npm i @capacitor/core

export interface IntegrityPlugin {
  checkIntegrity(): Promise<{ isSafe: boolean }>;
}

export const IntegrityPlugin = registerPlugin<IntegrityPlugin>('IntegrityPlugin');