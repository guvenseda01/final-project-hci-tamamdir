import { cn } from '../lib/utils'

export default function TamamdirLogo({ className }) {
  return (
    <img
      src="/tamamdir-logo.png?v=2"
      alt="Tamamdır"
      className={cn('h-[72px] w-auto object-contain', className)}
    />
  )
}
