import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore } from '../../stores/app-store';

export function AppLayout({ children }: { children: ReactNode }) {
  const page = useAppStore(s => s.activePage);
  const draft = ['rapid-trigger','socd','key-mapping','display'].includes(page);
  return <div className="app-shell">
    <a className="skip-link" href="#workspace" onClick={event=>{event.preventDefault();document.getElementById('workspace')?.focus();}}>Skip to workspace</a>
    <Sidebar />
    <div className="app-content">
      <Header />
      {draft && <div className="workspace-notice" role="status"><span className="notice-tag">LOCAL EDITOR</span>{page === 'display' ? 'Design and save your screen locally. Upload to the keyboard is not available yet.' : 'Changes here are saved in the editor. Applying these settings to the keyboard is not available yet.'}</div>}
      <main id="workspace" tabIndex={-1} className="workspace"><div className="workspace-inner">{children}</div></main>
      <footer className="workspace-footer"><span>APEX 200 <span className="footer-dot">·</span> 82 keys</span><span>{draft ? 'Local editing' : 'Browser workspace'}</span></footer>
    </div>
  </div>;
}
