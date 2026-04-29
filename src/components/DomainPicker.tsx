import { Search, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Checkbox } from './ui/Checkbox';
import type { DomainSelection } from '../hooks/useDomainSelection';
import { useMemo } from 'react';

interface DomainPickerProps {
  groups: DomainSelection[];
  onToggleDomain: (domain: string) => void;
  onToggleCookie: (domain: string, cookieName: string, cookiePath: string) => void;
  onToggleExpand: (domain: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  searchQuery: string;
  onSearch: (query: string) => void;
  selectedCount: number;
  totalCookiesSelected: number;
  totalDomains: number;
  totalCookies: number;
}

export function DomainPicker({
  groups,
  onToggleDomain,
  onToggleCookie,
  onToggleExpand,
  onSelectAll,
  onDeselectAll,
  searchQuery,
  onSearch,
  selectedCount,
  totalCookiesSelected,
  totalDomains,
  totalCookies,
}: DomainPickerProps) {
  const filteredDomains = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const query = searchQuery.toLowerCase();
    return groups.filter((g) => g.domain.toLowerCase().includes(query));
  }, [groups, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
          {selectedCount}/{totalDomains} domains · {totalCookiesSelected}/{totalCookies} cookies
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="text"
          placeholder="Search domains..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      {/* Select All / Deselect All */}
      <div className="flex gap-2">
        <Button type="button" variant="secondary" className="flex-1 text-xs" onClick={onSelectAll}>
          <CheckSquare className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
          Select All
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="flex-1 text-xs"
          onClick={onDeselectAll}
        >
          <Square className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
          Deselect All
        </Button>
      </div>

      {/* Domain List */}
      <div className="max-h-64 overflow-y-auto border border-border rounded-xl divide-y divide-border bg-card">
        {filteredDomains.map((group) => {
          const domainSelectedCount = group.cookies.filter((c) => c.selected).length;
          const allSelected = domainSelectedCount === group.cookies.length;
          const someSelected = domainSelectedCount > 0 && !allSelected;

          return (
            <div key={group.domain} className="divide-y divide-border">
              {/* Domain Row */}
              <div
                className={`flex items-center gap-3 p-3 transition-colors ${
                  allSelected ? 'bg-primary/5' : 'hover:bg-muted/50'
                }`}
              >
                <Checkbox
                  checked={allSelected}
                  onChange={() => onToggleDomain(group.domain)}
                  id={`domain-${group.domain}`}
                  aria-label={group.domain}
                />
                <button
                  type="button"
                  onClick={() => onToggleExpand(group.domain)}
                  className="flex-1 flex items-center gap-2 text-left touch-target"
                  aria-expanded={group.expanded}
                  aria-controls={`cookies-${group.domain}`}
                >
                  <span
                    className={`flex-1 text-sm truncate ${
                      someSelected || allSelected ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {group.domain}
                  </span>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {domainSelectedCount}/{group.cookies.length}
                  </span>
                  {group.expanded ? (
                    <ChevronUp
                      className="w-4 h-4 text-muted-foreground flex-shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <ChevronDown
                      className="w-4 h-4 text-muted-foreground flex-shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </div>

              {/* Cookie Rows */}
              {group.expanded && (
                <div id={`cookies-${group.domain}`} className="bg-muted/30">
                  {group.cookies.map((c) => (
                    <label
                      key={`${c.cookie.name}-${c.cookie.path}`}
                      className={`flex items-center gap-3 px-3 py-2 pl-10 cursor-pointer transition-colors hover:bg-muted/50 ${
                        c.selected ? 'bg-primary/[0.03]' : ''
                      }`}
                    >
                      <Checkbox
                        checked={c.selected}
                        onChange={() => onToggleCookie(group.domain, c.cookie.name, c.cookie.path)}
                        id={`cookie-${group.domain}-${c.cookie.name}-${c.cookie.path}`}
                        aria-label={`${c.cookie.name} ${c.cookie.path}`}
                      />
                      <span
                        className={`flex-1 text-sm truncate ${
                          c.selected ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {c.cookie.name}
                      </span>
                      <span className="text-xs text-muted-foreground">{c.cookie.path}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {filteredDomains.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No domains match your search
          </div>
        )}
      </div>
    </div>
  );
}
