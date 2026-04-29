import { useState, useEffect, useCallback } from 'react';
import {
  Cloud,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  KeyRound,
  HardDrive,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Checkbox } from './ui/Checkbox';
import browser from 'webextension-polyfill';
import { getSettings, setSettings, clearCloudToken, type VaultSettings } from '../utils/storage';
import { authorizeGoogleDrive, authorizeDropbox } from '../utils/cloud-sync/oauth';
import { listDriveFiles } from '../utils/cloud-sync/google-drive';
import { listDropboxFiles } from '../utils/cloud-sync/dropbox';

type CloudStatus = 'idle' | 'loading' | 'connected' | 'error';

export function SettingsTab() {
  const [settings, setLocalSettings] = useState<VaultSettings | null>(null);
  const [googleClientId, setGoogleClientId] = useState('');
  const [dropboxClientId, setDropboxClientId] = useState('');
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('idle');
  const [cloudError, setCloudError] = useState('');
  const [backupCount, setBackupCount] = useState(0);
  const [message, setMessage] = useState('');
  const [statusType, setStatusType] = useState<'idle' | 'success' | 'error'>('idle');

  const loadSettings = useCallback(async () => {
    const s = await getSettings();
    setLocalSettings(s);
    setGoogleClientId(s.googleDriveToken ? '***' : '');
    setDropboxClientId(s.dropboxToken ? '***' : '');
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setStatusType(type);
    setTimeout(() => setStatusType('idle'), 3000);
  };

  const handleConnectGoogleDrive = async () => {
    if (!googleClientId || googleClientId === '***') {
      showMessage('Enter your Google OAuth Client ID', 'error');
      return;
    }
    setCloudStatus('loading');
    setCloudError('');
    try {
      await authorizeGoogleDrive(googleClientId.trim());
      const files = await listDriveFiles((await getSettings()).googleDriveToken!);
      setBackupCount(files.length);
      setCloudStatus('connected');
      await loadSettings();
      showMessage('Google Drive connected successfully', 'success');
    } catch (err) {
      setCloudStatus('error');
      setCloudError(err instanceof Error ? err.message : 'Connection failed');
      showMessage('Google Drive connection failed', 'error');
    }
  };

  const handleConnectDropbox = async () => {
    if (!dropboxClientId || dropboxClientId === '***') {
      showMessage('Enter your Dropbox App Key', 'error');
      return;
    }
    setCloudStatus('loading');
    setCloudError('');
    try {
      await authorizeDropbox(dropboxClientId.trim());
      const files = await listDropboxFiles((await getSettings()).dropboxToken!);
      setBackupCount(files.length);
      setCloudStatus('connected');
      await loadSettings();
      showMessage('Dropbox connected successfully', 'success');
    } catch (err) {
      setCloudStatus('error');
      setCloudError(err instanceof Error ? err.message : 'Connection failed');
      showMessage('Dropbox connection failed', 'error');
    }
  };

  const handleDisconnect = async () => {
    const provider = settings?.cloudProvider;
    if (!provider) return;
    await clearCloudToken(provider);
    await loadSettings();
    setCloudStatus('idle');
    setBackupCount(0);
    showMessage('Cloud provider disconnected', 'success');
  };

  const ALARM_NAME = 'cookie-vault-auto-backup';

  const handleToggleAutoBackup = async (enabled: boolean) => {
    await setSettings({ autoBackupEnabled: enabled });
    await loadSettings();
    if (enabled) {
      const freq = settings?.autoBackupFrequency || 'daily';
      const periodInMinutes = freq === 'daily' ? 24 * 60 : 7 * 24 * 60;
      await browser.alarms.create(ALARM_NAME, { periodInMinutes });
      showMessage('Auto-backup enabled', 'success');
    } else {
      await browser.alarms.clear(ALARM_NAME);
      showMessage('Auto-backup disabled', 'success');
    }
  };

  const handleSetAutoBackupPassword = async (password: string) => {
    await setSettings({ autoBackupPassword: password || null });
    await loadSettings();
    showMessage('Auto-backup password updated', 'success');
  };

  const handleSetFrequency = async (frequency: 'daily' | 'weekly') => {
    await setSettings({ autoBackupFrequency: frequency });
    await loadSettings();
    if (settings?.autoBackupEnabled) {
      const periodInMinutes = frequency === 'daily' ? 24 * 60 : 7 * 24 * 60;
      await browser.alarms.create(ALARM_NAME, { periodInMinutes });
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cloud Sync Section */}
      <div className="border border-border rounded-xl p-4 space-y-4 bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
            <Cloud className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-sm">Cloud Sync</h3>
            <p className="text-xs text-muted-foreground">
              Upload encrypted backups to Google Drive or Dropbox
            </p>
          </div>
        </div>

        {settings.cloudProvider ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="capitalize">
                {settings.cloudProvider.replace('-', ' ')} connected
              </span>
              {backupCount > 0 && (
                <span className="text-xs text-muted-foreground">({backupCount} backups)</span>
              )}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleDisconnect}>
              <XCircle className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Google Drive */}
            <div className="space-y-2">
              <Label htmlFor="google-client-id">Google Drive OAuth Client ID</Label>
              <div className="flex gap-2">
                <Input
                  id="google-client-id"
                  type="text"
                  placeholder="Enter your Client ID"
                  value={googleClientId}
                  onChange={(e) => setGoogleClientId(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleConnectGoogleDrive}
                  disabled={cloudStatus === 'loading'}
                >
                  {cloudStatus === 'loading' ? 'Connecting...' : 'Connect'}
                </Button>
              </div>
            </div>

            {/* Dropbox */}
            <div className="space-y-2">
              <Label htmlFor="dropbox-client-id">Dropbox App Key</Label>
              <div className="flex gap-2">
                <Input
                  id="dropbox-client-id"
                  type="text"
                  placeholder="Enter your App Key"
                  value={dropboxClientId}
                  onChange={(e) => setDropboxClientId(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleConnectDropbox}
                  disabled={cloudStatus === 'loading'}
                >
                  {cloudStatus === 'loading' ? 'Connecting...' : 'Connect'}
                </Button>
              </div>
            </div>

            {cloudStatus === 'error' && cloudError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
                {cloudError}
              </div>
            )}

            <div className="bg-secondary/50 rounded-xl p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                OAuth Setup Required
              </p>
              <p>
                Create an OAuth app in{' '}
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Google Cloud Console
                </a>{' '}
                or{' '}
                <a
                  href="https://www.dropbox.com/developers/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Dropbox App Console
                </a>{' '}
                and add your extension's redirect URL.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Auto-Backup Section */}
      <div className="border border-border rounded-xl p-4 space-y-4 bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-sm">Auto-Backup</h3>
            <p className="text-xs text-muted-foreground">Schedule automatic encrypted backups</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            checked={settings.autoBackupEnabled}
            onChange={() => handleToggleAutoBackup(!settings.autoBackupEnabled)}
            id="auto-backup-toggle"
          />
          <Label htmlFor="auto-backup-toggle" className="text-sm cursor-pointer">
            Enable automatic backups
          </Label>
        </div>

        {settings.autoBackupEnabled && (
          <div className="space-y-4 pl-8">
            <div className="space-y-2">
              <Label htmlFor="auto-backup-password">Backup Password</Label>
              <div className="flex gap-2">
                <Input
                  id="auto-backup-password"
                  type="password"
                  placeholder="Enter password for auto-backup encryption"
                  defaultValue={settings.autoBackupPassword || ''}
                  onBlur={(e) => handleSetAutoBackupPassword(e.target.value)}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Password is stored locally in browser storage for unattended backups
              </p>
            </div>

            <div className="space-y-2">
              <Label>Backup Frequency</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={settings.autoBackupFrequency === 'daily' ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => handleSetFrequency('daily')}
                >
                  Daily
                </Button>
                <Button
                  type="button"
                  variant={settings.autoBackupFrequency === 'weekly' ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => handleSetFrequency('weekly')}
                >
                  Weekly
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                checked={settings.autoBackupCloudEnabled}
                onChange={() =>
                  setSettings({ autoBackupCloudEnabled: !settings.autoBackupCloudEnabled }).then(
                    loadSettings
                  )
                }
                id="auto-backup-cloud-toggle"
              />
              <Label htmlFor="auto-backup-cloud-toggle" className="text-sm cursor-pointer">
                Upload auto-backups to cloud
              </Label>
            </div>

            {!settings.cloudProvider && settings.autoBackupCloudEnabled && (
              <p className="text-xs text-destructive">
                Connect a cloud provider above to enable cloud uploads
              </p>
            )}
          </div>
        )}
      </div>

      {/* Storage Info */}
      <div className="border border-border rounded-xl p-4 space-y-3 bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
            <HardDrive className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-sm">Local Storage</h3>
            <p className="text-xs text-muted-foreground">Settings and tokens are stored locally</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={async () => {
            await browser.storage.local.clear();
            await loadSettings();
            showMessage('All local data cleared', 'success');
          }}
        >
          Clear All Local Data
        </Button>
      </div>

      {/* Status Message */}
      {statusType !== 'idle' && message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium ${
            statusType === 'error'
              ? 'bg-destructive/10 text-destructive border border-destructive/20'
              : 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
