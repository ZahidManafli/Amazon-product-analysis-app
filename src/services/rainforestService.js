import { db } from '../firebase'
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'

function stableKey(input) {
  // Keep key Firestore-friendly and deterministic
  return btoa(unescape(encodeURIComponent(input)))
    .replaceAll('=', '')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
}

function getApiKey() {
  const key = import.meta.env.VITE_RAINFOREST_API_KEY
  if (!key) {
    throw new Error(
      'Missing VITE_RAINFOREST_API_KEY. Add it to your .env and restart the dev server.'
    )
  }
  return key
}

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 6 // 6 hours

async function getCachedOrFetch({ cacheId, ttlMs = DEFAULT_TTL_MS, fetcher }) {
  const cacheRef = doc(collection(db, 'apiCache'), cacheId)
  let snap = null
  try {
    snap = await getDoc(cacheRef)
  } catch {
    // If Firestore rules block cache reads, fall back to fetching.
    snap = null
  }
  const now = Date.now()

  if (snap?.exists?.()) {
    const data = snap.data()
    const cachedAt = data?.cachedAt?.toMillis?.() ?? 0
    if (cachedAt && now - cachedAt < ttlMs && data?.payload) {
      return { payload: data.payload, fromCache: true }
    }
  }

  const payload = await fetcher()
  try {
    await setDoc(
      cacheRef,
      {
        payload,
        cachedAt: serverTimestamp(),
      },
      { merge: true }
    )
  } catch {
    // If Firestore rules block cache writes, ignore and still return payload.
  }

  return { payload, fromCache: false }
}

export async function rainforestSearchProducts({
  keyword,
  amazonDomain = 'amazon.com',
  page = 1,
}) {
  const apiKey = getApiKey()
  const q = keyword?.trim()
  if (!q) throw new Error('Please enter a keyword')

  const cacheId = `search_${amazonDomain}_${stableKey(`${q}|${page}`)}`

  return await getCachedOrFetch({
    cacheId,
    fetcher: async () => {
      const url = new URL('https://api.rainforestapi.com/request')
      url.searchParams.set('api_key', apiKey)
      url.searchParams.set('type', 'search')
      url.searchParams.set('amazon_domain', amazonDomain)
      url.searchParams.set('search_term', q)
      url.searchParams.set('page', String(page))

      const res = await fetch(url.toString())
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Rainforest error (${res.status}): ${text}`)
      }
      return await res.json()
    },
  })
}

export async function rainforestGetProduct({
  asin,
  amazonDomain = 'amazon.com',
}) {
  const apiKey = getApiKey()
  const a = asin?.trim()
  if (!a) throw new Error('Missing ASIN')

  const cacheId = `product_${amazonDomain}_${stableKey(a)}`

  return await getCachedOrFetch({
    cacheId,
    fetcher: async () => {
      const url = new URL('https://api.rainforestapi.com/request')
      url.searchParams.set('api_key', apiKey)
      url.searchParams.set('type', 'product')
      url.searchParams.set('amazon_domain', amazonDomain)
      url.searchParams.set('asin', a)

      const res = await fetch(url.toString())
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Rainforest error (${res.status}): ${text}`)
      }
      return await res.json()
    },
  })
}
