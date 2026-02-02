// lib/notifications.ts
// Local notifications for game reminders

import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications'

export interface GameReminder {
  gameId: string
  team: string
  opponent: string
  gameDate: string
  gameTime: string
  channel: string
  isHome: boolean
}

// Check if we're running in Capacitor (native app) vs browser
export const isNativeApp = (): boolean => {
  return typeof window !== 'undefined' &&
         window.hasOwnProperty('Capacitor') &&
         (window as any).Capacitor?.isNativePlatform?.()
}

// Request notification permissions
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNativeApp()) {
    // Web fallback - use browser Notification API
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }

  try {
    const result = await LocalNotifications.requestPermissions()
    return result.display === 'granted'
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return false
  }
}

// Check if notifications are enabled
export async function checkNotificationPermission(): Promise<boolean> {
  if (!isNativeApp()) {
    if ('Notification' in window) {
      return Notification.permission === 'granted'
    }
    return false
  }

  try {
    const result = await LocalNotifications.checkPermissions()
    return result.display === 'granted'
  } catch (error) {
    console.error('Error checking notification permission:', error)
    return false
  }
}

// Schedule a game reminder notification
export async function scheduleGameReminder(
  game: GameReminder,
  minutesBefore: number = 30
): Promise<boolean> {
  try {
    // Parse game date and time
    const gameDateTime = parseGameDateTime(game.gameDate, game.gameTime)
    if (!gameDateTime) {
      console.error('Could not parse game date/time')
      return false
    }

    // Calculate notification time (X minutes before game)
    const notificationTime = new Date(gameDateTime.getTime() - minutesBefore * 60 * 1000)

    // Don't schedule if the notification time has passed
    if (notificationTime <= new Date()) {
      console.log('Game reminder time has already passed')
      return false
    }

    const notificationId = generateNotificationId(game.gameId)
    const matchupText = game.isHome
      ? `${game.team} vs ${game.opponent}`
      : `${game.team} @ ${game.opponent}`

    if (!isNativeApp()) {
      // Web fallback - store reminder in localStorage and use setTimeout
      // (This is a simplified version - full implementation would use Service Workers)
      const reminders = getStoredReminders()
      reminders[game.gameId] = {
        ...game,
        notificationTime: notificationTime.toISOString(),
        minutesBefore
      }
      localStorage.setItem('gameReminders', JSON.stringify(reminders))
      return true
    }

    const scheduleOptions: ScheduleOptions = {
      notifications: [
        {
          id: notificationId,
          title: 'Game Starting Soon!',
          body: `${matchupText} starts in ${minutesBefore} minutes on ${game.channel}`,
          schedule: {
            at: notificationTime,
            allowWhileIdle: true
          },
          extra: {
            gameId: game.gameId,
            team: game.team
          }
        }
      ]
    }

    await LocalNotifications.schedule(scheduleOptions)

    // Store reminder info locally
    const reminders = getStoredReminders()
    reminders[game.gameId] = {
      ...game,
      notificationId,
      notificationTime: notificationTime.toISOString(),
      minutesBefore
    }
    localStorage.setItem('gameReminders', JSON.stringify(reminders))

    return true
  } catch (error) {
    console.error('Error scheduling game reminder:', error)
    return false
  }
}

// Cancel a game reminder
export async function cancelGameReminder(gameId: string): Promise<boolean> {
  try {
    const reminders = getStoredReminders()
    const reminder = reminders[gameId]

    if (reminder?.notificationId && isNativeApp()) {
      await LocalNotifications.cancel({
        notifications: [{ id: reminder.notificationId }]
      })
    }

    delete reminders[gameId]
    localStorage.setItem('gameReminders', JSON.stringify(reminders))

    return true
  } catch (error) {
    console.error('Error canceling game reminder:', error)
    return false
  }
}

// Check if a game has a reminder set
export function hasGameReminder(gameId: string): boolean {
  const reminders = getStoredReminders()
  return !!reminders[gameId]
}

// Get all stored reminders
export function getStoredReminders(): Record<string, any> {
  if (typeof window === 'undefined') return {}
  try {
    const stored = localStorage.getItem('gameReminders')
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

// Parse game time string (e.g., "7:10 PM ET") to Date
function parseGameDateTime(dateStr: string, timeStr: string): Date | null {
  try {
    // dateStr format: "2026-03-25"
    // timeStr format: "7:10 PM ET"

    // Extract time components
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    if (!timeMatch) return null

    let hours = parseInt(timeMatch[1])
    const minutes = parseInt(timeMatch[2])
    const isPM = timeMatch[3].toUpperCase() === 'PM'

    if (isPM && hours !== 12) hours += 12
    if (!isPM && hours === 12) hours = 0

    // Create date in ET timezone (approximate - games are usually ET)
    const date = new Date(`${dateStr}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00-05:00`)

    return date
  } catch {
    return null
  }
}

// Generate a unique notification ID from game ID
function generateNotificationId(gameId: string): number {
  // Convert gameId to a numeric hash for notification ID
  let hash = 0
  for (let i = 0; i < gameId.length; i++) {
    const char = gameId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}
