import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import browser from 'webextension-polyfill';
import { downloadBlob } from './downloadBlob';

interface MockDownloads {
  download?: Mock;
}

interface MockBrowser {
  downloads?: MockDownloads;
}

vi.mock('webextension-polyfill', () => ({
  default: {
    downloads: { download: vi.fn() },
  },
}));

vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

describe('downloadBlob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use browser.downloads when available', async () => {
    const downloadMock = vi.fn().mockResolvedValue(1);
    (browser as unknown as MockBrowser).downloads = { download: downloadMock };

    const blob = new Blob(['test']);
    await downloadBlob(blob, 'file.txt');

    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(downloadMock).toHaveBeenCalledWith({
      url: 'blob:test',
      filename: 'file.txt',
      saveAs: true,
    });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });

  it('should fallback to anchor click when browser.downloads is unavailable', async () => {
    (browser as unknown as MockBrowser).downloads = undefined;

    const clickMock = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    const mockAnchor = {
      click: clickMock,
      href: '',
      download: '',
    } as unknown as HTMLAnchorElement;

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        return mockAnchor;
      }
      return originalCreateElement(tagName);
    });

    const blob = new Blob(['test']);
    await downloadBlob(blob, 'file.txt');

    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickMock).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');

    vi.restoreAllMocks();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  it('should revoke object URL even if browser.downloads throws', async () => {
    const downloadMock = vi.fn().mockRejectedValue(new Error('Download failed'));
    (browser as unknown as MockBrowser).downloads = { download: downloadMock };

    const blob = new Blob(['test']);
    await expect(downloadBlob(blob, 'file.txt')).rejects.toThrow('Download failed');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });
});
