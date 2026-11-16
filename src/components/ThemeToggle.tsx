import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  const option = (value: 'light' | 'dark', label: string) => {
    const active = theme === value
    return (
      <button
        type="button"
        onClick={() => setTheme(value)}
        aria-pressed={active}
        className={`px-1.5 py-2.5 -my-2.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fg focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-sm ${
          active ? 'text-fg font-medium' : 'text-muted hover:text-fg'
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`} role="group" aria-label="Colour theme">
      {option('light', 'Light')}
      <span className="h-4 w-px bg-line-strong" aria-hidden="true" />
      {option('dark', 'Dark')}
    </div>
  )
}
