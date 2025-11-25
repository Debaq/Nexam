import React, { useState } from 'react'
import { MainLayout } from './shared/components/Layout/MainLayout'
import { SectionsPage } from './features/sections/components/SectionsPage'
import { ExamsPage } from './features/exams/components/ExamsPage'
import { QuestionsPage } from './features/questions/components/QuestionsPage'
import { StudentsPage } from './features/students/components/StudentsPage'
import { ReportsPage } from './features/analytics/components/ReportsPage'
import { SettingsPage } from './shared/components/SettingsPage'
import { GradeScaleGeneratorPage } from './shared/components/GradeScaleGeneratorPage'
import { ThemeProvider } from './core/theme/ThemeProvider'

function App() {
  const [currentPage, setCurrentPage] = useState('sections')

  const renderPage = () => {
    switch (currentPage) {
      case 'sections':
        return <SectionsPage />
      case 'exams':
        return <ExamsPage />
      case 'questions':
        return <QuestionsPage />
      case 'students':
        return <StudentsPage />
      case 'reports':
        return <ReportsPage />
      case 'grade-scale':
        return <GradeScaleGeneratorPage />
      case 'settings':
        return <SettingsPage />
      default:
        return <SectionsPage />
    }
  }

  return (
    <ThemeProvider>
      <MainLayout currentPath={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </MainLayout>
    </ThemeProvider>
  )
}

export default App
