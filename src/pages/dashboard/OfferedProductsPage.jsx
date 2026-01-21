import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { trendingKeywords } from '../../config/trendingKeywords.js'
import { rainforestSearchProducts } from '../../services/rainforestService.js'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  calculateProfit,
  marketIndicator,
  suggestedEbayPrice,
} from '../../services/profitCalculator.js'
import { saveProduct } from '../../utils/firestoreHelpers.js'

function inferTypeFromTitle(title) {
  const t = title.toLowerCase()
  if (
    t.includes('headphone') ||
    t.includes('earbud') ||
    t.includes('bluetooth') ||
    t.includes('phone') ||
    t.includes('charger')
  )
    return 'Electronics'
  if (
    t.includes('kitchen') ||
    t.includes('pan') ||
    t.includes('knife') ||
    t.includes('blender') ||
    t.includes('cook')
  )
    return 'Kitchen'
  if (
    t.includes('lamp') ||
    t.includes('light') ||
    t.includes('pillow') ||
    t.includes('blanket') ||
    t.includes('organizer')
  )
    return 'Home'
  if (
    t.includes('car') ||
    t.includes('auto') ||
    t.includes('tire') ||
    t.includes('dashboard')
  )
    return 'Automotive'
  if (
    t.includes('fitness') ||
    t.includes('yoga') ||
    t.includes('gym') ||
    t.includes('sport')
  )
    return 'Sports'
  if (
    t.includes('makeup') ||
    t.includes('cosmetic') ||
    t.includes('skincare') ||
    t.includes('beauty')
  )
    return 'Beauty'
  if (
    t.includes('pet') ||
    t.includes('dog') ||
    t.includes('cat') ||
    t.includes('leash')
  )
    return 'Pets'
  if (
    t.includes('baby') ||
    t.includes('infant') ||
    t.includes('diaper')
  )
    return 'Baby'
  if (
    t.includes('desk') ||
    t.includes('office') ||
    t.includes('notebook') ||
    t.includes('printer')
  )
    return 'Office'
  if (
    t.includes('shirt') ||
    t.includes('pants') ||
    t.includes('shoe') ||
    t.includes('jacket')
  )
    return 'Fashion'
  return 'Other'
}

function pickTopProducts(apiPayload) {
  const results = apiPayload?.search_results ?? apiPayload?.searchResults ?? []
  // Normalize a small subset of fields
  return results
    .map((r) => ({
      asin: r.asin,
      title: r.title,
      image: r.image,
      rating: r.rating,
      ratingsTotal: r.ratings_total ?? r.ratingsTotal,
      amazonPrice:
        r?.price?.value ??
        parseFloat(String(r?.price?.raw ?? '').replace(/[^0-9.]/g, '')) ??
        null,
      amazonPriceRaw: r?.price?.raw ?? null,
      type: inferTypeFromTitle(r.title ?? ''),
    }))
    .filter((p) => p.asin && p.title)
    .slice(0, 12)
}

