import type { User } from './models'

const ADDR = import.meta.env.VITE_API_ADDRESS

export async function getOnlineUsers(): Promise<User[]> {
  let path = '/api/allonlineusers'

  if (ADDR.endsWith('/')) {
    path = path.substring(1)
  }

  let resp = await fetch(`${location.protocol}//${ADDR}${path}`)
  let data: User[] = await resp.json()

  return data
}
