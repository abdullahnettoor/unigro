import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "@/index.css"
import App from "@/App.tsx"
import { ConvexClientProvider } from "@/providers/ConvexClientProvider"
import { initTheme } from "@/lib/theme"
import { FeedbackProvider } from "@/components/shared/FeedbackProvider.tsx"

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
