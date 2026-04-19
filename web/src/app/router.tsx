import { createBrowserRouter } from 'react-router';
import { AppShell } from '../shared/ui/app-shell';
import { ErrorPage } from './error-page';

function RouteHydrateFallback() {
  return <div className="route-loading">Loading...</div>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppShell,
    HydrateFallback: RouteHydrateFallback,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        lazy: async () => {
          const module = await import('../features/catalog/catalog-route');
          return {
            loader: module.catalogLoader,
            Component: module.CatalogRoute,
            HydrateFallback: RouteHydrateFallback,
          };
        },
      },
      {
        path: 'search',
        lazy: async () => {
          const module = await import('../features/search/search-route');
          return {
            loader: module.searchLoader,
            Component: module.SearchRoute,
            HydrateFallback: RouteHydrateFallback,
          };
        },
      },
      {
        path: 'video/:videoId',
        lazy: async () => {
          const module = await import('../features/playback/playback-route');
          return {
            loader: module.playbackLoader,
            Component: module.PlaybackRoute,
            HydrateFallback: RouteHydrateFallback,
          };
        },
      },
    ],
  },
]);
