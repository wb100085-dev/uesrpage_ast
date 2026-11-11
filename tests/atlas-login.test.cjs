/* eslint-disable @typescript-eslint/no-require-imports -- 기존 테스트와 같은 격리된 VM 실행. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== 'object') return [];
  return [node, ...elements(node.props?.children)];
}

function login({ user = null, next, pendingReview = false, meFails = false, redeemFails = false, redemption } = {}) {
  const events = [];
  const params = new URLSearchParams();
  if (next != null) params.set('next', next);
  const imports = {
    'react/jsx-runtime': require('react/jsx-runtime'),
    react: { Suspense: 'Suspense', useState: initial => [initial, () => {}] },
    'next/image': { default: 'img' },
    'next/link': { default: 'a' },
    'next/navigation': {
      useRouter: () => ({ push: url => events.push(['push', url]) }),
      useSearchParams: () => params,
    },
    'lucide-react': Object.fromEntries(['Mail', 'Lock', 'Eye', 'EyeOff', 'ArrowRight', 'Sparkles', 'AlertCircle', 'CheckCircle2', 'MailCheck'].map(name => [name, name])),
    '@/lib/auth-api': {
      authLogin: async () => { events.push(['login']); },
      authGetMe: async () => { events.push(['me']); if (meFails) throw new Error('조회 실패'); return user; },
      getAccessToken: () => 'test-access',
      getRefreshToken: () => 'test-refresh',
    },
    '@/lib/pending-review': { hasPendingReview: () => pendingReview, PENDING_REVIEW_NEXT: '/pending-review-test' },
    '@/lib/survey-api': {
      redeemPendingReportToken: async () => {
        events.push(['redeem:start']);
        if (redemption) await redemption;
        if (redeemFails) throw new Error('리딤 실패');
        events.push(['redeem:end']);
        return true;
      },
    },
    '@/lib/i18n': { useT: () => ko => ko },
    '@/components/LangToggle': { default: 'LangToggle' },
  };
  const window = { location: {
    assign: url => events.push(['assign', url]),
    set href(url) { events.push(['handoff', url]); },
  } };
  const source = ts.transpileModule(fs.readFileSync(__dirname + '/../app/login/page.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(`(function(exports,require,module){${source}\n})`, { window, URLSearchParams })(
    mod.exports,
    name => { assert.ok(Object.hasOwn(imports, name), `예상하지 못한 모듈: ${name}`); return imports[name]; },
    mod,
  );
  const inner = mod.exports.default().props.children;
  const form = elements(inner.type()).find(node => node.type === 'form');
  const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
  return {
    events, flush,
    async submit() { await form.props.onSubmit({ preventDefault() {} }); await flush(); },
  };
}

test('슈퍼계정의 Atlas next는 쿠폰 리딤 완료 후에만 전체 페이지 이동한다', async () => {
  for (const next of ['/atlas', '/atlas/', '/atlas/reports?tab=latest#summary']) {
    let finish;
    const redemption = new Promise(resolve => { finish = resolve; });
    const app = login({ user: { is_superuser: true, is_staff: true }, next, redemption });
    await app.submit();
    assert.deepEqual(app.events, [['login'], ['me'], ['redeem:start']]);
    finish();
    await app.flush();
    assert.deepEqual(app.events, [['login'], ['me'], ['redeem:start'], ['redeem:end'], ['assign', next]]);
  }
});

test('Atlas 복귀 시 쿠폰 리딤에 실패해도 기존 폴백처럼 이동을 계속한다', async () => {
  const app = login({ user: { is_superuser: true }, next: '/atlas/', redeemFails: true });
  await app.submit();
  assert.deepEqual(app.events, [['login'], ['me'], ['redeem:start'], ['assign', '/atlas/']]);
});

test('next 없음·다른 next·staff만인 계정의 관리자 핸드오프는 유지한다', async () => {
  for (const options of [
    { user: { is_superuser: true } },
    ...['/design', '/atlas-other', '//external.test/atlas/', 'https://external.test/atlas/', '/login'].map(next => ({ user: { is_superuser: true }, next })),
    { user: { is_staff: true }, next: '/atlas/' },
    { user: { is_superuser: 'true' }, next: '/atlas/' },
  ]) {
    const app = login(options);
    await app.submit();
    assert.deepEqual(app.events, [
      ['login'], ['me'],
      ['handoff', 'https://admin-frontend-chi-two.vercel.app/admin-handoff#access=test-access&refresh=test-refresh'],
    ]);
  }
});

test('일반 계정은 쿠폰 리딤 후 기존 next·보류 후기·대시보드 우선순위를 유지한다', async () => {
  for (const [options, destination] of [
    [{ next: '/atlas/', pendingReview: true }, '/atlas/'],
    [{ next: '/design' }, '/design'],
    [{ pendingReview: true }, '/pending-review-test'],
    [{}, '/dashboard/user'],
    [{ next: '//external.test' }, '/dashboard/user'],
    [{ next: '/login' }, '/dashboard/user'],
  ]) {
    const app = login({ user: { is_superuser: false }, ...options });
    await app.submit();
    assert.deepEqual(app.events, [['login'], ['me'], ['redeem:start'], ['redeem:end'], ['push', destination]]);
  }
});

test('사용자 조회 실패 시에도 기존 일반 사용자 next 이동을 유지한다', async () => {
  const app = login({ next: '/atlas/', meFails: true });
  await app.submit();
  assert.deepEqual(app.events, [['login'], ['me'], ['redeem:start'], ['redeem:end'], ['push', '/atlas/']]);
});

test('Atlas 초대 계정은 관리자 권한 없이 Atlas next로 전체 이동한다', async () => {
  const app = login({ user: { email: 'onlymindy1@gmail.com', is_superuser: false, is_staff: false, can_access_atlas: true }, next: '/atlas/' });
  await app.submit();
  assert.deepEqual(app.events, [['login'], ['me'], ['redeem:start'], ['redeem:end'], ['assign', '/atlas/']]);
});
