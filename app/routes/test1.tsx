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

function getCollectionYear(collection: any): number {
  const value = collection.releaseyear ?? collection.release_year
  const year = Number(value)

  return Number.isFinite(year) ? year : 0
}

function seasonRank(value: string | null | undefined): number {
  const seasonName = (value ?? '').toLowerCase()

  if (seasonName.includes('holiday') || seasonName.includes('christmas')) return 5
  if (seasonName.includes('winter')) return 4
  if (seasonName.includes('autumn') || seasonName.includes('fall')) return 3
  if (seasonName.includes('summer')) return 2
  if (seasonName.includes('spring')) return 1

  return 0
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

  // Track which design accordions are open
  const [openDesigns, setOpenDesigns] = useState<Record<number, boolean>>({})

  const toggleDesign = (designId: number) => {
    setOpenDesigns(prev => ({
      ...prev,
      [designId]: !prev[designId]
    }))
  }

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
        const designShape = String(d.shape_name ?? d.shape ?? '').trim().toLowerCase()

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

      // Never show a collection without designs.
      if (c.filteredDesigns.length === 0) return false

      // A search can match either collection metadata or a design.
      if (term && !c.collectionMatches && c.filteredDesigns.length === 0) return false

      return true
    })
    .sort((a: any, b: any) => {
      return (
        getCollectionYear(b) - getCollectionYear(a) ||
        seasonRank(b.season) - seasonRank(a.season) ||
        Number(b.sort_order ?? 0) - Number(a.sort_order ?? 0) ||
        String(a.name ?? '').localeCompare(String(b.name ?? ''))
      )
    })
}, [normalizedCollections, search, season, series, shape])

  const { visibleItems, hasMore, isLoadingMore, loadMoreRef } = useInfiniteCollections(
    filteredCollections,
    50,
  )


const collectionYear = (collection: any): number => {
  const value = collection.releaseyear ?? collection.release_year
  const year = Number(value)

  return Number.isFinite(year) ? year : 0
}

const seasonsSort = useMemo(() => {
  return uniq(
    normalizedCollections
      .map((collection: any) => String(collection.season ?? '').trim())
      .filter(Boolean),
  ).sort((a, b) => {
    const aYear = Math.max(
      ...normalizedCollections
        .filter((collection: any) => collection.season === a)
        .map(collectionYear),
      0,
    )

    const bYear = Math.max(
      ...normalizedCollections
        .filter((collection: any) => collection.season === b)
        .map(collectionYear),
      0,
    )

    // Year descending, then season descending
    return bYear - aYear || seasonRank(b) - seasonRank(a) || a.localeCompare(b)
  })
}, [normalizedCollections])

const groupedByYearAndSeason = useMemo(() => {
  return visibleItems.reduce(
    (groups: Record<string, Record<string, any[]>>, collection: any) => {
      const year = String(getCollectionYear(collection) || 'Unknown')
      const seasonName = String(collection.season ?? 'Uncategorised')

      if (!groups[year]) groups[year] = {}
      if (!groups[year][seasonName]) groups[year][seasonName] = []

      groups[year][seasonName].push(collection)

      return groups
    },
    {},
  )
}, [visibleItems])

const years = useMemo(() => {
  return Object.keys(groupedByYearAndSeason).sort((a, b) => {
    if (a === 'Unknown') return 1
    if (b === 'Unknown') return -1

    return Number(b) - Number(a)
  })
}, [groupedByYearAndSeason])

const seasonsForYear = (year: string) => {
  return Object.keys(groupedByYearAndSeason[year] ?? {}).sort((a, b) => {
    return seasonRank(b) - seasonRank(a) || a.localeCompare(b)
  })
}


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
      {/* <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top shadow-sm bg-danger-subtle">
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
      </nav> */}

      <div className="container-xl py-4">
        <div className="row g-4">
          <aside className="col-lg-3">
            <div className="sticky-top" style={{ top: '1rem' }}>
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
         <div className="sticky-top bg-white "  style={{ height: '2rem' }}>
      <h2 className="h4 fw-bold mb-4">{year}</h2>
