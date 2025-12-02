import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../game/App'
import { AuthProvider } from '../game/components/auth/AuthContext'
import { AuthGate } from '../game/components/auth/AuthGate'
import { AssetPreviewPage } from '../game/components/asset-preview'
import '../game/styles/globals.css'

// Development-only route for asset preview
const isAssetPreview = window.location.pathname === '/asset-preview';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isAssetPreview ? (
      <AssetPreviewPage />
    ) : (
      <AuthProvider>
        <AuthGate>
          <App />
        </AuthGate>
      </AuthProvider>
    )}
  </React.StrictMode>,
)
