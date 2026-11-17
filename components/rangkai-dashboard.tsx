'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { ArrowDownLeft, ArrowUpRight, Bell, CalendarDays, Check, ChevronDown, CircleHelp, Clock3, Coins, Heart, LayoutDashboard, Menu, NotebookPen, Pencil, Plus, Search, Settings2, Sparkles, Tag, Wallet, X } from 'lucide-react'
import { saveProfile } from '@/app/actions'
import { FormDialog } from '@/components/form-dialog'
import { iconFor } from '@/components/icons'
import { ActivityManager } from '@/components/manage/activity-manager'
import { CategoryManager } from '@/components/manage/category-manager'
import { DepositManager } from '@/components/manage/deposit-manager'
import { ItemForm } from '@/components/manage/item-form'
import { useDialogState } from '@/components/use-dialog-state'
import { formatMoney, type DashboardData, type Deposit, type PlanItem } from '@/lib/rangkai'

const navItems = [
  { label: 'Ringkasan', href: '#overview', icon: LayoutDashboard },
  { label: 'Kategori', href: '#categories', icon: Tag },
  { label: 'Rencana & kebutuhan', href: '#items', icon: Sparkles },
  { label: 'Tabungan', href: '#savings', icon: Wallet },
  { label: 'Linimasa', href: '#timeline', icon: CalendarDays },
  { label: 'Pengaturan', href: '#settings', icon: Settings2 },
]

