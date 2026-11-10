/* eslint-disable @typescript-eslint/no-require-imports -- 기존 테스트와 같은 격리된 VM 실행. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, globals = {}, imports = {}) {
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const mod = { exports: {} };
  const context = vm.createContext({ ...globals });
  vm.runInContext(`(function(exports,require,module){${source}\n})`, context)(
    mod.exports,
    name => {
      if (Object.hasOwn(imports, name)) return imports[name];
      throw new Error(`예상하지 못한 모듈: ${name}`);
    },
    mod,
  );
  return mod.exports.default;
}

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== 'object') return [];
  return [node, ...elements(node.props?.children)];
}

function navbar({ cachedUser = null, token = cachedUser ? 'test-token' : null, lang = 'ko' } = {}) {
  const states = [], navigations = [], effects = [], cleanups = [], listeners = new Map();
  let cursor = 0, requests = 0, rendered = false;
  const Navbar = load('components/Navbar.tsx', { window: {
    location: { assign: url => navigations.push(url) },
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: name => listeners.delete(name),
  } }, {
    'react/jsx-runtime': require('react/jsx-runtime'),
    react: {
      useEffect(effect) { if (!rendered) effects.push(effect); },
      useState(initial) {
        const index = cursor++;
        if (!(index in states)) states[index] = initial;
        return [states[index], value => { states[index] = value; }];
      },
    },
    'next/link': { default: 'a' },
    'next/image': { default: 'img' },
    'next/navigation': { useRouter: () => ({ push() {} }) },
    'lucide-react': Object.fromEntries(['LayoutDashboard', 'LogOut', 'Menu', 'User', 'X'].map(name => [name, name])),
    '@/lib/auth-api': {
      getAccessToken: () => token,
      getCachedUser: () => cachedUser,
      authGetMe: async () => { requests++; return null; },
      authLogout: async () => { token = null; cachedUser = null; },
    },
    '@/lib/i18n': { useLang: () => lang, useT: () => (ko, en) => lang === 'en' ? en : ko },
    '@/components/LangToggle': { default: 'LangToggle' },
    '@/lib/analytics': { trackEvent() { throw new Error('기존 분석 이벤트를 호출하면 안 됨'); } },
  });
  const render = () => { cursor = 0; const nodes = elements(Navbar({})); rendered = true; return nodes; };
  const menu = () => render().filter(node => node.type === 'button' && node.props.children === (lang === 'en' ? 'Atlas' : '아틀란스'));
  const flush = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };
  const mount = () => { render(); effects.forEach(effect => cleanups.push(effect())); };
  const openMobile = () => render().find(node => node.props?.['aria-label'] === (lang === 'en' ? 'Menu' : '메뉴')).props.onClick();
  return {
    render, menu, navigations, mount, flush, openMobile,
    requests: () => requests,
    updateSession(user, accessToken = user ? 'test-token' : null) {
      cachedUser = user; token = accessToken; listeners.get('storage')?.();
    },
    unmount() { cleanups.forEach(cleanup => cleanup?.()); },
    listenerCount: () => listeners.size,
  };
}

test('hydration 전에는 캐시가 슈퍼계정이어도 두 메뉴에 Atlas를 렌더링하지 않는다', () => {
  const app = navbar({ cachedUser: { is_superuser: true } });
  app.openMobile();
  assert.equal(app.menu().length, 0);
  assert.equal(app.requests(), 0);
});

test('비로그인 및 엄격한 true가 아닌 캐시 사용자는 두 메뉴에 Atlas를 렌더링하지 않는다', async () => {
  for (const options of [
    {}, { cachedUser: { is_superuser: true }, token: null }, { token: 'test-token' },
    ...[{}, { is_superuser: false }, { is_superuser: 'true' }, { is_superuser: 1 }].map(cachedUser => ({ cachedUser })),
  ]) {
    const app = navbar(options);
    app.mount();
    await app.flush();
    app.openMobile();
    assert.equal(app.menu().length, 0);
    assert.equal(app.requests(), 0);
    assert.ok(!app.render().some(node => node.props?.role === 'status'));
  }
});

test('서버 조회 없이 캐시의 로그인 표시와 슈퍼계정 메뉴를 유지한다', async () => {
  for (const is_superuser of [false, true]) {
    const app = navbar({ cachedUser: { username: 'member', email: 'member@example.test', is_superuser } });
    app.mount();
    await app.flush();
    app.openMobile();
    assert.equal(app.requests(), 0, '페이지에서 /me를 호출하지 않는다');
    assert.equal(app.menu().length, is_superuser ? 2 : 0);
    assert.ok(app.render().some(node => node.props?.title === 'member@example.test'));
    assert.ok(!app.render().some(node => node.props?.href === '/login'));
  }
});

test('캐시 슈퍼계정의 두 메뉴는 옴니노드 뒤에 표시되고 /atlas/로 전체 이동한다', async () => {
  const app = navbar({ cachedUser: { is_superuser: true } });
  app.mount();
  app.openMobile();
  const nodes = app.render();
  const menus = nodes.filter(node => node.type === 'button' && node.props.children === '아틀란스');
  assert.equal(menus.length, 2);
  assert.match(menus[0].props.className, /hidden lg:inline/);
  const items = nodes.filter(node => ['a', 'button'].includes(node.type));
  for (const menu of menus) {
    assert.equal(items[items.indexOf(menu) - 1].props.children, '(주)옴니노드');
    await menu.props.onClick();
  }
  assert.deepEqual(app.navigations, ['/atlas/', '/atlas/']);
  assert.equal(app.requests(), 0, '클릭 시에도 사용자 API를 호출하지 않는다');
  assert.ok(!app.render().some(node => node.props?.role === 'status'));
  const en = navbar({ lang: 'en', cachedUser: { is_superuser: true } });
  en.mount();
  assert.equal(en.menu()[0].props.children, 'Atlas');
});

test('기존 storage 리스너가 캐시 로그인·권한·로그아웃을 동기화하고 정리된다', async () => {
  const app = navbar();
  app.mount();
  app.openMobile();
  assert.equal(app.menu().length, 0);
  assert.equal(app.listenerCount(), 1);
  app.updateSession({ is_superuser: true });
  assert.equal(app.menu().length, 2);
  app.updateSession({ is_superuser: false });
  assert.equal(app.menu().length, 0);
  app.updateSession({ is_superuser: true });
  assert.equal(app.menu().length, 2);
  app.updateSession(null);
  await app.flush();
  assert.equal(app.menu().length, 0);
  assert.equal(app.requests(), 0);
  app.unmount();
  assert.equal(app.listenerCount(), 0);
});

test('ATLAS_ORIGIN이 없거나 빈 값이면 rewrite를 만들지 않는다', async () => {
  for (const env of [{}, { ATLAS_ORIGIN: '' }, { ATLAS_ORIGIN: '  ' }]) {
    const config = load('next.config.ts', { process: { env } });
    assert.deepEqual(JSON.parse(JSON.stringify(await config.rewrites())), []);
  }
});

test('ATLAS_ORIGIN 설정 시 두 Atlas 경로만 프록시하고 끝 슬래시를 정리한다', async () => {
  for (const origin of ['https://atlas.test', 'https://atlas.test/']) {
    const config = load('next.config.ts', { process: { env: { ATLAS_ORIGIN: origin } } });
    assert.deepEqual(JSON.parse(JSON.stringify(await config.rewrites())), [
      { source: '/atlas', destination: 'https://atlas.test/' },
      { source: '/atlas/:path*', destination: 'https://atlas.test/:path*' },
    ]);
  }
});
