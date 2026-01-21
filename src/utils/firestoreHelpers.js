import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'

function yyyymmdd(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

export async function assertAndIncrementDailySearchLimit({
  uid,
  maxPerDay = 50,
}) {
  const dayId = yyyymmdd()
  const usageRef = doc(db, 'users', uid, 'usage', dayId)
  const snap = await getDoc(usageRef)
  const current = snap.exists() ? snap.data()?.searchCount ?? 0 : 0

  if (current >= maxPerDay) {
    throw new Error(`Daily search limit reached (${maxPerDay}/day).`)
  }

  if (snap.exists()) {
    await updateDoc(usageRef, {
      searchCount: current + 1,
      updatedAt: serverTimestamp(),
    })
  } else {
    await setDoc(usageRef, {
      dayId,
      searchCount: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
}

export async function logSearch({ uid, keyword, resultsSummary }) {
  const searchesCol = collection(db, 'users', uid, 'searches')
  const ref = doc(searchesCol)
  await setDoc(ref, {
    keyword,
    results: resultsSummary,
    createdAt: serverTimestamp(),
  })
}

export async function saveProduct({ uid, asin, product }) {
  const ref = doc(db, 'users', uid, 'savedProducts', asin)
  await setDoc(
    ref,
    {
      ...product,
      asin,
      updatedAt: serverTimestamp(),
      createdAt: product?.createdAt ?? serverTimestamp(),
    },
    { merge: true }
  )
}

export async function removeSavedProduct({ uid, asin }) {
  const ref = doc(db, 'users', uid, 'savedProducts', asin)
  await deleteDoc(ref)
}

export async function listSavedProducts({ uid, pageSize = 50 }) {
  const colRef = collection(db, 'users', uid, 'savedProducts')
  const q = query(colRef, orderBy('updatedAt', 'desc'), limit(pageSize))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getSavedProduct({ uid, asin }) {
  const ref = doc(db, 'users', uid, 'savedProducts', asin)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

