import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { Route } from './+types/home'
import { useInfiniteCollections } from './useInfiniteCollections'

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Vendula London Handbag Library' },
    {
      name: 'description',
      content: 'An archives library of all seasons, designs, collections of Vendula London bags for all the Vendulettes out there',
    },
  ]
}

export async function clientLoader() {
  const res = await fetch('/api/collections')
  const collections = res.ok ? await res.json() : []
  return { collections }
}

export function HydrateFallback() {
  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100">
      <div className="spinner-border text-secondary" role="status">
        <span className="visually-hidden">Loading…</span>
      </div>
    </div>
  )
}

function parseImages(value: any): string[] {
  if (Array.isArray(value)) return Array.from(new Set(value.filter(Boolean)))
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return Array.from(new Set(parsed.filter(Boolean)))
    } catch {}
  }
  return []
}

function toProperCase(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .split(/[\s\-_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function uniq(arr: string[]): string[] {
  return Array.from(new Set(arr.filter(Boolean)))
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { collections } = loaderData

  const [search, setSearch] = useState('')
  const [season, setSeason] = useState<string | null>(null)
  const [series, setSeries] = useState<string | null>(null)
  const [shape, setShape] = useState<string | null>(null)
  const [showAdmin, setShowAdmin] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)

  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const normalizedCollections = useMemo(() => {
    return (Array.isArray(collections) ? collections : []).map((col: any) => {
      const designs = Array.isArray(col.designs) ? col.designs : []
      const collectionImages = parseImages(col.imageurls ?? col.image_urls)
      const designImages = uniq(designs.flatMap((d: any) => parseImages(d.imageurls ?? d.image_urls)))

      return {
        ...col,
        designs,
        collectionImages,
        thumbnail: collectionImages[0] ?? designImages[0] ?? null,
      }
    })
  }, [collections, refreshTick])

  const seasons = useMemo(
    () => Array.from(new Set(normalizedCollections.map((c: any) => c.season).filter(Boolean))),
    [normalizedCollections],
  )

  const seriesList = useMemo(
    () => Array.from(new Set(normalizedCollections.map((c: any) => c.series).filter(Boolean))),
    [normalizedCollections],
  )

  const shapeList = useMemo(() => {
    return Array.from(
      new Set(
        normalizedCollections
          .flatMap((c: any) => c.designs)
          .map((d: any) => String(d.shape_name ?? d.shape ?? '').trim())
          .filter(Boolean),
      ),
    ).sort()
  }, [normalizedCollections])

  const filteredCollections = useMemo(() => {
    const term = search.trim().toLowerCase()

    return normalizedCollections
      .map((c: any) => {
        const collectionMatches =
          !term ||
          [c.name, c.description, c.season, c.series, c.releaseyear ?? c.release_year]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(term)

        const filteredDesigns = c.designs.filter((d: any) => {
          const designShape = String(d.shape_name?? d.shape ?? '').trim().toLowerCase()

          if (shape && designShape !== shape.toLowerCase()) return false
          if (!term) return true

          const haystack = [
            d.name,
            d.description,
            d.shape_name,
            d.shape,
            ...(Array.isArray(d.categories) ? d.categories : []),
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          return haystack.includes(term)
        })

        return {
          ...c,
          filteredDesigns,
          collectionMatches,
        }
      })
      .filter((c: any) => {
        if (season && c.season !== season) return false
        if (series && c.series !== series) return false
        if (shape && c.filteredDesigns.length === 0) return false
        if (term && !c.collectionMatches && c.filteredDesigns.length === 0) return false
        return true
      })
      .sort(
        (a: any, b: any) =>
          Number(b.season ?? b.releaseyear ?? 0) -
          Number(a.season ?? a.releaseyear ?? 0),
      )
  }, [normalizedCollections, search, season, series, shape])

  const { visibleItems, hasMore, isLoadingMore, loadMoreRef } = useInfiniteCollections(
    filteredCollections,
    50,
  )

  const groupedByYear = useMemo(() => {
    return visibleItems.reduce((acc: Record<string, any[]>, col: any) => {
      const year = String(col.releaseyear ?? col.release_year ?? 'Unknown')
      if (!acc[year]) acc[year] = []
      acc[year].push(col)
      return acc
    }, {})
  }, [visibleItems])

  const years = useMemo(
    () => Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a)),
    [groupedByYear],
  )

  const openLightbox = (images: string[], index = 0) => {
    if (!images.length) return
    setLightboxImages(images)
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => setLightboxOpen(false)

  const nextImage = () =>
    setLightboxIndex((current) =>
      lightboxImages.length ? (current + 1) % lightboxImages.length : current,
    )

  const prevImage = () =>
    setLightboxIndex((current) =>
      lightboxImages.length
        ? (current - 1 + lightboxImages.length) % lightboxImages.length
        : current,
    )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') nextImage()
      if (e.key === 'ArrowLeft') prevImage()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [lightboxOpen, lightboxImages.length])

  const activeFilterCount = [search.trim(), season, series, shape].filter(Boolean).length

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top shadow-sm bg-danger-subtle">
        <div className="container-xl">
          <span className="navbar-brand fw-bold mb-0">Vendula Handbag Library</span>
          <span className="badge bg-secondary rounded-pill px-3">
            {filteredCollections.length} collection{filteredCollections.length !== 1 ? 's' : ''}
          </span>
          <div className="ms-auto d-flex align-items-center gap-2">
            <span className="fw-light fs-6 pe-2 mb-0 d-none d-md-inline">
              Want to help build out the Vendula library? Email me at{' '}
              <a
                href="mailto:hello@vendulette.com?subject=Vendulette%20Library%20enquiry&body=Hello%2C%0A%0AI%20would%20like%20to%20ask%20about..."
              >
                hello@vendulette.com
              </a>
            </span>
          </div>
        </div>
      </nav>

      <div className="container-xl py-4">
        <div className="row g-4">
          <aside className="col-lg-3">
            <div className="sticky-top" style={{ top: '72px' }}>
              <div className="card shadow-sm border">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-semibold mb-0">Filters</h6>

                    {activeFilterCount > 0 && (
                      <button
                        className="btn btn-sm btn-link text-danger p-0 text-decoration-none"
                        onClick={() => {
                          setSearch('')
                          setSeason(null)
                          setSeries(null)
                          setShape(null)
                        }}
                        type="button"
                      >
                        Clear all ({activeFilterCount})
                      </button>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="search-input" className="form-label small fw-medium text-muted">
                      Search
                    </label>
                    <input
                      id="search-input"
                      type="search"
                      className="form-control form-control-sm"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Collections, designs, shapes"
                    />
                  </div>

                  <div className="mb-3">
                    <label
                      htmlFor="season-select"
                      className="form-label small fw-medium text-muted"
                    >
                      Season
                    </label>
                    <select
                      id="season-select"
                      className="form-select form-select-sm"
                      value={season ?? ''}
                      onChange={(e) => setSeason(e.target.value || null)}
                    >
                      <option value="">All seasons</option>
                      {seasons.map((s) => (
                        <option key={s as string} value={s as string}>
                          {s as string}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label
                      htmlFor="series-select"
                      className="form-label small fw-medium text-muted"
                    >
                      Series
                    </label>
                    <select
                      id="series-select"
                      className="form-select form-select-sm"
                      value={series ?? ''}
                      onChange={(e) => setSeries(e.target.value || null)}
                    >
                      <option value="">All series</option>
                      {seriesList.map((s) => (
                        <option key={s as string} value={s as string}>
                          {s as string}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-0">
                    <label htmlFor="shape-select" className="form-label small fw-medium text-muted">
                      Shape
                    </label>
                    <select
                      id="shape-select"
                      className="form-select form-select-sm"
                      value={shape ?? ''}
                      onChange={(e) => setShape(e.target.value || null)}
                    >
                      <option value="">All shapes</option>
                      {shapeList.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="col-lg-9">
            {years.length === 0 ? (
              <div className="text-center py-5 px-3 text-muted">
                <div className="mb-2" style={{ fontSize: '2rem' }}>
                  👜
                </div>
                <div className="fw-medium">No collections found</div>
                <div className="small mt-1">Try adjusting your filters or search term.</div>
              </div>
            ) : (
              <div className="d-flex flex-column gap-5">
                {years.map((year) => (
                  <section key={year}>
                    <h2 className="h6 fw-semibold text-muted text-uppercase border-bottom pb-0 mb-0">
                      {/* {year} */}
                    </h2>

                    <div className="d-flex flex-column gap-3">
                      {groupedByYear[year].map((col: any) => {
                        const designs: any[] = Array.isArray(col.filteredDesigns)
                          ? col.filteredDesigns
                          : []

                        const collectionImages = uniq(col.collectionImages ?? [])
                        const designImages = uniq(
                          designs.flatMap((d: any) => parseImages(d.imageurls ?? d.image_urls)),
                        )
                        const collectionPhoto = collectionImages[0] ?? designImages[0] ?? null

                        return (
                          <article key={col.id} className="card shadow-sm border">
                            {/* Collection Banner */}
                            {collectionPhoto && (
                              <div 
                                className="position-relative rounded-top overflow-hidden" 
                                style={{ height: 280, cursor: 'pointer' }}
                                onClick={() => openLightbox(collectionImages.length ? collectionImages : designImages, 0)}
                              >
                                <img
                                  src={collectionPhoto}
                                  alt={col.name}
                                  loading="lazy"
                                  className="w-100 h-100"
                                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                                />
                                {/* Gradient overlay */}
                                <div className="position-absolute bottom-0 start-0 w-100 p-3" 
                                     style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                                  <h3 className="text-white mb-1 fs-4">{col.name}</h3>
                                  <p className="text-white text-opacity-75 mb-0 small">
                                    {year} {col.season ? `· ${col.season}` : ''} {col.series ? `· ${col.series}` : ''} {col.type ? `· ${toProperCase(col.type)}` : ''}
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            <div className="card-body pt-3">
                              {designs.length > 0 && (
                                <div className="d-flex flex-column gap-2">
                                  {designs.map((d: any) => {
                                    const images = uniq(parseImages(d.imageurls ?? d.image_urls))
                                    const thumb = images[0] ?? null

                                    return (
                                      <div key={d.id} className="d-flex gap-3 p-3 rounded border bg-white">
                                        <div
                                          className="flex-shrink-0 rounded overflow-hidden bg-light border"
                                          style={{ width: 96, height: 96 }}
                                        >
                                          {thumb ? (
                                            <img
                                              src={thumb}
                                              alt={d.name}
                                              loading="lazy"
                                              width={96}
                                              height={96}
                                              className="w-100 h-100"
                                              style={{ objectFit: 'cover', cursor: 'pointer' }}
                                              onClick={() => openLightbox(images, 0)}
                                            />
                                          ) : (
                                            <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                                              <small>No img</small>
                                            </div>
                                          )}
                                        </div>
                                        
                                        <div className="min-w-0 flex-grow-1">
                                          <div className="fw-medium d-flex flex-row justify-content-between" style={{ fontSize: '0.9rem' }}>
                                            <h6 className="pb-0 m-0">{d.name}</h6>
                                            <p className="fw-light pb-0 m-0">
                                              {col.season || ''}{' '} 
                                              {year ? `| ${year}` : ''}
                                            </p>
                                          </div>

                                          <p className="mb-1 small text-muted fw-medium pb-2" style={{ fontSize: '0.75rem' }}>
                                            {d.shape_name || ''}{' '}
                                            {d.size ? `· ${d.size}` : ''}
                                          </p>

                                          {d.measurements && (
                                            <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
                                              Dimensions: {d.measurements}
                                            </div>
                                          )}

                                          <Link
                                            to={`/collection/${col.id}`}
                                            className="btn btn-sm btn-outline-secondary small text-muted flex-shrink-0 float-end"
                                          >
                                            View 
                                          </Link>

                                          {images.length > 1 && (
                                            <div className="row g-1 mt-2 d-none">
                                              {images.slice(1, 6).map((src, idx) => (
                                                <div key={idx} className="col-auto">
                                                  <img
                                                    src={src}
                                                    alt={`${d.name} ${idx + 2}`}
                                                    loading="lazy"
                                                    width={36}
                                                    height={36}
                                                    className="rounded border"
                                                    style={{
                                                      width: 36,
                                                      height: 36,
                                                      objectFit: 'cover',
                                                      cursor: 'pointer',
                                                    }}
                                                    onClick={() => openLightbox(images, idx + 1)}
                                                  />
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}

            <div ref={loadMoreRef} className="py-4 text-center">
              {hasMore && isLoadingMore && (
                <div className="spinner-border spinner-border-sm text-secondary" role="status">
                  <span className="visually-hidden">Loading more…</span>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {showAdmin && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAdmin(false)
          }}
        >
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-semibold">Admin Panel</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setShowAdmin(false)}
                />
              </div>
              <div className="modal-body">
                <p className="text-muted mb-0">Admin tools coming soon.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {lightboxOpen && lightboxImages.length > 0 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={closeLightbox}
        >
          <button
            type="button"
            aria-label="Previous image"
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1,
            }}
            className="btn btn-dark btn-sm rounded-circle opacity-75"
            onClick={(e) => {
              e.stopPropagation()
              prevImage()
            }}
          >
            ‹
          </button>

          <img
            src={lightboxImages[lightboxIndex]}
            alt="Expanded view"
            style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          />

          <button
            type="button"
            aria-label="Next image"
            style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1,
            }}
            className="btn btn-dark btn-sm rounded-circle opacity-75"
            onClick={(e) => {
              e.stopPropagation()
              nextImage()
            }}
          >
            ›
          </button>

          <button
            type="button"
            aria-label="Close lightbox"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              zIndex: 1,
            }}
            className="btn btn-dark btn-sm rounded-circle opacity-75"
            onClick={(e) => {
              e.stopPropagation()
              closeLightbox()
            }}
          >
            ✕
          </button>

          <div
            style={{
              position: 'absolute',
              bottom: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
            className="badge bg-dark opacity-75"
          >
            {lightboxIndex + 1} / {lightboxImages.length}
          </div>
        </div>
      )}
    </>
  )
}