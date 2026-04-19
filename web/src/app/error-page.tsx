import { isRouteErrorResponse, useRouteError } from 'react-router';

export function ErrorPage() {
  const routeError = useRouteError();

  if (isRouteErrorResponse(routeError)) {
    return (
      <section className="empty-state">
        <h1>{routeError.status}</h1>
        <p>{routeError.statusText}</p>
      </section>
    );
  }

  if (routeError instanceof Error) {
    return (
      <section className="empty-state">
        <h1>Something went wrong</h1>
        <p>{routeError.message}</p>
      </section>
    );
  }

  return (
    <section className="empty-state">
      <h1>Something went wrong</h1>
    </section>
  );
}
