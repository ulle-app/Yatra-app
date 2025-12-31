import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function getCrowdColor(level) {
  switch (level) {
    case 'low':
      return {
        bg: 'bg-green-500',
        text: 'text-green-700',
        badge: 'bg-green-50 text-green-700 border-green-200',
        pulse: 'pulse-green'
      }
    case 'medium':
      return {
        bg: 'bg-yellow-500',
        text: 'text-yellow-700',
        badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        pulse: 'pulse-yellow'
      }
    case 'high':
      return {
        bg: 'bg-red-500',
        text: 'text-red-700',
        badge: 'bg-red-50 text-red-700 border-red-200',
        pulse: 'pulse-red'
      }
    default:
      return {
        bg: 'bg-gray-500',
        text: 'text-gray-700',
        badge: 'bg-gray-50 text-gray-700 border-gray-200',
        pulse: ''
      }
  }
}

export function getCrowdLabel(level) {
  switch (level) {
    case 'low':
      return 'Low'
    case 'medium':
      return 'Moderate'
    case 'high':
      return 'High'
    default:
      return 'Unknown'
  }
}
