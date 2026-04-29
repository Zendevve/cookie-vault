import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDomainSelection } from '../hooks/useDomainSelection';
import type { Cookie } from './crypto';

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
    expect(result.current.domainGroups).toEqual([]);
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.totalCookiesSelected).toBe(0);
    expect(result.current.searchQuery).toBe('');
  });

  it('should load cookies and create domain groups', () => {
    const { result } = renderHook(() => useDomainSelection());
    act(() => {
      result.current.loadCookies(mockCookies);
    });

    expect(result.current.domainGroups).toHaveLength(2);
    expect(result.current.domainGroups[0].domain).toBe('example.com');
    expect(result.current.domainGroups[0].cookies).toHaveLength(2);
    expect(result.current.domainGroups[0].selected).toBe(true);
    expect(result.current.selectedCount).toBe(2);
    expect(result.current.totalCookiesSelected).toBe(3);
  });

  it('should toggle domain selection', () => {
    const { result } = renderHook(() => useDomainSelection());
    act(() => {
      result.current.loadCookies(mockCookies);
    });

    act(() => {
      result.current.toggleDomain('example.com');
    });

    expect(result.current.domainGroups[0].selected).toBe(false);
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.totalCookiesSelected).toBe(1);
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

    act(() => {
      result.current.selectAll();
    });
    expect(result.current.selectedCount).toBe(2);
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
    expect(result.current.domainGroups).toEqual([]);
    expect(result.current.allCookies).toEqual([]);
    expect(result.current.searchQuery).toBe('');
  });
});
