window.__ModuleLoader__.load({
	id: "dsh-plugin-radio",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
"use strict";var ft=Object.create;var W=Object.defineProperty;var gt=Object.getOwnPropertyDescriptor;var yt=Object.getOwnPropertyNames;var bt=Object.getPrototypeOf,vt=Object.prototype.hasOwnProperty;var wt=(e,t)=>{for(var a in t)W(e,a,{get:t[a],enumerable:!0})},_e=(e,t,a,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of yt(t))!vt.call(e,i)&&i!==a&&W(e,i,{get:()=>t[i],enumerable:!(r=gt(t,i))||r.enumerable});return e};var xe=(e,t,a)=>(a=e!=null?ft(bt(e)):{},_e(t||!e||!e.__esModule?W(a,"default",{value:e,enumerable:!0}):a,e)),_t=e=>_e(W({},"__esModule",{value:!0}),e);var ga={};wt(ga,{apply:()=>fa,inject:()=>ha,name:()=>ma});module.exports=_t(ga);var n=xe(require("react"),1);var xt={appName:"DSH \u7535\u53F0",panelLabel:"\u7535\u53F0\u9762\u677F",settingsLabel:"\u64AD\u653E\u8BBE\u7F6E",back:"\u8FD4\u56DE",status:{idle:"\u5F85\u673A",loading:"\u8FDE\u63A5\u4E2D\u2026",playing:"\u6B63\u5728\u64AD\u653E",paused:"\u5DF2\u6682\u505C",error:"\u8FDE\u63A5\u5931\u8D25"},retry:"\u8FDE\u63A5\u5931\u8D25\uFF0C\u70B9\u51FB\u91CD\u8BD5",playAria:"\u64AD\u653E",pauseAria:"\u6682\u505C",nextAria:"\u4E0B\u4E00\u4E2A\u7535\u53F0",panelAria:e=>`\u7535\u53F0\u9762\u677F\uFF1A${e}`,nowPlaying:"\u6B63\u5728\u64AD\u653E",volume:"\u97F3\u91CF",mute:"\u9759\u97F3",unmute:"\u53D6\u6D88\u9759\u97F3",mediaKeys:"\u7CFB\u7EDF\u5A92\u4F53\u952E",spectrum:"\u9891\u8C31\u6837\u5F0F",spectrumOption:{real:"\u771F\u5B9E",decor:"\u88C5\u9970",off:"\u5173\u95ED"},remember:"\u8BB0\u4F4F\u4E0A\u6B21\u7535\u53F0"},kt={appName:"DSH Radio",panelLabel:"Radio panel",settingsLabel:"Playback settings",back:"Back",status:{idle:"Idle",loading:"Connecting\u2026",playing:"Now playing",paused:"Paused",error:"Connection failed"},retry:"Connection failed \xB7 click to retry",playAria:"Play",pauseAria:"Pause",nextAria:"Next station",panelAria:e=>`Radio panel \xB7 ${e}`,nowPlaying:"Now playing",volume:"Volume",mute:"Mute",unmute:"Unmute",mediaKeys:"Media keys",spectrum:"Spectrum",spectrumOption:{real:"Live",decor:"Decorative",off:"Off"},remember:"Remember station"},j;function V(){return j!==void 0||(j=(typeof navigator<"u"&&typeof navigator.language=="string"?navigator.language.toLowerCase():"zh").startsWith("zh")?xt:kt),j}var u=null,ke={onStatus:()=>{}},T=null,R="idle",g=!1,D=!1,M=!1,H=null,b=null,C=null,P=null,X=!1;function A(e){R!==e&&(R=e,ke.onStatus(e))}function _(){H!==null&&(clearTimeout(H),H=null)}function St(){_(),H=setTimeout(()=>{H=null,R==="loading"&&G()},12e3)}function Q(){if(u!==null)return u;if(typeof Audio>"u")return null;let e=new Audio;return e.crossOrigin="anonymous",e.preload="auto",e.addEventListener("playing",()=>{g&&(M=!1,_(),A("playing"))}),e.addEventListener("error",()=>{if(!g){M=!0;return}G()}),u=e,u}function ee(){u!==null&&(u.volume=Se,u.muted=Pe)}var Se=1,Pe=!1;function Pt(e){if(C!==null||X){b!==null&&b.state==="suspended"&&b.resume().catch(()=>{});return}if(X=!0,typeof window>"u")return;let t=window.AudioContext??window.webkitAudioContext;if(t!==void 0)try{let a=new t,r=a.createAnalyser();r.fftSize=512,r.smoothingTimeConstant=.78,a.createMediaElementSource(e).connect(r),r.connect(a.destination),b=a,C=r,P=new Uint8Array(r.frequencyBinCount),a.resume().catch(()=>{})}catch{C=null,P=null;try{b?.close()}catch{}b=null}}function te(e,t){M=!1,e.pause(),e.src=t,e.load()}function ae(e){Pt(e),ee(),A("loading"),St();try{e.play().catch(()=>G())}catch{G()}}function G(){if(_(),!!g){if(!D&&T?.fallbackUrl!==void 0&&u!==null){D=!0,te(u,T.fallbackUrl),ae(u);return}g=!1,A("error")}}function Re(e){ke=e}function ne(e){let t=Q();T=e,M=!1,t!==null&&(t.src=e.url,t.load())}function $(e){let t=Q();if(T=e,g=!0,D=!1,_(),t===null){g=!1,A("error");return}(M||t.src!==e.url||R==="error")&&te(t,e.url),ae(t)}function Me(e){let t=Q();if(T=e,g=!0,D=!1,_(),t===null){g=!1,A("error");return}(M||t.src!==e.url)&&te(t,e.url),ae(t)}function Ae(){R==="idle"||R==="error"||(_(),g=!1,u?.pause(),A("paused"))}function Ne(){_(),g=!1,u?.pause(),A("idle")}function re(e){$(e)}function ie(e){Se=Math.min(1,Math.max(0,e)),ee()}function oe(e){Pe=e,ee()}function Ee(){if(C===null||P===null)return null;C.getByteFrequencyData(P);let e=new Array(16);for(let t=0;t<16;t+=1){let a=t/15,r=Math.min(P.length-1,Math.round(Math.pow(a,1.8)*96)+2);e[t]=Math.max(.06,Math.min(1,P[r]/200))}return e}function Le(){if(_(),g=!1,D=!1,M=!1,R="idle",u!==null){try{u.pause(),u.removeAttribute("src"),u.load()}catch{}u=null}T=null,X=!1,C=null,P=null,b!==null&&(b.close().catch(()=>{}),b=null)}var v=[{id:"chillsynth",name:"ChillSynth",provider:"Nightride FM",url:"https://stream.nightride.fm/chillsynth.mp3"},{id:"nightride",name:"Nightride",provider:"Nightride FM",url:"https://stream.nightride.fm/nightride.mp3"},{id:"darksynth",name:"Darksynth",provider:"Nightride FM",url:"https://stream.nightride.fm/darksynth.mp3"},{id:"spacesynth",name:"Spacesynth",provider:"Nightride FM",url:"https://stream.nightride.fm/spacesynth.mp3"},{id:"main",name:"Main Mix",provider:"Radio Paradise",url:"https://stream.radioparadise.com/aac-320",fallbackUrl:"https://stream.radioparadise.com/aac-128"},{id:"mellow",name:"Mellow Mix",provider:"Radio Paradise",url:"https://stream.radioparadise.com/mellow-128",fallbackUrl:"https://stream.radioparadise.com/mellow-320"},{id:"eve",name:"EVE Radio",provider:"GamingNow",url:"https://media01.gamingnow.net:8010/erweb.mp3",fallbackUrl:"http://media01.gamingnow.net:8000/er.mp3"}],se=v[0].id;function le(e){if(!(e==null||e===""))return v.find(t=>t.id===e)}function p(e){return le(e)??v[0]}var I={mediaKeys:!0,spectrum:"real",remember:!0},Ce=.7,m={lastStation:"dsh-radio:lastStation",volume:"dsh-radio:volume",muted:"dsh-radio:muted",settings:"dsh-radio:settings"},de=["real","decor","off"];function Mt(e){return typeof e=="string"&&de.includes(e)}function Te(e){if(e===null||e==="")return{...I};let t;try{t=JSON.parse(e)}catch{return{...I}}if(typeof t!="object"||t===null)return{...I};let a=t;return{mediaKeys:typeof a.mediaKeys=="boolean"?a.mediaKeys:I.mediaKeys,spectrum:Mt(a.spectrum)?a.spectrum:I.spectrum,remember:typeof a.remember=="boolean"?a.remember:I.remember}}function Ie(e){if(e===null||e.trim()==="")return Ce;let t=Number(e);return Number.isFinite(t)?Math.min(1,Math.max(0,t)):Ce}function Oe(e){return e==="1"||e==="true"}function He(e){return e?"1":"0"}var Ke=xe(require("react"),1);var At="https://stream.nightride.fm/status-json.xsl",Nt="/plugins/dsh-plugin-radio/now-playing",Et={chillsynth:"chillsynth",nightride:"nightride",darksynth:"darksynth",spacesynth:"spacesynth"},Lt={main:"main-mix",mellow:"mellow-mix"},Ct=15e3,De=new Map;function Tt(e){if(typeof e!="object"||e===null)return[];let t=e.icestats;if(typeof t!="object"||t===null)return[];let a=t.source;return Array.isArray(a)?a.filter(r=>typeof r=="object"&&r!==null):typeof a=="object"&&a!==null?[a]:[]}function It(e){if(typeof e!="string")return null;let t=e.trim();if(t===""||t.toLowerCase()==="unknown")return null;let a=t.indexOf(" - ");if(a>0&&a<=80&&a<t.length-3){let r=t.slice(0,a).trim(),i=t.slice(a+3).trim();if(r!==""&&i!=="")return{artist:r,title:i}}return{title:t}}function Ot(e,t){for(let a of Tt(e)){let r=a.listenurl;if(!(typeof r!="string"||!r.includes(t)))return It(a.title)}return null}function Ht(e){if(typeof e!="object"||e===null)return null;let t=e;if(t.ok!==!0)return null;let a=typeof t.title=="string"?t.title.trim():"";if(a===""||a.toLowerCase()==="unknown")return null;let r=typeof t.artist=="string"?t.artist.trim():"";return r===""?{title:a}:{artist:r,title:a}}async function ze(e,t,a){let r=await a(e,{signal:t,headers:{accept:"application/json"}});return r.ok?r.json():null}async function Dt(e,t,a){let r=Et[e.id];if(r!==void 0)return Ot(await ze(At,t,a),`${r}.mp3`);let i=Lt[e.id];if(i!==void 0){let c=`${Nt}?station=${encodeURIComponent(i)}`;return Ht(await ze(c,t,a))}return null}async function Fe(e,t,a={}){let r=a.now??Date.now,i=De.get(e.id);if(i!==void 0&&r()-i.at<Ct)return i.track;let c=a.fetch??globalThis.fetch;try{let l=await Dt(e,t,c);return l===null?null:(De.set(e.id,{at:r(),track:l}),l)}catch{return null}}var ue=new Set;function q(e){if(typeof window>"u")return null;try{return window.localStorage.getItem(e)}catch{return null}}function U(e,t){if(!(typeof window>"u"))try{window.localStorage.setItem(e,t)}catch{}}function We(e){if(!(typeof window>"u"))try{window.localStorage.removeItem(e)}catch{}}function zt(){let e=Te(q(m.settings)),t=e.remember?le(q(m.lastStation)):void 0,a=t??p(se);return{status:t===void 0?"idle":"paused",stationId:a.id,volume:Ie(q(m.volume)),muted:Oe(q(m.muted)),settings:e,panelOpen:!1,settingsOpen:!1,nowPlaying:null}}var o=zt();function Ue(){return o}function Ft(e){return ue.add(e),()=>{ue.delete(e)}}function je(){return Ke.useSyncExternalStore(Ft,Ue,Ue)}function h(e){let t=o,a=e.stationId!==void 0&&e.stationId!==t.stationId;o={...o,...e},a&&e.nowPlaying===void 0&&(o.nowPlaying=null);for(let r of ue)r();(o.status!==t.status||o.stationId!==t.stationId||o.settings.mediaKeys!==t.settings.mediaKeys)&&qe(),a?(B(),Z(!0)):o.status!==t.status&&(o.status==="playing"?Z():o.status!=="loading"&&B())}var Ut=2e4,F=null,ce=null,Be=0,z=null;function Ve(){F!==null&&(clearTimeout(F),F=null)}function B(){Ve(),ce?.abort(),ce=null,z=null}function pe(){return typeof document<"u"&&document.visibilityState==="hidden"}function Bt(e){Ve(),!(o.status!=="playing"||pe())&&(F=setTimeout(()=>{F=null,Z()},e))}async function Z(e=!1){if(!e&&o.status!=="playing"||pe())return;let t=o.stationId;if(z===t)return;let a=new AbortController;B(),ce=a,z=t;let r=Be+=1,i=await Fe(p(t),a.signal);z===t&&(z=null),!(r!==Be||o.stationId!==t)&&(i!==null&&h({nowPlaying:{stationId:t,...i}}),Bt(Ut))}function Ge(){if(pe()){B();return}o.status==="playing"&&Z()}function $e(){return typeof navigator>"u"?void 0:navigator.mediaSession}function qe(){let e=$e();if(e===void 0)return;if(!o.settings.mediaKeys){try{e.metadata=null,e.playbackState="none"}catch{}for(let i of["play","pause","stop"])try{e.setActionHandler(i,null)}catch{}return}let t=p(o.stationId),a=globalThis.MediaMetadata;try{e.metadata=a===void 0?null:new a({title:t.name,artist:t.provider,album:V().appName})}catch{e.metadata=null}try{e.playbackState=o.status==="playing"||o.status==="loading"?"playing":o.status==="paused"?"paused":"none"}catch{}let r={play:()=>{me()},pause:()=>{he()},stop:()=>{Wt()}};for(let i of["play","pause","stop"])try{e.setActionHandler(i,r[i])}catch{}}function Kt(e){o.settings.remember?U(m.lastStation,e):We(m.lastStation)}function Ze(){Re({onStatus:e=>{h({status:e})}}),ie(o.volume),oe(o.muted),ne(p(o.stationId)),qe(),typeof document<"u"&&document.addEventListener("visibilitychange",Ge)}function Ye(){B(),typeof document<"u"&&document.removeEventListener("visibilitychange",Ge),Le();let e=$e();if(e!==void 0){try{e.metadata=null,e.playbackState="none"}catch{}for(let t of["play","pause","stop"])try{e.setActionHandler(t,null)}catch{}}}function me(){let e=p(o.stationId);o.status==="playing"||o.status==="loading"||(o.status==="paused"?Me(e):o.status==="error"?re(e):$(e))}function he(){Ae()}function Wt(){Ne(),h({panelOpen:!1,settingsOpen:!1})}function fe(){o.status==="playing"||o.status==="loading"?he():me()}function Je(e){let t=p(e);o.stationId!==t.id&&h({stationId:t.id}),Kt(t.id),$(t)}function Xe(e){if(o.stationId===e){o.status==="playing"||o.status==="loading"?he():me();return}Je(e)}function Y(){re(p(o.stationId))}function ge(){let e=v.findIndex(a=>a.id===o.stationId),t=v[(e+1)%v.length];Je(t.id)}function Qe(e){let t=Math.min(1,Math.max(0,e));h({volume:t}),ie(t),U(m.volume,String(t))}function jt(e){h({muted:e}),oe(e),U(m.muted,He(e))}function et(){jt(!o.muted)}function ye(){h({panelOpen:!o.panelOpen,settingsOpen:!1})}function be(){o.panelOpen&&h({panelOpen:!1,settingsOpen:!1})}function tt(){h({panelOpen:!0,settingsOpen:!0})}function at(){o.settingsOpen&&h({settingsOpen:!1})}function J(e){let t=o.settings,a={...t,...e};if(!(a.mediaKeys===t.mediaKeys&&a.spectrum===t.spectrum&&a.remember===t.remember)&&(h({settings:a}),U(m.settings,JSON.stringify(a)),a.remember!==t.remember)){if(a.remember)U(m.lastStation,o.stationId);else if(We(m.lastStation),o.status!=="playing"&&o.status!=="loading"){let r=p(se);ne(r),(o.stationId!==r.id||o.status!=="idle")&&h({stationId:r.id,status:"idle"})}}}var Vt=typeof window>"u"?n.useEffect:n.useLayoutEffect,ve=28,we=1.5,st=2,Gt=14,$t=3,qt=ve*we+(ve-1)*st,nt=56,rt=1.5,it=328,Zt=20,Yt=4,Jt=120;function Xt(e,t){let a=16/t,r=new Array(t);for(let i=0;i<t;i+=1){let c=Math.abs(Math.sin(e/460+i*a*.62)),l=Math.abs(Math.sin(e/1130+i*a*.27)),d=.55+.45*Math.abs(Math.sin(e/2400));r[i]=Math.min(1,.16+(c*.52+l*.3)*d)}return r}function Qt(e,t){let a=new Array(t);for(let r=0;r<t;r+=1)a[r]=.1+.13*(.5+.5*Math.sin(e/680+r*.55));return a}function lt(e){let t=new Array(e);for(let a=0;a<e;a+=1)t[a]=.2+.2*(.5+.5*Math.sin(a*.7));return t}function ea(e,t){return e.length===0?lt(t):Array.from({length:t},(a,r)=>{let i=r/Math.max(1,t-1)*(e.length-1),c=Math.floor(i),l=Math.min(e.length-1,c+1),d=i-c;return e[c]*(1-d)+e[l]*d})}function ta(e,t,a,r){if(a==="loading")return Qt(e,t);if(a==="playing"){let i=r==="real"?Ee():null;return i===null?Xt(e,t):ea(i,t)}return lt(t)}function dt({status:e,mode:t,size:a}){let r=a==="panel",i=r?nt:ve,c=r?it:qt,l=r?Zt:Gt,d=r?Yt:$t,O=r?rt:we,N=r?(it-rt)/(nt-1):we+st,E=e==="playing"||e==="loading"||t==="decor",y=n.useRef([]);return n.useEffect(()=>{if(t==="off")return;let x=0,w=s=>{let k=ta(s,i,e,t);for(let f=0;f<i;f+=1){let S=y.current[f];if(S==null)continue;let L=Math.max(0,Math.min(1,k[f]??0)),K=d+L*(l-d);S.setAttribute("y",(l-K).toFixed(2)),S.setAttribute("height",K.toFixed(2)),S.setAttribute("opacity",(.35+L*.65).toFixed(2))}(e==="playing"||e==="loading")&&(x=requestAnimationFrame(w))};return x=requestAnimationFrame(w),()=>{cancelAnimationFrame(x)}},[e,t,i,l,d,E]),t==="off"?null:n.createElement("svg",{className:"dsh-radio__wave","data-size":a,viewBox:`0 0 ${c} ${l}`,"aria-hidden":"true"},Array.from({length:i},(x,w)=>n.createElement("rect",{key:w,ref:s=>{y.current[w]=s},x:(w*N).toFixed(2),y:l-d,width:O,height:d,rx:.4,opacity:.4})))}function aa(){return n.createElement("span",{className:"dsh-radio__dots","aria-hidden":"true"},n.createElement("i",null),n.createElement("i",null),n.createElement("i",null))}function ut(){return n.createElement("svg",{viewBox:"0 0 16 16",fill:"none","aria-hidden":"true"},n.createElement("path",{d:"M5.4 3.6v8.8l7-4.4-7-4.4Z",stroke:"currentColor",strokeWidth:"1.5",strokeLinejoin:"round"}))}function ct(){return n.createElement("svg",{viewBox:"0 0 16 16",fill:"none","aria-hidden":"true"},n.createElement("path",{d:"M5.6 3.6v8.8M10.4 3.6v8.8",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round"}))}function pt(){return n.createElement("svg",{viewBox:"0 0 16 16",fill:"none","aria-hidden":"true"},n.createElement("path",{d:"M2.4 3.8v8.4L7.6 8 2.4 3.8Z",stroke:"currentColor",strokeWidth:"1.5",strokeLinejoin:"round"}),n.createElement("path",{d:"M8 3.8v8.4L13.2 8 8 3.8Z",stroke:"currentColor",strokeWidth:"1.5",strokeLinejoin:"round"}),n.createElement("path",{d:"M14.4 3.4v9.2",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round"}))}var na=(()=>{let e=[];for(let l=0;l<8;l+=1){let d=-90+l*45,O=[[3.5,d-21],[4.85,d-9.5],[4.85,d+9.5],[3.5,d+21]];for(let[N,E]of O){let y=E*Math.PI/180;e.push(`${(6+N*Math.cos(y)).toFixed(2)} ${(6+N*Math.sin(y)).toFixed(2)}`)}}return`M${e.join("L")}Z`})();function ra(){return n.createElement("svg",{viewBox:"0 0 12 12",fill:"none","aria-hidden":"true"},n.createElement("path",{d:na,stroke:"currentColor",strokeWidth:"1.4",strokeLinejoin:"round",vectorEffect:"non-scaling-stroke"}),n.createElement("circle",{cx:"6",cy:"6",r:"1.45",stroke:"currentColor",strokeWidth:"1.4",vectorEffect:"non-scaling-stroke"}))}function ia({muted:e}){return n.createElement("svg",{viewBox:"0 0 16 16",fill:"none","aria-hidden":"true"},n.createElement("path",{d:"M3 6.1h2.2L8.4 3.5v9L5.2 9.9H3V6.1Z",stroke:"currentColor",strokeWidth:"1.3",strokeLinejoin:"round"}),e?n.createElement("path",{d:"M10.5 6.1l3.2 3.8M13.7 6.1l-3.2 3.8",stroke:"currentColor",strokeWidth:"1.3",strokeLinecap:"round"}):n.createElement(n.Fragment,null,n.createElement("path",{d:"M10.7 6.2a2.6 2.6 0 0 1 0 3.6",stroke:"currentColor",strokeWidth:"1.3",strokeLinecap:"round"}),n.createElement("path",{d:"M12.4 4.8a4.5 4.5 0 0 1 0 6.4",stroke:"currentColor",strokeWidth:"1.3",strokeLinecap:"round"})))}function ot({label:e,checked:t,onChange:a}){return n.createElement("button",{type:"button",role:"switch",className:"dsh-radio__switch","aria-checked":t,"aria-label":e,onClick:()=>{a(!t)}})}function oa({state:e,t}){return n.createElement("div",{className:"dsh-radio__settings"},n.createElement("div",{className:"dsh-radio__setting"},n.createElement("span",{className:"dsh-radio__setting-label"},t.mediaKeys),n.createElement(ot,{label:t.mediaKeys,checked:e.settings.mediaKeys,onChange:a=>{J({mediaKeys:a})}})),n.createElement("div",{className:"dsh-radio__setting"},n.createElement("span",{className:"dsh-radio__setting-label"},t.spectrum),n.createElement("div",{className:"dsh-radio__seg",role:"group","aria-label":t.spectrum},de.map(a=>n.createElement("button",{key:a,type:"button","data-active":e.settings.spectrum===a,"aria-pressed":e.settings.spectrum===a,onClick:()=>{J({spectrum:a})}},t.spectrumOption[a])))),n.createElement("div",{className:"dsh-radio__setting"},n.createElement("span",{className:"dsh-radio__setting-label"},t.remember),n.createElement(ot,{label:t.remember,checked:e.settings.remember,onChange:a=>{J({remember:a})}})))}function sa({state:e,t}){return n.createElement("ul",{className:"dsh-radio__list","aria-label":t.panelLabel},v.map(a=>n.createElement("li",{key:a.id},n.createElement("button",{type:"button",className:"dsh-radio__row","data-current":e.stationId===a.id,"aria-current":e.stationId===a.id,onClick:()=>{Xe(a.id)}},n.createElement("span",{className:"dsh-radio__row-name"},a.name),n.createElement("span",{className:"dsh-radio__row-src"},a.provider)))))}function la(e){return e.artist===void 0?e.title:`${e.artist} \u2014 ${e.title}`}function da({state:e,t}){let a=e.status==="playing"||e.status==="loading";return n.createElement("div",{className:"dsh-radio__volume"},n.createElement("div",{className:"dsh-radio__transport"},n.createElement("button",{type:"button",className:"dsh-radio__transport-btn","aria-label":e.status==="error"?t.retry:a?t.pauseAria:t.playAria,onClick:()=>{e.status==="error"?Y():fe()}},a?n.createElement(ct,null):n.createElement(ut,null)),n.createElement("button",{type:"button",className:"dsh-radio__transport-btn","aria-label":t.nextAria,onClick:ge},n.createElement(pt,null))),n.createElement("div",{className:"dsh-radio__volume-controls"},n.createElement("button",{type:"button",className:"dsh-radio__mute","aria-label":e.muted?t.unmute:t.mute,"aria-pressed":e.muted,onClick:et},n.createElement(ia,{muted:e.muted})),n.createElement("input",{type:"range",min:0,max:100,step:1,value:Math.round(e.volume*100),"aria-label":t.volume,onChange:r=>{Qe(Number(r.currentTarget.value)/100)}}),n.createElement("span",{className:"dsh-radio__volume-value"},Math.round(e.volume*100))))}function ua({state:e,t,style:a}){let r=p(e.stationId);return n.createElement("div",{className:"dsh-radio__panel",role:"dialog","aria-label":t.panelLabel,style:a},n.createElement("div",{className:"dsh-radio__panel-head"},e.settingsOpen?n.createElement(n.Fragment,null,n.createElement("button",{type:"button",className:"dsh-radio__back","aria-label":t.back,onClick:at},"\u2039"),n.createElement("span",{className:"dsh-radio__kicker"},t.settingsLabel)):n.createElement(n.Fragment,null,n.createElement("span",{className:"dsh-radio__kicker"},t.status[e.status]),n.createElement("span",{className:"dsh-radio__now"},r.name),n.createElement("span",{className:"dsh-radio__provider"},r.provider),n.createElement("button",{type:"button",className:"dsh-radio__gear","aria-label":t.settingsLabel,onClick:tt},n.createElement(ra,null)))),e.settingsOpen?n.createElement(oa,{state:e,t}):n.createElement(sa,{state:e,t}),n.createElement("div",{className:"dsh-radio__band"},n.createElement(dt,{status:e.status,mode:e.settings.spectrum,size:"panel"})),e.nowPlaying!==null&&e.nowPlaying.stationId===e.stationId?n.createElement("div",{className:"dsh-radio__track","aria-label":t.nowPlaying},n.createElement("span",{className:"dsh-radio__track-mark","aria-hidden":"true"},"\u266A"),n.createElement("span",{className:"dsh-radio__track-text"},la(e.nowPlaying))):null,n.createElement(da,{state:e,t}))}function ca({state:e}){let t=V(),a=n.useRef(null),r=p(e.stationId),i=e.status==="error",c=e.status==="playing"||e.status==="loading",l=i?t.retry:r.name,[d,O]=n.useState(l),[N,E]=n.useState("in"),[y,x]=n.useState(null);n.useEffect(()=>{if(l===d)return;E("out");let s=window.setTimeout(()=>{O(l),E("in")},Jt);return()=>{window.clearTimeout(s)}},[l,d]),Vt(()=>{if(!e.panelOpen){x(null);return}let s=()=>{let k=a.current;if(k===null)return;let f=k.getBoundingClientRect(),S=Math.min(360,window.innerWidth-16),L=8,K=Math.min(Math.max(L,f.left),Math.max(L,window.innerWidth-S-L));x({left:K,bottom:window.innerHeight-f.top+6})};return s(),window.addEventListener("resize",s),window.addEventListener("scroll",s,!0),()=>{window.removeEventListener("resize",s),window.removeEventListener("scroll",s,!0)}},[e.panelOpen]),n.useEffect(()=>{if(!e.panelOpen)return;let s=f=>{a.current!==null&&!a.current.contains(f.target)&&be()},k=f=>{f.key==="Escape"&&be()};return document.addEventListener("pointerdown",s,!0),document.addEventListener("keydown",k),()=>{document.removeEventListener("pointerdown",s,!0),document.removeEventListener("keydown",k)}},[e.panelOpen]);let w=s=>{s.target.closest("button")===null&&ye()};return n.createElement("div",{ref:a,className:"dsh-radio","data-status":e.status,"data-expanded":e.panelOpen?"true":"false"},e.panelOpen&&y!==null?n.createElement(ua,{state:e,t,style:{left:y.left,bottom:y.bottom}}):null,n.createElement("div",{className:"dsh-radio__pill",onClick:w},n.createElement("button",{type:"button",className:"dsh-radio__play","aria-label":i?t.retry:c?t.pauseAria:t.playAria,onClick:s=>{s.stopPropagation(),i?Y():fe()}},c?n.createElement(ct,null):n.createElement(ut,null)),n.createElement("button",{type:"button",className:"dsh-radio__next","aria-label":t.nextAria,title:t.nextAria,onClick:s=>{s.stopPropagation(),ge()}},n.createElement(pt,null)),n.createElement("button",{type:"button",className:"dsh-radio__body","aria-haspopup":"dialog","aria-expanded":e.panelOpen,"aria-label":t.panelAria(r.name),onClick:s=>{s.stopPropagation(),ye()}},i?n.createElement("span",{className:"dsh-radio__dot dsh-radio__dot--error","aria-hidden":"true"}):null,n.createElement("span",{className:"dsh-radio__name","data-phase":N,onClick:i?s=>{s.stopPropagation(),Y()}:void 0},d),e.status==="loading"?n.createElement(aa,null):null),n.createElement(dt,{status:e.status,mode:e.settings.spectrum,size:"bar"})))}function mt(){let e=je();return n.createElement(ca,{state:e})}var pa=`
.dsh-radio {
  --name-w: 62px;
  --dsh-radio-ease: cubic-bezier(.4, 0, .2, 1);
  --dsh-radio-accent: var(--dsw-alias-state-business-primary, var(--dsw-static-deepseek-450));
  /* \u9762\u677F\u5185\u5BB9\u5DE6\u53F3\u5185\u8FB9\u8DDD\uFF1A\u9891\u8C31\u5E26\u4E0E\u66F2\u76EE\u884C\u5171\u7528\uFF0C\u907F\u514D\u4E24\u5904\u5404\u5199\u4E00\u4E2A\u503C\u540E\u6F02\u79FB\u3002 */
  --dsh-radio-panel-pad: 16px;
  position: relative;
  z-index: 60;
  display: inline-flex;
  align-items: center;
  flex: none;
  font-family: var(--dsw-font-family);
  color: var(--dsw-alias-label-primary);
  font-size: 11px;
  line-height: 1;
}
.dsh-radio *,
.dsh-radio *::before,
.dsh-radio *::after { box-sizing: border-box; }
.dsh-radio button { font: inherit; color: inherit; margin: 0; }
.dsh-radio button:focus-visible {
  outline: 2px solid var(--dsw-alias-label-secondary);
  outline-offset: 2px;
}

/* ---------- \u6536\u8D77\u6001\u80F6\u56CA ---------- */
.dsh-radio__pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 24px;
  padding: 0 8px 0 7px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-tertiary);
  white-space: nowrap;
  transition:
    background .15s var(--dsh-radio-ease),
    border-color .15s var(--dsh-radio-ease),
    color .15s var(--dsh-radio-ease);
}
.dsh-radio__pill:hover {
  background: var(--dsw-alias-bg-layer-2);
  border-color: var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-secondary);
}
.dsh-radio[data-expanded="true"] .dsh-radio__pill {
  background: var(--dsw-alias-bg-layer-3);
  border-color: var(--dsw-alias-border-l3);
  color: var(--dsw-alias-label-secondary);
}
.dsh-radio[data-expanded="true"] .dsh-radio__pill:hover {
  background: var(--dsw-alias-bg-layer-3);
  border-color: var(--dsw-alias-border-l3);
}

/* ---------- \u64AD\u653E / \u4E0B\u4E00\u53F0 ---------- */
.dsh-radio__play,
.dsh-radio__next {
  position: relative;
  display: grid;
  place-items: center;
  flex: none;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-caption);
  cursor: pointer;
  transition: color .15s var(--dsh-radio-ease);
}
.dsh-radio__play {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}
.dsh-radio__play::after {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: 50%;
}
.dsh-radio__next {
  width: 18px;
  height: 24px;
  border-radius: 4px;
}
.dsh-radio__next::after {
  content: "";
  position: absolute;
  inset: 0 -3px;
}
.dsh-radio__play svg { width: 10px; height: 10px; display: block; }
.dsh-radio__next svg { width: 14px; height: 14px; display: block; }
.dsh-radio__pill:hover .dsh-radio__play,
.dsh-radio__pill:hover .dsh-radio__next { color: var(--dsw-alias-label-secondary); }
.dsh-radio[data-status="playing"] .dsh-radio__play,
.dsh-radio[data-status="loading"] .dsh-radio__play { color: var(--dsw-alias-label-secondary); }
.dsh-radio[data-status="error"] .dsh-radio__play {
  color: var(--dsw-alias-state-error-primary, #E5484D);
}

/* ---------- \u53F0\u540D / \u72B6\u6001\u70B9 / \u52A0\u8F7D\u8109\u51B2 ---------- */
.dsh-radio__body {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  height: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  white-space: nowrap;
}
.dsh-radio__name {
  display: inline-block;
  min-width: var(--name-w);
  max-width: 132px;
  overflow: hidden;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: .005em;
  color: var(--dsw-alias-label-tertiary);
  text-overflow: ellipsis;
  text-align: left;
}
.dsh-radio[data-status="paused"] .dsh-radio__name,
.dsh-radio[data-status="playing"] .dsh-radio__name,
.dsh-radio[data-status="loading"] .dsh-radio__name {
  color: var(--dsw-alias-label-secondary);
}
.dsh-radio[data-status="error"] .dsh-radio__name {
  max-width: 152px;
  color: var(--dsw-alias-state-error-primary, #E5484D);
}
.dsh-radio[data-status="error"] .dsh-radio__name:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.dsh-radio__name[data-phase="out"] { animation: dsh-radio-name-out 120ms var(--dsh-radio-ease) forwards; }
.dsh-radio__name[data-phase="in"] { animation: dsh-radio-name-in 180ms var(--dsh-radio-ease) both; }
@keyframes dsh-radio-name-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes dsh-radio-name-in { from { opacity: 0; } to { opacity: 1; } }

.dsh-radio__dot {
  width: 4px;
  height: 4px;
  flex: none;
  border-radius: 50%;
  background: var(--dsh-radio-accent);
}
.dsh-radio__dot--error {
  background: var(--dsw-alias-state-error-primary, #E5484D);
}
.dsh-radio__dots {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.dsh-radio__dots i {
  display: block;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--dsw-alias-label-caption);
  animation: dsh-radio-dot 1.2s infinite var(--dsh-radio-ease);
}
.dsh-radio__dots i:nth-child(2) { animation-delay: .16s; }
.dsh-radio__dots i:nth-child(3) { animation-delay: .32s; }
@keyframes dsh-radio-dot {
  0%, 100% { opacity: .25; transform: scale(.8); }
  45% { opacity: 1; transform: scale(1); }
}

/* ---------- \u9891\u8C31\uFF1A\u5F3A\u8C03\u8272\u5C0F\u65B9\u67F1 ---------- */
.dsh-radio__wave {
  flex: none;
  fill: var(--dsh-radio-accent);
  animation: dsh-radio-wave-in 180ms var(--dsh-radio-ease) both;
}
.dsh-radio__wave[data-size="bar"] {
  width: 95px;
  height: 14px;
}
.dsh-radio__wave[data-size="panel"] {
  width: 100%;
  height: 20px;
}
@keyframes dsh-radio-wave-in { from { opacity: 0; } to { opacity: 1; } }

/* ---------- \u9762\u677F ---------- */
.dsh-radio__panel {
  /* \u89C6\u53E3\u5B9A\u4F4D\uFF1Acomposer \u5BB9\u5668\u662F overflow:auto\uFF0C\u7EDD\u5BF9\u5B9A\u4F4D\u4F1A\u88AB\u88C1\u6389\u3002
     left/bottom \u7531\u7EC4\u4EF6\u6309\u80F6\u56CA\u951A\u70B9\u5B9E\u65F6\u8BA1\u7B97\u3002 */
  position: fixed;
  z-index: 1000;
  width: 360px;
  max-width: calc(100vw - 32px);
  padding: 0 0 6px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-1);
  box-shadow: var(--dsw-shadow-lv3);
  color: var(--dsw-alias-label-primary);
  animation: dsh-radio-panel-in 150ms var(--dsh-radio-ease) both;
}
@keyframes dsh-radio-panel-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: none; }
}

.dsh-radio__panel-head {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 10px 0 17px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.dsh-radio__kicker {
  flex: none;
  font-size: 11px;
  line-height: 1;
  letter-spacing: .02em;
  color: var(--dsw-alias-label-caption);
}
.dsh-radio__now {
  overflow: hidden;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  color: var(--dsw-alias-label-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-radio__provider {
  margin-left: auto;
  overflow: hidden;
  font-size: 10px;
  line-height: 1;
  letter-spacing: .01em;
  color: var(--dsw-alias-label-caption);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-radio__gear,
.dsh-radio__back {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  flex: none;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-caption);
  cursor: pointer;
}
.dsh-radio__gear { margin-left: 2px; }
.dsh-radio__back {
  width: 18px;
  margin-left: -4px;
  font-size: 14px;
  line-height: 1;
}
.dsh-radio__gear:hover,
.dsh-radio__back:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-secondary);
}
.dsh-radio__gear svg { width: 12px; height: 12px; display: block; }

/* ---------- \u7535\u53F0\u5217\u8868 ---------- */
.dsh-radio__list {
  margin: 0;
  padding: 4px 0 2px;
  list-style: none;
}
.dsh-radio__row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 28px;
  padding: 0 14px 0 17px;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  text-align: left;
  cursor: pointer;
  transition: background .12s var(--dsh-radio-ease), color .12s var(--dsh-radio-ease);
}
.dsh-radio__row::before {
  content: "";
  position: absolute;
  left: 6px;
  top: 6px;
  bottom: 6px;
  width: 2px;
  border-radius: 1px;
  background: transparent;
}
.dsh-radio__row:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-secondary);
}
.dsh-radio__row[data-current="true"] { color: var(--dsw-alias-label-primary); }
.dsh-radio__row[data-current="true"]::before { background: var(--dsw-alias-label-tertiary); }
.dsh-radio__row-name {
  font-size: 11.5px;
  font-weight: 450;
  line-height: 1;
  letter-spacing: .005em;
  white-space: nowrap;
}
.dsh-radio__row[data-current="true"] .dsh-radio__row-name { font-weight: 550; }
.dsh-radio__row-src {
  margin-left: auto;
  overflow: hidden;
  font-size: 10px;
  line-height: 1;
  letter-spacing: .01em;
  color: var(--dsw-alias-label-caption);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-radio__row[data-current="true"] .dsh-radio__row-src {
  color: var(--dsw-alias-label-tertiary);
}

/* ---------- \u9762\u677F\u9891\u8C31\u5E26 ---------- */
.dsh-radio__band {
  padding: 9px var(--dsh-radio-panel-pad);
}

/* ---------- \u5F53\u524D\u66F2\u76EE\uFF1A\u9891\u8C31\u4E0B\u3001\u97F3\u91CF\u4E0A\u7684\u4E00\u884C ---------- */
.dsh-radio__track {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 20px;
  padding: 0 var(--dsh-radio-panel-pad);
  overflow: hidden;
  font-size: 10.5px;
  line-height: 1;
  color: var(--dsw-alias-label-tertiary);
}
.dsh-radio__track-mark {
  flex: none;
  font-size: 11px;
  line-height: 1;
  color: var(--dsw-alias-label-caption);
}
.dsh-radio__track-text {
  min-width: 0;
  overflow: hidden;
  letter-spacing: .005em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---------- \u8BBE\u7F6E ---------- */
.dsh-radio__setting {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 32px;
  padding: 4px 14px 4px 17px;
}
.dsh-radio__settings { padding: 4px 0 2px; }
.dsh-radio__setting-label {
  min-width: 0;
  flex: 1;
  font-size: 11.5px;
  line-height: 1;
  color: var(--dsw-alias-label-secondary);
  white-space: nowrap;
}
.dsh-radio__seg {
  display: inline-flex;
  flex: none;
  overflow: hidden;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 7px;
}
.dsh-radio__seg button {
  height: 20px;
  padding: 0 7px;
  border: 0;
  background: transparent;
  font-size: 10px;
  line-height: 1;
  color: var(--dsw-alias-label-caption);
  cursor: pointer;
  white-space: nowrap;
}
.dsh-radio__seg button + button { border-left: 1px solid var(--dsw-alias-border-l1); }
.dsh-radio__seg button:hover { color: var(--dsw-alias-label-secondary); }
.dsh-radio__seg button[data-active="true"] {
  background: var(--dsw-alias-bg-layer-3);
  color: var(--dsw-alias-label-primary);
}
.dsh-radio__switch {
  position: relative;
  width: 28px;
  height: 16px;
  flex: none;
  margin-left: auto;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: var(--dsw-alias-border-l4);
  cursor: pointer;
  transition: background .15s var(--dsh-radio-ease);
}
.dsh-radio__switch::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--dsw-alias-bg-layer-1);
  transition: transform .15s var(--dsh-radio-ease);
}
.dsh-radio__switch[aria-checked="true"] { background: var(--dsw-alias-label-tertiary); }
.dsh-radio__switch[aria-checked="true"]::after { transform: translateX(12px); }

/* ---------- \u97F3\u91CF\uFF1A\u7D27\u51D1\u4E00\u884C\uFF0C\u53F3\u5BF9\u9F50 ---------- */
.dsh-radio__volume {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 30px;
  margin-top: 2px;
  padding: 0 14px 0 13px;
  border-top: 1px solid var(--dsw-alias-border-l1);
}
.dsh-radio__transport {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: none;
}
.dsh-radio__transport-btn {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  flex: none;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
  transition: background .15s var(--dsh-radio-ease), color .15s var(--dsh-radio-ease);
}
.dsh-radio__transport-btn:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}
.dsh-radio__transport-btn svg { width: 13px; height: 13px; display: block; }
.dsh-radio__volume-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.dsh-radio__mute {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  flex: none;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
}
.dsh-radio__mute:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}
.dsh-radio__mute svg { width: 14px; height: 14px; display: block; }
.dsh-radio__mute[aria-pressed="true"] { color: var(--dsw-alias-label-caption); }
.dsh-radio__volume input[type="range"] {
  width: 112px;
  flex: none;
  height: 2px;
  margin: 0;
  border-radius: 2px;
  outline: none;
  background: var(--dsw-alias-border-l4);
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}
.dsh-radio__volume input[type="range"]:focus-visible {
  outline: 2px solid var(--dsw-alias-label-secondary);
  outline-offset: 3px;
}
.dsh-radio__volume input[type="range"]::-webkit-slider-thumb {
  width: 9px;
  height: 9px;
  border: 0;
  border-radius: 50%;
  background: var(--dsw-alias-label-secondary);
  box-shadow: 0 0 0 1px var(--dsw-alias-border-l3);
  -webkit-appearance: none;
  appearance: none;
}
.dsh-radio__volume input[type="range"]::-moz-range-thumb {
  width: 9px;
  height: 9px;
  border: 0;
  border-radius: 50%;
  background: var(--dsw-alias-label-secondary);
}
.dsh-radio__volume-value {
  min-width: 20px;
  flex: none;
  font-size: 10px;
  line-height: 1;
  color: var(--dsw-alias-label-caption);
  text-align: right;
  font-variant-numeric: tabular-nums;
}
`;function ht(){if(typeof document>"u")return()=>{};let e=document.createElement("style");return e.setAttribute("data-dsh-radio",""),e.textContent=pa,document.head.appendChild(e),()=>{e.remove()}}var ma="dsh-plugin-radio",ha=["slots"];function fa(e){e.effect(()=>ht(),"dsh-radio: styles"),e.effect(()=>(Ze(),Ye),"dsh-radio: audio"),e.slots.inject("conversation.composer.dock",()=>e.slots.register({name:"conversation.composer.dock",id:"radio",order:-1},mt))}

		return module.exports;
	}
});
