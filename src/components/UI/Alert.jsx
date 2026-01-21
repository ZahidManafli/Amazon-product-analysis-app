export default function Alert({ variant = 'error', message }) {
  if (!message) return null

  const colors =
    variant === 'error'
      ? 'border-red-500/60 bg-red-950/60 text-red-100'
      : 'border-amber-500/60 bg-amber-950/60 text-amber-100'

  return (
    <div className={`w-full rounded-md border px-3 py-2 text-sm ${colors}`}>
      {message}
    </div>
  )
}

