import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts'
import Alert from '../../components/UI/Alert.jsx'
import Button from '../../components/UI/Button.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { rainforestGetProduct } from '../../services/rainforestService.js'
import {
  calculateProfit,
  marketIndicator,
  suggestedEbayPrice,
} from '../../services/profitCalculator.js'
import { saveProduct } from '../../utils/firestoreHelpers.js'

function extractAmazonPrice(payload, fallback) {
  const p = payload?.product ?? payload
  const priceValue =
    p?.buybox_winner?.price?.value ??
    p?.buybox_winner?.price?.raw ??
    p?.price?.value ??
    p?.price?.raw ??
    fallback

  if (typeof priceValue === 'number') return priceValue
  const n = parseFloat(String(priceValue ?? '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : Number(fallback ?? 0)
}

function extractImages(payload, fallbackImage) {
  const p = payload?.product ?? payload
  const images = []

  const main =
    p?.main_image?.link ??
    p?.main_image ??
    p?.images?.[0]?.link ??
    p?.images?.[0] ??
    fallbackImage
  if (main) images.push(main)

  const more = p?.images ?? p?.images_list ?? p?.imagesList ?? []
  for (const img of more) {
    const url = img?.link ?? img
    if (url && !images.includes(url)) images.push(url)
  }

  return images.slice(0, 12)
}

function Carousel({ images, title }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    setIdx(0)
  }, [images?.length])

  if (!images?.length) {
    return (
      <div className="flex h-80 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/60 text-sm text-slate-500">
        No images available
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
        <img
          src={images[idx]}
          alt={title}
          className="h-80 w-full object-contain"
          loading="lazy"
        />
      </div>

      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIdx(i)}
              className={`h-16 w-16 flex-none overflow-hidden rounded-lg border bg-slate-950/60 ${
                i === idx ? 'border-indigo-500' : 'border-slate-800'
              }`}
            >
              <img
                src={src}
                alt={`${title} ${i + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function ProductDetailsPage() {
  const { asin } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [payload, setPayload] = useState(null)

  const initial = state?.product ?? null

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError('')
      try {
        const { payload: p } = await rainforestGetProduct({ asin })
        if (cancelled) return
        setPayload(p)
      } catch (e) {
        if (cancelled) return
        setError(e?.message ?? 'Failed to load product details')
        setPayload(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [asin])

  const title =
    payload?.product?.title ??
    payload?.product?.product_title ??
    payload?.title ??
    initial?.title ??
    'Product'

  const images = useMemo(
    () => extractImages(payload, initial?.image),
    [payload, initial?.image]
  )

  const amazonCost = useMemo(
    () => extractAmazonPrice(payload, initial?.amazonPrice),
    [payload, initial?.amazonPrice]
  )

  const ebayPrice = useMemo(
    () => suggestedEbayPrice({ amazonCost, targetMarginPct: 25 }),
    [amazonCost]
  )

  const { ebayFee, paymentFee, netProfit, margin } = useMemo(
    () => calculateProfit({ ebayPrice, amazonCost }),
    [ebayPrice, amazonCost]
  )

  const indicator = useMemo(() => marketIndicator({ margin }), [margin])
  const badgeClass =
    indicator.color === 'green'
      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
      : indicator.color === 'amber'
        ? 'border-amber-500/40 bg-amber-500/15 text-amber-200'
        : 'border-red-500/40 bg-red-500/15 text-red-200'

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError('')
    try {
      await saveProduct({
        uid: user.uid,
        asin,
        product: {
          asin,
          title,
          image: images[0] ?? initial?.image ?? null,
          amazonCost,
          ebayPrice,
          profit: netProfit,
          margin,
          fees: { ebayFee, paymentFee },
          lastKnown: { amazonPrice: amazonCost, ebayPrice },
        },
      })
      navigate('/dashboard/saved')
    } catch (e) {
      setError(e?.message ?? 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const salesData = useMemo(() => {
    // Placeholder / mock data if none available
    const base = [
      { label: 'Week -4', sold: 12 },
      { label: 'Week -3', sold: 15 },
      { label: 'Week -2', sold: 10 },
      { label: 'Week -1', sold: 18 },
      { label: 'Week 0', sold: 20 },
    ]
    const data =
      payload?.product?.sales_history ??
      payload?.product?.bestsellers_rank_history ??
      null
    if (Array.isArray(data) && data.length) {
      return data.slice(0, 8).map((d, i) => ({
        label: d?.date ?? `T-${i}`,
        sold: d?.value ?? d?.sales ?? d?.rank ?? 0,
      }))
    }
    return base
  }, [payload])

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-slate-500">ASIN: {asin}</div>
          <h1 className="mt-1 line-clamp-2 text-lg font-semibold text-slate-50">
            {title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2 py-1 text-xs ${badgeClass}`}>
              Market entry: {indicator.label}
            </span>
            <Link
              to={`/dashboard/analysis/${asin}`}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
            >
              View analytics
            </Link>
          </div>
        </div>

        <Button variant="ghost" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      <Alert message={error} />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="h-96 animate-pulse rounded-2xl border border-slate-800 bg-slate-950/60" />
          <div className="h-96 animate-pulse rounded-2xl border border-slate-800 bg-slate-950/60" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Carousel images={images} title={title} />

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="text-xs text-slate-500">Amazon cost</div>
                  <div className="mt-1 text-lg font-semibold text-slate-50">
                    ${amazonCost || '—'}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="text-xs text-slate-500">Suggested eBay price</div>
                  <div className="mt-1 text-lg font-semibold text-slate-50">
                    ${ebayPrice}
                  </div>
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

              <div className="mt-4 flex justify-end">
                <Button onClick={handleSave} disabled={saving || !user}>
                  {saving ? 'Saving…' : 'Save product'}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="mb-3 text-sm font-semibold text-slate-100">
                Estimated sales trend (weekly)
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Line type="monotone" dataKey="sold" stroke="#60a5fa" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Sales counts are estimated placeholders unless real sales data is
                available.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="mb-3 text-sm font-semibold text-slate-100">
                Profit vs fees breakdown
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Amazon cost', value: amazonCost },
                      { name: 'eBay fee', value: ebayFee },
                      { name: 'Payment fee', value: paymentFee },
                      { name: 'Net profit', value: netProfit },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#34d399" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

