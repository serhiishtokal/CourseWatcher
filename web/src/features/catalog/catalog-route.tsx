import type { CatalogResponse } from '@contracts/api';
import { startTransition, useEffect, useState } from 'react';
import { Link, useLoaderData, useNavigate } from 'react-router';
import { fetchCatalog } from '../../shared/http/api-client';

type CatalogViewMode = 'grid' | 'list';

const VIEW_MODE_STORAGE_KEY = 'coursewatcher.catalog.view-mode';

export async function catalogLoader({ request }: { request: Request }) {
  const url = new URL(request.url);
  return fetchCatalog(url.searchParams.get('sort') ?? undefined);
}

export function CatalogRoute() {
  const { currentSort, modules, stats } = useLoaderData() as CatalogResponse;
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<CatalogViewMode>(() => {
    if (typeof window === 'undefined') {
      return 'list';
    }

    const storedValue = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return storedValue === 'grid' ? 'grid' : 'list';
  });

  useEffect(() => {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  function handleSortChange(sort: CatalogResponse['currentSort']) {
    startTransition(() => {
      navigate(sort === 'name' ? '/' : `/?sort=${sort}`);
    });
  }

  return (
    <div className="stack">
      <section className="stats-grid">
        <article className="stat-card">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total Videos</span>
        </article>
        <article className="stat-card">
          <span className="stat-value">{stats.completed}</span>
          <span className="stat-label">Completed</span>
        </article>
        <article className="stat-card">
          <span className="stat-value">{stats.inProgress}</span>
          <span className="stat-label">In Progress</span>
        </article>
        <article className="stat-card accent">
          <span className="stat-value">{stats.percentComplete}%</span>
          <span className="stat-label">Course Progress</span>
        </article>
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <h1>Course Content</h1>
            <p>Organized by folder structure with progress-aware list and card views.</p>
          </div>
          <div className="controls-cluster">
            <div className="pill-group">
              {[
                ['name', 'Name ↑'],
                ['name_desc', 'Name ↓'],
                ['date', 'Date ↑'],
                ['date_desc', 'Date ↓'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={currentSort === value ? 'pill active' : 'pill'}
                  onClick={() => handleSortChange(value as CatalogResponse['currentSort'])}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="pill-group">
              <button
                className={viewMode === 'list' ? 'pill active' : 'pill'}
                onClick={() => setViewMode('list')}
                type="button"
              >
                List
              </button>
              <button
                className={viewMode === 'grid' ? 'pill active' : 'pill'}
                onClick={() => setViewMode('grid')}
                type="button"
              >
                Tiles
              </button>
            </div>
          </div>
        </div>

        {modules.length === 0 ? (
          <div className="empty-state">
            <h2>No videos found</h2>
            <p>Run CourseWatcher inside a folder that contains course videos.</p>
          </div>
        ) : (
          <div className="module-list">
            {modules.map((module, index) => (
              <details className="module-card" key={`${module.name}-${module.id ?? 'root'}`} open={index === 0}>
                <summary>
                  <div>
                    <span className="eyebrow">Module</span>
                    <h2>{module.name}</h2>
                  </div>
                  <span className="meta-chip">{module.videos.length} videos</span>
                </summary>

                <div className={viewMode === 'list' ? 'video-list' : 'video-grid'}>
                  {module.videos.map((video) => {
                    const percent =
                      video.duration > 0 ? Math.round((video.position / video.duration) * 100) : 0;

                    return (
                      <Link
                        className={viewMode === 'list' ? 'video-row' : 'video-card'}
                        key={video.id}
                        to={`/video/${video.id}`}
                      >
                        <div className="video-card-top">
                          <span className={`status-badge status-${video.status}`}>{video.status}</span>
                          <span className="meta-chip">{percent}% watched</span>
                        </div>
                        <div className="video-copy">
                          <h3>{video.title}</h3>
                          <p>{video.filename}</p>
                        </div>
                        <div className="progress-track">
                          <span style={{ width: `${percent}%` }} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
