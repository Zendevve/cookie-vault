import { useState } from 'react';
import { Shield, Download, Upload, Share2 } from 'lucide-react';
import { BackupFlow } from './components/BackupFlow';
import { RestoreFlow } from './components/RestoreFlow';
import { ExportTab } from './components/ExportTab';
import { ErrorBoundary } from './components/ErrorBoundary';

type Tab = 'backup' | 'restore' | 'export';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('backup');
  // Local state for ExportTab status message, since it doesn't have internal complex state styling
  const [exportStatus, setExportStatus] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  const handleExportStatusChange = (
    status: 'idle' | 'loading' | 'success' | 'error',
    message: string
  ) => {
    setExportStatus({ status, message });
  };

  const resetState = () => {
    setExportStatus({ status: 'idle', message: '' });
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground p-6">
        {/* Header */}
        <header className="mb-6 text-center space-y-2">
          <div className="mx-auto w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/10">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Cookie Vault</h1>
          <p className="text-sm text-muted-foreground">Secure your session data</p>
        </header>

        {/* Tab Navigation */}
        <div
          className="flex p-1.5 mb-6 bg-secondary rounded-xl"
          role="tablist"
          aria-label="Cookie Vault actions"
        >
          <button
            role="tab"
            aria-selected={activeTab === 'backup'}
            aria-controls="backup-panel"
            id="backup-tab"
            onClick={() => {
              setActiveTab('backup');
              resetState();
            }}
            className={`tab-button ${
              activeTab === 'backup' ? 'tab-button-active' : 'tab-button-inactive'
            }`}
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Backup
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'restore'}
            aria-controls="restore-panel"
            id="restore-tab"
            onClick={() => {
              setActiveTab('restore');
              resetState();
            }}
            className={`tab-button ${
              activeTab === 'restore' ? 'tab-button-active' : 'tab-button-inactive'
            }`}
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            Restore
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'export'}
            aria-controls="export-panel"
            id="export-tab"
            onClick={() => {
              setActiveTab('export');
              resetState();
            }}
            className={`tab-button ${
              activeTab === 'export' ? 'tab-button-active' : 'tab-button-inactive'
            }`}
          >
            <Share2 className="w-4 h-4" aria-hidden="true" />
            Export
          </button>
        </div>

        {/* Content */}
        <div className="min-h-[300px]">
          <div
            role="tabpanel"
            id="backup-panel"
            aria-labelledby="backup-tab"
            hidden={activeTab !== 'backup'}
          >
            {activeTab === 'backup' && <BackupFlow />}
          </div>

          <div
            role="tabpanel"
            id="restore-panel"
            aria-labelledby="restore-tab"
            hidden={activeTab !== 'restore'}
          >
            {activeTab === 'restore' && <RestoreFlow />}
          </div>

          <div
            role="tabpanel"
            id="export-panel"
            aria-labelledby="export-tab"
            hidden={activeTab !== 'export'}
          >
            {activeTab === 'export' && (
              <div className="space-y-4">
                <ExportTab status={exportStatus.status} onStatusChange={handleExportStatusChange} />
                {exportStatus.message && (
                  <div
                    aria-live="polite"
                    className={`p-4 rounded-xl text-sm font-medium ${
                      exportStatus.status === 'error'
                        ? 'bg-destructive/10 text-destructive border border-destructive/20'
                        : exportStatus.status === 'success'
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                          : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {exportStatus.message}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[300px]">
          {activeTab === 'backup' && <BackupFlow />}

          {activeTab === 'restore' && <RestoreFlow />}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <ExportTab status={exportStatus.status} onStatusChange={handleExportStatusChange} />
              {exportStatus.message && (
                <div
                  className={`p-4 rounded-xl text-sm font-medium ${
                    exportStatus.status === 'error'
                      ? 'bg-destructive/10 text-destructive border border-destructive/20'
                      : exportStatus.status === 'success'
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                        : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {exportStatus.message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
