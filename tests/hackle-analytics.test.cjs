/* eslint-disable @typescript-eslint/no-require-imports -- isolated browser contracts. */
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm'), ts=require('typescript'), path=require('node:path');
function storage(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),data};}
function load({key='browser-test-key',saved=storage(),pathname='/',search='',user,token,fetch,gtag}={}){
 if(user)saved.setItem('vpg.auth.user',JSON.stringify(user));if(token)saved.setItem('vpg.auth.access',token);
 const window={location:{origin:'https://socialtwin.test',pathname,search},localStorage:saved,gtag};
 const context=vm.createContext({window,document:{referrer:'https://socialtwin.test/auth/callback?access=REFERRER_SECRET'},process:{env:{NEXT_PUBLIC_HACKLE_SDK_KEY:key}},URL,URLSearchParams,console,Headers,fetch,crypto:require('node:crypto').webcrypto,Date});
 const modules=new Map();function requireModule(file){
  if(modules.has(file))return modules.get(file);
  if(file==='lib/i18n.ts')return {getLang:()=> 'ko'};
  if(file==='lib/auth-api.ts')return {getAccessToken:()=>saved.getItem('vpg.auth.access')};
  const mod={exports:{}};modules.set(file,mod.exports);
  const src=ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  vm.runInContext(`(function(exports,require,module){${src}\n})`,context)(mod.exports,n=>requireModule(n.startsWith('@/')?n.slice(2)+'.ts':path.posix.join(path.posix.dirname(file),n)+'.ts'),mod);return mod.exports;
 }
 return {window,saved,bridge:requireModule('lib/hackle-analytics.ts'),analytics:()=>requireModule('lib/analytics.ts'),payments:()=>requireModule('lib/payments-api.ts')};
}
function connect(app){
 assert.equal(typeof app.bridge.attachHackleRelay,'function','privacy-safe relay transport must exist');
 const sent=[],frame={postMessage:m=>sent.push(JSON.parse(JSON.stringify(m)))};app.bridge.attachHackleRelay(frame);
 const reply=data=>app.bridge.handleHackleRelayMessage({origin:app.window.location.origin,source:frame,data:{protocol:'socialtwin-hackle-v2',...data}});reply({type:'ready'});
 return {sent,frame,reply,events:()=>sent.filter(x=>x.type==='event')};
}
test('confirmed payment survives callback closure without storing or sending credentials',()=>{
 const a=load({pathname:'/checkout/success',search:'?paymentKey=PAYMENT_SECRET&email=private@example.com'});
 a.bridge.trackHackleEvent('결제완료',{금액:99000,상품:'100명 조사',paymentKey:'PAYMENT_SECRET'},{dedupeKey:'purchase:order42'});
 const b=load({saved:a.saved}),r=connect(b),e=r.events()[0];assert.equal(r.events().length,1);assert.equal(e.event.key,'complete_purchase');assert.equal(e.event.properties.amount,99000);
 assert.doesNotMatch(JSON.stringify(r.sent),/PAYMENT_SECRET|private@example|REFERRER_SECRET/);
 r.reply({type:'ack',id:e.id});b.bridge.trackHackleEvent('결제완료',{금액:99000},{dedupeKey:'purchase:order42'});assert.equal(r.events().length,1);
 assert.equal(connect(load({saved:a.saved})).events().length,0);
});
test('signup on a sensitive callback is sent immediately through the clean relay',()=>{
 const a=load({pathname:'/auth/callback',search:'?access=ACCESS_SECRET&refresh=REFRESH_SECRET'});a.bridge.trackHackleEvent('회원가입',{방식:'소셜'});
 const r=connect(a);assert.equal(r.events()[0].event.key,'complete_signup');assert.doesNotMatch(JSON.stringify(r.sent),/ACCESS_SECRET|REFRESH_SECRET|REFERRER_SECRET/);
});
test('first and last channel/post attribution survives navigation and document reload',()=>{
 const a=load({search:'?utm_source=naver_blog&utm_medium=organic&utm_content=report01'});a.bridge.trackHacklePage('/');a.window.location.pathname='/design';a.window.location.search='';a.bridge.trackHackleEvent('조사실행_접수',{패널수:10,무료체험:true});
 const b=load({saved:a.saved,search:'?utm_source=threads&utm_content=post02'});b.bridge.trackHacklePage('/');const e=connect(b).events().map(x=>x.event);
 assert.equal(e[1].properties.utm_source,'naver_blog');assert.equal(e[1].properties.utm_content,'report01');assert.equal(e[2].properties.first_utm_source,'naver_blog');assert.equal(e[2].properties.last_utm_source,'threads');
});
test('only signed-in numeric member keys are sent, never profile fields or research text',()=>{
 const a=load({user:{pk:42,email:'private@example.com',phone:'01012345678'},token:'AUTH_SECRET'});a.bridge.trackHackleEvent('조사実행_접수');a.bridge.trackHackleEvent('조사실행_접수',{패널수:10,email:'private@example.com',text:'PRIVATE_RESEARCH'});
 const e=connect(a).events()[0];assert.equal(e.userId,'st-member-42');assert.doesNotMatch(JSON.stringify(e),/private@example|01012345678|AUTH_SECRET|PRIVATE_RESEARCH/);
 const b=load({user:{pk:42}});b.bridge.trackHackleEvent('문의하기_클릭');assert.equal(connect(b).events()[0].userId,null);
});
test('untrusted origins and frames cannot acknowledge pending events',()=>{
 const a=load();a.bridge.trackHackleEvent('회원가입');const r=connect(a),id=r.events()[0].id;
 for(const [origin,source] of [['https://evil.test',r.frame],[a.window.location.origin,{}]])a.bridge.handleHackleRelayMessage({origin,source,data:{protocol:'socialtwin-hackle-v2',type:'ack',id}});
 assert.equal(connect(load({saved:a.saved})).events().length,1);
});
test('missing key, blocked storage and GA4 exceptions never break product actions',()=>{
 let n=0;const a=load({key:'',gtag:()=>n++});assert.equal(a.analytics().trackEvent('회원가입'),true);assert.equal(n,1);
 const b=load({saved:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}},gtag(){throw Error('blocked')}});assert.doesNotThrow(()=>b.analytics().trackEvent('회원가입'));assert.equal(connect(b).events().length,1);
});
test('page views normalize IDs, omit secret routes and deduplicate route commits',()=>{
 const a=load({pathname:'/results/private-job'});a.bridge.trackHacklePage('/results/private-job');a.bridge.trackHacklePage('/results/private-job');a.window.location.pathname='/auth/callback';a.window.location.search='?access=SECRET';a.bridge.trackHacklePage('/auth/callback');
 const e=connect(a).events();assert.equal(e.length,1);assert.equal(e[0].event.properties.page_path,'/results/[id]');
});
test('page-view floods cannot displace a pending payment',()=>{
 const a=load();a.bridge.trackHackleEvent('결제완료',{금액:99000},{dedupeKey:'purchase:flood'});for(let i=0;i<250;i++)a.bridge.trackHacklePage('/pricing/'+i);const e=connect(a).events();assert.ok(e.length<=100);assert.equal(e[0].event.key,'complete_purchase');
});
test('two open tabs preserve each other\'s pending events and acknowledgements',()=>{
 const saved=storage(),a=load({saved}),b=load({saved});connect(a);connect(b);
 a.bridge.trackHackleEvent('회원가입');b.bridge.trackHackleEvent('결제완료',{금액:99000});
 const c=load({saved}),r=connect(c);assert.equal(r.events().length,2);
 r.reply({type:'ack',id:r.events()[0].id});b.bridge.trackHackleEvent('문의하기_클릭');
 const keys=connect(load({saved})).events().map(x=>x.event.key);assert.deepEqual(keys,['complete_purchase','click_contact']);
});
test('payment helpers track only accepted orders and confirmed payments, once per order',async()=>{
 let ok=true;const a=load({token:'AUTH_SECRET',fetch:async url=>({ok:true,json:async()=>url.endsWith('/create')?{order_id:'order42',order_name:'100명 조사',amount:99000,client_key:'PUBLIC_KEY'}:{ok,order_id:'order42',order_name:'100명 조사',amount:99000}})});
 await a.payments().createOrder('panel100');await a.payments().confirmPayment({paymentKey:'PAYMENT_SECRET',orderId:'order42',amount:99000});await a.payments().confirmPayment({paymentKey:'PAYMENT_SECRET',orderId:'order42',amount:99000});ok=false;await a.payments().confirmPayment({paymentKey:'PAYMENT_SECRET',orderId:'other',amount:99000});
 const e=connect(a).events().map(x=>x.event);assert.deepEqual(e.map(x=>x.key),['begin_checkout','complete_purchase']);assert.equal(e[0].properties.product_key,'panel100');assert.doesNotMatch(JSON.stringify(e),/PAYMENT_SECRET|AUTH_SECRET|order42/);
});
