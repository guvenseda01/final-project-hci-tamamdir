import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2, User, Sliders, Wrench, Shield, Settings,
  HelpCircle, LogOut, Bell, Trash2, Eye, Plus, AlertTriangle
} from 'lucide-react'
import Navbar from '../components/Navbar'
import { currentUser } from '../data/mockData'

const tabs = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'personalization', label: 'Personalization', icon: Sliders },
  { id: 'services', label: 'Service Management', icon: Wrench },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'account', label: 'Account Management', icon: Settings },
]

function PersonalInfo() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Personal Info</h2>
        <p className="text-gray-500 text-sm">Manage your personal information and public profile.</p>
      </div>

      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={currentUser.avatar} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-gray-100" />
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-primary rounded-full flex items-center justify-center border-2 border-white">
              <User className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{currentUser.fullName}</p>
            <p className="text-sm text-gray-500">{currentUser.department}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="w-4 h-4 text-green-primary" />
              <span className="text-xs text-green-primary font-medium">Verified Student</span>
            </div>
          </div>
        </div>

        {[
          { label: 'Full Name', value: currentUser.fullName },
          { label: 'Email', value: currentUser.email },
          { label: 'Department', value: currentUser.department },
          { label: 'Student ID', value: '300201049' },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between py-3 border-b border-gray-50">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">{label}</p>
              <p className="text-sm font-medium text-gray-900">{value}</p>
            </div>
            <button className="text-sm text-green-primary hover:underline font-medium">Edit</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function ServiceManagement() {
  const [services, setServices] = useState(currentUser.activeServices)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Service Management</h2>
        <p className="text-gray-500 text-sm">Manage the services you offer to other students on the marketplace.</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Your Active Services</h3>
            <p className="text-sm text-gray-400">These services are currently visible to other students.</p>
          </div>
          <button className="flex items-center gap-2 bg-green-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-dark transition-colors">
            <Plus className="w-4 h-4" />
            Add New Service
          </button>
        </div>

        <div className="space-y-3 mb-4">
          {services.map((svc) => (
            <div key={svc.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-pale rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{svc.title}</p>
                  <p className="text-xs text-gray-400">{svc.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setServices(services.filter((s) => s.id !== svc.id))}
                className="flex items-center gap-1.5 text-red-400 hover:text-red-600 text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            </div>
          ))}
        </div>

        <p className="text-xs text-center text-gray-400 py-2 bg-gray-50 rounded-lg">
          Tip: Offering high-quality services helps you earn higher ratings and peer trust.
        </p>
      </div>

      <button className="w-full flex items-center justify-between card px-5 py-4 hover:shadow-md transition-shadow group">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
            <Eye className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900 text-sm">Public Profile Preview</p>
            <p className="text-xs text-gray-400">See how others view you.</p>
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}

function AccountManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Account Management</h2>
        <p className="text-gray-500 text-sm">View and manage your core account settings and data preferences.</p>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-gray-900 text-sm">Primary Account Details</h3>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">University Email</p>
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-gray-900">{currentUser.email}</p>
            <span className="flex items-center gap-1 bg-green-pale text-green-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Verified
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">This email is required for campus verification and cannot be changed.</p>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-gray-900 text-sm">Account Security</h3>
        </div>
        {[
          { label: 'Password', desc: 'Last changed 3 months ago', action: 'Change' },
          { label: 'Two-Factor Authentication (2FA)', desc: <span>Currently <span className="text-red-400 font-medium">disabled</span>. Add an extra layer of security.</span>, action: 'Manage' },
        ].map(({ label, desc, action }) => (
          <div key={label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
            <button className={`text-sm font-semibold px-3 py-1.5 rounded-lg border transition-colors ${action === 'Change' ? 'text-green-primary hover:bg-green-pale border-transparent' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              {action}
            </button>
          </div>
        ))}
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-gray-900 text-sm">Data & Privacy</h3>
        </div>
        <p className="text-sm text-gray-500">Control how your data is used and stored within the Tamamdır platform.</p>
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-outline text-sm py-2.5 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export My Data
          </button>
          <button className="btn-outline text-sm py-2.5 flex items-center justify-center gap-2 text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Delete Account History
          </button>
        </div>
      </div>

      <div className="card p-6 border-red-100">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <h3 className="font-semibold text-red-500 text-sm">Danger Zone</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Deactivating your account will immediately hide your profile and active service listings. You will not be able to log in or receive messages.
        </p>
        <button className="flex items-center gap-2 border border-red-300 text-red-400 hover:bg-red-50 transition-colors text-sm font-semibold px-4 py-2.5 rounded-lg">
          <AlertTriangle className="w-4 h-4" />
          Deactivate Account
        </button>
      </div>
    </div>
  )
}

function SecurityTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Security</h2>
        <p className="text-gray-500 text-sm">Manage your account security settings.</p>
      </div>
      <div className="card p-6 space-y-4">
        {[
          { label: 'Login Sessions', desc: '2 active sessions', action: 'View All' },
          { label: 'Login Notifications', desc: 'Get notified on new logins', action: 'Enable' },
        ].map(({ label, desc, action }) => (
          <div key={label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
            <button className="text-sm font-semibold text-green-primary hover:underline">{action}</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function PersonalizationTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Personalization</h2>
        <p className="text-gray-500 text-sm">Customize your experience on Tamamdır.</p>
      </div>
      <div className="card p-6">
        <p className="text-sm text-gray-500 mb-4">Update your interest categories to get better service recommendations.</p>
        <Link to="/onboarding" className="btn-primary inline-flex">
          <Sliders className="w-4 h-4" />
          Update Interests
        </Link>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('services')

  const renderContent = () => {
    switch (activeTab) {
      case 'personal': return <PersonalInfo />
      case 'personalization': return <PersonalizationTab />
      case 'services': return <ServiceManagement />
      case 'security': return <SecurityTab />
      case 'account': return <AccountManagement />
      default: return <ServiceManagement />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-56 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 text-center border-b border-gray-100">
                <div className="relative inline-block mb-3">
                  <img
                    src={currentUser.avatar}
                    alt=""
                    className="w-20 h-20 rounded-full object-cover border-4 border-gray-50 shadow-sm"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-primary rounded-full flex items-center justify-center border-2 border-white">
                    <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                </div>
                <p className="font-semibold text-gray-900 text-sm">{currentUser.name.split(' ')[0]} Profile</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-primary" />
                  <span className="text-xs text-green-primary font-medium">Verified Student</span>
                </div>
                <button className="mt-3 w-full bg-green-primary text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-green-dark transition-colors">
                  Upgrade to Pro
                </button>
              </div>

              <nav className="p-3 space-y-1">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                      activeTab === id
                        ? 'bg-green-pale text-green-primary'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </button>
                ))}
              </nav>

              <div className="p-3 border-t border-gray-100 space-y-1">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                  <HelpCircle className="w-4 h-4" />
                  Help Center
                </button>
                <Link
                  to="/login"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Link>
              </div>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  )
}
