import { test, expect } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.jsx'

test('the app module loads without crashing', async () => {
  const mod = await import('./App.jsx')
  expect(mod.default).toBeTruthy()
})

test('app contains no external target="_blank" links', () => {
  const html = renderToString(React.createElement(App))
  expect(html).not.toContain('target="_blank"')
  expect(html).not.toContain('href="https://vite.dev/"')
  expect(html).not.toContain('href="https://react.dev/"')
  expect(html).not.toContain('href="https://github.com/vitejs/vite"')
})

test('app renders interactive feature buttons in next-steps', () => {
  const html = renderToString(React.createElement(App))
  expect(html).toContain('Explore Vite')
  expect(html).toContain('Learn more')
  expect(html).toContain('GitHub')
  expect(html).toContain('Discord')
  expect(html).toContain('X.com')
  expect(html).toContain('Bluesky')
  expect(html).toContain('class="feature-btn')
})

