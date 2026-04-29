import { useState, useMemo, useCallback } from 'react';
import type { Cookie } from '../utils/crypto';
import type { DomainGroup } from '../utils/cookies';
import { groupCookiesByDomain } from '../utils/cookies';

export function useDomainSelection() {
  const [allCookies, setAllCookies] = useState<Cookie[]>([]);
  const [domainGroups, setDomainGroups] = useState<DomainGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCount = useMemo(
    () => domainGroups.filter((g) => g.selected).length,
    [domainGroups]
  );

  const totalCookiesSelected = useMemo(
    () => domainGroups.filter((g) => g.selected).reduce((sum, g) => sum + g.cookies.length, 0),
    [domainGroups]
  );

  const toggleDomain = useCallback((domain: string) => {
    setDomainGroups((prev) =>
      prev.map((g) => (g.domain === domain ? { ...g, selected: !g.selected } : g))
    );
  }, []);

  const selectAll = useCallback(() => {
    setDomainGroups((prev) => prev.map((g) => ({ ...g, selected: true })));
  }, []);

  const deselectAll = useCallback(() => {
    setDomainGroups((prev) => prev.map((g) => ({ ...g, selected: false })));
  }, []);

  const loadCookies = useCallback((cookies: Cookie[]) => {
    setAllCookies(cookies);
    setDomainGroups(groupCookiesByDomain(cookies));
    setSearchQuery('');
  }, []);

  const reset = useCallback(() => {
    setAllCookies([]);
    setDomainGroups([]);
    setSearchQuery('');
  }, []);

  return {
    allCookies,
    domainGroups,
    searchQuery,
    selectedCount,
    totalCookiesSelected,
    toggleDomain,
    selectAll,
    deselectAll,
    setSearchQuery,
    loadCookies,
    reset,
  };
}
