import { Search, CheckSquare, Square } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Checkbox } from './ui/Checkbox';
import type { DomainGroup } from '../utils/cookies';
import { useMemo } from 'react';

interface DomainPickerProps {
  groups: DomainGroup[];
  onToggle: (domain: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  searchQuery: string;
  onSearch: (query: string) => void;
  selectedCount: number;
  totalCookiesSelected: number;
}

export function DomainPicker({
  groups,
  onToggle,
  onSelectAll,
  onDeselectAll,
  searchQuery,
  onSearch,
  selectedCount,
  totalCookiesSelected,
}: DomainPickerProps) {
  const filteredDomains = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const query = searchQuery.toLowerCase();
    return groups.filter((g) => g.domain.toLowerCase().includes(query));
  }, [groups, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div /> {/* Spacer for flex alignment if needed, or remove */}
        <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full ml-auto">
          {selectedCount}/{groups.length} domains · {totalCookiesSelected} cookies
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
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
          <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
          Select All
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="flex-1 text-xs"
          onClick={onDeselectAll}
        >
          <Square className="w-3.5 h-3.5 mr-1.5" />
          Deselect All
        </Button>
      </div>

      {/* Domain List */}
      <div className="max-h-52 overflow-y-auto border border-border rounded-xl divide-y divide-border bg-card">
        {filteredDomains.map((group) => (
          <label
            key={group.domain}
            className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
              group.selected ? 'bg-primary/5' : 'hover:bg-muted/50'
            }`}
          >
            <Checkbox checked={group.selected} onChange={() => onToggle(group.domain)} />
            <span
              className={`flex-1 text-sm truncate ${
                group.selected ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {group.domain}
            </span>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {group.cookies.length}
            </span>
          </label>
        ))}
        {filteredDomains.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No domains match your search
          </div>
        )}
      </div>
    </div>
  );
}
