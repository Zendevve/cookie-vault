import { useState, useMemo, useCallback } from 'react';
import type { Cookie } from '../utils/crypto';
import { groupCookiesByDomain } from '../utils/cookies';

export interface CookieSelection {
  cookie: Cookie;
  selected: boolean;
}

export interface DomainSelection {
  domain: string;
  cookies: CookieSelection[];
  expanded: boolean;
}

function createDomainSelections(cookies: Cookie[]): DomainSelection[] {
  const groups = groupCookiesByDomain(cookies);
  return groups.map((g) => ({
    domain: g.domain,
    cookies: g.cookies.map((c) => ({ cookie: c, selected: true })),
    expanded: false,
  }));
}

export function useDomainSelection() {
  const [allCookies, setAllCookies] = useState<Cookie[]>([]);
  const [domainSelections, setDomainSelections] = useState<DomainSelection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCount = useMemo(
    () => domainSelections.filter((g) => g.cookies.some((c) => c.selected)).length,
    [domainSelections]
  );

  const totalCookiesSelected = useMemo(
    () => domainSelections.reduce((sum, g) => sum + g.cookies.filter((c) => c.selected).length, 0),
    [domainSelections]
  );

  const totalDomains = domainSelections.length;
  const totalCookies = useMemo(
    () => domainSelections.reduce((sum, g) => sum + g.cookies.length, 0),
    [domainSelections]
  );

  const toggleDomain = useCallback((domain: string) => {
    setDomainSelections((prev) =>
      prev.map((g) => {
        if (g.domain !== domain) return g;
        const allSelected = g.cookies.every((c) => c.selected);
        return {
          ...g,
          cookies: g.cookies.map((c) => ({ ...c, selected: !allSelected })),
        };
      })
    );
  }, []);

  const toggleCookie = useCallback((domain: string, cookieName: string, cookiePath: string) => {
    setDomainSelections((prev) =>
      prev.map((g) => {
        if (g.domain !== domain) return g;
        return {
          ...g,
          cookies: g.cookies.map((c) =>
            c.cookie.name === cookieName && c.cookie.path === cookiePath
              ? { ...c, selected: !c.selected }
              : c
          ),
        };
      })
    );
  }, []);

  const toggleExpand = useCallback((domain: string) => {
    setDomainSelections((prev) =>
      prev.map((g) => (g.domain === domain ? { ...g, expanded: !g.expanded } : g))
    );
  }, []);

  const selectAll = useCallback(() => {
    setDomainSelections((prev) =>
      prev.map((g) => ({
        ...g,
        cookies: g.cookies.map((c) => ({ ...c, selected: true })),
      }))
    );
  }, []);

  const deselectAll = useCallback(() => {
    setDomainSelections((prev) =>
      prev.map((g) => ({
        ...g,
        cookies: g.cookies.map((c) => ({ ...c, selected: false })),
      }))
    );
  }, []);

  const loadCookies = useCallback((cookies: Cookie[]) => {
    setAllCookies(cookies);
    setDomainSelections(createDomainSelections(cookies));
    setSearchQuery('');
  }, []);

  const reset = useCallback(() => {
    setAllCookies([]);
    setDomainSelections([]);
    setSearchQuery('');
  }, []);

  const getSelectedCookies = useCallback((): Cookie[] => {
    return domainSelections.flatMap((g) =>
      g.cookies.filter((c) => c.selected).map((c) => c.cookie)
    );
  }, [domainSelections]);

  return {
    allCookies,
    domainSelections,
    searchQuery,
    selectedCount,
    totalCookiesSelected,
    toggleDomain,
    toggleCookie,
    toggleExpand,
    selectAll,
    deselectAll,
    setSearchQuery,
    loadCookies,
    reset,
    totalDomains,
    totalCookies,
    getSelectedCookies,
  };
}
