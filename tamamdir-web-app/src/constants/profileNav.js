import {
  User,
  Sliders,
  Wrench,
  ShoppingBag,
  Shield,
  Settings,
} from 'lucide-react'

export const PROFILE_TABS = [
  { id: 'personal',        label: 'Personal Info',      icon: User },
  { id: 'personalization', label: 'Personalization',    icon: Sliders },
  { id: 'services',        label: 'Service Management', icon: Wrench },
  { id: 'orders',          label: 'Orders',             icon: ShoppingBag },
  { id: 'security',        label: 'Security',           icon: Shield },
  { id: 'account',         label: 'Account Management', icon: Settings },
]
