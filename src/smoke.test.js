import { test, expect, beforeEach } from 'vitest'
import { formatJson, minifyJson, decodeJwt, encodeBase64, decodeBase64, testRegex } from './utils/utilities'
import { loadStorage, saveStorage, clearStorage } from './utils/storage'

beforeEach(() => {
  clearStorage()
})

test('the app module loads without crashing', async () => {
  const mod = await import('./App.jsx')
  expect(mod.default).toBeTruthy()
})

test('JSON Formatter formats valid JSON with specified indentations', () => {
  const raw = '{"a":1,"b":[2,3]}'
  
  const formatted2 = formatJson(raw, 2)
  expect(formatted2.error).toBeNull()
  expect(formatted2.result).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}')

  const formatted4 = formatJson(raw, 4)
  expect(formatted4.error).toBeNull()
  expect(formatted4.result).toBe('{\n    "a": 1,\n    "b": [\n        2,\n        3\n    ]\n}')

  const formattedTab = formatJson(raw, 'tab')
  expect(formattedTab.error).toBeNull()
  expect(formattedTab.result).toBe('{\n\t"a": 1,\n\t"b": [\n\t\t2,\n\t\t3\n\t]\n}')
})

test('JSON Minifier minifies formatted JSON', () => {
  const formatted = '{\n  "foo": "bar",\n  "baz": true\n}'
  const minified = minifyJson(formatted)
  expect(minified.error).toBeNull()
  expect(minified.result).toBe('{"foo":"bar","baz":true}')
})

test('JSON Formatter catches syntax errors', () => {
  const invalidJson = '{"a": 1,}'
  const result = formatJson(invalidJson, 2)
  expect(result.result).toBe('')
  expect(result.error).toBeTruthy()
  expect(typeof result.error).toBe('string')
})

test('JWT Decoder decodes header and payload and checks exp status', () => {
  // Sub: 1234567890, name: John Doe, iat: 1516239022, exp: 2537939200 (far future)
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjI1Mzc5MzkyMDB9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  
  const decoded = decodeJwt(token)
  expect(decoded.error).toBeNull()
  expect(decoded.header).toEqual({ alg: 'HS256', typ: 'JWT' })
  expect(decoded.payload.sub).toBe('1234567890')
  expect(decoded.payload.name).toBe('John Doe')
  expect(decoded.isExpired).toBe(false)
  expect(decoded.expDate).toBeTruthy()
})

test('JWT Decoder detects expired tokens', () => {
  // exp: 1000000000 (year 2001)
  const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjEwMDAwMDAwMDB9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  
  const decoded = decodeJwt(expiredToken)
  expect(decoded.error).toBeNull()
  expect(decoded.isExpired).toBe(true)
})

test('JWT Decoder handles invalid token formats', () => {
  const invalidToken = 'not.a.valid.jwt.token'
  const decoded = decodeJwt(invalidToken)
  expect(decoded.header).toBeNull()
  expect(decoded.payload).toBeNull()
  expect(decoded.error).toBeTruthy()
})

test('Base64 Converter encodes and decodes strings correctly including UTF-8', () => {
  const plainText = 'Hello World! 🚀 123'
  const encoded = encodeBase64(plainText)
  expect(encoded.error).toBeNull()
  expect(encoded.result).toBeTruthy()

  const decoded = decodeBase64(encoded.result)
  expect(decoded.error).toBeNull()
  expect(decoded.result).toBe(plainText)
})

test('Base64 Converter handles invalid Base64 input', () => {
  const invalidBase64 = '!!!NotBase64!!!'
  const decoded = decodeBase64(invalidBase64)
  expect(decoded.result).toBe('')
  expect(decoded.error).toBeTruthy()
})

test('Regex Tester finds matches and capture groups with flags', () => {
  const pattern = '([a-z]+)@([a-z]+)\\.com'
  const flags = 'gi'
  const text = 'Contact alice@example.com or bob@test.com for assistance.'

  const result = testRegex(pattern, flags, text)
  expect(result.error).toBeNull()
  expect(result.count).toBe(2)
  expect(result.matches[0].match).toBe('alice@example.com')
  expect(result.matches[0].groups).toEqual(['alice', 'example'])
  expect(result.matches[1].match).toBe('bob@test.com')
  expect(result.matches[1].groups).toEqual(['bob', 'test'])
})

test('Regex Tester handles invalid regex syntax', () => {
  const invalidPattern = '([a-z+'
  const flags = 'g'
  const text = 'test string'

  const result = testRegex(invalidPattern, flags, text)
  expect(result.matches).toEqual([])
  expect(result.count).toBe(0)
  expect(result.error).toBeTruthy()
})

test('Local Storage helper saves and loads values', () => {
  expect(loadStorage('dev_utils_active_tab', 'json')).toBe('json')
  
  saveStorage('dev_utils_active_tab', 'jwt')
  expect(loadStorage('dev_utils_active_tab', 'json')).toBe('jwt')

  saveStorage('dev_utils_json_input', '{"test":true}')
  expect(loadStorage('dev_utils_json_input', '')).toBe('{"test":true}')
})
