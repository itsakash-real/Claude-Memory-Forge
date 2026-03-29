import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import LandingPage from './pages/LandingPage';
import WizardPage from './pages/WizardPage';
import DownloadPage from './pages/DownloadPage';
import './index.css';

export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/wizard" element={<WizardPage />} />
          <Route path="/download" element={<DownloadPage />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  );
}
