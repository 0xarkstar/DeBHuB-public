import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Providers } from './providers'
import { ErrorBoundary } from './components/ErrorBoundary'
import DashboardLayout from './layouts/DashboardLayout'
import { ProjectCardSkeletonGrid } from './components/ProjectCardSkeleton'

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'))
const DocumentPage = lazy(() => import('./pages/DocumentPage'))
const NewProjectPage = lazy(() => import('./pages/NewProjectPage'))
const ProjectPage = lazy(() => import('./pages/ProjectPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const StoragePage = lazy(() => import('./pages/StoragePage'))
const BlockchainPage = lazy(() => import('./pages/BlockchainPage'))
const UsagePage = lazy(() => import('./pages/UsagePage'))
const ProgrammableDataPage = lazy(() => import('./pages/ProgrammableDataPage'))

// Loading fallback component
const PageLoader = () => (
  <div className="container mx-auto py-8 px-4">
    <ProjectCardSkeletonGrid count={6} />
  </div>
)

function App() {
  return (
    <ErrorBoundary>
      <Providers>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route
              index
              element={
                <Suspense fallback={<PageLoader />}>
                  <Dashboard />
                </Suspense>
              }
            />
            <Route
              path="documents/:id"
              element={
                <Suspense fallback={<PageLoader />}>
                  <DocumentPage />
                </Suspense>
              }
            />
            <Route
              path="projects/new"
              element={
                <Suspense fallback={<PageLoader />}>
                  <NewProjectPage />
                </Suspense>
              }
            />
            <Route
              path="projects/:id"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProjectPage />
                </Suspense>
              }
            />
            <Route
              path="search"
              element={
                <Suspense fallback={<PageLoader />}>
                  <SearchPage />
                </Suspense>
              }
            />
            <Route
              path="storage"
              element={
                <Suspense fallback={<PageLoader />}>
                  <StoragePage />
                </Suspense>
              }
            />
            <Route
              path="blockchain"
              element={
                <Suspense fallback={<PageLoader />}>
                  <BlockchainPage />
                </Suspense>
              }
            />
            <Route
              path="usage"
              element={
                <Suspense fallback={<PageLoader />}>
                  <UsagePage />
                </Suspense>
              }
            />
            <Route
              path="settings"
              element={
                <Suspense fallback={<PageLoader />}>
                  <SettingsPage />
                </Suspense>
              }
            />
            <Route
              path="programmable-data"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProgrammableDataPage />
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </Providers>
    </ErrorBoundary>
  )
}

export default App