function ProductDetails({ product, onClose, onSave, onSeeDetail, saving }) {
  if (!product) return null

  const amazonCost = Number(product.amazonPrice ?? 0)
  const ebayPrice = suggestedEbayPrice({ amazonCost, targetMarginPct: 25 })
  const { ebayFee, paymentFee, netProfit, margin } = calculateProfit({
    ebayPrice,
    amazonCost,
  })
  const indicator = marketIndicator({ margin })

  const indicatorClass =
    indicator.color === 'green'
      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/40'
      : indicator.color === 'amber'
        ? 'bg-amber-500/15 text-amber-200 border-amber-500/40'
        : 'bg-red-500/15 text-red-200 border-red-500/40'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs text-slate-500">ASIN: {product.asin}</div>
            <h2 className="mt-1 line-clamp-2 text-base font-semibold text-slate-50">
              {product.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="text-xs text-slate-500">Amazon cost</div>
            <div className="mt-1 text-lg font-semibold text-slate-50">
              {product.amazonPriceRaw ??
                (amazonCost ? `$${amazonCost}` : '—')}
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="text-xs text-slate-500">Suggested eBay price</div>
            <div className="mt-1 text-lg font-semibold text-slate-50">
              ${ebayPrice}
            </div>
          </div>
          <div className={`rounded-xl border p-4 ${indicatorClass}`}>
            <div className="text-xs opacity-80">Market entry</div>
            <div className="mt-1 text-lg font-semibold">{indicator.label}</div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-100">
            Profit breakdown
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-slate-200 sm:grid-cols-4">
            <div>
              <div className="text-xs text-slate-500">eBay fee (8%)</div>
              <div className="font-medium">${ebayFee}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Payment fee (3%)</div>
              <div className="font-medium">${paymentFee}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Net profit</div>
              <div className="font-medium">${netProfit}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Margin</div>
              <div className="font-medium">{margin}%</div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={() =>
              onSave({
                product,
                amazonCost,
                ebayPrice,
                netProfit,
                margin,
                ebayFee,
                paymentFee,
              })
            }
            className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save product'}
          </button>
          <button
            onClick={() => onSeeDetail(product)}
            className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800"
          >
            See detailed page
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OfferedProductsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState(trendingKeywords[0])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fromCache, setFromCache] = useState(false)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 10

  const keywords = useMemo(() => trendingKeywords, [])
  const types = useMemo(
    () => ['All types', 'Electronics', 'Home', 'Kitchen', 'Automotive', 'Sports', 'Beauty', 'Pets', 'Baby', 'Office', 'Fashion', 'Other'],
    []
  )
  const [typeFilter, setTypeFilter] = useState('All types')

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      setError('')
      try {
        const { payload, fromCache: cached } = await rainforestSearchProducts({
          keyword,
        })
        if (cancelled) return
        setFromCache(cached)
        setItems(pickTopProducts(payload))
      } catch (e) {
        if (cancelled) return
        setError(e?.message ?? 'Failed to load offered products')
        setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [keyword])

  const filteredItems =
    typeFilter === 'All types'
      ? items
      : items.filter((p) => p.type === typeFilter)

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize))
  const pagedItems = filteredItems.slice(
    (page - 1) * pageSize,
    page * pageSize
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">
            Offered Products
          </h1>
          <p className="text-sm text-slate-400">
            Auto suggestions from trending keywords with simple type filters.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
          <label className="flex w-full max-w-xs flex-col gap-1 text-sm text-slate-200">
            <span>Trending keyword</span>
            <select
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(1)
              }}
            >
              {keywords.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>

          <label className="flex w-full max-w-xs flex-col gap-1 text-sm text-slate-200 sm:w-48">
            <span>Type</span>
            <select
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setPage(1)
              }}
            >
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-500/50 bg-red-950/40 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="text-xs text-slate-500">
        {loading ? 'Loading…' : fromCache ? 'Loaded from cache.' : 'Fetched fresh.'}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-slate-800 bg-slate-950/60"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-6 text-sm text-slate-400">
          No products yet. Confirm your `VITE_RAINFOREST_API_KEY` and Firestore
          rules, then try again.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pagedItems.map((p) => (
              <button
                key={p.asin}
                type="button"
                onClick={() => setSelected(p)}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-left hover:border-slate-700 hover:bg-slate-950"
              >
                <div className="flex gap-3">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.title}
                      className="h-14 w-14 rounded-md object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-md bg-slate-800" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-sm font-medium text-slate-100">
                      {p.title}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      ASIN: {p.asin}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="text-slate-400">
                    Price:{' '}
                    <span className="font-medium text-slate-100">
                      {p.amazonPriceRaw ??
                        (p.amazonPrice ? `$${p.amazonPrice}` : '—')}
                    </span>
                  </div>
                  <div className="text-slate-500">
                    {p.rating ? `⭐ ${p.rating}` : ''}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-100 disabled:opacity-50"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-100 disabled:opacity-50"
                  disabled={page === totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
      <ProductDetails
        product={selected}
        onClose={() => setSelected(null)}
        onSeeDetail={(p) =>
          navigate(`/dashboard/product/${p.asin}`, { state: { product: p } })
        }
        onSave={async ({
          product,
          amazonCost,
          ebayPrice,
          netProfit,
          margin,
          ebayFee,
          paymentFee,
        }) => {
          if (!user) return
          setSaving(true)
          setError('')
          try {
            await saveProduct({
              uid: user.uid,
              asin: product.asin,
              product: {
                asin: product.asin,
                title: product.title,
                image: product.image ?? null,
                amazonCost,
                ebayPrice,
                profit: netProfit,
                margin,
                fees: { ebayFee, paymentFee },
                lastKnown: { amazonPrice: amazonCost, ebayPrice },
              },
            })
            setSelected(null)
          } catch (e) {
            setError(e?.message ?? 'Failed to save product')
          } finally {
            setSaving(false)
          }
        }}
        saving={saving}
      />
    </div>
  )
}

