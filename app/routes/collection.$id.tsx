import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { Route } from './+types/collections.$id'

export function meta({ data }: Route.MetaArgs) {
  const name = data?.collection?.name ?? 'Collection'
  return [
    { title: `${name} | Vendula London Handbag Library` },
    { name: 'description', content: `Collection details, designs, and admin tools for ${name}.` },
  ]
}

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const res = await fetch(`/api/collections/${params.id}`)
  const collection = res.ok ? await res.json() : null
  return { collection }
}

export function HydrateFallback() {
  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100">
      <div className="spinner-border text-secondary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  )
}

function parseImages(value: any): string[] {
  if (Array.isArray(value)) return Array.from(new Set(value.filter(Boolean)))
  if (typeof value !== 'string' || !value.trim()) return []
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return Array.from(new Set(parsed.filter(Boolean)))
  } catch {}
  return []
}

function uniq(arr: string[]): string[] {
  return Array.from(new Set(arr.filter(Boolean)))
}

function toTextValue(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }
  if (Array.isArray(value)) {
    const joined = value.map((item) => String(item).trim()).filter(Boolean).join(', ')
    return joined || null
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value).trim() || null
}

function toFormString(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean).join(', ')
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

type AdminTab = 'collection' | 'designs' | 'shapes'

type CollectionPayload = {
  id?: string
  name: string
  description?: string
  season?: string
  series?: string
  edition?: string
  release_year?: string
  themes?: string
  colours?: string
  name_friendly?: string
  type?: string
  image_urls?: string
  releaseDate?: string
  exclusive?: string
  isComplete?: string
}

type DesignPayload = {
  id?: string
  name: string
  description?: string
  price?: string
  shape_id?: string
  shape_name_overwrite?: string
  shape_measurements_overwrite?: string
  shape_size_overwrite?: string
  shape_details_overwrite?: string
  collectionId?: string
}

type ShapePayload = {
  id?: string
  name: string
  description?: string
  measurements?: string
  category?: string
  size?: string
}

function ImageGallery({ images, title, onOpen }: { images: string[]; title: string; onOpen: (index: number) => void }) {
  const [loaded, setLoaded] = useState<Record<number, boolean>>({})

  return (
    <div className="row g-3">
      {images.map((src, idx) => (
        <div key={`${src}-${idx}`} className="col-6 col-md-4">
          <button
            type="button"
            className="btn p-0 border-0 bg-transparent w-100"
            onClick={() => onOpen(idx)}
            aria-label={`Open ${title} image ${idx + 1}`}
          >
            <div
              className="bg-light border rounded overflow-hidden position-relative"
              style={{ aspectRatio: '1 / 1' }}
            >
              {!loaded[idx] && (
                <div className="position-absolute top-50 start-50 translate-middle text-muted small">
                  Loading...
                </div>
              )}
              <img
                src={src}
                alt={`${title} ${idx + 1}`}
                loading="lazy"
                decoding="async"
                fetchPriority={idx === 0 ? 'high' : 'auto'}
                width={300}
                height={300}
                className="w-100 h-100"
                style={{ objectFit: 'cover', opacity: loaded[idx] ? 1 : 0, transition: 'opacity 180ms ease' }}
                onLoad={() => setLoaded((prev) => ({ ...prev, [idx]: true }))}
              />
            </div>
          </button>
        </div>
      ))}
    </div>
  )
}

function Lightbox({
  open,
  images,
  index,
  onClose,
  onNext,
  onPrev,
}: {
  open: boolean
  images: string[]
  index: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNext()
      if (e.key === 'ArrowLeft') onPrev()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, onNext, onPrev])

  if (!open || images.length === 0) return null

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Previous image"
        className="btn btn-dark btn-sm rounded-circle opacity-75 position-absolute"
        style={{ left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}
        onClick={(e) => {
          e.stopPropagation()
          onPrev()
        }}
      >
        ‹
      </button>
      <img
        src={images[index]}
        alt="Expanded view"
        style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain' }}
        onClick={(e) => e.stopPropagation()}
        decoding="async"
      />
      <button
        type="button"
        aria-label="Next image"
        className="btn btn-dark btn-sm rounded-circle opacity-75 position-absolute"
        style={{ right: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}
        onClick={(e) => {
          e.stopPropagation()
          onNext()
        }}
      >
        ›
      </button>
      <button
        type="button"
        aria-label="Close lightbox"
        className="btn btn-dark btn-sm rounded-circle opacity-75 position-absolute"
        style={{ top: '1rem', right: '1rem', zIndex: 1 }}
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      >
        ×
      </button>
      <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3">
        <span className="badge bg-dark opacity-75">
          {index + 1} / {images.length}
        </span>
      </div>
    </div>
  )
}

