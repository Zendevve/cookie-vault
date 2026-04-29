import { useState } from 'react';
import { Lock, ArrowLeft } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { PasswordStrengthMeter } from './ui/PasswordStrengthMeter';
import { DomainPicker } from './DomainPicker';
import { encryptData } from '../utils/crypto';
import { getAllCookies, filterCookiesByDomains } from '../utils/cookies';
import { downloadBlob } from '../utils/downloadBlob';
import { useDomainSelection } from '../hooks/useDomainSelection';

type BackupStep = 'password' | 'preview';

export function BackupFlow() {
  const [step, setStep] = useState<BackupStep>('password');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const ds = useDomainSelection();

  const handleBackupPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setStatus('error');
      setMessage('Password is required');
      return;
    }

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match');
      return;
    }

    try {
      setStatus('loading');
      setMessage('Fetching cookies...');

      const cookies = await getAllCookies();
      ds.loadCookies(cookies);

      setStatus('idle');
      setMessage('');
      setStep('preview');
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to fetch cookies');
    }
  };

  const handleBackupConfirm = async () => {
    const selectedDomains = new Set(ds.domainGroups.filter((g) => g.selected).map((g) => g.domain));
    const cookiesToBackup = filterCookiesByDomains(ds.allCookies, selectedDomains);

    if (cookiesToBackup.length === 0) {
      setStatus('error');
      setMessage('No cookies selected for backup');
      return;
    }

    try {
      setStatus('loading');
      setMessage(`Encrypting ${cookiesToBackup.length} cookies...`);

      const blob = await encryptData(cookiesToBackup, password, (current, total) => {
        setProgress({ current, total });
        setMessage(
          `Encrypting ${cookiesToBackup.length} cookies... (${Math.round((current / total) * 100)}%)`
        );
      });

      const d = new Date();
      const timestamp = d.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `cookies-${timestamp}.cv`;
      await downloadBlob(blob, filename);

      setStatus('success');
      setMessage(
        `Successfully backed up ${cookiesToBackup.length} cookies from ${ds.selectedCount} domains!`
      );
      setPassword('');
      setConfirmPassword('');
      setStep('password');
      ds.reset();
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Backup failed');
    }
  };

  return (
    <div className="space-y-4">
      {step === 'password' ? (
        <form onSubmit={handleBackupPreview} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backup-password">Encryption Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="backup-password"
                type="password"
                placeholder="Enter a strong password"
                className="pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <PasswordStrengthMeter password={password} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm your password"
                className="pl-9"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This password will be required to restore your cookies.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={status === 'loading'}>
            {status === 'loading' ? 'Loading...' : 'Next: Select Domains'}
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('password')}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors touch-target"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Back
            </button>
          </div>

          <DomainPicker
            groups={ds.domainGroups}
            onToggle={ds.toggleDomain}
            onSelectAll={ds.selectAll}
            onDeselectAll={ds.deselectAll}
            searchQuery={ds.searchQuery}
            onSearch={ds.setSearchQuery}
            selectedCount={ds.selectedCount}
            totalCookiesSelected={ds.totalCookiesSelected}
          />

          <Button
            type="button"
            className="w-full"
            onClick={handleBackupConfirm}
            disabled={status === 'loading' || ds.selectedCount === 0}
          >
            {status === 'loading' ? 'Encrypting...' : `Backup ${ds.totalCookiesSelected} Cookies`}
          </Button>

          {status === 'loading' && progress.total > 0 && (
            <div
              className="w-full bg-secondary h-2 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round((progress.current / progress.total) * 100)}
              aria-label="Encryption progress"
            >
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Status Message */}
      <div aria-live="polite" aria-atomic="true">
        {message && (
          <div
            className={`p-4 rounded-xl text-sm font-medium ${
              status === 'error'
                ? 'bg-destructive/10 text-destructive border border-destructive/20'
                : status === 'success'
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                  : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
