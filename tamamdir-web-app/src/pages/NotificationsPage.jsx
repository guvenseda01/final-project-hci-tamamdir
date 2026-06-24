import { Bell } from 'lucide-react'
import Navbar from '../components/Navbar'

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Notifications</h1>
        <p className="text-gray-500 text-sm mb-8">Stay updated on orders, messages, and account activity.</p>

        <div className="card p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">No notifications yet</p>
          <p className="text-xs text-gray-400">
            When you receive order updates or other alerts, they will appear here.
          </p>
        </div>
      </main>
    </div>
  )
}
