import browser from 'webextension-polyfill';

export interface VaultSettings {
  autoBackupEnabled: boolean;
  autoBackupPassword: string | null;
  autoBackupFrequency: 'daily' | 'weekly';
  autoBackupCloudEnabled: boolean;
  cloudProvider: 'google-drive' | 'dropbox' | null;
  googleDriveToken: string | null;
  dropboxToken: string | null;
}

const DEFAULT_SETTINGS: VaultSettings = {
  autoBackupEnabled: false,
  autoBackupPassword: null,
  autoBackupFrequency: 'daily',
  autoBackupCloudEnabled: false,
  cloudProvider: null,
  googleDriveToken: null,
  dropboxToken: null,
};

const SETTINGS_KEY = 'cookie-vault-settings';

export async function getSettings(): Promise<VaultSettings> {
  const result = await browser.storage.local.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] || {}) };
}

export async function setSettings(settings: Partial<VaultSettings>): Promise<void> {
  const current = await getSettings();
  await browser.storage.local.set({
    [SETTINGS_KEY]: { ...current, ...settings },
  });
}

export async function clearCloudToken(provider: 'google-drive' | 'dropbox'): Promise<void> {
  const current = await getSettings();
  if (provider === 'google-drive') {
    await browser.storage.local.set({
      [SETTINGS_KEY]: { ...current, googleDriveToken: null, cloudProvider: null },
    });
  } else {
    await browser.storage.local.set({
      [SETTINGS_KEY]: { ...current, dropboxToken: null, cloudProvider: null },
    });
  }
}
