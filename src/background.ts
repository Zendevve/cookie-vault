import browser from 'webextension-polyfill';
import { getSettings } from './utils/storage';
import { getAllCookies } from './utils/cookies';
import { encryptData } from './utils/crypto';
import { downloadBlob } from './utils/downloadBlob';
import { getGoogleDriveToken, getDropboxToken } from './utils/cloud-sync/oauth';
import { uploadToDrive } from './utils/cloud-sync/google-drive';
import { uploadToDropbox } from './utils/cloud-sync/dropbox';

const ALARM_NAME = 'cookie-vault-auto-backup';

// ------------------------------------------------------------------
// Alarm scheduling
// ------------------------------------------------------------------

export async function scheduleAutoBackup(frequency: 'daily' | 'weekly'): Promise<void> {
  const periodInMinutes = frequency === 'daily' ? 24 * 60 : 7 * 24 * 60;
  await browser.alarms.create(ALARM_NAME, { periodInMinutes });
}

export async function cancelAutoBackup(): Promise<void> {
  await browser.alarms.clear(ALARM_NAME);
}

// ------------------------------------------------------------------
// Alarm listener
// ------------------------------------------------------------------

browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;

  const settings = await getSettings();
  if (!settings.autoBackupEnabled || !settings.autoBackupPassword) {
    return;
  }

  try {
    const cookies = await getAllCookies();
    const blob = await encryptData(cookies, settings.autoBackupPassword);

    const d = new Date();
    const timestamp = d.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `cookies-auto-${timestamp}.cv`;

    // Always save locally
    await downloadBlob(blob, filename);

    // Upload to cloud if configured
    if (settings.autoBackupCloudEnabled && settings.cloudProvider) {
      if (settings.cloudProvider === 'google-drive') {
        const token = await getGoogleDriveToken();
        if (token) {
          await uploadToDrive(token, filename, blob);
        }
      } else if (settings.cloudProvider === 'dropbox') {
        const token = await getDropboxToken();
        if (token) {
          await uploadToDropbox(token, filename, blob);
        }
      }
    }
  } catch (err) {
    console.error('[Cookie Vault] Auto-backup failed:', err);
  }
});

// ------------------------------------------------------------------
// Re-schedule on startup if enabled
// ------------------------------------------------------------------

(async () => {
  const settings = await getSettings();
  if (settings.autoBackupEnabled) {
    await scheduleAutoBackup(settings.autoBackupFrequency);
  }
})();
