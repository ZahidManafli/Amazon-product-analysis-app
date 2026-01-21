import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/UI/Button.jsx'
import Alert from '../../components/UI/Alert.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  listSavedProducts,
  removeSavedProduct,
} from '../../utils/firestoreHelpers.js'

export default function SavedProductsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      const data = await listSavedProducts({ uid: user.uid })
      setItems(data)
    } catch (e) {
      setError(e?.message ?? 'Failed to load saved products')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRemove = async (asin) => {
    setError('')
    try {
      await removeSavedProduct({ uid: user.uid, asin })
      await refresh()
    } catch (e) {
      setError(e?.message ?? 'Failed to remove product')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Saved Products</h1>
          <p className="text-sm text-slate-400">
            Your saved products with quick access to analysis.
          </p>
        </div>
        <Button variant="subtle" onClick={refresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      <Alert message={error} />

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
          No saved products yet. Go to Manual Search or Offered Products and
          save one.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <div
              key={p.asin ?? p.id}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
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
                    {p.title ?? 'Untitled'}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Profit: {typeof p.profit === 'number' ? `$${p.profit}` : '—'}{' '}
                    <span className="text-slate-600">•</span> Margin:{' '}
                    {typeof p.margin === 'number' ? `${p.margin}%` : '—'}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <Link
                  to={`/dashboard/product/${p.asin ?? p.id}`}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
                >
                  View product
                </Link>
                <Link
                  to={`/dashboard/analysis/${p.asin ?? p.id}`}
                  className="text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  Analytics
                </Link>
                <Button
                  variant="ghost"
                  className="px-3 py-1 text-xs"
                  onClick={() => handleRemove(p.asin ?? p.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

