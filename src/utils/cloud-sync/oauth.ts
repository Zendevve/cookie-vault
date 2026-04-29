import browser from 'webextension-polyfill';
import { getSettings, setSettings } from '../storage';

// ------------------------------------------------------------------
// PKCE helpers
// ------------------------------------------------------------------

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(digest));
}

function base64URLEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ------------------------------------------------------------------
// Google Drive OAuth
// ------------------------------------------------------------------

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export async function authorizeGoogleDrive(clientId: string): Promise<string> {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  const redirectURL = await browser.identity.getRedirectURL();

  const authUrl = new URL(GOOGLE_AUTH_ENDPOINT);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectURL);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', GOOGLE_SCOPE);
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');

  const responseUrl = await browser.identity.launchWebAuthFlow({
    url: authUrl.toString(),
    interactive: true,
  });

  const url = new URL(responseUrl);
  const code = url.searchParams.get('code');
  if (!code) {
    throw new Error('Google OAuth failed: no authorization code');
  }

  const tokenRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      code,
      redirect_uri: redirectURL,
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }

  const tokenData = await tokenRes.json();
  await setSettings({ googleDriveToken: tokenData.access_token, cloudProvider: 'google-drive' });
  return tokenData.access_token;
}

// ------------------------------------------------------------------
// Dropbox OAuth
// ------------------------------------------------------------------

const DROPBOX_AUTH_ENDPOINT = 'https://www.dropbox.com/oauth2/authorize';
const DROPBOX_TOKEN_ENDPOINT = 'https://api.dropboxapi.com/oauth2/token';
const DROPBOX_SCOPE = 'files.content.write files.content.read';

export async function authorizeDropbox(clientId: string): Promise<string> {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  const redirectURL = await browser.identity.getRedirectURL();

  const authUrl = new URL(DROPBOX_AUTH_ENDPOINT);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectURL);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', DROPBOX_SCOPE);
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('token_access_type', 'offline');

  const responseUrl = await browser.identity.launchWebAuthFlow({
    url: authUrl.toString(),
    interactive: true,
  });

  const url = new URL(responseUrl);
  const code = url.searchParams.get('code');
  if (!code) {
    throw new Error('Dropbox OAuth failed: no authorization code');
  }

  const tokenRes = await fetch(DROPBOX_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      code,
      redirect_uri: redirectURL,
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Dropbox token exchange failed: ${err}`);
  }

  const tokenData = await tokenRes.json();
  await setSettings({ dropboxToken: tokenData.access_token, cloudProvider: 'dropbox' });
  return tokenData.access_token;
}

// ------------------------------------------------------------------
// Token refresh / get valid token
// ------------------------------------------------------------------

export async function getGoogleDriveToken(): Promise<string | null> {
  const settings = await getSettings();
  return settings.googleDriveToken;
}

export async function getDropboxToken(): Promise<string | null> {
  const settings = await getSettings();
  return settings.dropboxToken;
}
