import { useState } from 'react';
import { Download, FileText, FileKey, Clipboard, CheckCheck } from 'lucide-react';
import { Button } from './ui/Button';
import { getAllCookies } from '../utils/cookies';
import { downloadNetscape } from '../utils/netscape';
import { downloadJDownloader, copyJDownloaderToClipboard } from '../utils/jdownloader';

interface ExportTabProps {
  onStatusChange: (status: 'idle' | 'loading' | 'success' | 'error', message: string) => void;
  status: 'idle' | 'loading' | 'success' | 'error';
}

export function ExportTab({ onStatusChange, status }: ExportTabProps) {
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const handleExportNetscape = async () => {
    try {
      onStatusChange('loading', 'Fetching cookies...');
      const cookies = await getAllCookies();
      await downloadNetscape(cookies, 'cookies.txt');
      onStatusChange('success', `Exported ${cookies.length} cookies for yt-dlp/wget/curl`);
    } catch (err) {
      onStatusChange('error', err instanceof Error ? err.message : 'Export failed');
    }
  };

  const handleExportJDownloader = async () => {
    try {
      onStatusChange('loading', 'Fetching cookies...');
      const cookies = await getAllCookies();
      await downloadJDownloader(cookies, 'cookies.json');
      onStatusChange('success', `Exported ${cookies.length} cookies for JDownloader`);
    } catch (err) {
      onStatusChange('error', err instanceof Error ? err.message : 'Export failed');
    }
  };

  const handleCopyJDownloader = async () => {
    try {
      onStatusChange('loading', 'Copying to clipboard...');
      const cookies = await getAllCookies();
      await copyJDownloaderToClipboard(cookies);

      setCopiedToClipboard(true);
      onStatusChange('success', `Copied ${cookies.length} cookies to clipboard`);

      // Reset clipboard feedback after 2 seconds
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      onStatusChange('error', err instanceof Error ? err.message : 'Copy failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">
          Export cookies for use with CLI tools like yt-dlp, wget, curl, and JDownloader.
        </p>
      </div>

      {/* yt-dlp / wget / curl Export */}
      <div className="border border-border rounded-xl p-4 space-y-3 bg-card">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm">Netscape Format</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              For yt-dlp, wget, curl, gallery-dl, aria2c
            </p>
          </div>
        </div>
        <Button
          type="button"
          className="w-full"
          onClick={handleExportNetscape}
          disabled={status === 'loading'}
        >
          <Download className="w-4 h-4 mr-2" />
          Download cookies.txt
        </Button>
      </div>

      {/* JDownloader Export */}
      <div className="border border-border rounded-xl p-4 space-y-3 bg-card">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
            <FileKey className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm">JDownloader Format</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              JSON format compatible with JDownloader 2
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={handleCopyJDownloader}
            disabled={status === 'loading'}
          >
            {copiedToClipboard ? (
              <>
                <CheckCheck className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Clipboard className="w-4 h-4 mr-2" />
                Copy
              </>
            )}
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={handleExportJDownloader}
            disabled={status === 'loading'}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-secondary/50 rounded-xl p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground mb-1">💡 Usage Tips</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>
            <code className="bg-secondary px-1 rounded">yt-dlp --cookies cookies.txt URL</code>
          </li>
          <li>
            <code className="bg-secondary px-1 rounded">wget --load-cookies cookies.txt URL</code>
          </li>
          <li>JDownloader: Paste JSON in Settings → Account Manager</li>
        </ul>
      </div>
    </div>
  );
}
