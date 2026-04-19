import { FormEvent, startTransition } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get('q') ?? '').trim();
    startTransition(() => {
      navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
    });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">CW</span>
          <div>
            <div className="brand-title">CourseWatcher</div>
            <div className="brand-subtitle">Track local courses with a modern player</div>
          </div>
        </Link>

        <div className="topbar-actions">
          <nav className="topnav">
            <Link className={location.pathname === '/' ? 'active' : ''} to="/">
              Course
            </Link>
            <Link className={location.pathname === '/search' ? 'active' : ''} to="/search">
              Search
            </Link>
          </nav>

          <form className="searchbar" onSubmit={handleSearchSubmit}>
            <input
              aria-label="Search videos"
              defaultValue={new URLSearchParams(location.search).get('q') ?? ''}
              name="q"
              placeholder="Search videos..."
              type="search"
            />
            <button type="submit">Search</button>
          </form>
        </div>
      </header>

      <main className="page-shell">
        <Outlet />
      </main>
    </div>
  );
}
