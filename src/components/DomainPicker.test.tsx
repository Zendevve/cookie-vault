import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DomainPicker } from './DomainPicker';
import type { DomainGroup } from '../utils/cookies';

const mockGroups: DomainGroup[] = [
  {
    domain: 'example.com',
    cookies: [
      {
        name: 'a',
        value: '1',
        domain: 'example.com',
        path: '/',
        secure: true,
        httpOnly: true,
        storeId: '0',
      },
    ],
    selected: true,
  },
  {
    domain: 'other.com',
    cookies: [
      {
        name: 'b',
        value: '2',
        domain: 'other.com',
        path: '/',
        secure: true,
        httpOnly: true,
        storeId: '0',
      },
    ],
    selected: false,
  },
];

describe('DomainPicker', () => {
  it('should render domain groups', () => {
    render(
      <DomainPicker
        groups={mockGroups}
        onToggle={vi.fn()}
        onSelectAll={vi.fn()}
        onDeselectAll={vi.fn()}
        searchQuery=""
        onSearch={vi.fn()}
        selectedCount={1}
        totalCookiesSelected={1}
      />
    );

    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('other.com')).toBeInTheDocument();
  });

  it('should call onToggle when a domain is clicked', () => {
    const onToggle = vi.fn();
    render(
      <DomainPicker
        groups={mockGroups}
        onToggle={onToggle}
        onSelectAll={vi.fn()}
        onDeselectAll={vi.fn()}
        searchQuery=""
        onSearch={vi.fn()}
        selectedCount={1}
        totalCookiesSelected={1}
      />
    );

    const row = screen.getByText('example.com').closest('label');
    expect(row).toBeTruthy();
    fireEvent.click(row!);
    expect(onToggle).toHaveBeenCalledWith('example.com');
  });

  it('should call onSearch when typing in search input', () => {
    const onSearch = vi.fn();
    render(
      <DomainPicker
        groups={mockGroups}
        onToggle={vi.fn()}
        onSelectAll={vi.fn()}
        onDeselectAll={vi.fn()}
        searchQuery=""
        onSearch={onSearch}
        selectedCount={1}
        totalCookiesSelected={1}
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
        onToggle={vi.fn()}
        onSelectAll={vi.fn()}
        onDeselectAll={vi.fn()}
        searchQuery="other"
        onSearch={vi.fn()}
        selectedCount={0}
        totalCookiesSelected={0}
      />
    );

    expect(screen.queryByText('example.com')).not.toBeInTheDocument();
    expect(screen.getByText('other.com')).toBeInTheDocument();
  });

  it('should show empty state when no domains match', () => {
    render(
      <DomainPicker
        groups={mockGroups}
        onToggle={vi.fn()}
        onSelectAll={vi.fn()}
        onDeselectAll={vi.fn()}
        searchQuery="nomatch"
        onSearch={vi.fn()}
        selectedCount={0}
        totalCookiesSelected={0}
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
        onToggle={vi.fn()}
        onSelectAll={onSelectAll}
        onDeselectAll={onDeselectAll}
        searchQuery=""
        onSearch={vi.fn()}
        selectedCount={1}
        totalCookiesSelected={1}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Select All' }));
    expect(onSelectAll).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Deselect All' }));
    expect(onDeselectAll).toHaveBeenCalled();
  });
});
