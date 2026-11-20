import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import type { Route } from './+types/archive'

type Design = {
  id: string | number
  name?: string
  description?: string
  shape_name?: string
  shape?: string
  size?: string
  measurements?: string
  categories?: string[]
  imageurls?: unknown
  image_urls?: unknown
}

type Collection = {
  id: string | number
  name?: string
  description?: string
  season?: string | number
  series?: string
  releaseyear?: string | number
  release_year?: string | number
  imageurls?: unknown
  image_urls?: unknown
  designs?: Design[]
}

type ArchiveItem = {
  key: string
  title: string
  collectionId: Collection['id']
  collectionName: string
  year: string
  season: string
  series: string
  shape: string
  size: string
  measurements: string
  description: string
  categories: string[]
  images: string[]
  isCollection: boolean
}

type LightboxState = {
  images: string[]
  index: number
  title: string
}

const PAGE_SIZE = 64

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Collections | Vendula London Handbag Library' },
    {
      name: 'description',
      content:
        'Explore past Vendula London collections, designs, seasons and bag shapes in the handbag library.',
    },
  ]
}

export async function clientLoader() {
  const response = await fetch('/api/collections')

  if (!response.ok) {
    throw new Response('Unable to load the collection archive.', {
      status: response.status,
    })
  }

  const data: unknown = await response.json()

  return {
    collections: (Array.isArray(data) ? data : []) as Collection[],
  }
}

export function HydrateFallback() {
  return (
    <>
      <ArchiveStyles />

      <div className="archive-loading" role="status">
        Loading the handbag library…
      </div>
    </>
  )
}

function text(value: unknown): string {
  return value == null ? '' : String(value).trim()
}

function parseImages(value: unknown): string[] {
  let images = value

  if (typeof images === 'string') {
    try {
      images = JSON.parse(images)
    } catch {
      return []
    }
  }

  if (!Array.isArray(images)) return []

  return [
    ...new Set(
      images
        .filter((image): image is string => typeof image === 'string')
        .map((image) => image.trim())
        .filter(Boolean),
    ),
  ]
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

function getYear(collection: Collection): string {
  return (
    text(collection.releaseyear) ||
    text(collection.release_year) ||
    'Undated'
  )
}

function compareYears(a: string, b: string): number {
  if (a === b) return 0
  if (a === 'Undated') return 1
  if (b === 'Undated') return -1

  const aNumber = Number(a)
  const bNumber = Number(b)

  if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) {
    return bNumber - aNumber
  }

  return b.localeCompare(a, undefined, { numeric: true })
}

function ImagePlaceholder() {
  return (
    <span className="archive-placeholder">
      <svg
        width="46"
        height="46"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M11 17h26l3 24H8l3-24Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M17 19v-7a7 7 0 0 1 14 0v7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      <span>Photo needed</span>
    </span>
  )
}

function ArchiveLightbox({
  value,
  onClose,
  onMove,
}: {
  value: LightboxState
  onClose: () => void
  onMove: (direction: number) => void
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [])

  return (
    <div
      className="archive-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${value.title} image gallery`}
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onClose()
        }

        if (event.key === 'ArrowRight') {
          event.preventDefault()
          onMove(1)
        }

        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          onMove(-1)
        }

        if (event.key === 'Tab') {
          const buttons = Array.from(
            event.currentTarget.querySelectorAll<HTMLButtonElement>(
              'button:not(:disabled)',
            ),
          )

          const first = buttons[0]
          const last = buttons[buttons.length - 1]

          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last?.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first?.focus()
          }
        }
      }}
    >
      <button
        ref={closeButtonRef}
        className="archive-lightbox__close"
        type="button"
        aria-label="Close image gallery"
        onClick={(event) => {
          event.stopPropagation()
          onClose()
        }}
      >
        ×
      </button>

      {value.images.length > 1 && (
        <button
          className="archive-lightbox__previous"
          type="button"
          aria-label="Previous image"
          onClick={(event) => {
            event.stopPropagation()
            onMove(-1)
          }}
        >
          ‹
        </button>
      )}

      <figure
        className="archive-lightbox__figure"
        onClick={(event) => event.stopPropagation()}
      >
        <img
          src={value.images[value.index]}
          alt={`${value.title} — image ${value.index + 1}`}
        />

        <figcaption>
          {value.title}

          <span aria-live="polite">
            {value.index + 1} / {value.images.length}
          </span>
        </figcaption>
      </figure>

      {value.images.length > 1 && (
        <button
          className="archive-lightbox__next"
          type="button"
          aria-label="Next image"
          onClick={(event) => {
            event.stopPropagation()
            onMove(1)
          }}
        >
          ›
        </button>
      )}
    </div>
  )
}