export default function CollectionDetail({ loaderData }: Route.ComponentProps) {
  const initialCollection = loaderData.collection
  const [collection, setCollection] = useState(initialCollection)
  const [showAdmin, setShowAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState<AdminTab>('collection')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'danger' | 'text-bg-info'; text: string } | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const normalizedCollection = useMemo(() => {
    if (!collection) return null
    const designs = Array.isArray(collection.designs) ? collection.designs : []
    const collectionImages = parseImages(collection.image_urls ?? collection.imageurls)
    return {
      ...collection,
      designs,
      collectionImages,
    }
  }, [collection])

  const [collectionForm, setCollectionForm] = useState<CollectionPayload>({
    id: initialCollection?.id,
    name: toFormString(initialCollection?.name),
    description: toFormString(initialCollection?.description),
    season: toFormString(initialCollection?.season),
    series: toFormString(initialCollection?.series),
    edition: toFormString(initialCollection?.edition),
    release_year: initialCollection?.release_year != null ? String(initialCollection.release_year) : '',
    themes: toFormString(initialCollection?.themes),
    colours: toFormString(initialCollection?.colours),
    name_friendly: toFormString(initialCollection?.name_friendly),
    type: toFormString(initialCollection?.type),
    image_urls: toFormString(initialCollection?.image_urls),
    releaseDate: toFormString(initialCollection?.releaseDate),
    exclusive: toFormString(initialCollection?.exclusive),
    isComplete: toFormString(initialCollection?.isComplete),
  })

  const emptyDesign: DesignPayload = {
    id: '',
    name: '',
    description: '',
    price: '',
    shape_id: '',
    shape_name_overwrite: '',
    shape_measurements_overwrite: '',
    shape_size_overwrite: '',
    shape_details_overwrite: '',
    collectionId: initialCollection?.id,
  }
  const [designForm, setDesignForm] = useState<DesignPayload>(emptyDesign)

  const emptyShape: ShapePayload = {
    id: '',
    name: '',
    description: '',
    measurements: '',
    category: '',
    size: '',
  }
  const [shapeForm, setShapeForm] = useState<ShapePayload>(emptyShape)

  const shapeNames = useMemo(() => {
    if (!normalizedCollection) return []
    return Array.from(
      new Set(
        normalizedCollection.designs
          .map((d: any) => String(d.shape_name ?? d.shape_id ?? '').trim())
          .filter(Boolean)
      )
    ).sort()
  }, [normalizedCollection])

  async function refreshCollection() {
    if (!normalizedCollection?.id) return
    const res = await fetch(`/api/collections/${normalizedCollection.id}`)
    const updated = res.ok ? await res.json() : null
    setCollection(updated)
  }

  function openLightbox(images: string[], index = 0) {
    if (!images.length) return
    setLightboxImages(images)
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  function closeLightbox() {
    setLightboxOpen(false)
  }

  function nextImage() {
    setLightboxIndex((current) => (lightboxImages.length ? (current + 1) % lightboxImages.length : current))
  }

  function prevImage() {
    setLightboxIndex((current) =>
      lightboxImages.length ? (current - 1 + lightboxImages.length) % lightboxImages.length : current
    )
  }

  async function handleUpdateCollection(e: React.FormEvent) {
    e.preventDefault()
    if (!normalizedCollection?.id) return
    setSaving(true)
    setMessage(null)

    const payload = {
      name: toTextValue(collectionForm.name),
      description: toTextValue(collectionForm.description),
      season: toTextValue(collectionForm.season),
      series: toTextValue(collectionForm.series),
      edition: toTextValue(collectionForm.edition),
      release_year: collectionForm.release_year ? Number(collectionForm.release_year) : null,
      themes: toTextValue(collectionForm.themes),
      colours: toTextValue(collectionForm.colours),
      name_friendly: toTextValue(collectionForm.name_friendly),
      type: toTextValue(collectionForm.type),
      image_urls: toTextValue(collectionForm.image_urls),
      releaseDate: toTextValue(collectionForm.releaseDate),
      exclusive: toTextValue(collectionForm.exclusive),
      isComplete: collectionForm.isComplete ? Number(collectionForm.isComplete) : null,
    }

    try {
      const res = await fetch(`/api/admin/collections/${normalizedCollection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const text = await res.text()
      if (!res.ok) throw new Error(text || `Update failed with status ${res.status}`)
      await refreshCollection()
      setMessage({ type: 'success', text: 'Collection updated successfully.' })
    } catch (error: any) {
      setMessage({ type: 'danger', text: error.message || 'Failed to update collection.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveDesign(e: React.FormEvent) {
    e.preventDefault()
    if (!normalizedCollection?.id) return
    setSaving(true)
    setMessage(null)
    const isUpdate = Boolean(designForm.id)

    try {
      const res = await fetch(isUpdate ? `/api/admin/designs/${designForm.id}` : '/api/designs', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...designForm,
          collection_id: normalizedCollection.id,
        }),
      })
      const text = await res.text()
      if (!res.ok) throw new Error(text || `Design save failed with status ${res.status}`)
      await refreshCollection()
      setMessage({ type: 'success', text: isUpdate ? 'Design updated successfully.' : 'Design created successfully.' })
      setDesignForm({ ...emptyDesign, collectionId: normalizedCollection.id })
    } catch (error: any) {
      setMessage({ type: 'danger', text: error.message || 'Failed to save design.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveShape(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    const isUpdate = Boolean(shapeForm.id)

    try {
      const res = await fetch(isUpdate ? `/api/admin/shapes/${shapeForm.id}` : '/api/shapes', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shapeForm),
      })
      const text = await res.text()
      if (!res.ok) throw new Error(text || `Shape save failed with status ${res.status}`)
      setMessage({ type: 'success', text: isUpdate ? 'Shape updated successfully.' : 'Shape created successfully.' })
      setShapeForm(emptyShape)
      await refreshCollection()
    } catch (error: any) {
      setMessage({ type: 'danger', text: error.message || 'Failed to save shape.' })
    } finally {
      setSaving(false)
    }
  }

  if (!normalizedCollection) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning mb-4">Collection not found.</div>
        <Link to="/" className="btn btn-outline-white text-white me-3" >
          Back to library
        </Link>
      </div>
    )
  }

  const collectionImages = uniq(normalizedCollection.collectionImages)
  const allDesignImages = uniq(normalizedCollection.designs.flatMap((d: any) => parseImages(d.image_urls ?? d.imageurls)))

  return (
    <>
       <div className="navbar navbar-expand-lg navbar-light border-bottom sticky-top shadow-sm mb-5"  style={{ zIndex: 1030, top: 66 , backgroundColor: '#fa8ebf'}}>
        <div className="container-xl">
          <Link to="/" className="navbar-brand fw-bold text-white text-decoration-none" >
            Vendula Handbag Library: Collection: {normalizedCollection.name}
          </Link>
          <div className="ms-auto d-flex gap-2" style={{
   
    backgroundColor: '#cb2182',

   
  }}>
            <Link to="/" className="btn btn-sm btn-outline-white text-white" style={{
   
    backgroundColor: '#cb2182',

   
  }}>
              Back to library
            </Link>
            {/* <button type="button" className="btn btn-sm btn-dark d-none" onClick={() => setShowAdmin(true)}>
              Admin
            </button> */}
          </div>
        </div>
      </div>

   

      <div className="container-xl py-4">
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card shadow-sm border mb-4">
              <div className="card-body">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
                  <div>
                    <p className="text-muted small mb-1">
                      {normalizedCollection.season || 'Unknown season'}
                      {normalizedCollection.series ? ` • ${normalizedCollection.series}` : ''}
                    </p>
                    <h1 className="h3 fw-bold mb-1">{normalizedCollection.name}</h1>
                    <p className="text-muted mb-0">
                      Release year: {normalizedCollection.release_year ?? 'Unknown'}
                    </p>
                  </div>
                  <span className="badge bg-secondary rounded-pill">
                    {normalizedCollection.designs.length} design{normalizedCollection.designs.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {normalizedCollection.description ? <p className="mb-0">{normalizedCollection.description}</p> : null}
              </div>
            </div>

            {collectionImages.length > 0 && (
              <div className="card shadow-sm border mb-4">
                <div className="card-header bg-light d-flex justify-content-between align-items-center">
                  <h2 className="h6 fw-semibold mb-0">Collection images</h2>
                  <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => setShowAdmin(true)}>
                    Edit collection
                  </button>
                </div>
                <div className="card-body">
                  <ImageGallery images={collectionImages} title={normalizedCollection.name} onOpen={(i) => openLightbox(collectionImages, i)} />
                </div>
              </div>
            )}

            <div className="card shadow-sm border">
              <div className="card-header bg-light d-flex justify-content-between align-items-center flex-wrap gap-2">
                <h2 className="h6 fw-semibold mb-0">Designs</h2>
                <span className="small text-muted">{normalizedCollection.designs.length} total</span>
              </div>
              <div className="card-body">
                {normalizedCollection.designs.length === 0 ? (
                  <div className="text-muted">No designs found for this collection.</div>
                ) : (
                  <div className="row g-3">
                    {normalizedCollection.designs.map((design: any) => {
                      const images = uniq(parseImages(design.image_urls ?? design.imageurls))
                      const thumb = images[0] ?? null
                      return (
                        <div key={design.id} className="col-12">
                          <div className="border rounded p-3 h-100">
                            <div className="row g-3">
                              <div className="col-md-3">
                                <div
                                  className="bg-light border rounded d-flex align-items-center justify-content-center overflow-hidden"
                                  style={{ minHeight: 180 }}
                                >
                                  {thumb ? (
                                    <img
                                      src={thumb}
                                      alt={design.name}
                                      loading="lazy"
                                      decoding="async"
                                      fetchPriority="low"
                                      width={320}
                                      height={320}
                                      className="img-fluid w-100 h-100"
                                      style={{ objectFit: 'cover', cursor: 'pointer' }}
                                      onClick={() => openLightbox(images, 0)}
                                    />
                                  ) : (
                                    <span className="text-muted small">No image</span>
                                  )}
                                </div>
                              </div>
                              <div className="col-md-9">
                                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                                  <div>
                                    <h3 className="h5 mb-1">{design.name}</h3>
                                    <div className="text-muted small">
                                      {design.shape_name || design.shape_id || 'No shape'}
                                    </div>
                                  </div>
                                  <div className="d-flex gap-2">
                                    {design.price != null && design.price !== '' ? (
                                      <span className="badge bg-light text-dark border">£{Number(design.price).toFixed(2)}</span>
                                    ) : null}
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-primary d-none"
                                      onClick={() => {
                                        setDesignForm({
                                          id: design.id,
                                          name: design.name,
                                          description: design.description,
                                          price: design.price != null ? String(design.price) : '',
                                          shape_id: design.shape_id,
                                          shape_name_overwrite: design.shape_name_overwrite ?? '',
                                          shape_measurements_overwrite: design.shape_measurements_overwrite ?? '',
                                          shape_size_overwrite: design.shape_size_overwrite ?? '',
                                          shape_details_overwrite: design.shape_details_overwrite ?? '',
                                          collectionId: normalizedCollection.id,
                                        })
                                        setActiveTab('designs')
                                        setShowAdmin(true)
                                      }}
                                    >
                                      Edit
                                    </button>
                                  </div>
                                </div>
                                {design.description ? <p className="mb-2">{design.description}</p> : null}
                                <div className="small text-muted mb-3">
                                  {design.measurements ? `Measurements: ${design.measurements}` : 'No measurements'}
                                </div>
                                {images.length > 1 && (
                                  <div className="d-flex gap-2 flex-wrap">
                                    {images.map((src, idx) => (
                                      <button
                                        key={`${src}-${idx}`}
                                        type="button"
                                        className="p-0 border-0 bg-transparent"
                                        onClick={() => openLightbox(images, idx)}
                                      >
                                        <img
                                          src={src}
                                          alt={`${design.name} ${idx + 1}`}
                                          loading="lazy"
                                          decoding="async"
                                          fetchPriority="low"
                                          width={64}
                                          height={64}
                                          className="rounded border"
                                          style={{ width: 64, height: 64, objectFit: 'cover', cursor: 'pointer' }}
                                        />
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card shadow-sm border mb-4">
              <div className="card-header bg-light">
                <h2 className="h6 fw-semibold mb-0">Collection details</h2>
              </div>
              <div className="card-body">
                <dl className="row mb-0">
                  <dt className="col-5 text-muted">Name</dt>
                  <dd className="col-7">{normalizedCollection.name}</dd>
                  <dt className="col-5 text-muted">Season</dt>
                  <dd className="col-7">{normalizedCollection.season}</dd>
                  <dt className="col-5 text-muted">Series</dt>
                  <dd className="col-7">{normalizedCollection.series}</dd>
                  <dt className="col-5 text-muted">Edition</dt>
                  <dd className="col-7">{normalizedCollection.edition}</dd>
                  <dt className="col-5 text-muted">Release year</dt>
                  <dd className="col-7">{normalizedCollection.release_year ?? '—'}</dd>
                  <dt className="col-5 text-muted">Friendly name</dt>
                  <dd className="col-7">{normalizedCollection.name_friendly}</dd>
                  <dt className="col-5 text-muted">Type</dt>
                  <dd className="col-7">{normalizedCollection.type}</dd>
                  <dt className="col-5 text-muted">Exclusive</dt>
                  <dd className="col-7">{normalizedCollection.exclusive}</dd>
                  <dt className="col-5 text-muted">Designs</dt>
                  <dd className="col-7">{normalizedCollection.designs.length}</dd>
                  <dt className="col-5 text-muted">Images</dt>
                  <dd className="col-7">{collectionImages.length + allDesignImages.length}</dd>
                </dl>
              </div>
            </div>

            <div className="card shadow-sm border mb-4">
              <div className="card-header bg-light">
                <h2 className="h6 fw-semibold mb-0">Themes and colours</h2>
              </div>
              <div className="card-body">
                <p className="mb-2">
                  <span className="fw-semibold">Themes:</span> {toFormString(normalizedCollection.themes)}
                </p>
                <p className="mb-0">
                  <span className="fw-semibold">Colours:</span> {toFormString(normalizedCollection.colours)}
                </p>
              </div>
            </div>

            <div className="card shadow-sm border d-none ">
              <div className="card-header bg-light">
                <h2 className="h6 fw-semibold mb-0">Admin shortcuts</h2>
              </div>
              <div className="card-body d-grid gap-2">
                <button type="button" className="btn btn-outline-dark" onClick={() => { setActiveTab('collection'); setShowAdmin(true) }}>
                  Edit collection
                </button>
                <button
                  type="button"
                  className="btn btn-outline-dark"
                  onClick={() => {
                    setDesignForm({ ...emptyDesign, collectionId: normalizedCollection.id })
                    setActiveTab('designs')
                    setShowAdmin(true)
                  }}
                >
                  Create design
                </button>
                <button
                  type="button"
                  className="btn btn-outline-dark"
                  onClick={() => {
                    setShapeForm(emptyShape)
                    setActiveTab('shapes')
                    setShowAdmin(true)
                  }}
                >
                  Create shape
                </button>
              </div>
            </div>
          </div>
        </div>

        {showAdmin && (
          <div
            className="modal d-block"
            tabIndex={-1}
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={(e) => e.target === e.currentTarget && setShowAdmin(false)}
          >
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-semibold">Admin</h5>
                  <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowAdmin(false)} />
                </div>
                {message && (
                  <div className={`alert alert-${message.type} alert-dismissible m-3 mb-0`} role="alert">
                    {message.text}
                    <button type="button" className="btn-close" onClick={() => setMessage(null)} />
                  </div>
                )}
                <div className="modal-body">
                  <ul className="nav nav-tabs mb-4">
                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link ${activeTab === 'collection' ? 'active' : ''}`}
                        onClick={() => setActiveTab('collection')}
                      >
                        Edit Collection
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link ${activeTab === 'designs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('designs')}
                      >
                        {designForm.id ? 'Edit Design' : 'Add Design'}
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link ${activeTab === 'shapes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('shapes')}
                      >
                        Shapes
                      </button>
                    </li>
                  </ul>

                  {activeTab === 'collection' && (
                    <form onSubmit={handleUpdateCollection}>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Name</label>
                          <input className="form-control" value={collectionForm.name} onChange={(e) => setCollectionForm((prev) => ({ ...prev, name: e.target.value }))} required />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">Season</label>
                          <input className="form-control" value={collectionForm.season ?? ''} onChange={(e) => setCollectionForm((prev) => ({ ...prev, season: e.target.value }))} />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">Series</label>
                          <input className="form-control" value={collectionForm.series ?? ''} onChange={(e) => setCollectionForm((prev) => ({ ...prev, series: e.target.value }))} />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">Release Year</label>
                          <input type="number" className="form-control" value={collectionForm.release_year ?? ''} onChange={(e) => setCollectionForm((prev) => ({ ...prev, release_year: e.target.value }))} />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">Edition</label>
                          <input className="form-control" value={collectionForm.edition ?? ''} onChange={(e) => setCollectionForm((prev) => ({ ...prev, edition: e.target.value }))} />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">Type</label>
                          <input className="form-control" value={collectionForm.type ?? ''} onChange={(e) => setCollectionForm((prev) => ({ ...prev, type: e.target.value }))} />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">Exclusive</label>
                          <input className="form-control" value={collectionForm.exclusive ?? ''} onChange={(e) => setCollectionForm((prev) => ({ ...prev, exclusive: e.target.value }))} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Friendly Name</label>
                          <input className="form-control" value={collectionForm.name_friendly ?? ''} onChange={(e) => setCollectionForm((prev) => ({ ...prev, name_friendly: e.target.value }))} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Themes</label>
                          <input className="form-control" value={collectionForm.themes ?? ''} onChange={(e) => setCollectionForm((prev) => ({ ...prev, themes: e.target.value }))} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Colours</label>
                          <input className="form-control" value={collectionForm.colours ?? ''} onChange={(e) => setCollectionForm((prev) => ({ ...prev, colours: e.target.value }))} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Release Date</label>
                          <input className="form-control" value={collectionForm.releaseDate ?? ''} onChange={(e) => setCollectionForm((prev) => ({ ...prev, releaseDate: e.target.value }))} placeholder="e.g. 2024-03-01" />
                        </div>
                        <div className="col-12">
                          <label className="form-label">Image URLs</label>
                          <textarea className="form-control" rows={3} value={collectionForm.image_urls ?? ''} onChange={(e) => setCollectionForm((prev) => ({ ...prev, image_urls: e.target.value }))} placeholder="JSON array or text stored in image_urls" />
                        </div>
                        <div className="col-12">
                          <label className="form-label">Description</label>
                          <textarea className="form-control" rows={4} value={collectionForm.description ?? ''} onChange={(e) => setCollectionForm((prev) => ({ ...prev, description: e.target.value }))} />
                        </div>
                        <div className="col-12">
                          <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving…' : 'Update collection'}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {activeTab === 'designs' && (
                    <div className="row g-4">
                      <div className="col-md-5">
                        <form onSubmit={handleSaveDesign}>
                          <div className="mb-3">
                            <label className="form-label">Name</label>
                            <input className="form-control" value={designForm.name} onChange={(e) => setDesignForm((prev) => ({ ...prev, name: e.target.value }))} required />
                          </div>
                          <div className="row g-3 mb-3">
                            <div className="col">
                              <label className="form-label">Shape ID</label>
                              <input className="form-control" value={designForm.shape_id ?? ''} onChange={(e) => setDesignForm((prev) => ({ ...prev, shape_id: e.target.value }))} />
                            </div>
                            <div className="col">
                              <label className="form-label">Override Shape Name</label>
                              <input className="form-control" value={designForm.shape_name_overwrite ?? ''} onChange={(e) => setDesignForm((prev) => ({ ...prev, shape_name_overwrite: e.target.value }))} />
                            </div>
                          </div>
                          <div className="row g-3 mb-3">
                            <div className="col">
                              <label className="form-label">Price</label>
                              <input type="number" step="0.01" className="form-control" value={designForm.price ?? ''} onChange={(e) => setDesignForm((prev) => ({ ...prev, price: e.target.value }))} />
                            </div>
                            <div className="col">
                              <label className="form-label">Measurements Override</label>
                              <input className="form-control" value={designForm.shape_measurements_overwrite ?? ''} onChange={(e) => setDesignForm((prev) => ({ ...prev, shape_measurements_overwrite: e.target.value }))} />
                            </div>
                          </div>
                          <div className="row g-3 mb-3">
                            <div className="col">
                              <label className="form-label">Size Override</label>
                              <input className="form-control" value={designForm.shape_size_overwrite ?? ''} onChange={(e) => setDesignForm((prev) => ({ ...prev, shape_size_overwrite: e.target.value }))} />
                            </div>
                            <div className="col">
                              <label className="form-label">Details Override</label>
                              <input className="form-control" value={designForm.shape_details_overwrite ?? ''} onChange={(e) => setDesignForm((prev) => ({ ...prev, shape_details_overwrite: e.target.value }))} />
                            </div>
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Description</label>
                            <textarea className="form-control" rows={4} value={designForm.description ?? ''} onChange={(e) => setDesignForm((prev) => ({ ...prev, description: e.target.value }))} />
                          </div>
                          <div className="d-flex gap-2">
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                              {saving ? 'Saving…' : designForm.id ? 'Update design' : 'Create design'}
                            </button>
                            {designForm.id ? (
                              <button type="button" className="btn btn-outline-secondary" onClick={() => setDesignForm({ ...emptyDesign, collectionId: normalizedCollection.id })}>
                                Cancel edit
                              </button>
                            ) : null}
                          </div>
                        </form>
                      </div>
                      <div className="col-md-7">
                        <h6 className="fw-semibold mb-3">Designs in this collection</h6>
                        <div className="list-group" style={{ maxHeight: 420, overflowY: 'auto' }}>
                          {normalizedCollection.designs.map((d: any) => (
                            <div key={d.id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                              <div>
                                <div className="fw-medium">{d.name}</div>
                                <div className="small text-muted">{d.shape_name || d.shape_id || 'No shape'}</div>
                              </div>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() =>
                                  setDesignForm({
                                    id: d.id,
                                    name: d.name,
                                    description: d.description,
                                    price: d.price != null ? String(d.price) : '',
                                    shape_id: d.shape_id,
                                    shape_name_overwrite: d.shape_name_overwrite ?? '',
                                    shape_measurements_overwrite: d.shape_measurements_overwrite ?? '',
                                    shape_size_overwrite: d.shape_size_overwrite ?? '',
                                    shape_details_overwrite: d.shape_details_overwrite ?? '',
                                    collectionId: normalizedCollection.id,
                                  })
                                }
                              >
                                Edit
                              </button>
                            </div>
                          ))}
                          {normalizedCollection.designs.length === 0 && <div className="list-group-item text-muted">No designs yet.</div>}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'shapes' && (
                    <div className="row g-4">
                      <div className="col-md-5">
                        <form onSubmit={handleSaveShape}>
                          <div className="mb-3">
                            <label className="form-label">Shape name</label>
                            <input className="form-control" value={shapeForm.name} onChange={(e) => setShapeForm((prev) => ({ ...prev, name: e.target.value }))} required />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Category</label>
                            <input className="form-control" value={shapeForm.category ?? ''} onChange={(e) => setShapeForm((prev) => ({ ...prev, category: e.target.value }))} />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Measurements</label>
                            <input className="form-control" value={shapeForm.measurements ?? ''} onChange={(e) => setShapeForm((prev) => ({ ...prev, measurements: e.target.value }))} />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Size</label>
                            <input className="form-control" value={shapeForm.size ?? ''} onChange={(e) => setShapeForm((prev) => ({ ...prev, size: e.target.value }))} />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Description</label>
                            <textarea className="form-control" rows={4} value={shapeForm.description ?? ''} onChange={(e) => setShapeForm((prev) => ({ ...prev, description: e.target.value }))} />
                          </div>
                          <div className="d-flex gap-2">
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                              {saving ? 'Saving…' : shapeForm.id ? 'Update shape' : 'Create shape'}
                            </button>
                            {shapeForm.id ? (
                              <button type="button" className="btn btn-outline-secondary" onClick={() => setShapeForm(emptyShape)}>
                                Cancel edit
                              </button>
                            ) : null}
                          </div>
                        </form>
                      </div>
                      <div className="col-md-7">
                        <h6 className="fw-semibold mb-3">Shapes used in this collection</h6>
                        <div className="list-group" style={{ maxHeight: 420, overflowY: 'auto' }}>
                          {shapeNames.map((shapeName) => (
                            <div key={shapeName} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                              <span className="fw-medium">{shapeName}</span>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => setShapeForm({ ...emptyShape, name: shapeName })}
                              >
                                Edit
                              </button>
                            </div>
                          ))}
                          {shapeNames.length === 0 && <div className="list-group-item text-muted">No shapes found.</div>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Lightbox
        open={lightboxOpen}
        images={lightboxImages}
        index={lightboxIndex}
        onClose={closeLightbox}
        onNext={nextImage}
        onPrev={prevImage}
      />
    </>
  )
}