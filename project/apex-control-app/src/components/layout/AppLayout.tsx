import React, { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div
      className="flex h-screen w-screen overflow-hidden text-neutral-100 font-sans"
      style={{ backgroundColor: '#1a1a2e' }}
    >
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main
          className="flex-1 overflow-y-auto p-6"
          style={{ backgroundColor: '#1a1a2e' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
