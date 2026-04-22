import { getToken } from './tokenStore.js'

const BASE = 'https://slack.com/api'

async function get(method, params = {}) {
  const token = await getToken('slack')
  if (!token) throw new Error('No Slack token')
  const url = new URL(`${BASE}/${method}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || 'Slack API error')
  return data
}

async function post(method, body = {}) {
  const token = await getToken('slack')
  if (!token) throw new Error('No Slack token')
  const res = await fetch(`${BASE}/${method}`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
    body:    JSON.stringify(body),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || 'Slack API error')
  return data
}

export const getSelf     = ()                    => get('auth.test')
export const getDMs      = ()                    => get('conversations.list', { types: 'im', limit: 100, exclude_archived: true })
export const getUser     = (user)                => get('users.info', { user })
export const getMessages = (channel)             => get('conversations.history', { channel, limit: 50 })
export const sendMessage = (channel, text)       => post('chat.postMessage', { channel, text })
