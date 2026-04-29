import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDomainSelection } from '../hooks/useDomainSelection';
import type { Cookie } from '../utils/crypto';

vi.mock('webextension-polyfill', () => ({
  default: {
    cookies: { getAll: vi.fn(), set: vi.fn() },
  },
}));

const mockCookies: Cookie[] = [
  {
    name: 'a',
    value: '1',
    domain: 'example.com',
    path: '/',
    secure: true,
    httpOnly: true,
    storeId: '0',
  },
  {
    name: 'b',
    value: '2',
    domain: 'example.com',
    path: '/',
    secure: true,
    httpOnly: true,
    storeId: '0',
  },
  {
    name: 'c',
    value: '3',
    domain: 'other.com',
    path: '/',
    secure: true,
    httpOnly: true,
    storeId: '0',
  },
];

describe('useDomainSelection', () => {
  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useDomainSelection());
    expect(result.current.domainSelections).toEqual([]);
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.totalCookiesSelected).toBe(0);
    expect(result.current.searchQuery).toBe('');
  });

  it('should load cookies and create domain selections', () => {
    const { result } = renderHook(() => useDomainSelection());
    act(() => {
      result.current.loadCookies(mockCookies);
    });

    expect(result.current.domainSelections).toHaveLength(2);
    expect(result.current.domainSelections[0].domain).toBe('example.com');
    expect(result.current.domainSelections[0].cookies).toHaveLength(2);
    expect(result.current.domainSelections[0].cookies[0].selected).toBe(true);
    expect(result.current.selectedCount).toBe(2);
    expect(result.current.totalCookiesSelected).toBe(3);
    expect(result.current.totalDomains).toBe(2);
    expect(result.current.totalCookies).toBe(3);
  });

  it('should toggle domain selection', () => {
    const { result } = renderHook(() => useDomainSelection());
    act(() => {
      result.current.loadCookies(mockCookies);
    });

    act(() => {
      result.current.toggleDomain('example.com');
    });

    expect(result.current.domainSelections[0].cookies.every((c) => !c.selected)).toBe(true);
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.totalCookiesSelected).toBe(1);

    act(() => {
      result.current.toggleDomain('example.com');
    });

    expect(result.current.domainSelections[0].cookies.every((c) => c.selected)).toBe(true);
    expect(result.current.selectedCount).toBe(2);
    expect(result.current.totalCookiesSelected).toBe(3);
  });

  it('should toggle individual cookie selection', () => {
    const { result } = renderHook(() => useDomainSelection());
    act(() => {
      result.current.loadCookies(mockCookies);
    });

    act(() => {
      result.current.toggleCookie('example.com', 'a', '/');
    });

    expect(result.current.domainSelections[0].cookies[0].selected).toBe(false);
    expect(result.current.domainSelections[0].cookies[1].selected).toBe(true);
    expect(result.current.totalCookiesSelected).toBe(2);
  });

  it('should expand and collapse domains', () => {
    const { result } = renderHook(() => useDomainSelection());
    act(() => {
      result.current.loadCookies(mockCookies);
    });

    act(() => {
      result.current.toggleExpand('example.com');
    });

    expect(result.current.domainSelections[0].expanded).toBe(true);

    act(() => {
      result.current.toggleExpand('example.com');
    });

    expect(result.current.domainSelections[0].expanded).toBe(false);
  });

  it('should get selected cookies', () => {
    const { result } = renderHook(() => useDomainSelection());
    act(() => {
      result.current.loadCookies(mockCookies);
    });

    act(() => {
      result.current.toggleCookie('example.com', 'a', '/');
    });

    const selected = result.current.getSelectedCookies();
    expect(selected).toHaveLength(2);
    expect(selected.map((c) => c.name)).toContain('b');
    expect(selected.map((c) => c.name)).toContain('c');
  });

  it('should select all and deselect all', () => {
    const { result } = renderHook(() => useDomainSelection());
    act(() => {
      result.current.loadCookies(mockCookies);
    });

    act(() => {
      result.current.deselectAll();
    });
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.totalCookiesSelected).toBe(0);

    act(() => {
      result.current.selectAll();
    });
    expect(result.current.selectedCount).toBe(2);
    expect(result.current.totalCookiesSelected).toBe(3);
  });

  it('should update search query', () => {
    const { result } = renderHook(() => useDomainSelection());
    act(() => {
      result.current.setSearchQuery('example');
    });
    expect(result.current.searchQuery).toBe('example');
  });

  it('should reset to empty state', () => {
    const { result } = renderHook(() => useDomainSelection());
    act(() => {
      result.current.loadCookies(mockCookies);
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.domainSelections).toEqual([]);
    expect(result.current.allCookies).toEqual([]);
    expect(result.current.searchQuery).toBe('');
  });
});
