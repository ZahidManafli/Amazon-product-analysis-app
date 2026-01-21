import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
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
import { getSavedProduct, saveProduct } from '../../utils/firestoreHelpers.js'

function fmtTs(ts) {
  try {
    const d = ts?.toDate?.() ?? new Date(ts)
    return d.toLocaleDateString()
  } catch {
    return ''
  }
}

export default function ProductAnalysisPage() {
  const { asin } = useParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [product, setProduct] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const p = await getSavedProduct({ uid: user.uid, asin })
      setProduct(p)
      if (!p) setError('Product not found (not saved yet).')
    } catch (e) {
      setError(e?.message ?? 'Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asin])

  const priceSeries = useMemo(() => {
    const createdAt = product?.createdAt ?? null
    return [
      {
        t: createdAt ? fmtTs(createdAt) : 'Initial',
        amazon: product?.amazonCost ?? product?.lastKnown?.amazonPrice ?? 0,
        ebay: product?.ebayPrice ?? product?.lastKnown?.ebayPrice ?? 0,
      },
    ]
  }, [product])

  const breakdown = useMemo(() => {
    const amazon = Number(product?.amazonCost ?? 0)
    const ebayFee = Number(product?.fees?.ebayFee ?? 0)
    const paymentFee = Number(product?.fees?.paymentFee ?? 0)
    const profit = Number(product?.profit ?? 0)
    return [
      { name: 'Amazon cost', value: amazon },
      { name: 'eBay fee', value: ebayFee },
      { name: 'Payment fee', value: paymentFee },
      { name: 'Net profit', value: profit },
    ]
  }, [product])

  const handleRefreshSnapshot = async () => {
    // Placeholder: later this will re-fetch prices and append to history.
    // For now, just bumps updatedAt so the Saved Products list reorders.
    if (!product) return
    try {
      await saveProduct({
        uid: user.uid,
        asin,
        product: { ...product },
      })
      await load()
    } catch (e) {
      setError(e?.message ?? 'Failed to refresh')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">
            Product Analysis
          </h1>
          <p className="text-sm text-slate-400">
            Charts and breakdown for your saved product.
          </p>
        </div>
        <Button variant="subtle" onClick={handleRefreshSnapshot} disabled={!product}>
          Refresh snapshot
        </Button>
      </div>

      <Alert message={error} />

      {loading ? (
        <div className="h-40 animate-pulse rounded-xl border border-slate-800 bg-slate-950/60" />
      ) : !product ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-6 text-sm text-slate-400">
          Save this product first to view analysis.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="mb-3 text-sm font-semibold text-slate-100">
              Price comparison (Amazon vs eBay)
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="t" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Line type="monotone" dataKey="amazon" stroke="#60a5fa" />
                  <Line type="monotone" dataKey="ebay" stroke="#a78bfa" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="mb-3 text-sm font-semibold text-slate-100">
              Profit breakdown
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#34d399" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 lg:col-span-2">
            <div className="mb-2 text-sm font-semibold text-slate-100">
              Current metrics
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-200 sm:grid-cols-4">
              <div>
                <div className="text-xs text-slate-500">Amazon cost</div>
                <div className="font-medium">${product.amazonCost ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">eBay price</div>
                <div className="font-medium">${product.ebayPrice ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Net profit</div>
                <div className="font-medium">
                  {typeof product.profit === 'number' ? `$${product.profit}` : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Margin</div>
                <div className="font-medium">
                  {typeof product.margin === 'number' ? `${product.margin}%` : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

