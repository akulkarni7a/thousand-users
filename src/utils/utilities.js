// Helper utilities for JSON, JWT, Base64, and Regex processing

export function formatJson(input, indent = 2) {
  if (!input || !input.trim()) {
    return { result: '', error: null }
  }
  try {
    const parsed = JSON.parse(input)
    const indentVal = indent === 'tab' ? '\t' : Number(indent)
    const result = JSON.stringify(parsed, null, indentVal)
    return { result, error: null }
  } catch (err) {
    return { result: '', error: err.message }
  }
}

export function minifyJson(input) {
  if (!input || !input.trim()) {
    return { result: '', error: null }
  }
  try {
    const parsed = JSON.parse(input)
    const result = JSON.stringify(parsed)
    return { result, error: null }
  } catch (err) {
    return { result: '', error: err.message }
  }
}

function base64UrlDecode(str) {
  let output = str.replace(/-/g, '+').replace(/_/g, '/')
  switch (output.length % 4) {
    case 0:
      break
    case 2:
      output += '=='
      break
    case 3:
      output += '='
      break
    default:
      throw new Error('Illegal base64url string!')
  }
  const binary = atob(output)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function decodeJwt(token) {
  if (!token || !token.trim()) {
    return {
      header: null,
      payload: null,
      signature: null,
      isExpired: null,
      expDate: null,
      iatDate: null,
      error: null,
    }
  }

  const cleanToken = token.trim()
  const parts = cleanToken.split('.')

  if (parts.length < 2 || parts.length > 3) {
    return {
      header: null,
      payload: null,
      signature: null,
      isExpired: null,
      expDate: null,
      iatDate: null,
      error:
        'Invalid JWT format. A valid JWT consists of header, payload, and optional signature separated by dots.',
    }
  }

  try {
    const headerStr = base64UrlDecode(parts[0])
    const payloadStr = base64UrlDecode(parts[1])

    const header = JSON.parse(headerStr)
    const payload = JSON.parse(payloadStr)
    const signature = parts[2] || ''

    let isExpired = null
    let expDate = null
    let iatDate = null

    if (payload && typeof payload.exp === 'number') {
      const expMs = payload.exp * 1000
      isExpired = Date.now() > expMs
      expDate = new Date(expMs).toISOString()
    }

    if (payload && typeof payload.iat === 'number') {
      iatDate = new Date(payload.iat * 1000).toISOString()
    }

    return {
      header,
      payload,
      signature,
      isExpired,
      expDate,
      iatDate,
      error: null,
    }
  } catch (err) {
    return {
      header: null,
      payload: null,
      signature: null,
      isExpired: null,
      expDate: null,
      iatDate: null,
      error: 'Failed to decode token: ' + err.message,
    }
  }
}

export function encodeBase64(str) {
  if (str === null || str === undefined || str === '') {
    return { result: '', error: null }
  }
  try {
    const bytes = new TextEncoder().encode(str)
    let bin = ''
    bytes.forEach((b) => {
      bin += String.fromCharCode(b)
    })
    const result = btoa(bin)
    return { result, error: null }
  } catch (err) {
    return { result: '', error: 'Encoding failed: ' + err.message }
  }
}

export function decodeBase64(str) {
  if (str === null || str === undefined || str === '') {
    return { result: '', error: null }
  }
  try {
    const cleanStr = str.trim()
    const binary = atob(cleanStr)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const result = new TextDecoder().decode(bytes)
    return { result, error: null }
  } catch (err) {
    return { result: '', error: 'Invalid Base64 string format: ' + err.message }
  }
}

export function testRegex(pattern, flags, text) {
  if (!pattern && pattern !== '') {
    return { matches: [], count: 0, error: null }
  }
  if (!text && text !== '') {
    return { matches: [], count: 0, error: null }
  }

  try {
    const re = new RegExp(pattern, flags)
    if (!text) {
      return { matches: [], count: 0, error: null }
    }

    if (flags.includes('g')) {
      const matches = []
      let match
      let guard = 0
      while ((match = re.exec(text)) !== null) {
        matches.push({
          index: match.index,
          match: match[0],
          groups: match.slice(1),
        })
        if (match[0].length === 0) {
          re.lastIndex++
        }
        if (++guard > 5000) break
      }
      return { matches, count: matches.length, error: null }
    } else {
      const match = re.exec(text)
      if (match) {
        return {
          matches: [
            {
              index: match.index,
              match: match[0],
              groups: match.slice(1),
            },
          ],
          count: 1,
          error: null,
        }
      }
      return { matches: [], count: 0, error: null }
    }
  } catch (err) {
    return { matches: [], count: 0, error: err.message }
  }
}
