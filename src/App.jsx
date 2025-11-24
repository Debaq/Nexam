import React, { useState } from 'react'
import { MainLayout } from './shared/components/Layout/MainLayout'
import { ExamsPage } from './features/exams/components/ExamsPage'
import { QuestionsPage } from './features/questions/components/QuestionsPage'
import { StudentsPage } from './features/students/components/StudentsPage'
import { CorrectionPage } from './features/correction/components/CorrectionPage'
import { ReportsPage } from './features/analytics/components/ReportsPage'

function App() {
  const [currentPage, setCurrentPage] = useState('exams')

  const renderPage = () => {
    switch (currentPage) {
      case 'exams':
        return <ExamsPage />
      case 'questions':
        return <QuestionsPage />
      case 'students':
        return <StudentsPage />
      case 'correction':
        return <CorrectionPage />
      case 'reports':
        return <ReportsPage />
      case 'settings':
        return (
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">Configuración</h1>
            <p className="text-muted-foreground">Próximamente...</p>
          </div>
        )
      default:
        return <ExamsPage />
    }
  }

  return (
    <MainLayout currentPath={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </MainLayout>
  )
}

export default App