export function RangkaiDashboard({ profile, categories, items, deposits, activities }: DashboardData) {
  const [category, setCategory] = useState('Semua')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeNav, setActiveNav] = useState('#overview')
  const [nameOneDraft, setNameOneDraft] = useState(profile.nameOne)
  const [nameTwoDraft, setNameTwoDraft] = useState(profile.nameTwo)
  const [targetDateDraft, setTargetDateDraft] = useState(profile.targetDate)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [settingsPending, startSettings] = useTransition()

  const itemDialog = useDialogState<{ item: PlanItem | null }>()
  const depositDialog = useDialogState<{ itemId: number; name: string }>()
  const categoryDialog = useDialogState<true>()
  const activityDialog = useDialogState<true>()
  const itemNameRef = useRef<HTMLInputElement>(null)
  const depositAmountRef = useRef<HTMLInputElement>(null)
  const categoryNameRef = useRef<HTMLInputElement>(null)
  const activityTitleRef = useRef<HTMLInputElement>(null)

  const { nameOne: coupleNameOne, nameTwo: coupleNameTwo, targetDate } = profile
  // Kalau kategori yang sedang difilter diganti nama/dihapus, kembali ke "Semua".
  const activeCategory = category === 'Semua' || categories.some(c => c.name === category) ? category : 'Semua'
  const filterNames = ['Semua', ...categories.map(c => c.name)]
  const depositsByItem = useMemo(() => {
    const map = new Map<number, Deposit[]>()
    for (const deposit of deposits) map.set(deposit.itemId, [...(map.get(deposit.itemId) ?? []), deposit])
    return map
  }, [deposits])

  const totalTarget = items.reduce((sum, item) => sum + item.target, 0)
  const totalSaved = items.reduce((sum, item) => sum + item.saved, 0)
  const fulfilledCount = items.filter(item => item.saved >= item.target).length
  const filteredItems = useMemo(() => items.filter(item => (activeCategory === 'Semua' || item.category === activeCategory) && item.name.toLowerCase().includes(searchQuery.toLowerCase())), [items, activeCategory, searchQuery])
  const progress = totalTarget ? Math.round(totalSaved / totalTarget * 100) : 0
  const targetDateValue = new Date(`${targetDate}T00:00:00`)
  const daysUntilTarget = Math.ceil((targetDateValue.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000)
  const targetDateLabel = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(targetDateValue)
  const coupleInitials = `${coupleNameOne[0] ?? ''}${coupleNameTwo[0] ?? ''}`.toUpperCase()

  const editingItem = itemDialog.data?.item ?? null
  const depositTarget = depositDialog.data
  const depositItem = depositTarget ? items.find(item => item.id === depositTarget.itemId) : undefined

  function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const first = nameOneDraft.trim()
    const second = nameTwoDraft.trim()
    if (!first || !second || !targetDateDraft) return
    startSettings(async () => {
      const result = await saveProfile({ nameOne: first, nameTwo: second, targetDate: targetDateDraft })
      setSettingsError(result.ok ? null : result.error)
      setSettingsSaved(result.ok)
      if (result.ok) setActiveNav('#settings')
    })
  }

  function navigate(href: string) {
    setActiveNav(href)
    setMobileNavOpen(false)
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function openDeposits(item: PlanItem) {
    depositDialog.show({ itemId: item.id, name: item.name })
  }

  return (
    <main className="app-shell" id="overview">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" /><div className="ambient ambient-three" />
      <aside className="sidebar">
        <a className="brand" href="#overview" onClick={() => navigate('#overview')} aria-label="Rangkai home"><span className="brand-mark"><Heart size={17} fill="currentColor" /></span><span>rangkai<span className="brand-dot">.</span></span></a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Navigasi utama">{navItems.map(({ label, href, icon: Icon }) => <button type="button" className={`nav-link ${activeNav === href ? 'active' : ''}`} key={href} onClick={() => navigate(href)}><Icon size={17} />{label}{href === '#items' && <span className="nav-count">{items.length}</span>}</button>)}</nav>
        <div className="sidebar-bottom"><div className="couple-card"><span className="couple-avatar">{coupleNameOne[0]}<span>&</span>{coupleNameTwo[0]}</span><div><strong>{coupleNameOne} & {coupleNameTwo}</strong><small>Perjalanan kalian</small></div><ChevronDown size={15} /></div><button className={`nav-link ${activeNav === '#help-panel' ? 'active' : ''}`} type="button" onClick={() => navigate('#help-panel')}><CircleHelp size={17} />Panduan penggunaan</button><div className="sidebar-footnote">Disusun dengan penuh cinta <Heart size={12} /></div></div>
      </aside>

      <section className="main-column">
        <header className="topbar"><button className="mobile-menu" aria-label="Buka menu" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button><div className="breadcrumb">Workspace <span>/</span> Ringkasan</div><div className="top-actions"><button className={`icon-button ${searchOpen ? 'tool-active' : ''}`} aria-label="Cari kebutuhan" onClick={() => { setSearchOpen(open => !open); setSearchQuery(''); document.getElementById('items')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}><Search size={17} /></button><button className="icon-button notification" aria-label="Lihat linimasa" onClick={() => navigate('#timeline')}><Bell size={17} /><i /></button><span className="top-divider" /><div className="user-avatar" aria-label={`Profil ${coupleNameOne} dan ${coupleNameTwo}`}>{coupleInitials}</div></div></header>
        <div className="content">
          <div className="welcome-row"><div><div className="eyebrow"><span className="live-dot" />PERJALANAN KALIAN</div><h1>Pelan-pelan, <em>menuju selamanya.</em></h1><p className="welcome-sub">Satu tempat untuk merangkai semua rencana besar kalian.</p></div><button className="date-pill" onClick={() => navigate('#settings')}><CalendarDays size={15} /> {targetDateLabel} <ChevronDown size={14} /></button></div>

          <section className="hero-card liquid-panel" id="savings"><div className="hero-orb orb-one" /><div className="hero-orb orb-two" /><div className="hero-topline"><span className="hero-label"><span className="hero-dot" />TOTAL TABUNGAN TERKUMPUL</span><span className="hero-since">{deposits.length} setoran tercatat</span></div><div className="hero-total">{formatMoney(totalSaved)}</div><div className="hero-bottom"><div className="hero-target">dari <strong>{formatMoney(totalTarget)}</strong> target keseluruhan</div><div className="hero-progress-wrap"><div className="hero-progress"><span style={{ width: `${Math.min(progress, 100)}%` }} /></div><strong>{progress}%</strong></div></div><div className="hero-decoration"><span>THE BIG DAY</span><Heart size={20} /></div></section>

          <div className="stats-grid"><article className="stat-card liquid-panel"><div className="stat-top"><span className="stat-icon coral"><Coins size={17} /></span><span className="stat-caption">TARGET KESELURUHAN</span></div><strong>{formatMoney(totalTarget)}</strong><small>{items.length} kebutuhan direncanakan</small></article><article className="stat-card liquid-panel"><div className="stat-top"><span className="stat-icon green"><ArrowDownLeft size={17} /></span><span className="stat-caption">SUDAH TERKUMPUL</span></div><strong>{formatMoney(totalSaved)}</strong><small><span className="positive">{progress}%</span> dari target keseluruhan</small></article><article className="stat-card liquid-panel"><div className="stat-top"><span className="stat-icon violet"><Check size={17} /></span><span className="stat-caption">KEBUTUHAN TERPENUHI</span></div><strong>{fulfilledCount} <span className="stat-total">/ {items.length}</span></strong><small>Item mencapai target tabungan</small></article><article className="stat-card liquid-panel"><div className="stat-top"><span className="stat-icon amber"><Clock3 size={17} /></span><span className="stat-caption">MENUJU HARI BAHAGIA</span></div><strong>{daysUntilTarget > 0 ? daysUntilTarget : 0} <span className="stat-days">{daysUntilTarget > 0 ? 'hari lagi' : daysUntilTarget === 0 ? 'hari ini' : 'terlewati'}</span></strong><small>{targetDateLabel}</small></article></div>

          <div className="section-heading" id="items"><div><div className="section-kicker">LANGKAH KECIL, ARTI BESAR</div><h2>Rencana & kebutuhan</h2><p>Tambah, ubah, atau hapus kebutuhan. Tombol + mencatat dan mengelola setoran.</p></div><button className="primary-button" onClick={() => itemDialog.show({ item: null })}><Plus size={16} />Tambah kebutuhan</button></div>
          <section className="category-section" id="categories" aria-labelledby="categories-title"><div className="category-heading"><div><div className="section-kicker">PILIH AREA RENCANA</div><h2 id="categories-title">Kategori</h2></div><div className="heading-actions"><button className="category-reset" onClick={() => categoryDialog.show(true)}><Pencil size={11} /> Kelola kategori</button><button className="category-reset" onClick={() => { setCategory('Semua'); setActiveNav('#categories') }}>Lihat semua</button></div></div><div className="category-grid">{categories.map(cat => { const CategoryIcon = iconFor(cat.icon); const matchingItems = items.filter(item => item.category === cat.name); const categoryTarget = matchingItems.reduce((sum, item) => sum + item.target, 0); return <button key={cat.id} className={`category-card liquid-panel ${activeCategory === cat.name ? 'category-selected' : ''}`} onClick={() => { setCategory(cat.name); setActiveNav('#categories'); document.getElementById('items')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}><span className="category-icon"><CategoryIcon size={17}/></span><span className="category-copy"><strong>{cat.name}</strong><small>{matchingItems.length} rencana · {formatMoney(categoryTarget)}</small></span><ArrowUpRight size={14} className="category-arrow"/></button>})}{categories.length === 0 && <button className="category-card liquid-panel" onClick={() => categoryDialog.show(true)}><span className="category-icon"><Plus size={17}/></span><span className="category-copy"><strong>Buat kategori</strong><small>Belum ada kategori</small></span></button>}</div></section>
          <div className="list-toolbar">{searchOpen && <label className="search-field"><Search size={15}/><input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari rumah, cincin, vendor…" aria-label="Cari kebutuhan"/><button onClick={() => { setSearchOpen(false); setSearchQuery('') }} aria-label="Tutup pencarian"><X size={15}/></button></label>}<div className="filter-row" role="tablist" aria-label="Filter kategori">{filterNames.map(name => <button role="tab" aria-selected={activeCategory === name} className={`filter-chip ${activeCategory === name ? 'selected' : ''}`} key={name} onClick={() => setCategory(name)}>{name}</button>)}</div></div>
          <div className="needs-list liquid-panel">{filteredItems.map(item => { const Icon = iconFor(item.icon); const pct = Math.min(100, Math.round(item.saved / item.target * 100)); return <article className="need-row" key={item.id}><div className={`need-icon ${item.icon}`}><Icon size={19} /></div><div className="need-main"><div className="need-title-row"><h3>{item.name}</h3><span className="category-tag">{item.category}</span></div><div className="need-progress-track"><span style={{ width: `${pct}%` }} /></div><div className="need-meta"><span>{formatMoney(item.saved)} <span className="muted">terkumpul</span></span><span>{pct}%</span></div></div><div className="need-target"><span>Target</span><strong>{formatMoney(item.target)}</strong><small><Clock3 size={12} /> {item.due}</small></div><div className="row-actions"><button className="add-fund-button" onClick={() => itemDialog.show({ item })} aria-label={`Ubah atau hapus ${item.name}`}><Pencil size={14} /></button><button className="add-fund-button" onClick={() => openDeposits(item)} aria-label={`Tambah tabungan untuk ${item.name}`}><Plus size={16} /></button></div></article> })}{filteredItems.length === 0 && <div className="empty-state">{items.length === 0 ? 'Belum ada kebutuhan. Klik “Tambah kebutuhan” untuk mulai.' : 'Tidak ada kebutuhan yang cocok. Coba kata kunci atau kategori lain.'}</div>}</div>

          <section className="bottom-grid"><article className="tradition-card liquid-panel"><div className="tradition-label"><span className="mini-spark">✳</span> CERITA DI BALIK RENCANA</div><h2>Merangkai dua cerita,<br /><em>dalam satu tradisi.</em></h2><p>Rencanakan momen lamaran dan pernikahan adat Sunda dengan detail yang terasa dekat di hati.</p><div className="tradition-tags"><span>Adat Sunda</span><span>Seserahan 7 macam</span><span>Akad & resepsi</span></div><button className="text-action" onClick={() => { setCategory('Lamaran'); navigate('#items') }}>Lihat kebutuhan lamaran <ArrowUpRight size={15} /></button><div className="tradition-illustration"><div className="sun"/><div className="arch arch-back"/><div className="arch arch-front"/><div className="hill"/></div></article><article className="activity-card liquid-panel" id="timeline"><div className="activity-heading"><div><div className="section-kicker">CATATAN TERBARU</div><h2>Linimasa</h2></div><button className="more-button" aria-label="Kelola linimasa" onClick={() => activityDialog.show(true)}>···</button></div><div className="activity-list">{activities.slice(0, 5).map((activity, index) => <div className="activity-item" key={activity.id}><span className={`activity-symbol ${index === 0 ? 'coral-bg' : index === 1 ? 'green-bg' : 'violet-bg'}`}>{activity.amount ? <ArrowDownLeft size={15}/> : index === 1 ? <Check size={15}/> : <NotebookPen size={14}/>}</span><div><strong>{activity.title}</strong><small>{activity.detail}</small></div>{activity.amount ? <span className="activity-amount">+ {formatMoney(activity.amount)}</span> : <span className="activity-time">{activity.time}</span>}</div>)}{activities.length === 0 && <p className="empty-activity">Aktivitas akan muncul di sini setelah rencana diperbarui.</p>}</div><div className="activity-links"><button className="all-activity" onClick={() => activityDialog.show(true)}><Pencil size={12}/> Kelola linimasa</button><button className="all-activity" onClick={() => navigate('#items')}>Kelola semua kebutuhan <ArrowUpRight size={14}/></button></div></article></section>
          <section className="settings-panel liquid-panel" id="settings"><div className="settings-intro"><div className="settings-icon"><Settings2 size={18}/></div><div><div className="section-kicker">ATUR RENCANA KALIAN</div><h2>Pengaturan perjalanan</h2><p>Nama pasangan dan tanggal target acara.</p></div></div><form className="settings-form" onSubmit={saveSettings}><label>Nama pertama<input value={nameOneDraft} onChange={event => { setNameOneDraft(event.target.value); setSettingsSaved(false) }} placeholder="Nama kamu" maxLength={60} required /></label><label>Nama pasangan<input value={nameTwoDraft} onChange={event => { setNameTwoDraft(event.target.value); setSettingsSaved(false) }} placeholder="Nama pasangan" maxLength={60} required /></label><label className="target-date-field">Tanggal target<input type="date" value={targetDateDraft} onChange={event => { setTargetDateDraft(event.target.value); setSettingsSaved(false) }} required /></label><button className="primary-button settings-save" type="submit" disabled={settingsPending}><Check size={15}/>{settingsPending ? 'Menyimpan…' : 'Simpan pengaturan'}</button>{(settingsError || settingsSaved) && <p className={`form-status ${settingsError ? 'is-error' : ''}`} role="status">{settingsError ?? 'Pengaturan tersimpan.'}</p>}</form><div className="settings-preview"><span className="couple-avatar">{coupleNameOne[0]}<span>&</span>{coupleNameTwo[0]}</span><div><strong>{coupleNameOne} & {coupleNameTwo}</strong><small>Target hari bahagia · {targetDateLabel}</small></div></div></section>
          <section className="help-panel liquid-panel" id="help-panel"><div><div className="section-kicker">CARA MEMAKAI RANGKAI</div><h2>Mulai dari rencana, lanjutkan dengan tabungan.</h2><p>Kelola kategori, tambah atau ubah kebutuhan lewat tombol pensil, lalu catat, ubah, atau hapus setoran lewat tombol + pada tiap item. Catatan linimasa bisa ditambah dan dirapikan dari tombol ···. Semua perubahan langsung tersimpan di database.</p></div><div className="help-steps"><span><b>01</b> Atur kategori</span><span><b>02</b> Tentukan target</span><span><b>03</b> Catat tabungan</span></div></section>
          <footer className="footer"><span>Rangkai <Heart size={11}/> perjalanan kalian.</span><span>Semua rencana, satu cerita.</span></footer>
        </div>
      </section>
      {mobileNavOpen && <div className="mobile-nav-backdrop" onClick={() => setMobileNavOpen(false)}><section className="mobile-nav-panel" role="dialog" aria-modal="true" aria-label="Menu utama" onClick={event => event.stopPropagation()}><div className="mobile-nav-header"><a className="brand" href="#overview" onClick={() => navigate('#overview')}><span className="brand-mark"><Heart size={17} fill="currentColor" /></span><span>rangkai<span className="brand-dot">.</span></span></a><button className="dialog-close" onClick={() => setMobileNavOpen(false)} aria-label="Tutup menu"><X size={18}/></button></div><div className="workspace-label">MENU PERENCANAAN</div><nav className="side-nav">{navItems.map(({ label, href, icon: Icon }) => <button type="button" className={`nav-link ${activeNav === href ? 'active' : ''}`} key={href} onClick={() => navigate(href)}><Icon size={17}/>{label}{href === '#items' && <span className="nav-count">{items.length}</span>}</button>)}</nav><div className="mobile-couple"><span className="couple-avatar">{coupleNameOne[0]}<span>&</span>{coupleNameTwo[0]}</span><div><strong>{coupleNameOne} & {coupleNameTwo}</strong><small>{items.length} kebutuhan direncanakan</small></div></div></section></div>}

      <FormDialog
        open={itemDialog.open}
        onOpenChange={itemDialog.onOpenChange}
        onOpenChangeComplete={itemDialog.onOpenChangeComplete}
        icon={editingItem ? <Pencil size={18}/> : <Sparkles size={19}/>}
        kicker={editingItem ? 'UBAH RENCANA' : 'SATU LANGKAH LAGI'}
        title={editingItem ? 'Ubah kebutuhan' : 'Tambah kebutuhan'}
        description={editingItem ? 'Perbarui nama, kategori, target, atau bulan target.' : 'Rencana kecil yang mendekatkan kalian pada hari besar.'}
        initialFocus={itemNameRef}
      >
        {itemDialog.data && (
          <ItemForm
            key={itemDialog.key}
            item={editingItem}
            categories={categories}
            depositCount={editingItem ? depositsByItem.get(editingItem.id)?.length ?? 0 : 0}
            nameRef={itemNameRef}
            onDone={itemDialog.hide}
            onManageDeposits={editingItem ? () => { itemDialog.hide(); openDeposits(editingItem) } : undefined}
            onManageCategories={() => { itemDialog.hide(); categoryDialog.show(true) }}
          />
        )}
      </FormDialog>

      <FormDialog
        open={depositDialog.open}
        onOpenChange={depositDialog.onOpenChange}
        onOpenChangeComplete={depositDialog.onOpenChangeComplete}
        icon={<Wallet size={19}/>}
        kicker="SEDIKIT DEMI SEDIKIT"
        title="Tabungan"
        description={depositItem?.name ?? depositTarget?.name}
        initialFocus={depositAmountRef}
        wide
      >
        {depositTarget && <DepositManager key={depositDialog.key} item={depositItem} deposits={depositsByItem.get(depositTarget.itemId) ?? []} amountRef={depositAmountRef} />}
      </FormDialog>

      <FormDialog
        open={categoryDialog.open}
        onOpenChange={categoryDialog.onOpenChange}
        onOpenChangeComplete={categoryDialog.onOpenChangeComplete}
        icon={<Tag size={18}/>}
        kicker="AREA RENCANA"
        title="Kelola kategori"
        description="Tambah, ganti nama atau ikon, dan hapus kategori yang tidak dipakai."
        initialFocus={categoryNameRef}
        wide
      >
        {categoryDialog.data && <CategoryManager key={categoryDialog.key} categories={categories} items={items} nameRef={categoryNameRef} />}
      </FormDialog>

      <FormDialog
        open={activityDialog.open}
        onOpenChange={activityDialog.onOpenChange}
        onOpenChangeComplete={activityDialog.onOpenChangeComplete}
        icon={<NotebookPen size={18}/>}
        kicker="CATATAN PERJALANAN"
        title="Kelola linimasa"
        description="Tambah catatan sendiri, ubah, atau hapus aktivitas."
        initialFocus={activityTitleRef}
        wide
      >
        {activityDialog.data && <ActivityManager key={activityDialog.key} activities={activities} titleRef={activityTitleRef} />}
      </FormDialog>
    </main>
  )
}
