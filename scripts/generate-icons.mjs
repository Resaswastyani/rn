// Membuat app/favicon.ico (16, 32, 48 px) dan app/apple-icon.png (180 px) dari app/icon.svg.
// Jalankan: pnpm icons
import { readFileSync, writeFileSync } from 'node:fs'
import { ImageResponse } from 'next/og.js'
import { createElement as h } from 'react'

const iconSvg = readFileSync('app/icon.svg', 'utf8')

// Versi Apple: latar penuh tanpa sudut (iOS memotong sudutnya sendiri), hati sedikit lebih kecil.
const appleSvg = iconSvg
  .replace(/<path d="M22 0H42[^>]*\/>/, '<rect width="64" height="64" fill="url(#bg)" />')
  .replace('<g transform="translate(13.25 14.25) scale(1.5625)"', '<g transform="translate(17.375 18.375) scale(1.21875)"')

async function renderPng(svg, size) {
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  const image = new ImageResponse(
    h('div', { style: { display: 'flex', width: '100%', height: '100%' } }, h('img', { src, width: size, height: size })),
    { width: size, height: size },
  )
  return Buffer.from(await image.arrayBuffer())
}

// ICO berisi PNG (didukung semua browser modern).
function buildIco(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = 6 + 16 * images.length
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(png.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += png.length
    return entry
  })
  return Buffer.concat([header, ...entries, ...images.map(image => image.png)])
}

const sizes = [16, 32, 48]
const pngs = await Promise.all(sizes.map(async size => ({ size, png: await renderPng(iconSvg, size) })))
writeFileSync('app/favicon.ico', buildIco(pngs))
writeFileSync('app/apple-icon.png', await renderPng(appleSvg, 180))
console.log(`app/favicon.ico (${sizes.join(', ')} px) dan app/apple-icon.png (180 px) dibuat.`)
