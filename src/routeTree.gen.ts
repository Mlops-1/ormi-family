// Generouted, changes to this file will be overridden
import { Route as rootRoute } from './routes/__root';
import { Route as IndexRoute } from './routes/index';
import { Route as Landing2Route } from './routes/landing2';

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      preLoaderRoute: typeof IndexRoute;
      parentRoute: typeof rootRoute;
    };
    '/landing2': {
      preLoaderRoute: typeof Landing2Route;
      parentRoute: typeof rootRoute;
    };
  }
}

Object.assign(IndexRoute.options, {
  path: '/',
  getParentRoute: () => rootRoute,
});

Object.assign(Landing2Route.options, {
  path: '/landing2',
  getParentRoute: () => rootRoute,
});

export const routeTree = rootRoute.addChildren([IndexRoute, Landing2Route]);
