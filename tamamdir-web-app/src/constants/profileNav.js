import {
  User,
  Sliders,
  Wrench,
  ShoppingBag,
  Shield,
  Settings,
} from 'lucide-react'

export const PROFILE_TABS = [
  { id: 'personal',        labelKey: 'profile.tab.personal',        icon: User },
  { id: 'personalization', labelKey: 'profile.tab.personalization', icon: Sliders },
  { id: 'services',        labelKey: 'profile.tab.services',        icon: Wrench },
  { id: 'orders',          labelKey: 'profile.tab.orders',          icon: ShoppingBag },
  { id: 'security',        labelKey: 'profile.tab.security',        icon: Shield },
  { id: 'account',         labelKey: 'profile.tab.account',         icon: Settings },
]
