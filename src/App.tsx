import { useState } from 'react'
import { Shield, Download, Upload, Lock, FileKey } from 'lucide-react'
import { Button } from './components/ui/Button'
import { Input } from './components/ui/Input'
import { Label } from './components/ui/Label'
import { encryptData, decryptData, type Cookie } from './utils/crypto'
import { getAllCookies, restoreCookies } from './utils/cookies'

type Tab = 'backup' | 'restore'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('backup')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [file, setFile] = useState<File | null>(null)

  const handleBackup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      setStatus('error')
      setMessage('Password is required')
      return
    }

    try {
      setStatus('loading')
      setMessage('Fetching cookies...')

      const cookies = await getAllCookies()

      setMessage(`Encrypting ${cookies.length} cookies...`)
      const blob = await encryptData(cookies, password)

      // Download
      const url = URL.createObjectURL(blob)
      const d = new Date()
      const timestamp = d.toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const filename = `cookies-${timestamp}.cv` // .cv = cookie vault

      // Chrome API download or anchor tag
      if (chrome.downloads) {
        await chrome.downloads.download({
          url: url,
          filename: filename,
          saveAs: true
        })
      } else {
        // Fallback for dev environment
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
      }

      setStatus('success')
      setMessage(`Successfully backed up ${cookies.length} cookies!`)
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message || 'Backup failed')
    }
  }

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || !file) {
      setStatus('error')
      setMessage('Password and file are required')
      return
    }

    try {
      setStatus('loading')
      setMessage('Reading file...')
      const text = await file.text()

      setMessage('Decrypting...')
      const cookies: Cookie[] = await decryptData(text, password)

      setMessage(`Restoring ${cookies.length} cookies...`)
      const result = await restoreCookies(cookies, (current, total) => {
        setProgress({ current, total })
      })

      setStatus('success')
      setMessage(`Restored: ${result.success}, Failed: ${result.failed}`)
    } catch (err: any) {
      console.error(err)
      setStatus('error')
      setMessage(err.message || 'Restore failed. Check password or file format.')
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <header className="mb-8 text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Cookie Vault</h1>
        <p className="text-sm text-muted-foreground">Secure your session data</p>
      </header>

      <div className="flex p-1 mb-6 bg-secondary/50 rounded-lg">
        <button
          onClick={() => { setActiveTab('backup'); setStatus('idle'); setMessage('') }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'backup'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <Download className="w-4 h-4" />
          Backup
        </button>
        <button
          onClick={() => { setActiveTab('restore'); setStatus('idle'); setMessage('') }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'restore'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <Upload className="w-4 h-4" />
          Restore
        </button>
      </div>

      <div className="space-y-6">
        {activeTab === 'backup' ? (
          <form onSubmit={handleBackup} className="space-y-4">
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
              <p className="text-xs text-muted-foreground">
                This password will be required to restore your cookies.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Encrypting...' : 'Backup Cookies'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRestore} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="restore-file">Backup File</Label>
              <div className="border border-input border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                <FileKey className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {file ? file.name : "Click to select .cv or .ckz file"}
                </span>
                <input
                  id="restore-file"
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept=".json,.ckz,.cv,.txt" // .cv is our new extension
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

            <Button
              type="submit"
              className="w-full"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Restoring...' : 'Restore Cookies'}
            </Button>

            {status === 'loading' && progress.total > 0 && (
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            )}
          </form>
        )}

        {message && (
          <div className={`p-4 rounded-md text-sm ${status === 'error' ? 'bg-destructive/15 text-destructive' :
            status === 'success' ? 'bg-green-500/15 text-green-500' :
              'bg-secondary text-secondary-foreground'
            }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
