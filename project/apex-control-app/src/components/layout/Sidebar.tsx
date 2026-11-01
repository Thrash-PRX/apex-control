import { ArrowUpRight, ChevronRight, Command, Gauge, Keyboard, LayoutDashboard, Monitor, Palette, Settings, SlidersHorizontal, Zap, FolderOpen } from 'lucide-react';
import { useAppStore, type AppPage } from '../../stores/app-store';
import { ConnectionState } from '../../types';

const groups = [
  { label: 'WORKSPACE', items: [
    { page: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { page: 'profiles', label: 'Profiles', icon: FolderOpen },
  ] },
  { label: 'KEYBOARD', items: [
    { page: 'key-mapping', label: 'Key mapping', icon: Keyboard },
    { page: 'actuation', label: 'Actuation', icon: Gauge },
    { page: 'rapid-trigger', label: 'Rapid Trigger', icon: Zap },
    { page: 'socd', label: 'SOCD', icon: SlidersHorizontal },
    { page: 'lighting', label: 'Lighting', icon: Palette },
    { page: 'display', label: 'OLED Studio', icon: Monitor },
  ] },
] as const;

export function Sidebar() {
  const activePage = useAppStore(s => s.activePage);
  const setActivePage = useAppStore(s => s.setActivePage);
  const connection = useAppStore(s => s.connection);
  const mock = useAppStore(s => s.useMock);
  const connected = connection.state === ConnectionState.Connected;
  function navigate(page: AppPage) { setActivePage(page); }
  return <aside className="app-sidebar">
    <button className="app-brand" onClick={() => navigate('dashboard')} aria-label="APEX CONTROL overview">
      <span className="brand-mark"><Command size={21} /></span>
      <span>apex<span className="brand-secondary">control</span><small>KEYBOARD CONFIGURATOR</small></span>
    </button>
    <button className="device-tile" onClick={() => navigate('dashboard')}>
      <Keyboard size={26} aria-hidden="true" />
      <span><strong>APEX 200</strong><small><i className={connected && !mock ? 'device-dot connected' : 'device-dot'} />{mock ? 'Demo workspace' : connected ? 'USB connected' : 'Connect your keyboard'}</small></span>
      <ChevronRight size={14} />
    </button>
    <nav aria-label="Main navigation" className="app-navigation">
      {groups.map(group => <div className="nav-group" key={group.label}>
        <p className="nav-label">{group.label}</p>
        {group.items.map(({page, label, icon: Icon}) => <button key={page} className={`nav-link ${activePage === page ? 'active' : ''}`} aria-current={activePage === page ? 'page' : undefined} onClick={() => navigate(page)}><Icon size={17} aria-hidden="true" /><span>{label}</span>{activePage === page && <span className="nav-active-dot" />}</button>)}
      </div>)}
      <button className={`nav-link mobile-settings ${activePage === 'settings' ? 'active' : ''}`} aria-current={activePage === 'settings' ? 'page' : undefined} onClick={() => navigate('settings')}><Settings size={17} />Settings</button>
    </nav>
    <div className="sidebar-bottom">
      <button className={`nav-link ${activePage === 'settings' ? 'active' : ''}`} aria-current={activePage === 'settings' ? 'page' : undefined} onClick={() => navigate('settings')}><Settings size={17} />Settings & diagnostics</button>
      <a href="https://github.com/Thrash-PRX/apex-control" target="_blank" rel="noreferrer" className="source-link">APEX CONTROL <span>WEB <ArrowUpRight size={12} /></span></a>
    </div>
  </aside>;
}
