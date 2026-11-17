'use client'

import { RadioGroup } from '@ark-ui/react'
import { ICON_COMPONENTS, ICON_LABELS } from '@/components/icons'
import { ICONS, type IconName } from '@/lib/rangkai'

// Pilihan ikon kategori memakai RadioGroup dari Ark UI (navigasi panah, satu pilihan, aksesibel).
export function IconPicker({ value, onChange, label = 'Ikon' }: { value: string; onChange: (icon: IconName) => void; label?: string }) {
  return (
    <RadioGroup.Root className="icon-picker" value={value} onValueChange={details => details.value && onChange(details.value as IconName)} orientation="horizontal">
      <RadioGroup.Label className="icon-picker-label">{label}</RadioGroup.Label>
      <div className="icon-picker-options">
        {ICONS.map(icon => {
          const Icon = ICON_COMPONENTS[icon]
          return (
            <RadioGroup.Item key={icon} value={icon} className="icon-picker-item" title={ICON_LABELS[icon]}>
              <RadioGroup.ItemControl className="icon-picker-control">
                <Icon size={15} />
              </RadioGroup.ItemControl>
              <RadioGroup.ItemText className="sr-only">{ICON_LABELS[icon]}</RadioGroup.ItemText>
              <RadioGroup.ItemHiddenInput />
            </RadioGroup.Item>
          )
        })}
      </div>
    </RadioGroup.Root>
  )
}
