import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadBlob } from './downloadBlob';

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
    const { default: browser } = await import('webextension-polyfill');
    const downloadMock = vi.fn().mockResolvedValue(1);
    (browser as any).downloads = { download: downloadMock };

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
    const { default: browser } = await import('webextension-polyfill');
    (browser as any).downloads = undefined;

    const clickMock = vi.fn();
    const originalCreateElement = document.createElement;
    document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'a') {
        return { click: clickMock, href: '', download: '' } as any;
      }
      return originalCreateElement.call(document, tagName);
    }) as any;

    const blob = new Blob(['test']);
    await downloadBlob(blob, 'file.txt');

    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickMock).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');

    document.createElement = originalCreateElement;
  });

  it('should revoke object URL even if browser.downloads throws', async () => {
    const { default: browser } = await import('webextension-polyfill');
    const downloadMock = vi.fn().mockRejectedValue(new Error('Download failed'));
    (browser as any).downloads = { download: downloadMock };

    const blob = new Blob(['test']);
    await expect(downloadBlob(blob, 'file.txt')).rejects.toThrow('Download failed');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });
});
