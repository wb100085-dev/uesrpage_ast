/* eslint-disable @typescript-eslint/no-require-imports -- browser receiver runs in a VM. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const tick=async()=>{for(let i=0;i<15;i++)await Promise.resolve();};
function relay(){
 const messages=[],tracked=[],changes=[],scripts=[],saved=new Map();let listener,uid='st-member-99';
 const parent={postMessage:m=>messages.push(m)};
 const client={onInitialized:async()=>{},getUser:()=>({userId:uid}),setOptOutTracking(){},resetUser:async()=>{changes.push('reset');uid=null;},setUserId:async id=>{changes.push(id);uid=id;},track:e=>tracked.push(JSON.parse(JSON.stringify(e)))};
 const window={parent,location:{origin:'https://socialtwin.test'},Hackle:{createInstance:(key,config)=>{assert.equal(config.automaticPageTracking,false);assert.equal(config.optOutTracking,true);return client;}},addEventListener:(_,l)=>listener=l};
 const context=vm.createContext({window,localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},document:{createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}},Date,console});
 vm.runInContext(fs.readFileSync(__dirname+'/../public/hackle-relay.js','utf8'),context);
 const post=(data,origin=window.location.origin,source=parent)=>listener({origin,source,data:{protocol:'socialtwin-hackle-v2',...data}});
 return {post,messages,tracked,changes,scripts,async ready(){post({type:'init',sdkKey:'browser-test-key'});scripts[0].onload();await tick();}};
}
test('relay rejects other origins/sources, strips extra fields and acknowledges duplicate retries once',async()=>{
 const r=relay();r.post({type:'init',sdkKey:'browser-test-key'},'https://evil.test');assert.equal(r.scripts.length,0);await r.ready();
 const event={type:'event',id:'id1',createdAt:Date.now(),userId:'st-member-42',event:{key:'complete_purchase',properties:{amount:99000,password:'SECRET',page_path:'/checkout/success'}}};
 r.post(event,'https://evil.test');r.post(event,'https://socialtwin.test',{});await tick();assert.equal(r.tracked.length,0);
 r.post(event);r.post(event);await tick();assert.equal(r.tracked.length,1);assert.deepEqual(r.tracked[0],{key:'complete_purchase',properties:{amount:99000,page_path:'/checkout/success'}});assert.equal(r.messages.filter(x=>x.type==='ack').length,2);
});
test('account switching resets stored identity; logout resets before anonymous tracking',async()=>{
 const r=relay();await r.ready();r.post({type:'identify',userId:'st-member-42'});await tick();assert.deepEqual(r.changes,['reset','st-member-42']);
 r.post({type:'event',id:'id2',createdAt:Date.now(),userId:null,event:{key:'page_view',properties:{page_path:'/'}}});await tick();assert.deepEqual(r.changes,['reset','st-member-42','reset']);assert.equal(r.tracked.length,1);
});
test('unsupported keys, invalid members and expired pending events are never tracked',async()=>{
 const r=relay();await r.ready();
 for(const overrides of [{event:{key:'secret',properties:{}}},{userId:'private@example.com'},{createdAt:Date.now()-604800001}])r.post({type:'event',id:'id3',createdAt:Date.now(),userId:null,event:{key:'page_view',properties:{}},...overrides});
 await tick();assert.equal(r.tracked.length,0);assert.equal(r.messages.filter(x=>x.type==='ack').length,0);
});
