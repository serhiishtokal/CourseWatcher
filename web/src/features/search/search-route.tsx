import type { SearchResult } from '@contracts/api';
import { useDeferredValue, useEffect, useEffectEvent, useMemo, useState, startTransition } from 'react';
import { Link, useLoaderData, useLocation, useNavigate } from 'react-router';
import { fetchSearchResults } from '../../shared/http/api-client';

interface SearchLoaderData {
  query: string;
  results: SearchResult[];
}

export async function searchLoader({ request }: { request: Request }): Promise<SearchLoaderData> {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') ?? '';
  return {
    query,
    results: await fetchSearchResults(query),
  };
}

export function SearchRoute() {
  const { query: initialQuery, results } = useLoaderData() as SearchLoaderData;
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query.trim());

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const syncQueryToUrl = useEffectEvent((nextQuery: string) => {
    const searchParams = new URLSearchParams(location.search);
    const currentQuery = searchParams.get('q') ?? '';
    if (currentQuery === nextQuery) {
      return;
    }

    startTransition(() => {
      navigate(nextQuery ? `/search?q=${encodeURIComponent(nextQuery)}` : '/search', { replace: true });
    });
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => syncQueryToUrl(deferredQuery), 200);
    return () => window.clearTimeout(timeoutId);
  }, [deferredQuery, syncQueryToUrl]);

  const sortedResults = useMemo(
    () =>
      [...results].sort((left, right) => {
        if (left.moduleName === right.moduleName) {
          return left.title.localeCompare(right.title);
        }
        return (left.moduleName ?? 'Videos').localeCompare(right.moduleName ?? 'Videos');
      }),
    [results],
  );

  return (
    <section className="panel stack">
      <div className="section-header">
        <div>
          <h1>Search</h1>
          <p>Type to search across video titles and filenames.</p>
        </div>
        <input
          className="inline-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Start typing..."
          type="search"
          value={query}
        />
      </div>

      {query && deferredQuery !== initialQuery ? <p className="muted">Updating results...</p> : null}

      {sortedResults.length === 0 ? (
        <div className="empty-state">
          <h2>{initialQuery ? 'No matches yet' : 'Start with a search query'}</h2>
          <p>{initialQuery ? 'Try a broader term or another lesson name.' : 'Results appear as you type.'}</p>
        </div>
      ) : (
        <div className="search-results">
          {sortedResults.map((result) => (
            <Link className="search-result" key={result.id} to={`/video/${result.id}`}>
              <div>
                <h2>{result.title}</h2>
                <p>{result.moduleName ?? 'Videos'}</p>
              </div>
              <span className={`status-badge status-${result.status}`}>{result.status}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
