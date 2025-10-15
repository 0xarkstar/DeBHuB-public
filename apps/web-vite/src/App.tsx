import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Providers } from './providers'
import { ApolloWrapper } from './lib/apollo-wrapper'
import { ErrorBoundary } from './components/ErrorBoundary'
import DashboardLayout from './layouts/DashboardLayout'
import { ProjectCardSkeletonGrid } from './components/ProjectCardSkeleton'
import { useIrysInit } from './lib/irys-hooks'

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'))
const DashboardPure = lazy(() => import('./pages/DashboardPure'))
const DocumentPage = lazy(() => import('./pages/DocumentPage'))
const NewProjectPage = lazy(() => import('./pages/NewProjectPage'))
const NewProjectPure = lazy(() => import('./pages/NewProjectPure'))
const ProjectPage = lazy(() => import('./pages/ProjectPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const StoragePage = lazy(() => import('./pages/StoragePage'))
const BlockchainPage = lazy(() => import('./pages/BlockchainPage'))
const UsagePage = lazy(() => import('./pages/UsagePage'))
const ProgrammableDataPage = lazy(() => import('./pages/ProgrammableDataPage'))
const PureIrysTestPage = lazy(() => import('./pages/PureIrysTestPage'))

// Loading fallback component
const PageLoader = () => (
  <div className="container mx-auto py-8 px-4">
    <ProjectCardSkeletonGrid count={6} />
  </div>
)

function App() {
  // Initialize IrysDatabase on app mount
  const { error } = useIrysInit();

  if (error) {
    console.error('Failed to initialize IrysDatabase:', error);
  }

  return (
    <ErrorBoundary>
      <Providers>
        <ApolloWrapper>
          <Routes>
          <Route path="/" element={<DashboardLayout />}>
            {/* Pure Irys Mode Routes */}
            <Route
              path="pure"
              element={
                <Suspense fallback={<PageLoader />}>
                  <DashboardPure />
                </Suspense>
              }
            />
            <Route
              path="pure/projects/new"
              element={
                <Suspense fallback={<PageLoader />}>
                  <NewProjectPure />
                </Suspense>
              }
            />

            {/* Legacy/Hybrid Mode Routes */}
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
            <Route
              path="pure-irys-test"
              element={
                <Suspense fallback={<PageLoader />}>
                  <PureIrysTestPage />
                </Suspense>
              }
            />
          </Route>
        </Routes>
        </ApolloWrapper>
      </Providers>
    </ErrorBoundary>
  )
}

export default App
