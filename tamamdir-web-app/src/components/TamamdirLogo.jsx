import { cn } from '../lib/utils'

export default function TamamdirLogo({ className }) {
  return (
    <img
      src="/tamamdir-logo.png"
      alt="Tamamdır"
      className={cn('h-12 w-auto object-contain', className)}
    />
  )
}
