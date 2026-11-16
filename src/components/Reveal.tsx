import type { CSSProperties, ElementType, ReactNode } from 'react'
import { useReveal } from '../hooks/useReveal'

interface RevealProps {
  children: ReactNode
  as?: ElementType
  delay?: number
  className?: string
}

/** Fade + rise on first entry. Transform/opacity only; disabled for reduced motion (see index.css). */
export default function Reveal({ children, as: Tag = 'div', delay = 0, className = '' }: RevealProps) {
  const { ref, visible } = useReveal<HTMLElement>()
  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  )
}
