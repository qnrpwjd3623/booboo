import { test } from 'node:test';
import assert from 'node:assert/strict';
import React, { useState } from 'react';
import { act, create } from 'react-test-renderer';
import { build } from 'esbuild';

// Compile the actual boundary with the same automatic JSX transform as the app.
const compiled = await build({ entryPoints: ['./src/components/AccountBoundary.tsx'], bundle: true,
  write: false, format: 'esm', packages: 'external', jsx: 'automatic' });
const code = compiled.outputFiles[0].text.replaceAll('"react/jsx-runtime"', JSON.stringify(new URL('../node_modules/react/jsx-runtime.js', import.meta.url).href));
const { AccountBoundary } = await import(`data:text/javascript,${encodeURIComponent(code)}`);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('account switch resets private state and ignores delayed previous-account results', async () => {
  const setters = [];
  function PrivateView() {
    const [comment, setComment] = useState('empty');
    setters.push(setComment);
    return React.createElement('p', null, comment);
  }
  const render = (userId) => React.createElement(AccountBoundary, { userId }, React.createElement(PrivateView));
  let root;
  await act(async () => { root = create(render('account-a')); });
  const setOldComment = setters[0];
  await act(async () => { setOldComment('A private financial comment'); });
  assert.ok(JSON.stringify(root.toJSON()).includes('A private'));
  await act(async () => { root.update(render('account-b')); });
  assert.ok(!JSON.stringify(root.toJSON()).includes('A private'));
  await act(async () => { setOldComment('A delayed private response'); });
  assert.ok(!JSON.stringify(root.toJSON()).includes('A delayed'));
  await act(async () => { setters.at(-1)('B private'); });
  await act(async () => { root.update(render(null)); });
  await act(async () => { root.update(render('account-b')); });
  assert.ok(!JSON.stringify(root.toJSON()).includes('B private'));
  await act(async () => { root.unmount(); });
});
