import { Routes, Route } from 'react-router-dom'
import { Providers } from './providers'
import { ErrorBoundary } from './components/ErrorBoundary'
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import DocumentPage from './pages/DocumentPage'
import NewProjectPage from './pages/NewProjectPage'
import ProjectPage from './pages/ProjectPage'
import SearchPage from './pages/SearchPage'

function App() {
  return (
    <ErrorBoundary>
      <Providers>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="documents/:id" element={<DocumentPage />} />
            <Route path="projects/new" element={<NewProjectPage />} />
            <Route path="projects/:id" element={<ProjectPage />} />
            <Route path="search" element={<SearchPage />} />
          </Route>
        </Routes>
      </Providers>
    </ErrorBoundary>
  )
}

export default App