</div>
      <div className="d-flex flex-column gap-5">
        {seasonsForYear(year).map((seasonName) => {
          const collectionsForSeason = groupedByYearAndSeason[year][seasonName]
            .filter((col: any) => Array.isArray(col.filteredDesigns) && col.filteredDesigns.length > 0)

          if (collectionsForSeason.length === 0) return null

          return (
            <div key={`${year}-${seasonName}`}>
                <div className="sticky-top bg-white pt-2" style={{ margin: '2rem' }}>
              <h3 className="h6 fw-semibold text-muted text-uppercase mb-3">
                {seasonName}
              </h3>
</div>
              <div className="d-flex flex-column gap-3">
                {collectionsForSeason.map((col: any) => {
                  const designs: any[] = col.filteredDesigns
                  const collectionImages = uniq(col.collectionImages ?? [])
                  const designImages = uniq(
                    designs.flatMap((design: any) =>
                      parseImages(design.imageurls ?? design.image_urls),
                    ),
                  )
                  const collectionPhoto = collectionImages[0] ?? designImages[0] ?? null

                  return (
                    <article key={col.id} className="card shadow-sm border">
                      {collectionPhoto && (
                        <div
                          className="position-relative rounded-top overflow-hidden"
                          style={{ height: 280, cursor: 'pointer' }}
                          onClick={() =>
                            openLightbox(
                              collectionImages.length ? collectionImages : designImages,
                              0,
                            )
                          }
                        >
                          <img
                            src={collectionPhoto}
                            alt={col.name}
                            loading="lazy"
                            className="w-100 h-100"
                            style={{ objectFit: 'cover', objectPosition: 'center' }}
                          />

                          <div
                            className="position-absolute bottom-0 start-0 w-100 p-3"
                            style={{
                              background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                            }}
                          >
                            <h3 className="text-white mb-1 fs-4">{col.name}</h3>
                            <p className="text-white text-opacity-75 mb-0 small">
                              {year}
                              {col.series ? ` · ${col.series}` : ''}
                              {col.type ? ` · ${toProperCase(col.type)}` : ''}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="card-body pt-3">
                        <div className="accordion" id={`accordion-${col.id}`}>
                          {designs.map((d: any) => {
                            const images = uniq(parseImages(d.imageurls ?? d.image_urls))
                            const thumb = images[0] ?? null
                            const isOpen = Boolean(openDesigns[d.id])

                            return (
                              <div key={d.id} className="accordion-item border mb-2 rounded">
                                <h4 className="accordion-header">
                                  <button
                                    className={`accordion-button d-flex align-items-center gap-3 py-3 ${
                                      isOpen ? '' : 'collapsed'
                                    }`}
                                    type="button"
                                    onClick={() => toggleDesign(d.id)}
                                    aria-expanded={isOpen}
                                    aria-controls={`design-collapse-${d.id}`}
                                  >
                                    <div
                                      className="flex-shrink-0 rounded overflow-hidden bg-light border"
                                      style={{ width: 64, height: 64 }}
                                    >
                                      {thumb ? (
                                        <img
                                          src={thumb}
                                          alt={d.name}
                                          loading="lazy"
                                          width={64}
                                          height={64}
                                          className="w-100 h-100"
                                          style={{ objectFit: 'cover', cursor: 'pointer' }}
                                          onClick={(event) => {
                                            event.stopPropagation()
                                            openLightbox(images, 0)
                                          }}
                                        />
                                      ) : (
                                        <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                                          <small>No img</small>
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex-grow-1 text-start">
                                      <div className="fw-medium" style={{ fontSize: '0.95rem' }}>
                                        {d.name}
                                      </div>
                                      <p
                                        className="mb-0 small text-muted fw-medium"
                                        style={{ fontSize: '0.8rem' }}
                                      >
                                        {d.shape_name || ''}
                                        {d.size ? ` · ${d.size}` : ''}
                                        {d.measurements ? ` · ${d.measurements}` : ''}
                                      </p>
                                    </div>
                                  </button>
                                </h4>

                                {isOpen && (
                                  <div
                                    id={`design-collapse-${d.id}`}
                                    className="accordion-collapse collapse show"
                                  >
                                    <div className="accordion-body bg-light">
                                      <div className="row g-3">
                                        {images.length > 0 && (
                                          <div className="col-md-4">
                                            <div className="rounded overflow-hidden border bg-white">
                                              <img
                                                src={images[0]}
                                                alt={d.name}
                                                loading="lazy"
                                                className="w-100"
                                                style={{ objectFit: 'cover', cursor: 'pointer' }}
                                                onClick={() => openLightbox(images, 0)}
                                              />
                                            </div>

                                            {images.length > 1 && (
                                              <div className="row g-1 mt-2">
                                                {images.slice(1, 5).map((src: string, index: number) => (
                                                  <div key={src} className="col-3">
                                                    <img
                                                      src={src}
                                                      alt={`${d.name} ${index + 2}`}
                                                      loading="lazy"
                                                      className="rounded border w-100"
                                                      style={{ objectFit: 'cover', cursor: 'pointer' }}
                                                      onClick={() => openLightbox(images, index + 1)}
                                                    />
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        <div className={images.length > 0 ? 'col-md-8' : 'col-12'}>
                                          <h5 className="h6 fw-semibold mb-2">Details</h5>

                                          {d.shape_name && (
                                            <div className="mb-2">
                                              <span className="text-muted small">Shape:</span>{' '}
                                              <span className="fw-medium">{d.shape_name}</span>
                                            </div>
                                          )}

                                          {d.size && (
                                            <div className="mb-2">
                                              <span className="text-muted small">Size:</span>{' '}
                                              <span className="fw-medium">{d.size}</span>
                                            </div>
                                          )}

                                          {d.measurements && (
                                            <div className="mb-2">
                                              <span className="text-muted small">Dimensions:</span>{' '}
                                              <span className="fw-medium">{d.measurements}</span>
                                            </div>
                                          )}

                                          {d.description && (
                                            <div className="mb-2">
                                              <span className="text-muted small">Description:</span>
                                              <p className="mb-0 small">{d.description}</p>
                                            </div>
                                          )}

                                          <div className="mt-3">
                                            <Link
                                              to={`/collection/${col.id}`}
                                              className="btn btn-sm btn-outline-secondary"
                                            >
                                              View Collection
                                            </Link>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  ))}
</div>
            //   <div className="d-flex flex-column gap-5">
            //     {years.map((year) => (
            //       <section key={year}>
            //         <h2 className="h6 fw-semibold text-muted text-uppercase border-bottom pb-0 mb-0">
            //           {/* {year} */}
            //         </h2>

            //         <div className="d-flex flex-column gap-3">
            //           {groupedByYear[year].map((col: any) => {
            //             const designs: any[] = Array.isArray(col.filteredDesigns)
            //               ? col.filteredDesigns
            //               : []

            //             const collectionImages = uniq(col.collectionImages ?? [])
            //             const designImages = uniq(
            //               designs.flatMap((d: any) => parseImages(d.imageurls ?? d.image_urls)),
            //             )
            //             const collectionPhoto = collectionImages[0] ?? designImages[0] ?? null

            //             return (
            //               <article key={col.id} className="card shadow-sm border">
            //                 {/* Collection Banner */}
            //                 {collectionPhoto && (
            //                   <div 
            //                     className="position-relative rounded-top overflow-hidden" 
            //                     style={{ height: 280, cursor: 'pointer' }}
            //                     onClick={() => openLightbox(collectionImages.length ? collectionImages : designImages, 0)}
            //                   >
            //                     <img
            //                       src={collectionPhoto}
            //                       alt={col.name}
            //                       loading="lazy"
            //                       className="w-100 h-100"
            //                       style={{ objectFit: 'cover', objectPosition: 'center' }}
            //                     />
            //                     {/* Gradient overlay */}
            //                     <div className="position-absolute bottom-0 start-0 w-100 p-3" 
            //                          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
            //                       <h3 className="text-white mb-1 fs-4">{col.name}</h3>
            //                       <p className="text-white text-opacity-75 mb-0 small">
            //                         {year} {col.season ? `· ${col.season}` : ''} {col.series ? `· ${col.series}` : ''} {col.type ? `· ${toProperCase(col.type)}` : ''}
            //                       </p>
            //                     </div>
            //                   </div>
            //                 )}
                            
            //                 <div className="card-body pt-3">
            //                   {designs.length > 0 && (
            //                     <div className="accordion" id={`accordion-${col.id}`}>
            //                       {designs.map((d: any, idx: number) => {
            //                         const images = uniq(parseImages(d.imageurls ?? d.image_urls))
            //                         const thumb = images[0] ?? null
            //                         const isOpen = openDesigns[d.id]

            //                         return (
            //                           <div key={d.id} className="accordion-item border mb-2 rounded">
            //                             <h2 className="accordion-header">
            //                               <button
            //                                 className="accordion-button d-flex align-items-center gap-3 py-3"
            //                                 type="button"
            //                                 onClick={() => toggleDesign(d.id)}
            //                                 aria-expanded={isOpen}
            //                                 aria-controls={`design-collapse-${d.id}`}
            //                               >
            //                                 {/* Thumbnail */}
            //                                 <div
            //                                   className="flex-shrink-0 rounded overflow-hidden bg-light border"
            //                                   style={{ width: 64, height: 64 }}
            //                                 >
            //                                   {thumb ? (
            //                                     <img
            //                                       src={thumb}
            //                                       alt={d.name}
            //                                       loading="lazy"
            //                                       width={64}
            //                                       height={64}
            //                                       className="w-100 h-100"
            //                                       style={{ objectFit: 'cover', cursor: 'pointer' }}
            //                                       onClick={(e) => {
            //                                         e.stopPropagation()
            //                                         openLightbox(images, 0)
            //                                       }}
            //                                     />
            //                                   ) : (
            //                                     <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
            //                                       <small>No img</small>
            //                                     </div>
            //                                   )}
            //                                 </div>

            //                                 {/* Design info */}
            //                                 <div className="flex-grow-1 text-start">
            //                                   <div className="fw-medium" style={{ fontSize: '0.95rem' }}>
            //                                     {d.name}
            //                                   </div>
            //                                   <p className="mb-0 small text-muted fw-medium" style={{ fontSize: '0.8rem' }}>
            //                                     {d.shape_name || ''}{' '}
            //                                     {d.size ? `· ${d.size}` : ''}
            //                                     {d.measurements ? `· ${d.measurements}` : ''}
            //                                   </p>
            //                                 </div>

            //                                 {/* Badge */}
            //                                 <div className="flex-shrink-0">
            //                                   <span className="badge bg-secondary">
            //                                     {col.season || ''} {year ? `| ${year}` : ''}
            //                                   </span>
            //                                 </div>
            //                               </button>
            //                             </h2>
                                        
            //                             {isOpen && (
            //                               <div
            //                                 id={`design-collapse-${d.id}`}
            //                                 className="accordion-collapse collapse show"
            //                               >
            //                                 <div className="accordion-body bg-light">
            //                                   <div className="row g-3">
            //                                     {/* Images */}
            //                                     {images.length > 0 && (
            //                                       <div className="col-md-4">
            //                                         <div className="rounded overflow-hidden border bg-white">
            //                                           <img
            //                                             src={images[0]}
            //                                             alt={d.name}
            //                                             loading="lazy"
            //                                             className="w-100"
            //                                             style={{ objectFit: 'cover', cursor: 'pointer' }}
            //                                             onClick={() => openLightbox(images, 0)}
            //                                           />
            //                                         </div>
            //                                         {images.length > 1 && (
            //                                           <div className="row g-1 mt-2">
            //                                             {images.slice(1, 5).map((src, i) => (
            //                                               <div key={i} className="col-3">
            //                                                 <img
            //                                                   src={src}
            //                                                   alt={`${d.name} ${i + 2}`}
            //                                                   loading="lazy"
            //                                                   className="rounded border w-100"
            //                                                   style={{ objectFit: 'cover', cursor: 'pointer' }}
            //                                                   onClick={() => openLightbox(images, i + 1)}
            //                                                 />
            //                                               </div>
            //                                             ))}
            //                                           </div>
            //                                         )}
            //                                       </div>
            //                                     )}

            //                                     {/* Details */}
            //                                     <div className="col-md-8">
            //                                       <h6 className="fw-semibold mb-2">Details</h6>
                                                  
            //                                       {d.shape_name && (
            //                                         <div className="mb-2">
            //                                           <span className="text-muted small">Shape:</span>{' '}
            //                                           <span className="fw-medium">{d.shape_name}</span>
            //                                         </div>
            //                                       )}
                                                  
            //                                       {d.size && (
            //                                         <div className="mb-2">
            //                                           <span className="text-muted small">Size:</span>{' '}
            //                                           <span className="fw-medium">{d.size}</span>
            //                                         </div>
            //                                       )}
                                                  
            //                                       {d.measurements && (
            //                                         <div className="mb-2">
            //                                           <span className="text-muted small">Dimensions:</span>{' '}
            //                                           <span className="fw-medium">{d.measurements}</span>
            //                                         </div>
            //                                       )}
                                                  
            //                                       {d.description && (
            //                                         <div className="mb-2">
            //                                           <span className="text-muted small">Description:</span>{' '}
            //                                           <p className="mb-0 small">{d.description}</p>
            //                                         </div>
            //                                       )}

            //                                       {d.categories && Array.isArray(d.categories) && d.categories.length > 0 && (
            //                                         <div className="mb-2">
            //                                           <span className="text-muted small">Categories:</span>{' '}
            //                                           {d.categories.map((cat: string, i: number) => (
            //                                             <span key={i} className="badge bg-secondary me-1">{cat}</span>
            //                                           ))}
            //                                         </div>
            //                                       )}

            //                                       <div className="mt-3">
            //                                         <Link
            //                                           to={`/collection/${col.id}`}
            //                                           className="btn btn-sm btn-outline-secondary"
            //                                         >
            //                                           View Collection
            //                                         </Link>
            //                                       </div>
            //                                     </div>
            //                                   </div>
            //                                 </div>
            //                               </div>
            //                             )}
            //                           </div>
            //                         )
            //                       })}
            //                     </div>
            //                   )}
            //                 </div>
            //               </article>
            //             )
            //           })}
            //         </div>
            //       </section>
            //     ))}
            //   </div>
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