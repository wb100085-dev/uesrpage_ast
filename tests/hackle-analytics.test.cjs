/* eslint-disable @typescript-eslint/no-require-imports -- Node's CJS test runner loads TypeScript in isolated VM contexts. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

function load({ key = 'browser-test-key', pathname = '/', search = '', referrer = '', gtag } = {}) {
  const window = { location: { pathname, search }, gtag };
  Object.defineProperty(window.location, 'href', { get: () => 'https://socialtwin.test' + window.location.pathname + window.location.search });
  const context = vm.createContext({ window, document: { referrer }, process: { env: { NEXT_PUBLIC_HACKLE_SDK_KEY: key } }, URL, URLSearchParams, console });
  const modules = new Map();
  function requireModule(file) {
    if (modules.has(file)) return modules.get(file);
    const loadedModule = { exports: {} };
    const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
    }).outputText;
    const wrapped = vm.runInContext(`(function(exports, require, module){${source}\n})`, context);
    wrapped(loadedModule.exports, (name) => requireModule(name.startsWith('@/') ? name.slice(2) + '.ts' : path.posix.join(path.posix.dirname(file), name) + '.ts'), loadedModule);
    modules.set(file, loadedModule.exports);
    return loadedModule.exports;
  }
  return { window, bridge: requireModule('lib/hackle-analytics.ts'), analytics: () => requireModule('lib/analytics.ts'), instrumentation: () => requireModule('instrumentation-client.ts') };
}
function receiver({ reject = false } = {}) {
  const received = [];
  let optedOut = true;
  let ready;
  const initialized = new Promise((resolve, rejectReady) => { ready = reject ? () => rejectReady(new Error('offline')) : resolve; });
  const sdk = { createInstance(_key, config) { assert.equal(config.automaticPageTracking, false); assert.equal(config.automaticRouteTracking, false); assert.equal(config.optOutTracking, true); return { onInitialized: () => initialized, setOptOutTracking(value) { optedOut = value; }, track: (event) => { if (!optedOut) received.push(JSON.parse(JSON.stringify(event))); } }; } };
  return { received, ready, sdk, optedOut: () => optedOut };
}

test('events emitted before SDK readiness are delivered in order with safe mapped properties', async () => {
  const { bridge } = load(); const target = receiver();
  assert.equal(bridge.trackHackleEvent('회원가입', { 방식: '이메일', email: 'private@example.com', access: 'secret' }), true);
  assert.equal(bridge.trackHackleEvent('조사실행_접수', { 패널수: 10, 무료체험: true }), true);
  const init = bridge.initializeHackle(target.sdk);
  assert.equal(target.received.length, 0);
  target.ready(); await init;
  assert.deepEqual(target.received, [
    { key: 'complete_signup', properties: { method: '이메일', page_path: '/' } },
    { key: 'start_survey', properties: { panel_size: 10, is_free_trial: true, page_path: '/' } },
  ]);
});
test('missing SDK key keeps Hackle disabled and preserves GA4 return behavior', async () => {
  const calls = []; const { bridge, analytics } = load({ key: '', gtag: (...args) => calls.push(args) });
  let created = 0; await bridge.initializeHackle({ createInstance() { created++; throw new Error('must not initialize'); } });
  assert.equal(bridge.trackHackleEvent('회원가입'), false); assert.equal(created, 0);
  assert.equal(analytics().trackEvent('회원가입', { 방식: '이메일' }), true);
  assert.equal(calls.length, 1); assert.equal(calls[0][0], 'event'); assert.equal(calls[0][1], '회원가입');
});
test('failed SDK initialization never throws into product flows or prevents GA4', async () => {
  const calls = []; const { bridge, analytics } = load({ gtag: (...args) => calls.push(args) });
  const target = receiver({ reject: true }); const init = bridge.initializeHackle(target.sdk); target.ready();
  await assert.doesNotReject(init);
  assert.equal(analytics().trackEvent('회원가입'), true); assert.equal(calls.length, 1); assert.equal(target.received.length, 0);
});
test('GA4 exceptions do not block Hackle event delivery', async () => {
  const { bridge, analytics } = load({ gtag() { throw new Error('blocked'); } }); const target = receiver();
  const init = bridge.initializeHackle(target.sdk); target.ready(); await init;
  assert.equal(analytics().trackEvent('조사결과_조회', { 패널수: 10, 화면: '조사설계' }), true);
  assert.deepEqual(target.received, [{ key: 'view_survey_result', properties: { panel_size: 10, screen: '조사설계', page_path: '/' } }]);
});
test('page views omit query tokens and normalize result and password paths', async () => {
  const { bridge } = load({ pathname: '/results/private-job-id', search: '?utm_source=naver_blog&utm_campaign=guide24' }); const target = receiver();
  bridge.trackHacklePage('/results/private-job-id'); bridge.trackHacklePage('/results/private-job-id');
  const init = bridge.initializeHackle(target.sdk); target.ready(); await init;
  assert.deepEqual(target.received, [{ key: 'page_view', properties: { page_path: '/results/[id]', utm_source: 'naver_blog', utm_campaign: 'guide24' } }]);
});
test('credential callback defers initialization and safely flushes signup on navigation away', async () => {
  const { bridge, window } = load({ pathname: '/auth/callback', search: '?access=secret&refresh=more-secret' }); const target = receiver();
  let created = 0; const sdk = { createInstance(...args) { created++; return target.sdk.createInstance(...args); } };
  assert.equal(bridge.canInitializeHackle(), false);
  bridge.trackHacklePage('/auth/callback'); bridge.trackHackleEvent('회원가입', { 방식: '소셜' }); await bridge.initializeHackle(sdk); assert.equal(created, 0);
  window.location.pathname = '/dashboard/user'; window.location.search = '';
  assert.equal(bridge.canInitializeHackle(), true);
  const init = bridge.initializeHackle(sdk); target.ready(); await init;
  assert.equal(created, 1); assert.deepEqual(target.received, [{ key: 'complete_signup', properties: { method: '소셜', page_path: '/auth/callback' } }]);
});
test('unknown events and invalid numeric properties are not forwarded', async () => {
  const { bridge } = load(); const target = receiver();
  assert.equal(bridge.trackHackleEvent('arbitrary_private_event', { text: 'private' }), false);
  bridge.trackHackleEvent('결제완료', { 금액: NaN, 상품: 'standard', password: 'secret' });
  const init = bridge.initializeHackle(target.sdk); target.ready(); await init;
  assert.deepEqual(target.received, [{ key: 'complete_purchase', properties: { product: 'standard', page_path: '/' } }]);
});
test('disabled SDK queue is dropped and never prevents site events', async () => {
  const { bridge } = load(); const target = receiver();
  bridge.trackHackleEvent('회원가입'); bridge.disableHackle();
  const init = bridge.initializeHackle(target.sdk); target.ready(); await init;
  assert.equal(target.received.length, 0); assert.equal(bridge.trackHackleEvent('회원가입'), false);
});
test('readiness queue stays bounded if a CDN never finishes loading', async () => {
  const { bridge } = load(); const target = receiver();
  for (let i = 0; i < 150; i++) bridge.trackHackleEvent('무료체험_실행', { 패널수: i });
  const init = bridge.initializeHackle(target.sdk); target.ready(); await init;
  assert.equal(target.received.length, 100); assert.equal(target.received[0].properties.panel_size, 50); assert.equal(target.received.at(-1).properties.panel_size, 149);
});

test('nested return URLs and credential-bearing referrers never initialize Hackle', async () => {
  const cases = [
    { pathname: '/login', search: '?next=%2Ffree-report%3Fpass%3Dprivate-token' },
    { pathname: '/login', search: '?next=%252Ffree-report%253Fpass%253Dprivate-token' },
    { pathname: '/', referrer: 'https://www.socialtwin.site/auth/callback?access=private-token' },
    { pathname: '/', referrer: 'https://www.socialtwin.site/reset-password/private-uid/private-token' },
  ];
  for (const location of cases) {
    const { bridge } = load(location);
    assert.equal(bridge.canInitializeHackle(), false);
    let created = 0;
    await bridge.initializeHackle({ createInstance() { created++; throw new Error('must not initialize'); } });
    assert.equal(created, 0);
  }
  assert.equal(load({ pathname: '/login', search: '?next=%2Fdesign' }).bridge.canInitializeHackle(), true);
});

test('an initialized SDK is opted out before navigation and stays paused on credential routes', async () => {
  const { bridge, window } = load(); const target = receiver();
  const init = bridge.initializeHackle(target.sdk); target.ready(); await init;
  assert.equal(target.optedOut(), false);
  bridge.pauseHackleTracking();
  assert.equal(target.optedOut(), true);
  window.location.pathname = '/reset-password/private-uid/private-token';
  bridge.synchronizeHackleTracking();
  assert.equal(target.optedOut(), true);
  window.location.pathname = '/pricing';
  bridge.synchronizeHackleTracking();
  assert.equal(target.optedOut(), false);
});

test('SDK readiness during a route transition does not resume native tracking early', async () => {
  const { bridge, window } = load(); const target = receiver();
  const init = bridge.initializeHackle(target.sdk);
  bridge.pauseHackleTracking();
  target.ready(); await init;
  assert.equal(target.optedOut(), true);
  window.location.pathname = '/auth/callback'; window.location.search = '?access=private';
  bridge.synchronizeHackleTracking();
  assert.equal(target.optedOut(), true);
});

test('same-page and hash-only navigation keep tracking active; changing routes pauses before commit', async () => {
  const { bridge, instrumentation } = load(); const target = receiver();
  const init = bridge.initializeHackle(target.sdk); target.ready(); await init;
  const { onRouterTransitionStart } = instrumentation();
  onRouterTransitionStart('/'); assert.equal(target.optedOut(), false);
  onRouterTransitionStart('/#how'); assert.equal(target.optedOut(), false);
  onRouterTransitionStart('/auth/callback?access=private'); assert.equal(target.optedOut(), true);
});
