/**
 * Utilities for multi-platform social sharing and clipboard fallback
 */

export async function copyToClipboard(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fallback below
    }
  }

  try {
    if (typeof document !== 'undefined') {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      return successful
    }
  } catch {
    return false
  }
  return false
}

export async function triggerNativeShare({ title = 'Gridiron Guesser 🏈', text, url }) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      const shareData = { title, text }
      if (url) shareData.url = url
      await navigator.share(shareData)
      return true
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Web Share failed:', err)
      }
      return false
    }
  }
  return false
}

export function openSocialShareIntent(platform, { text, title = 'Gridiron Guesser 🏈', url = '' }) {
  let shareUrl = ''
  const encodedText = encodeURIComponent(text)
  const encodedTitle = encodeURIComponent(title)
  const encodedUrl = encodeURIComponent(url)

  switch (platform.toLowerCase()) {
    case 'twitter':
    case 'x':
      shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}`
      break
    case 'reddit':
      shareUrl = url
        ? `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`
        : `https://www.reddit.com/submit?title=${encodedTitle}&text=${encodedText}`
      break
    case 'whatsapp':
      shareUrl = `https://api.whatsapp.com/send?text=${encodedText}`
      break
    default:
      return
  }

  if (typeof window !== 'undefined') {
    window.open(shareUrl, '_blank', 'noopener,noreferrer')
  }
}
