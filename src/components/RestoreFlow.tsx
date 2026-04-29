import { useState } from 'react';
import {
  Lock,
  FileKey,
  ArrowLeft,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { DomainPicker } from './DomainPicker';
import { decryptData } from '../utils/crypto';
import {
  restoreCookies,
  filterCookiesByDomains,
  type RestoreResult,
  type CookieRestoreDetail,
} from '../utils/cookies';
import { useDomainSelection } from '../hooks/useDomainSelection';

type RestoreStep = 'file' | 'preview';

export function RestoreFlow() {
  const [step, setStep] = useState<RestoreStep>('file');
  const [password, setPassword] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [restoreDetails, setRestoreDetails] = useState<CookieRestoreDetail[]>([]);
  const [showWarnings, setShowWarnings] = useState(false);

  const ds = useDomainSelection();

  const handleRestorePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !file) {
      setStatus('error');
      setMessage('Password and file are required');
      return;
    }

    try {
      setStatus('loading');
      setMessage('Reading and decrypting file...');
      const text = await file.text();
      const cookies = await decryptData(text, password, (current, total) => {
        setProgress({ current, total });
        setMessage(`Decrypting file... (${Math.round((current / total) * 100)}%)`);
      });

      ds.loadCookies(cookies);

      setStatus('idle');
      setMessage('');
      setStep('preview');
    } catch (err: unknown) {
      console.error(err);
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to decrypt. Check password.');
    }
  };

  const handleRestoreConfirm = async () => {
    const selectedDomains = new Set(ds.domainGroups.filter((g) => g.selected).map((g) => g.domain));
    const cookiesToRestore = filterCookiesByDomains(ds.allCookies, selectedDomains);

    if (cookiesToRestore.length === 0) {
      setStatus('error');
      setMessage('No cookies selected for restore');
      return;
    }

    try {
      setStatus('loading');
      setMessage(`Restoring ${cookiesToRestore.length} cookies...`);
      setRestoreDetails([]);
      setShowWarnings(false);

      const result: RestoreResult = await restoreCookies(cookiesToRestore, (current, total) => {
        setProgress({ current, total });
      });

      setRestoreDetails(result.details);
      setStatus('success');

      const parts: string[] = [];
      if (result.success > 0) parts.push(`✓ ${result.success} restored`);
      if (result.skipped > 0) parts.push(`⚠ ${result.skipped} skipped`);
      if (result.failed > 0) parts.push(`✗ ${result.failed} failed`);
      setMessage(parts.join(' · '));

      if (result.skipped > 0 || result.failed > 0) {
        setShowWarnings(true);
      }

      setPassword('');
      setStep('file');
      ds.reset();
      setFile(null);
    } catch (err: unknown) {
      console.error(err);
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Restore failed');
    }
  };

  const warningCount = restoreDetails.filter((d) => d.status !== 'success').length;

  return (
    <div className="space-y-4">
      {step === 'file' ? (
        <form onSubmit={handleRestorePreview} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="restore-file">Backup File</Label>
            <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-center hover:bg-muted/30 hover:border-primary/40 transition-all cursor-pointer relative">
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                <FileKey className="w-6 h-6 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">
                {file ? file.name : 'Click to select .cv or .ckz file'}
              </span>
              <input
                id="restore-file"
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".json,.ckz,.cv,.txt"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="restore-password">Decryption Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="restore-password"
                type="password"
                placeholder="Enter password"
                className="pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={status === 'loading'}>
            {status === 'loading' ? 'Decrypting...' : 'Next: Select Domains'}
          </Button>

          {status === 'loading' && progress.total > 0 && (
            <div
              className="w-full bg-secondary h-2 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round((progress.current / progress.total) * 100)}
              aria-label="Decryption progress"
            >
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          )}
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('file')}
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
            onClick={handleRestoreConfirm}
            disabled={status === 'loading' || ds.selectedCount === 0}
          >
            {status === 'loading' ? 'Restoring...' : `Restore ${ds.totalCookiesSelected} Cookies`}
          </Button>

          {status === 'loading' && progress.total > 0 && (
            <div
              className="w-full bg-secondary h-2 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round((progress.current / progress.total) * 100)}
              aria-label="Restore progress"
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

      {/* Collapsible Warnings Panel */}
      {restoreDetails.length > 0 && warningCount > 0 && (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <button
            onClick={() => setShowWarnings(!showWarnings)}
            aria-expanded={showWarnings}
            aria-controls="warnings-panel"
            className="w-full flex items-center justify-between p-3 bg-secondary/50 hover:bg-secondary/70 transition-colors text-sm font-medium touch-target"
          >
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              {warningCount} cookie{warningCount > 1 ? 's' : ''} need attention
            </span>
            {showWarnings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showWarnings && (
            <div id="warnings-panel" className="max-h-48 overflow-y-auto divide-y divide-border">
              {restoreDetails
                .filter((d) => d.status !== 'success')
                .map((detail, idx) => (
                  <div
                    key={`${detail.domain}-${detail.name}-${idx}`}
                    className="p-3 flex items-start gap-3 text-xs"
                  >
                    {detail.status === 'skipped' ? (
                      <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{detail.name}</p>
                      <p className="text-muted-foreground truncate">{detail.domain}</p>
                      {detail.reason && (
                        <p className="text-muted-foreground mt-1">{detail.reason}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {restoreDetails.length > 0 && status === 'success' && warningCount === 0 && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
          <CheckCircle className="w-4 h-4" />
          All {restoreDetails.length} cookies restored successfully!
        </div>
      )}
    </div>
  );
}
