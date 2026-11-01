import { DisplayPage } from './components/display/DisplayPage';
import {useEffect} from 'react';
import {pageFromHash} from './lib/app-navigation';
import { useAppStore } from './stores/app-store';
import { AppLayout } from './components/layout';
import { DashboardPage } from './components/dashboard';
import { LightingPage } from './components/lighting';
import { ActuationPage } from './components/actuation';
import { RapidTriggerPage } from './components/rapid-trigger';
import { SocdPage } from './components/socd';
import { KeyMappingPage } from './components/key-mapping';
import { ProfilesPage } from './components/profiles';
import { SettingsPage } from './components/settings';

export function App() {
  const activePage = useAppStore((s) => s.activePage);
  useEffect(()=>{
    const navigate=()=>useAppStore.getState().setActivePage(pageFromHash(window.location.hash));
    window.addEventListener('hashchange',navigate);
    return()=>window.removeEventListener('hashchange',navigate);
  },[]);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'display':
        return <DisplayPage />;
      case 'lighting':
        return <LightingPage />;
      case 'actuation':
        return <ActuationPage />;
      case 'rapid-trigger':
        return <RapidTriggerPage />;
      case 'socd':
        return <SocdPage />;
      case 'key-mapping':
        return <KeyMappingPage />;
      case 'profiles':
        return <ProfilesPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return <AppLayout>{renderPage()}</AppLayout>;
}

export default App;
