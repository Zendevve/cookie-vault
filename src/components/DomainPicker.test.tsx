import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DomainPicker } from './DomainPicker';
import type { DomainSelection } from '../hooks/useDomainSelection';

const mockGroups: DomainSelection[] = [
  {
    domain: 'example.com',
    cookies: [
      {
        cookie: {
          name: 'a',
          value: '1',
          domain: 'example.com',
          path: '/',
          secure: true,
          httpOnly: true,
          storeId: '0',
        },
        selected: true,
      },
    ],
    expanded: false,
  },
  {
    domain: 'other.com',
    cookies: [
      {
        cookie: {
          name: 'b',
          value: '2',
          domain: 'other.com',
          path: '/',
          secure: true,
          httpOnly: true,
          storeId: '0',
        },
        selected: false,
      },
    ],
    expanded: false,
  },
];

describe('DomainPicker', () => {
  it('should render domain groups', () => {
    render(
      <DomainPicker
        groups={mockGroups}
        onToggleDomain={vi.fn()}
        onToggleCookie={vi.fn()}
        onToggleExpand={vi.fn()}
        onSelectAll={vi.fn()}
        onDeselectAll={vi.fn()}
        searchQuery=""
        onSearch={vi.fn()}
        selectedCount={1}
        totalCookiesSelected={1}
        totalDomains={2}
        totalCookies={2}
      />
    );

    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('other.com')).toBeInTheDocument();
  });

  it('should call onToggleDomain when a domain checkbox is clicked', () => {
    const onToggleDomain = vi.fn();
    render(
      <DomainPicker
        groups={mockGroups}
        onToggleDomain={onToggleDomain}
        onToggleCookie={vi.fn()}
        onToggleExpand={vi.fn()}
        onSelectAll={vi.fn()}
        onDeselectAll={vi.fn()}
        searchQuery=""
        onSearch={vi.fn()}
        selectedCount={1}
        totalCookiesSelected={1}
        totalDomains={2}
        totalCookies={2}
      />
    );

    const checkbox = screen.getByRole('checkbox', { name: /example\.com/i });
    fireEvent.click(checkbox);
    expect(onToggleDomain).toHaveBeenCalledWith('example.com');
  });

  it('should call onSearch when typing in search input', () => {
    const onSearch = vi.fn();
    render(
      <DomainPicker
        groups={mockGroups}
        onToggleDomain={vi.fn()}
        onToggleCookie={vi.fn()}
        onToggleExpand={vi.fn()}
        onSelectAll={vi.fn()}
        onDeselectAll={vi.fn()}
        searchQuery=""
        onSearch={onSearch}
        selectedCount={1}
        totalCookiesSelected={1}
        totalDomains={2}
        totalCookies={2}
      />
    );

    const input = screen.getByPlaceholderText('Search domains...');
    fireEvent.change(input, { target: { value: 'exam' } });
    expect(onSearch).toHaveBeenCalledWith('exam');
  });

  it('should filter domains based on search query', () => {
    render(
      <DomainPicker
        groups={mockGroups}
        onToggleDomain={vi.fn()}
        onToggleCookie={vi.fn()}
        onToggleExpand={vi.fn()}
        onSelectAll={vi.fn()}
        onDeselectAll={vi.fn()}
        searchQuery="other"
        onSearch={vi.fn()}
        selectedCount={0}
        totalCookiesSelected={0}
        totalDomains={2}
        totalCookies={2}
      />
    );

    expect(screen.queryByText('example.com')).not.toBeInTheDocument();
    expect(screen.getByText('other.com')).toBeInTheDocument();
  });

  it('should show empty state when no domains match', () => {
    render(
      <DomainPicker
        groups={mockGroups}
        onToggleDomain={vi.fn()}
        onToggleCookie={vi.fn()}
        onToggleExpand={vi.fn()}
        onSelectAll={vi.fn()}
        onDeselectAll={vi.fn()}
        searchQuery="nomatch"
        onSearch={vi.fn()}
        selectedCount={0}
        totalCookiesSelected={0}
        totalDomains={2}
        totalCookies={2}
      />
    );

    expect(screen.getByText('No domains match your search')).toBeInTheDocument();
  });

  it('should call onSelectAll and onDeselectAll', () => {
    const onSelectAll = vi.fn();
    const onDeselectAll = vi.fn();
    render(
      <DomainPicker
        groups={mockGroups}
        onToggleDomain={vi.fn()}
        onToggleCookie={vi.fn()}
        onToggleExpand={vi.fn()}
        onSelectAll={onSelectAll}
        onDeselectAll={onDeselectAll}
        searchQuery=""
        onSearch={vi.fn()}
        selectedCount={1}
        totalCookiesSelected={1}
        totalDomains={2}
        totalCookies={2}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Select All' }));
    expect(onSelectAll).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Deselect All' }));
    expect(onDeselectAll).toHaveBeenCalled();
  });
});
