/**
 * Triggers a download for a Blob using chrome.downloads when available,
 * falling back to an anchor element click in non-extension environments.
 * Automatically revokes the object URL after the download is initiated.
 */
export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob);

  try {
    if (typeof chrome !== 'undefined' && chrome.downloads) {
      await chrome.downloads.download({
        url,
        filename,
        saveAs: true,
      });
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}
