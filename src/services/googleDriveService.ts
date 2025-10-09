/*
  Google Drive Service (Frontend-only)
  - Uses Google Identity Services (GIS) for OAuth token
  - Uses Drive v3 REST API
  - Scope: drive.file (App-created files only)
*/

import { Capacitor } from '@capacitor/core';
import type { BackupData } from './backupService';

const GSI_SRC = 'https://accounts.google.com/gsi/client';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const TOKEN_STORAGE_KEY = 'gd_access_token';
const TOKEN_EXP_KEY = 'gd_access_token_exp';

let accessToken: string | null = null;

function getClientId(): string {
  const id = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  if (!id) throw new Error('VITE_GOOGLE_CLIENT_ID is not set');
  return id;
}

async function loadGsi(): Promise<void> {
  if ((window as any).google?.accounts?.oauth2) return;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = GSI_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(s);
  });
}

function getStoredToken(): string | null {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const expStr = localStorage.getItem(TOKEN_EXP_KEY);
    if (!token || !expStr) return null;
    const exp = parseInt(expStr, 10);
    if (Number.isFinite(exp) && Date.now() < exp - 5000) {
      return token;
    }
    return null;
  } catch {
    return null;
  }
}

function storeToken(token: string, expiresIn: number): void {
  accessToken = token;
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(TOKEN_EXP_KEY, String(Date.now() + expiresIn * 1000));
  } catch {}
}

async function ensureToken(interactive = true): Promise<string> {
  const cached = accessToken || getStoredToken();
  if (cached) return cached;

  await loadGsi();
  const clientId = getClientId();

  const token: string = await new Promise((resolve, reject) => {
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      prompt: interactive ? 'consent' : '',
      callback: (response: any) => {
        if (response && response.access_token) {
          // GIS doesn't return expires_in via token client reliably; default to 55 min
          storeToken(response.access_token, response.expires_in || 3300);
          resolve(response.access_token);
        } else {
          reject(new Error('Failed to get access token'));
        }
      },
      error_callback: (err: any) => reject(err),
    });
    client.requestAccessToken();
  });

  return token;
}

async function uploadMultipart(name: string, jsonContent: string): Promise<string> {
  const token = await ensureToken(true);

  const metadata = {
    name,
    mimeType: 'application/json',
  };

  const boundary = 'foo_bar_baz_' + Math.random().toString(36).slice(2);
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    jsonContent,
    `--${boundary}--`,
    '',
  ].join('\r\n');

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Drive upload failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.id as string;
}

async function listBackups(pageSize = 10): Promise<Array<{ id: string; name: string; modifiedTime: string }>> {
  const token = await ensureToken(false);
  const params = new URLSearchParams({
    pageSize: String(pageSize),
    fields: 'files(id,name,modifiedTime)',
    q: "mimeType='application/json' and name contains 'foodcart360_backup_'",
    orderBy: 'modifiedTime desc',
  });
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Drive list failed: ${res.status}`);
  const data = await res.json();
  return (data.files || []) as any;
}

async function downloadBackup(fileId: string): Promise<string> {
  const token = await ensureToken(false);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Drive download failed: ${res.status}`);
  return await res.text();
}

export const googleDriveService = {
  isSupported(): boolean {
    // Web only for now; native support can use Capacitor plugins in future
    return !Capacitor.isNativePlatform();
  },
  async uploadBackup(backup: BackupData): Promise<{ id: string; name: string }>
  {
    const name = `foodcart360_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
    const json = JSON.stringify(backup, null, 2);
    const id = await uploadMultipart(name, json);
    return { id, name };
  },
  async listBackups() {
    return await listBackups(25);
  },
  async downloadBackup(fileId: string): Promise<BackupData> {
    const text = await downloadBackup(fileId);
    return JSON.parse(text);
  },
  async ensureAuth(interactive = true) {
    await ensureToken(interactive);
  },
};

export default googleDriveService;
