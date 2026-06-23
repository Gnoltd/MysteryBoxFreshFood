import { Outlet } from 'react-router-dom'
import { ParticleBackground } from '../shared/ParticleBackground'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <ParticleBackground count={50} />

      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[150px] pointer-events-none animate-orb-1" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary-container/10 rounded-full blur-[120px] pointer-events-none animate-orb-2" />

      {/* Grid overlay */}
      <div className="absolute inset-0 qr-grid-bg opacity-40 pointer-events-none" />

      <div className="relative z-10 w-full flex items-center justify-center">
        <Outlet />
      </div>
    </div>
  )
}
