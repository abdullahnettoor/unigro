import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from "@/App.tsx"
import { FeedbackProvider } from "@/components/shared/FeedbackProvider.tsx"
import { initTheme } from "@/lib/theme"
import { ConvexClientProvider } from "@/providers/ConvexClientProvider"

import "@/index.css"

initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexClientProvider>
      <FeedbackProvider>
        <App />
      </FeedbackProvider>
    </ConvexClientProvider>
  </StrictMode>,
)
