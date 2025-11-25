import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { BackupManager } from '@/core/backup/BackupManager';
import { FeedbackButton } from '@/shared/components/FeedbackButton';

export const MainLayout = ({ children, currentPath, onNavigate }) => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar currentPath={currentPath} onNavigate={onNavigate} />
      <main className="flex-1 overflow-auto md:ml-64">
        <div className="flex flex-col min-h-screen">
          {/* Barra de herramientas superior */}
          <div className="px-6 py-3 border-b bg-background">
            <div className="flex justify-end">
              <BackupManager showReminder={false} />
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </main>
      <FeedbackButton />
    </div>
  );
};

export default MainLayout;
