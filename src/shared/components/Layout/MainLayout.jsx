import React, { useState } from 'react';
import { Sidebar } from './Sidebar';

export const MainLayout = ({ children, currentPath, onNavigate }) => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar currentPath={currentPath} onNavigate={onNavigate} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
