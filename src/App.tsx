import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './store/context';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Wardrobe } from './pages/Wardrobe';
import { Outfits } from './pages/Outfits';
import { Analytics } from './pages/Analytics';
import { Packing } from './pages/Packing';
import { Settings } from './pages/Settings';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/wardrobe" element={<Wardrobe />} />
            <Route path="/outfits" element={<Outfits />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/packing" element={<Packing />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
