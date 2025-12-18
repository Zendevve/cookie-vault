import { useState, useMemo } from 'react';
import {
  Shield,
  Download,
  Upload,
  Lock,
  FileKey,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  CheckSquare,
  Square,
  ArrowLeft,
} from 'lucide-react';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Label } from './components/ui/Label';
import { encryptData, decryptData, type Cookie } from './utils/crypto';
import {
  getAllCookies,
  restoreCookies,
  groupCookiesByDomain,
  filterCookiesByDomains,
  type RestoreResult,
  type CookieRestoreDetail,
  type DomainGroup,
} from './utils/cookies';

type Tab = 'backup' | 'restore';
type BackupStep = 'password' | 'preview';
type RestoreStep = 'file' | 'preview';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('backup');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [file, setFile] = useState<File | null>(null);
  const [restoreDetails, setRestoreDetails] = useState<CookieRestoreDetail[]>([]);
  const [showWarnings, setShowWarnings] = useState(false);

  // Phase 3: Selective backup/restore state
  const [backupStep, setBackupStep] = useState<BackupStep>('password');
  const [restoreStep, setRestoreStep] = useState<RestoreStep>('file');
  const [domainGroups, setDomainGroups] = useState<DomainGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [allCookies, setAllCookies] = useState<Cookie[]>([]);

  // Filter domains based on search query
  const filteredDomains = useMemo(() => {
    if (!searchQuery.trim()) return domainGroups;
    const query = searchQuery.toLowerCase();
    return domainGroups.filter((g) => g.domain.toLowerCase().includes(query));
  }, [domainGroups, searchQuery]);

  const selectedCount = domainGroups.filter((g) => g.selected).length;
  const totalCookiesSelected = domainGroups
    .filter((g) => g.selected)
    .reduce((sum, g) => sum + g.cookies.length, 0);

  const toggleDomain = (domain: string) => {
    setDomainGroups((prev) =>
      prev.map((g) => (g.domain === domain ? { ...g, selected: !g.selected } : g))
    );
  };

  const selectAll = () => {
    setDomainGroups((prev) => prev.map((g) => ({ ...g, selected: true })));
  };

  const deselectAll = () => {
    setDomainGroups((prev) => prev.map((g) => ({ ...g, selected: false })));
  };

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
      setAllCookies(cookies);
      const groups = groupCookiesByDomain(cookies);
      setDomainGroups(groups);

      setStatus('idle');
      setMessage('');
      setBackupStep('preview');
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to fetch cookies');
    }
  };

  const handleBackupConfirm = async () => {
    const selectedDomains = new Set(domainGroups.filter((g) => g.selected).map((g) => g.domain));
    const cookiesToBackup = filterCookiesByDomains(allCookies, selectedDomains);

    if (cookiesToBackup.length === 0) {
      setStatus('error');
      setMessage('No cookies selected for backup');
      return;
    }

    try {
      setStatus('loading');
      setMessage(`Encrypting ${cookiesToBackup.length} cookies...`);

      const blob = await encryptData(cookiesToBackup, password);

      // Download
      const url = URL.createObjectURL(blob);
      const d = new Date();
      const timestamp = d.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `cookies-${timestamp}.cv`;

      if (chrome.downloads) {
        await chrome.downloads.download({
          url: url,
          filename: filename,
          saveAs: true,
        });
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
      }

      setStatus('success');
      setMessage(
        `Successfully backed up ${cookiesToBackup.length} cookies from ${selectedCount} domains!`
      );
      setPassword('');
      setConfirmPassword('');
      setBackupStep('password');
      setDomainGroups([]);
      setAllCookies([]);
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Backup failed');
    }
  };

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
      const cookies: Cookie[] = await decryptData(text, password);

      setAllCookies(cookies);
      const groups = groupCookiesByDomain(cookies);
      setDomainGroups(groups);

      setStatus('idle');
      setMessage('');
      setRestoreStep('preview');
    } catch (err: unknown) {
      console.error(err);
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to decrypt. Check password.');
    }
  };

  const handleRestoreConfirm = async () => {
    const selectedDomains = new Set(domainGroups.filter((g) => g.selected).map((g) => g.domain));
    const cookiesToRestore = filterCookiesByDomains(allCookies, selectedDomains);

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
      setRestoreStep('file');
      setDomainGroups([]);
      setAllCookies([]);
      setFile(null);
    } catch (err: unknown) {
      console.error(err);
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Restore failed');
    }
  };

  const resetState = () => {
    setStatus('idle');
    setMessage('');
    setRestoreDetails([]);
    setDomainGroups([]);
    setAllCookies([]);
    setSearchQuery('');
    setBackupStep('password');
    setRestoreStep('file');
  };

  const warningCount = restoreDetails.filter((d) => d.status !== 'success').length;

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <header className="mb-6 text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Cookie Vault</h1>
        <p className="text-sm text-muted-foreground">Secure your session data</p>
      </header>

      <div className="flex p-1 mb-6 bg-secondary/50 rounded-lg">
        <button
          onClick={() => {
            setActiveTab('backup');
            resetState();
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'backup'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Download className="w-4 h-4" />
          Backup
        </button>
        <button
          onClick={() => {
            setActiveTab('restore');
            resetState();
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'restore'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Upload className="w-4 h-4" />
          Restore
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === 'backup' ? (
          backupStep === 'password' ? (
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
            /* Backup Preview Step */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setBackupStep('password')}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <span className="text-xs text-muted-foreground">
                  {selectedCount} of {domainGroups.length} domains ({totalCookiesSelected} cookies)
                </span>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search domains..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Select All / Deselect All */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 text-xs"
                  onClick={selectAll}
                >
                  <CheckSquare className="w-3 h-3 mr-1" />
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 text-xs"
                  onClick={deselectAll}
                >
                  <Square className="w-3 h-3 mr-1" />
                  Deselect All
                </Button>
              </div>

              {/* Domain List */}
              <div className="max-h-48 overflow-y-auto border border-border rounded-md divide-y divide-border">
                {filteredDomains.map((group) => (
                  <label
                    key={group.domain}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={group.selected}
                      onChange={() => toggleDomain(group.domain)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="flex-1 text-sm truncate">{group.domain}</span>
                    <span className="text-xs text-muted-foreground">{group.cookies.length}</span>
                  </label>
                ))}
                {filteredDomains.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No domains match your search
                  </div>
                )}
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={handleBackupConfirm}
                disabled={status === 'loading' || selectedCount === 0}
              >
                {status === 'loading' ? 'Encrypting...' : `Backup ${totalCookiesSelected} Cookies`}
              </Button>
            </div>
          )
        ) : restoreStep === 'file' ? (
          <form onSubmit={handleRestorePreview} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="restore-file">Backup File</Label>
              <div className="border border-input border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                <FileKey className="w-8 h-8 text-muted-foreground" />
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
          </form>
        ) : (
          /* Restore Preview Step */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setRestoreStep('file')}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <span className="text-xs text-muted-foreground">
                {selectedCount} of {domainGroups.length} domains ({totalCookiesSelected} cookies)
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search domains..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Select All / Deselect All */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1 text-xs"
                onClick={selectAll}
              >
                <CheckSquare className="w-3 h-3 mr-1" />
                Select All
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1 text-xs"
                onClick={deselectAll}
              >
                <Square className="w-3 h-3 mr-1" />
                Deselect All
              </Button>
            </div>

            {/* Domain List */}
            <div className="max-h-48 overflow-y-auto border border-border rounded-md divide-y divide-border">
              {filteredDomains.map((group) => (
                <label
                  key={group.domain}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={group.selected}
                    onChange={() => toggleDomain(group.domain)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="flex-1 text-sm truncate">{group.domain}</span>
                  <span className="text-xs text-muted-foreground">{group.cookies.length}</span>
                </label>
              ))}
              {filteredDomains.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No domains match your search
                </div>
              )}
            </div>

            <Button
              type="button"
              className="w-full"
              onClick={handleRestoreConfirm}
              disabled={status === 'loading' || selectedCount === 0}
            >
              {status === 'loading' ? 'Restoring...' : `Restore ${totalCookiesSelected} Cookies`}
            </Button>

            {status === 'loading' && progress.total > 0 && (
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}

        {message && (
          <div
            className={`p-4 rounded-md text-sm ${
              status === 'error'
                ? 'bg-destructive/15 text-destructive'
                : status === 'success'
                  ? 'bg-green-500/15 text-green-500'
                  : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {message}
          </div>
        )}

        {/* Collapsible Warnings Panel */}
        {restoreDetails.length > 0 && warningCount > 0 && (
          <div className="border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setShowWarnings(!showWarnings)}
              className="w-full flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 transition-colors text-sm font-medium"
            >
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                {warningCount} cookie{warningCount > 1 ? 's' : ''} need attention
              </span>
              {showWarnings ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showWarnings && (
              <div className="max-h-48 overflow-y-auto divide-y divide-border">
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
          <div className="flex items-center gap-2 text-sm text-green-500">
            <CheckCircle className="w-4 h-4" />
            All {restoreDetails.length} cookies restored successfully!
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
