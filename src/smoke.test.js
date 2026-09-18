import { test, expect } from 'vitest'

test('the app module loads without crashing', async () => {
  const mod = await import('./App.jsx')
  expect(mod.default).toBeTruthy()
})
