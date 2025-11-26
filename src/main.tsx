import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../game/App'
import { AuthProvider } from '../game/components/auth/AuthContext'
import { AuthGate } from '../game/components/auth/AuthGate'
import '../game/styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <AuthGate>
        <App />
      </AuthGate>
    </AuthProvider>
  </React.StrictMode>,
)
