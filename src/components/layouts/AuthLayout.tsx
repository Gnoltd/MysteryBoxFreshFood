import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <Outlet />
    </div>
  )
}
