const assert = require('node:assert/strict');
const test = require('node:test');
const { createApp } = require('../src/app');

test('GET /health returns ok', async () => {
  const server = createApp().listen(0);

  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, { status: 'ok' });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

