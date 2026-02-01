import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatGameTime(dateTime: string): string {
  const date = new Date(dateTime)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatGameDate(dateTime: string): string {
  const date = new Date(dateTime)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function isGameBlackedOut(
  userState: string,
  blackoutRegions: string[] | undefined
): boolean {
  if (!blackoutRegions) return false
  return blackoutRegions.includes(userState)
}
