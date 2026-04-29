/**
 * Google Drive API client for Cookie Vault.
 *
 * Uploads, downloads, and lists encrypted .cv backup files.
 */

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

export interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/**
 * List Cookie Vault backup files in the app-created folder.
 */
export async function listDriveFiles(token: string): Promise<DriveFile[]> {
  const q = encodeURIComponent(
    "mimeType!='application/vnd.google-apps.folder' and name contains '.cv' and trashed=false"
  );
  const res = await fetch(
    `${DRIVE_API_BASE}/files?q=${q}&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime desc`,
    {
      headers: authHeaders(token),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive list failed: ${err}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Upload a Blob to Google Drive.
 * If a file with the same name exists, it creates a new version.
 */
export async function uploadToDrive(token: string, filename: string, blob: Blob): Promise<string> {
  const metadata = { name: filename, mimeType: blob.type || 'application/octet-stream' };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const res = await fetch(`${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`, {
    method: 'POST',
    headers: authHeaders(token),
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive upload failed: ${err}`);
  }

  const data = await res.json();
  return data.id;
}

/**
 * Download a file from Google Drive.
 */
export async function downloadFromDrive(token: string, fileId: string): Promise<Blob> {
  const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive download failed: ${err}`);
  }

  return res.blob();
}

/**
 * Delete a file from Google Drive.
 */
export async function deleteDriveFile(token: string, fileId: string): Promise<void> {
  const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive delete failed: ${err}`);
  }
}
