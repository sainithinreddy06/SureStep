import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

function source(path) {
  return stripTypeScriptTypes(readFileSync(new URL(path, import.meta.url), 'utf8'))
    .replace(/^import[\s\S]*?;\r?\n/gm, '')
    .replace(/^export /gm, '');
}

const image = { imageBase64: 'data:image/png;base64,iVBORw0KGgo=' };
const rangerMessage = { message: 'What should I pack?' };

function api(provider) {
  const routes = new Map();
  const app = { use() {}, get() {}, post(path, handler) { routes.set(path, handler); }, listen() {} };
  runInNewContext(source('../backend/server.ts'), {
    express: Object.assign(() => app, { json() {} }),
    dotenv: { config() {} },
    process: { env: provider ? { GEMINI_API_KEY: 'synthetic-test-key' } : {} },
    GoogleGenAI: class { models = { generateContent: provider }; },
    Type: { OBJECT: 'OBJECT', ARRAY: 'ARRAY', STRING: 'STRING' },
    Buffer,
  });

  return async (path, body) => {
    const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(result) { this.body = result; } };
    await routes.get(path)({ body }, response);
    return { status: response.statusCode, body: JSON.parse(JSON.stringify(response.body)) };
  };
}

test('AI routes report unavailability without a provider and retire step targets', async () => {
  const call = api();
  assert.deepEqual(await call('/api/ranger-chat', rangerMessage), { status: 503, body: { error: 'Ranger AI is unavailable' } });
  assert.equal((await call('/api/ranger-chat', { message: '   ' })).status, 400);
  assert.deepEqual(await call('/api/analyze-terrain-image', image), { status: 503, body: { error: 'Terrain image analysis is unavailable' } });
  assert.equal((await call('/api/analyze-terrain-image', { imageBase64: 'not an image' })).status, 400);
  assert.equal((await call('/api/analyze-footsteps', image)).status, 410);
});

test('provider failures and malformed outputs never turn into successful advice', async () => {
  const offline = api(async () => { throw new Error('offline'); });
  assert.equal((await offline('/api/ranger-chat', rangerMessage)).status, 503);
  assert.equal((await offline('/api/analyze-terrain-image', image)).status, 503);

  const blank = api(async () => ({ text: ' ' }));
  assert.equal((await blank('/api/ranger-chat', rangerMessage)).status, 503);
  assert.equal((await blank('/api/analyze-terrain-image', image)).status, 503);
  const unexpected = api(async () => ({ text: '{"features":["Safe footing"]}' }));
  assert.equal((await unexpected('/api/analyze-terrain-image', image)).status, 503);
});

test('valid responses retain descriptive features and supplied Ranger information', async () => {
  const call = api(async request => {
    if (request.config.responseMimeType) return { text: '{"features":["Rock","Rock","Snow"]}' };
    assert.match(request.config.systemInstruction, /Device coordinates: Unavailable/);
    assert.match(request.config.systemInstruction, /Device elevation: Unavailable/);
    assert.match(request.config.systemInstruction, /Weather model: Unavailable/);
    return { text: '  Check the trail map before leaving.  ' };
  });
  assert.deepEqual((await call('/api/analyze-terrain-image', image)).body, { features: ['Rock', 'Snow'] });
  assert.deepEqual((await call('/api/ranger-chat', rangerMessage)).body, { reply: 'Check the trail map before leaving.' });
});

test('archive reads are read-only and manual writes require acknowledgement', async () => {
  let read = async () => ({ empty: true, docs: [] });
  let write = async () => ({ id: 'acknowledged' });
  let writes = 0;
  const functions = runInNewContext(source('../frontend/src/services/firebase.ts') + '\n({ getHistoricalIncidents, logHistoricalIncident })', {
    initializeApp: () => ({}), firebaseConfig: {}, getFirestore: () => ({}), collection: () => ({}),
    getDocsFromServer: () => read(),
    addDoc: (...args) => { writes++; return write(...args); },
  });
  assert.equal((await functions.getHistoricalIncidents('trail')).length, 0);
  read = async () => ({ docs: [{ id: 'existing', data: () => ({ trailId: 'trail' }) }, { id: 'other', data: () => ({ trailId: 'other' }) }] });
  assert.equal((await functions.getHistoricalIncidents('trail'))[0].id, 'existing');
  read = async () => { throw new Error('offline'); };
  await assert.rejects(() => functions.getHistoricalIncidents('trail'), /offline/);
  assert.equal(writes, 0);
  assert.equal(await functions.logHistoricalIncident({ title: 'Synthetic report' }), 'acknowledged');
  write = async () => { throw new Error('write rejected'); };
  await assert.rejects(() => functions.logHistoricalIncident({ title: 'Synthetic report' }), /write rejected/);
  assert.equal(writes, 2);
});
