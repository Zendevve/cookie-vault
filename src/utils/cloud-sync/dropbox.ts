/**
 * Dropbox API client for Cookie Vault.
 *
 * Uploads, downloads, and lists encrypted .cv backup files.
 */

const DROPBOX_API_BASE = 'https://api.dropboxapi.com/2';
const DROPBOX_CONTENT_BASE = 'https://content.dropboxapi.com/2';
const VAULT_PATH = '/Cookie Vault Backups';

export interface DropboxFile {
  id: string;
  name: string;
  client_modified: string;
  size: number;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/**
 * List Cookie Vault backup files in the app folder.
 */
export async function listDropboxFiles(token: string): Promise<DropboxFile[]> {
  const res = await fetch(`${DROPBOX_API_BASE}/files/list_folder`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: VAULT_PATH }),
  });

  if (res.status === 409) {
    // Folder doesn't exist yet
    return [];
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Dropbox list failed: ${err}`);
  }

  const data = await res.json();
  return (data.entries || []).filter((e: any) => e['.tag'] === 'file' && e.name.endsWith('.cv'));
}

/**
 * Upload a Blob to Dropbox.
 */
export async function uploadToDropbox(token: string, filename: string, blob: Blob): Promise<void> {
  const path = `${VAULT_PATH}/${filename}`;

  const res = await fetch(`${DROPBOX_CONTENT_BASE}/files/upload`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({ path, mode: 'overwrite', autorename: true }),
    },
    body: blob,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Dropbox upload failed: ${err}`);
  }
}

/**
 * Download a file from Dropbox.
 */
export async function downloadFromDropbox(token: string, path: string): Promise<Blob> {
  const res = await fetch(`${DROPBOX_CONTENT_BASE}/files/download`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Dropbox-API-Arg': JSON.stringify({ path }),
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Dropbox download failed: ${err}`);
  }

  return res.blob();
}

/**
 * Delete a file from Dropbox.
 */
export async function deleteDropboxFile(token: string, path: string): Promise<void> {
  const res = await fetch(`${DROPBOX_API_BASE}/files/delete_v2`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Dropbox delete failed: ${err}`);
  }
}
