// utils/redirectToStore.ts
export function redirectToStore() {
  if (typeof window === 'undefined') return

  const ua = navigator.userAgent

  const isAndroid = /Android/i.test(ua)
  const isIOS = /iPhone|iPad|iPod/i.test(ua)
  const isMacOS = /Macintosh|Mac OS X/i.test(ua)

  if (isAndroid) {
    window.location.href =
      'https://play.google.com/store/apps/details?id=com.hellomik.infobuh&hl=ru'
    return
  }

  if (isIOS || isMacOS) {
    window.location.href =
      'https://apps.apple.com/kz/app/infobuh/id6739352874'
    return
  }

  // fallback
  window.location.href =
    'https://apps.apple.com/kz/app/infobuh/id6739352874'
}
