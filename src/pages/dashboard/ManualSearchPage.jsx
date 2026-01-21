import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/UI/Button.jsx'
import Input from '../../components/UI/Input.jsx'
import Alert from '../../components/UI/Alert.jsx'
import { rainforestSearchProducts } from '../../services/rainforestService.js'
import {
  assertAndIncrementDailySearchLimit,
  logSearch,
  saveProduct,
} from '../../utils/firestoreHelpers.js'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  calculateProfit,
  marketIndicator,
  suggestedEbayPrice,
} from '../../services/profitCalculator.js'

function normalizeResult(r) {
  const amazonPrice =
    r?.price?.value ??
    parseFloat(String(r?.price?.raw ?? '').replace(/[^0-9.]/g, '')) ??
    null
  return {
    asin: r.asin,
    title: r.title,
    image: r.image,
    rating: r.rating,
    ratingsTotal: r.ratings_total ?? r.ratingsTotal,
    amazonPrice,
    amazonPriceRaw: r?.price?.raw ?? null,
  }
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
              {product.amazonPriceRaw ?? (amazonCost ? `$${amazonCost}` : '—')}
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
          <Button
            variant="subtle"
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
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save product'}
          </Button>
          <Button variant="ghost" onClick={() => onSeeDetail(product)}>
            See detailed page
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ManualSearchPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 10

  const resultsSummary = useMemo(() => {
    return results.slice(0, 10).map((r) => ({
      asin: r.asin,
      title: r.title,
      amazonPrice: r.amazonPrice ?? null,
      rating: r.rating ?? null,
      ratingsTotal: r.ratingsTotal ?? null,
    }))
  }, [results])

  const runSearch = async (e) => {
    e.preventDefault()
    setError('')
    setSelected(null)
    setPage(1)
    setLoading(true)
    try {
      await assertAndIncrementDailySearchLimit({ uid: user.uid, maxPerDay: 50 })
      const { payload } = await rainforestSearchProducts({ keyword })
      const items =
        (payload?.search_results ?? [])
          .map(normalizeResult)
          .filter((x) => x.asin && x.title) ?? []
      setResults(items)
      await logSearch({ uid: user.uid, keyword, resultsSummary })
    } catch (err) {
      setError(err?.message ?? 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(results.length / pageSize))
  const pagedResults = results.slice(
    (page - 1) * pageSize,
    page * pageSize
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-50">Manual Search</h1>
        <p className="text-sm text-slate-400">
          Search Amazon products by keyword, then open details to see profit and
          save.
        </p>
      </div>

      <Alert message={error} />

      <form
        onSubmit={runSearch}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <Input
            label="Keyword"
            placeholder="e.g. wireless earbuds"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </Button>
      </form>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-slate-800 bg-slate-950/60"
            />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-6 text-sm text-slate-400">
          Search to see results.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pagedResults.map((p) => (
              <button
                key={p.asin}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-left hover:border-slate-700 hover:bg-slate-950"
                onClick={() => setSelected(p)}
                type="button"
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
                      {p.amazonPriceRaw ??
                        (p.amazonPrice ? `$${p.amazonPrice}` : '—')}
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  Click for details
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
                <Button
                  variant="ghost"
                  className="px-3 py-1 text-xs"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  className="px-3 py-1 text-xs"
                  disabled={page === totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                >
                  Next
                </Button>
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
          } catch (err) {
            setError(err?.message ?? 'Failed to save product')
          } finally {
            setSaving(false)
          }
        }}
        saving={saving}
      />
    </div>
  )
}

