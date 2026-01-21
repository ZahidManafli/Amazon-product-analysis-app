export default function Button({
  children,
  className = '',
  variant = 'primary',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60'

  const variants = {
    primary:
      'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700',
    ghost:
      'border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800',
    subtle:
      'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700',
  }

  const styles = `${base} ${variants[variant] ?? variants.primary} ${className}`

  return (
    <button className={styles} {...props}>
      {children}
    </button>
  )
}

