import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fetchLiveWeather, WEATHER_STALE_MS } from '../src/services/weatherService.ts';

const modelTime = Math.floor((Date.now() - WEATHER_STALE_MS - 60_000) / 1000);
const sample = {
  elevation: 0,
  current: {
    time: modelTime,
    temperature_2m: 12,
    apparent_temperature: 11,
    relative_humidity_2m: 77,
    precipitation: 0,
    weather_code: 0,
    wind_speed_10m: 0,
    wind_gusts_10m: 0,
    precipitation_probability: 0,
    uv_index: 0,
  },
};

test('weather distinguishes source time, same-location cache, and unavailable data', async t => {
  const storage = new Map();
  t.mock.method(globalThis, 'fetch', async url => {
    const params = new URL(url).searchParams;
    assert.equal(params.get('latitude'), '0');
    assert.equal(params.get('longitude'), '0');
    assert.equal(params.get('timeformat'), 'unixtime');
    assert.ok(params.get('current').includes('precipitation_probability'));
    return new Response(JSON.stringify(sample));
  });
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  });
  t.after(() => {
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else delete globalThis.localStorage;
  });

  const controller = new AbortController();
  const weather = await fetchLiveWeather(0, 0, controller.signal);
  assert.equal(weather.validAt, modelTime * 1000);
  assert.equal(weather.isCached, false);
  assert.equal(weather.precipitationProbability, 0);

  globalThis.fetch.mock.mockImplementation(async () => new Response(null, { status: 503 }));
  const cached = await fetchLiveWeather(0, 0, controller.signal);
  assert.equal(cached.isCached, true);
  assert.equal(cached.validAt, weather.validAt);
  assert.equal(await fetchLiveWeather(0, 1, controller.signal), null);

  globalThis.fetch.mock.mockImplementation(async () => {
    const incomplete = structuredClone(sample);
    delete incomplete.current.temperature_2m;
    return new Response(JSON.stringify(incomplete));
  });
  assert.equal(await fetchLiveWeather(0, 1, controller.signal), null);

  globalThis.fetch.mock.mockImplementation(async () => {
    controller.abort();
    return new Response(JSON.stringify(sample));
  });
  assert.equal(await fetchLiveWeather(0, 0, controller.signal), null);
});
