'use client'

import { LocaleProvider, NumberInput } from '@ark-ui/react'
import { Minus, Plus } from 'lucide-react'
import type { Ref } from 'react'

type MoneyInputProps = {
  label: string
  value: string
  onValueChange: (value: string, valueAsNumber: number) => void
  placeholder?: string
  step?: number
  inputRef?: Ref<HTMLInputElement>
}

const rupiah: Intl.NumberFormatOptions = { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }

// Input nominal dari Ark UI: format "Rp 5.000.000" otomatis, bisa diketik dengan atau tanpa titik,
// tombol +/- dan panah atas/bawah menaikkan per `step`.
export function MoneyInput({ label, value, onValueChange, placeholder, step = 100_000, inputRef }: MoneyInputProps) {
  return (
    <LocaleProvider locale="id-ID">
      <NumberInput.Root
        className="money-input"
        value={value}
        onValueChange={details => onValueChange(details.value, details.valueAsNumber)}
        min={1}
        step={step}
        formatOptions={rupiah}
        required
      >
        <NumberInput.Label className="money-input-label">{label}</NumberInput.Label>
        <NumberInput.Control className="money-input-control">
          <NumberInput.Input ref={inputRef} placeholder={placeholder} />
          <div className="money-input-steppers">
            <NumberInput.DecrementTrigger aria-label="Kurangi">
              <Minus size={13} />
            </NumberInput.DecrementTrigger>
            <NumberInput.IncrementTrigger aria-label="Tambah">
              <Plus size={13} />
            </NumberInput.IncrementTrigger>
          </div>
        </NumberInput.Control>
      </NumberInput.Root>
    </LocaleProvider>
  )
}
