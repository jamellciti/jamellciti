import React, { useState, useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useLiveFeed } from './hooks/useLiveFeed';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { LiveMap } from './components/LiveMap';
import { KPIDashboard } from './components/KPIDashboard';
import { WorkOrders } from './components/WorkOrders';
import { Citations } from './components/Citations';
import { AdminPanel } from './components/AdminPanel';
import { VideoReviews } from './components/VideoReviews';
import './App.css';

function App() {
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState('map');

  // Initialize WebSocket connection when authenticated
  useLiveFeed();

  const renderContent = () => {
    switch (activeTab) {
      case 'map':
        return <LiveMap />;
      case 'kpis':
        return <KPIDashboard />;
      case 'work-orders':
        return <WorkOrders />;
      case 'citations':
        return <Citations />;
      case 'video-reviews':
        return <VideoReviews />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <LiveMap />;
    }
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;