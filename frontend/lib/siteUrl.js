export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://frontend-kohl-pi-29.vercel.app'
).replace(/\/$/, '')

export function authRedirectUrl(path) {
  return `${SITE_URL}${path}`
}
