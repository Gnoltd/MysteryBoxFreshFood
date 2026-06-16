import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            MysteryBox
          </h1>
          <p className="text-slate-400 text-sm mt-1">F&B Surplus Marketplace</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
