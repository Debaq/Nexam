import React from 'react'
import { QuestionsList } from './features/questions/components/QuestionsList'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-primary">Nexam</h1>
          <p className="text-sm text-muted-foreground">Sistema Inteligente de Evaluación Educativa</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <QuestionsList />
      </main>
    </div>
  )
}

export default App