function ArchiveStyles() {
  return (
    <style>{`
      .vendula-archive {
        --archive-ink: #343434;
        --archive-muted: #737373;
        --archive-line: #d9d9d7;
        --archive-header: #e3e3e0;
        --archive-paper: #fff;
        --archive-accent: #794b60;

        min-height: 100vh;
        color: var(--archive-ink);
        background: var(--archive-paper);
        font-family: Arial, Helvetica, sans-serif;
      }

      .vendula-archive *,
      .vendula-archive *::before,
      .vendula-archive *::after {
        box-sizing: border-box;
      }

      .vendula-archive button,
      .vendula-archive input,
      .vendula-archive select {
        font: inherit;
      }

      .vendula-archive button,
      .vendula-archive select {
        cursor: pointer;
      }

      .vendula-archive button:disabled {
        cursor: default;
      }

      .vendula-archive :focus-visible {
        outline: 3px solid var(--archive-accent);
        outline-offset: 4px;
      }

      .archive-skip {
        position: fixed;
        top: 10px;
        left: 10px;
        z-index: 10000;
        padding: 12px 18px;
        color: white;
        background: #252525;
        transform: translateY(-160%);
      }

      .archive-skip:focus {
        transform: translateY(0);
      }

      /* Header */

      .archive-header {
        padding: 30px 32px 28px;
        background: var(--archive-header);
      }

      .archive-header__top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 32px;
      }

      .archive-title {
        display: inline-block;
        color: #555552;
        font-size: clamp(26px, 3.4vw, 44px);
        font-weight: 800;
        letter-spacing: -1.8px;
        line-height: 1.1;
        text-decoration: none;
      }

      .archive-title:hover {
        color: #333330;
      }

      .archive-intro {
        margin: 10px 0 0;
        color: #6d6d69;
        font-size: 13px;
        line-height: 1.6;
      }

      .archive-search {
        width: 290px;
        max-width: 100%;
        flex-shrink: 0;
      }

      .archive-search label {
        display: block;
        margin-bottom: 7px;
        color: #656560;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .archive-search input {
        width: 100%;
        min-height: 40px;
        padding: 10px 12px;
        border: 1px solid #c5c5c0;
        border-radius: 0;
        color: var(--archive-ink);
        background: rgba(255, 255, 255, 0.65);
        font-size: 13px;
      }

      /* Year navigation */

      .archive-years {
        display: flex;
        gap: 38px;
        margin-top: 30px;
        padding-bottom: 8px;
        overflow-x: auto;
      }

      .archive-year-block {
        min-width: 145px;
        flex-shrink: 0;
      }

      .archive-year-block--all {
        min-width: 165px;
      }

      .archive-year-heading {
        display: block;
        padding: 0;
        border: 0;
        color: #666662;
        background: none;
        font-size: 28px;
        font-weight: 800;
        letter-spacing: -1px;
        line-height: 1.3;
      }

      .archive-year-heading:hover,
      .archive-year-heading.is-active {
        color: var(--archive-accent);
      }

      .archive-season-links {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 4px 18px;
        margin-top: 10px;
      }

      .archive-season-links button {
        min-height: 28px;
        padding: 2px 0;
        border: 0;
        color: #646460;
        background: none;
        font-size: 12px;
        text-align: left;
      }

      .archive-season-links button:hover,
      .archive-season-links button.is-active {
        color: #222;
        text-decoration: underline;
        text-underline-offset: 3px;
      }

      .archive-season-links button.is-active {
        font-weight: 700;
      }

      .archive-year-count {
        display: block;
        margin-top: 9px;
        color: #7a7a75;
        font-size: 11px;
      }

      .archive-browse-link {
        display: inline-block;
        margin-top: 13px;
        color: #62625e;
        font-size: 12px;
        text-decoration: none;
      }

      /* Results and filters */

      .archive-main {
        padding: 24px 32px 48px;
        scroll-margin-top: 16px;
      }

      .archive-toolbar {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 24px;
        padding-bottom: 18px;
        border-bottom: 1px solid var(--archive-line);
      }

      .archive-summary h1 {
        margin: 0 0 5px;
        font-size: 18px;
        font-weight: 700;
      }

      .archive-summary > span {
        color: var(--archive-muted);
        font-size: 12px;
      }

      .archive-controls {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        gap: 12px;
      }

      .archive-controls label > span {
        display: block;
        margin-bottom: 5px;
        color: var(--archive-muted);
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      .archive-controls select {
        width: 140px;
        max-width: 100%;
        min-height: 34px;
        padding: 6px 26px 6px 9px;
        border: 1px solid var(--archive-line);
        border-radius: 0;
        color: var(--archive-ink);
        background: white;
        font-size: 12px;
      }

      .archive-clear {
        min-height: 34px;
        padding: 6px 0;
        border: 0;
        color: var(--archive-accent);
        background: none;
        font-size: 12px;
      }

      /* Design grid */

      .archive-grid {
        display: grid;
        grid-template-columns: repeat(8, minmax(0, 1fr));
        gap: 26px 20px;
      }

      .archive-card {
        min-width: 0;
      }

      .archive-card__image {
        position: relative;
        display: block;
        width: 100%;
        aspect-ratio: 1;
        padding: 0;
        overflow: hidden;
        border: 1px solid #d0d0cd;
        border-top: 3px solid #747470;
        border-radius: 0;
        color: var(--archive-muted);
        background: #f7f7f5;
      }

      .archive-card__image img {
        display: block;
        width: 100%;
        height: 100%;
        padding: 8px;
        object-fit: contain;
        transition: transform 180ms ease;
      }

      .archive-card__image:not(:disabled):hover img {
        transform: scale(1.05);
      }

      .archive-card__year,
      .archive-card__image-count {
        position: absolute;
        bottom: 5px;
        padding: 3px 5px;
        color: #fff;
        background: rgba(40, 40, 40, 0.78);
        font-size: 9px;
        line-height: 1;
        pointer-events: none;
      }

      .archive-card__year {
        left: 5px;
      }

      .archive-card__image-count {
        right: 5px;
      }

      .archive-card__body {
        padding-top: 8px;
      }

      .archive-card__body h2 {
        margin: 0;
        font-size: 12px;
        font-weight: 700;
        line-height: 1.4;
        overflow-wrap: anywhere;
      }

      .archive-card__body h2 a {
        color: var(--archive-ink);
        text-decoration: none;
      }

      .archive-card__body h2 a:hover {
        color: var(--archive-accent);
        text-decoration: underline;
        text-underline-offset: 3px;
      }

      .archive-card__collection,
      .archive-card__meta {
        margin: 4px 0 0;
        color: var(--archive-muted);
        font-size: 10px;
        line-height: 1.5;
        overflow-wrap: anywhere;
      }

      .archive-card__collection {
        display: -webkit-box;
        overflow: hidden;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .archive-placeholder {
        display: flex;
        width: 100%;
        height: 100%;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 7px;
        padding: 12px;
        color: #a3a39d;
      }

      .archive-placeholder > span {
        font-size: 10px;
      }

      /* Empty state and pagination */

      .archive-empty {
        padding: 60px 20px;
        text-align: center;
      }

      .archive-empty > .archive-placeholder {
        height: 90px;
      }

      .archive-empty h2 {
        margin: 15px 0 8px;
        font-size: 20px;
      }

      .archive-empty p {
        color: var(--archive-muted);
        font-size: 13px;
      }

      .archive-empty button,
      .archive-more button {
        padding: 11px 20px;
        border: 1px solid #888;
        border-radius: 0;
        color: var(--archive-ink);
        background: white;
        font-size: 12px;
      }

      .archive-empty button:hover,
      .archive-more button:hover {
        background: #f2f2ef;
      }

      .archive-more {
        margin-top: 40px;
        text-align: center;
      }

      .archive-more p {
        margin: 10px 0 0;
        color: var(--archive-muted);
        font-size: 11px;
      }

      /* Footer and loading */

      .archive-footer {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 12px;
        padding: 22px 32px;
        border-top: 1px solid var(--archive-line);
        color: var(--archive-muted);
        font-size: 11px;
      }

      .archive-footer p {
        margin: 0;
      }

      .archive-footer a {
        color: inherit;
      }

      .archive-loading {
        display: grid;
        min-height: 100vh;
        place-items: center;
        color: #777;
        background: #f6f6f3;
        font: 14px Arial, sans-serif;
      }

      /* Image lightbox */

      .archive-lightbox {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 64px 70px;
        background: rgba(20, 20, 20, 0.94);
      }

      .archive-lightbox__figure {
        max-width: 100%;
        margin: 0;
      }

      .archive-lightbox__figure img {
        display: block;
        max-width: 100%;
        max-height: 76vh;
        margin: 0 auto;
        object-fit: contain;
      }

      .archive-lightbox__figure figcaption {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        margin-top: 15px;
        color: #eee;
        font-size: 12px;
        line-height: 1.5;
      }

      .archive-lightbox__figure figcaption span {
        flex-shrink: 0;
        color: #aaa;
      }

      .archive-lightbox button {
        position: absolute;
        display: grid;
        width: 44px;
        height: 44px;
        padding: 0;
        place-items: center;
        border: 1px solid #666;
        border-radius: 50%;
        color: white;
        background: #292929;
        font-size: 30px;
      }

      .archive-lightbox button:hover {
        background: #444;
      }

      .archive-lightbox__close {
        top: 18px;
        right: 18px;
      }

      .archive-lightbox__previous {
        top: calc(50% - 22px);
        left: 16px;
      }

      .archive-lightbox__next {
        top: calc(50% - 22px);
        right: 16px;
      }

      /* Responsive layouts */

      @media (min-width: 1700px) {
        .archive-grid {
          grid-template-columns: repeat(10, minmax(0, 1fr));
        }
      }

      @media (max-width: 1200px) {
        .archive-grid {
          grid-template-columns: repeat(6, minmax(0, 1fr));
        }

        .archive-toolbar {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      @media (max-width: 900px) {
        .archive-header,
        .archive-main {
          padding-right: 22px;
          padding-left: 22px;
        }

        .archive-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 24px 16px;
        }

        .archive-search {
          width: 240px;
        }
      }

      @media (max-width: 600px) {
        .archive-header {
          padding: 22px 16px 18px;
        }

        .archive-header__top {
          flex-direction: column;
          gap: 20px;
        }

        .archive-title {
          font-size: 30px;
          letter-spacing: -1px;
        }

        .archive-search {
          width: 100%;
        }

        .archive-years {
          gap: 28px;
          margin-top: 24px;
        }

        .archive-year-block {
          min-width: 130px;
        }

        .archive-year-block--all {
          min-width: 145px;
        }

        .archive-main {
          padding: 20px 16px 36px;
        }

        .archive-controls {
          display: grid;
          width: 100%;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .archive-controls select {
          width: 100%;
        }

        .archive-clear {
          justify-self: start;
        }

        .archive-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px 12px;
        }

        .archive-card__image img {
          padding: 4px;
        }

        .archive-card__body h2 {
          font-size: 11px;
        }

        .archive-footer {
          padding: 20px 16px;
        }

        .archive-lightbox {
          padding: 70px 48px;
        }

        .archive-lightbox button {
          width: 36px;
          height: 36px;
        }

        .archive-lightbox__previous {
          left: 6px;
        }

        .archive-lightbox__next {
          right: 6px;
        }
      }

      @media (max-width: 380px) {
        .archive-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .archive-card__image img {
          transition: none;
        }
      }
    `}</style>
  )
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { collections } = loaderData

  const [search, setSearch] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [season, setSeason] = useState('')
  const [series, setSeries] = useState('')
  const [shape, setShape] = useState('')
  const [sort, setSort] = useState('newest')

  const [pagination, setPagination] = useState({
    key: '',
    limit: PAGE_SIZE,
  })

  const [lightbox, setLightbox] = useState<LightboxState | null>(null)

  const items = useMemo<ArchiveItem[]>(() => {
    return collections.flatMap((collection) => {
      const designs = Array.isArray(collection.designs)
        ? collection.designs
        : []

      const collectionImages = parseImages(
        collection.imageurls ?? collection.image_urls,
      )

      const base = {
        collectionId: collection.id,
        collectionName: text(collection.name) || 'Untitled collection',
        year: getYear(collection),
        season: text(collection.season),
        series: text(collection.series),
      }

      if (designs.length === 0) {
        return [
          {
            ...base,
            key: `collection-${collection.id}`,
            title: base.collectionName,
            shape: '',
            size: '',
            measurements: '',
            description: text(collection.description),
            categories: [],
            images: collectionImages,
            isCollection: true,
          },
        ]
      }

      return designs.map((design) => {
        const designImages = parseImages(
          design.imageurls ?? design.image_urls,
        )

        return {
          ...base,
          key: `collection-${collection.id}-design-${design.id}`,
          title: text(design.name) || base.collectionName,
          shape: text(design.shape_name) || text(design.shape),
          size: text(design.size),
          measurements: text(design.measurements),
          description: [
            text(collection.description),
            text(design.description),
          ]
            .filter(Boolean)
            .join(' '),
          categories: Array.isArray(design.categories)
            ? design.categories.map(text)
            : [],
          images: designImages.length ? designImages : collectionImages,
          isCollection: false,
        }
      })
    })
  }, [collections])

  const years = useMemo(
    () => unique(items.map((item) => item.year)).sort(compareYears),
    [items],
  )

  const seasons = useMemo(
    () =>
      unique(
        items
          .filter((item) => !selectedYear || item.year === selectedYear)
          .map((item) => item.season),
      ).sort(),
    [items, selectedYear],
  )

  const seriesList = useMemo(
    () => unique(items.map((item) => item.series)).sort(),
    [items],
  )

  const shapes = useMemo(
    () => unique(items.map((item) => item.shape)).sort(),
    [items],
  )

  const yearNavigation = useMemo(
    () =>
      years.map((year) => ({
        year,
        count: items.filter((item) => item.year === year).length,
        seasons: unique(
          items
            .filter((item) => item.year === year)
            .map((item) => item.season),
        ).sort(),
      })),
    [items, years],
  )

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()

    return items
      .filter((item) => {
        if (selectedYear && item.year !== selectedYear) return false
        if (season && item.season !== season) return false
        if (series && item.series !== series) return false
        if (shape && item.shape !== shape) return false

        if (!term) return true

        return [
          item.title,
          item.collectionName,
          item.year,
          item.season,
          item.series,
          item.shape,
          item.description,
          ...item.categories,
        ]
          .join(' ')
          .toLowerCase()
          .includes(term)
      })
      .sort((a, b) => {
        if (sort === 'name') {
          return a.title.localeCompare(b.title)
        }

        if (a.year === 'Undated' && b.year !== 'Undated') return 1
        if (b.year === 'Undated' && a.year !== 'Undated') return -1

        const yearComparison = compareYears(a.year, b.year)

        return (
          (sort === 'oldest' ? -yearComparison : yearComparison) ||
          a.title.localeCompare(b.title)
        )
      })
  }, [items, search, selectedYear, season, series, shape, sort])

  const filterKey = JSON.stringify([
    search,
    selectedYear,
    season,
    series,
    shape,
    sort,
  ])

  const visibleLimit =
    pagination.key === filterKey ? pagination.limit : PAGE_SIZE

  const visibleItems = filteredItems.slice(0, visibleLimit)
  const hasMore = visibleItems.length < filteredItems.length

  const collectionCount = new Set(
    filteredItems.map((item) => item.collectionId),
  ).size

  const activeFilterCount = [
    search.trim(),
    selectedYear,
    season,
    series,
    shape,
  ].filter(Boolean).length

  function clearFilters() {
    setSearch('')
    setSelectedYear('')
    setSeason('')
    setSeries('')
    setShape('')
  }

  function selectYear(year: string) {
    setSelectedYear(year)
    setSeason('')
  }

  function moveLightbox(direction: number) {
    setLightbox((current) => {
      if (!current) return null

      return {
        ...current,
        index:
          (current.index + direction + current.images.length) %
          current.images.length,
      }
    })
  }

  return (
    <div className="vendula-archive">
      <ArchiveStyles />

      <a className="archive-skip" href="#archive-results">
        Skip to designs
      </a>

      <header className="archive-header">
        <div className="archive-header__top">
          <div>
            <Link to="/" className="archive-title">
              Vendula Handbag Library
            </Link>

            <p className="archive-intro">
              A visual archive of collections, seasons and past designs.
            </p>
          </div>

          <div className="archive-search">
            <label htmlFor="archive-search">Search the library</label>

            <input
              id="archive-search"
              type="search"
              placeholder="Collection, design or shape…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <nav className="archive-years" aria-label="Browse by release year">
          <div className="archive-year-block archive-year-block--all">
            <button
              type="button"
              className={`archive-year-heading ${
                !selectedYear ? 'is-active' : ''
              }`}
              aria-pressed={!selectedYear}
              onClick={() => selectYear('')}
            >
              All years
            </button>

            <span className="archive-year-count">
              {items.length} archive entries
            </span>

            <a href="#archive-results" className="archive-browse-link">
              Browse the library ↓
            </a>
          </div>

          {yearNavigation.map((group) => (
            <div className="archive-year-block" key={group.year}>
              <button
                type="button"
                className={`archive-year-heading ${
                  selectedYear === group.year ? 'is-active' : ''
                }`}
                aria-pressed={selectedYear === group.year}
                onClick={() => selectYear(group.year)}
              >
                {group.year}
              </button>

              <div className="archive-season-links">
                {group.seasons.map((value) => {
                  const active =
                    selectedYear === group.year && season === value

                  return (
                    <button
                      key={value}
                      type="button"
                      className={active ? 'is-active' : ''}
                      aria-pressed={active}
                      onClick={() => {
                        setSelectedYear(group.year)
                        setSeason(active ? '' : value)
                      }}
                    >
                      {value}
                    </button>
                  )
                })}
              </div>

              <span className="archive-year-count">
                {group.count} entries
              </span>
            </div>
          ))}
        </nav>
      </header>

      <main id="archive-results" className="archive-main">
        <div className="archive-toolbar">
          <div className="archive-summary" aria-live="polite">
            <h1>{selectedYear || 'All designs'}</h1>

            <span>
              {filteredItems.length} entries · {collectionCount}{' '}
              collection{collectionCount !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="archive-controls">
            <label>
              <span>Season</span>

              <select
                value={season}
                onChange={(event) => setSeason(event.target.value)}
              >
                <option value="">All seasons</option>

                {seasons.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Series</span>

              <select
                value={series}
                onChange={(event) => setSeries(event.target.value)}
              >
                <option value="">All series</option>

                {seriesList.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Bag shape</span>

              <select
                value={shape}
                onChange={(event) => setShape(event.target.value)}
              >
                <option value="">All shapes</option>

                {shapes.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Sort</span>

              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name">Name A–Z</option>
              </select>
            </label>

            {activeFilterCount > 0 && (
              <button
                className="archive-clear"
                type="button"
                onClick={clearFilters}
              >
                Clear ({activeFilterCount})
              </button>
            )}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="archive-empty">
            <ImagePlaceholder />

            <h2>No matching designs</h2>

            <p>Try another search or remove some filters.</p>

            <button type="button" onClick={clearFilters}>
              Reset filters
            </button>
          </div>
        ) : (
          <div className="archive-grid">
            {visibleItems.map((item) => (
              <article className="archive-card" key={item.key}>
                <button
                  className="archive-card__image"
                  type="button"
                  disabled={item.images.length === 0}
                  aria-label={`Open images of ${item.title}`}
                  onClick={() =>
                    setLightbox({
                      images: item.images,
                      index: 0,
                      title: item.title,
                    })
                  }
                >
                  {item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      width={320}
                      height={320}
                    />
                  ) : (
                    <ImagePlaceholder />
                  )}

                  <span className="archive-card__year">
                    {item.year}
                  </span>

                  {item.images.length > 1 && (
                    <span className="archive-card__image-count">
                      +{item.images.length - 1}
                    </span>
                  )}
                </button>

                <div className="archive-card__body">
                  <h2>
                    <Link to={`/collection/${item.collectionId}`}>
                      {item.title}
                    </Link>
                  </h2>

                  {!item.isCollection && (
                    <p className="archive-card__collection">
                      {item.collectionName}
                    </p>
                  )}

                  <p className="archive-card__meta">
                    {[item.shape, item.size || item.season]
                      .filter(Boolean)
                      .join(' · ') || 'Collection record'}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="archive-more">
            <button
              type="button"
              onClick={() =>
                setPagination({
                  key: filterKey,
                  limit: visibleLimit + PAGE_SIZE,
                })
              }
            >
              Show more designs
            </button>

            <p>
              Showing {visibleItems.length} of {filteredItems.length}
            </p>
          </div>
        )}
      </main>

      <footer className="archive-footer">
        <span>Vendula Handbag Library</span>

        <p>
          Help build the archive:{' '}
          <a href="mailto:hello@vendulette.com">
            hello@vendulette.com
          </a>
        </p>
      </footer>

      {lightbox && (
        <ArchiveLightbox
          value={lightbox}
          onClose={() => setLightbox(null)}
          onMove={moveLightbox}
        />
      )}
    </div>
  )
}