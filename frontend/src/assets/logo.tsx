import { type ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type LogoProps = ImgHTMLAttributes<HTMLImageElement>

export function Logo({ className, alt, ...props }: LogoProps) {
  return (
    <img
      src="/images/pulseboardlogo.png"
      alt={alt ?? 'Pulse Board logo'}
      className={cn('h-6 w-6', className)}
      {...props}
    />
  )
}
