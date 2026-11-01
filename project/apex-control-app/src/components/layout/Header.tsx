import { Globe2, ChevronRight } from 'lucide-react';
import { useAppStore, type AppPage } from '../../stores/app-store';
import { ConnectionState } from '../../types';

const titles: Record<AppPage, string> = {dashboard:'Overview', profiles:'Profiles', 'key-mapping':'Key mapping', actuation:'Actuation', 'rapid-trigger':'Rapid Trigger', socd:'SOCD', lighting:'Lighting', display:'OLED Studio', settings:'Settings & diagnostics'};
export function Header() {
  const activePage = useAppStore(s => s.activePage);
  const connection = useAppStore(s => s.connection);
  const useMock = useAppStore(s => s.useMock);
  const toggleMockMode = useAppStore(s => s.toggleMockMode);
  const connected = connection.state === ConnectionState.Connected;
  const busy = connection.state === ConnectionState.Connecting || connection.state === ConnectionState.Scanning;
  return <header className="app-header">
    <div className="app-breadcrumb"><span>APEX 200</span><ChevronRight size={13} /><strong>{titles[activePage]}</strong></div>
    <div className="header-actions">
      <span className="web-label"><Globe2 size={14} />Web configurator</span>
      <span className="connection-pill" role="status"><i className={connected && !useMock ? 'device-dot connected' : 'device-dot'} />{useMock ? 'Demo mode' : connected ? 'Connected' : busy ? 'Connecting…' : connection.state === ConnectionState.Error ? 'Connection error' : 'Not connected'}</span>
      <button className="mode-switch" role="switch" aria-checked={useMock} onClick={toggleMockMode} aria-label="Demo mode"><span>Demo</span><span className={`switch-track ${useMock ? 'on' : ''}`}><i /></span></button>
    </div>
  </header>;
}
