import { Camera, Car, Gem, Gift, Heart, Home, Plane, Shirt, Sparkles, Utensils, type LucideIcon } from 'lucide-react'
import type { IconName } from '@/lib/rangkai'

export const ICON_COMPONENTS: Record<IconName, LucideIcon> = {
  sparkles: Sparkles,
  heart: Heart,
  home: Home,
  gem: Gem,
  shirt: Shirt,
  camera: Camera,
  utensils: Utensils,
  car: Car,
  gift: Gift,
  plane: Plane,
}

export const ICON_LABELS: Record<IconName, string> = {
  sparkles: 'Kilau',
  heart: 'Hati',
  home: 'Rumah',
  gem: 'Permata',
  shirt: 'Busana',
  camera: 'Kamera',
  utensils: 'Katering',
  car: 'Kendaraan',
  gift: 'Hadiah',
  plane: 'Perjalanan',
}

export const iconFor = (name: string): LucideIcon => ICON_COMPONENTS[name as IconName] ?? Sparkles
