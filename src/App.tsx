import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PageSkeleton } from './components/PageSkeleton';
import { useData } from './data/DataContext';

// Code-split every route.
const Home = lazy(() => import('./pages/Home'));
const Incidents = lazy(() => import('./pages/Incidents'));
const IncidentDetail = lazy(() => import('./pages/IncidentDetail'));
const Prep = lazy(() => import('./pages/Prep'));
const DayView = lazy(() => import('./pages/DayView'));
const Flashcards = lazy(() => import('./pages/Flashcards'));
const Quiz = lazy(() => import('./pages/Quiz'));
const Templates = lazy(() => import('./pages/Templates'));
const About = lazy(() => import('./pages/About'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Gate route content on data readiness so pages can assume loaded content.
function Ready({ children }: { children: ReactNode }) {
  const { status, error } = useData();
  if (status === 'loading') return <PageSkeleton />;
  if (status === 'error') {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="text-xl font-bold">Content failed to load</h1>
        <p className="mt-2 text-text2">
          The app files may be incomplete — re-download the bundle.
        </p>
        {error && <p className="mt-2 font-mono text-xs text-text3">{error}</p>}
      </div>
    );
  }
  return <>{children}</>;
}

function page(node: ReactNode) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Ready>{node}</Ready>
    </Suspense>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: page(<Home />) },
      { path: 'incidents', element: page(<Incidents />) },
      { path: 'incidents/:id', element: page(<IncidentDetail />) },
      { path: 'prep', element: page(<Prep />) },
      { path: 'prep/day/:day', element: page(<DayView />) },
      { path: 'flashcards', element: page(<Flashcards />) },
      { path: 'quiz', element: page(<Quiz />) },
      { path: 'templates', element: page(<Templates />) },
      { path: 'about', element: page(<About />) },
      { path: '*', element: page(<NotFound />) },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
