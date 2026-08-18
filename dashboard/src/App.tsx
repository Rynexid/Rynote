import { Navbar } from "@/components/Navbar"
import { Hero } from "@/components/Hero"
import { Features } from "@/components/Features"

import { Platforms } from "@/components/Platforms"
import { DashboardPreview } from "@/components/DashboardPreview"
import { Commands } from "@/components/Commands"
import { FAQ } from "@/components/FAQ"
import { Stats } from "@/components/Stats"
import { CTA } from "@/components/CTA"
import { Footer } from "@/components/Footer"
import { Toaster } from "sonner"
import { TooltipProvider } from "@/components/ui/Tooltip"

export default function App() {
  return (
    <TooltipProvider>
      <div className="min-h-screen">
        <Toaster position="top-center" theme="dark" />
        <Navbar />
        <main>
          <Hero />
          <Features />
          <Platforms />
          <DashboardPreview />
          <Commands />
          <Stats />
          <FAQ />
          <CTA />
        </main>
        <Footer />
      </div>
    </TooltipProvider>
  )
}
