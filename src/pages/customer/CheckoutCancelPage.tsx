import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function CheckoutCancelPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-5xl mb-4">❌</div>
      <h2 className="text-white text-xl font-bold">Payment cancelled</h2>
      <p className="text-slate-400 mt-2">Your box is still available. Ready to try again?</p>
      <Link to="/browse" className="mt-6"><Button className="bg-indigo-600 hover:bg-indigo-500">Back to Browse</Button></Link>
    </div>
  )
}
