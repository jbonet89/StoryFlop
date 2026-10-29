import { adsterraFormats, type AdsterraFormat } from "@/lib/adsterra";
// The iframe runs with an opaque sandbox origin: vendor scripts cannot read the app DOM or storage.
export function adsterraFrameHtml(format: AdsterraFormat) {
  const unit = adsterraFormats[format];
  const content = format === "native"
    ? `<script async="async" data-cfasync="false" src="https://bauval.org/21/${unit.key}"></script><div id="container-${unit.key}"></div>`
    : `<script>var atOptions=${JSON.stringify({ key: unit.key, format: "iframe", height: unit.height, width: unit.width, params: {} })};</script><script src="https://bauval.org/22/${unit.key}"></script>`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="origin"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><style>html,body{margin:0;padding:0;font:14px system-ui;color:#184c3c}body{overflow:hidden}iframe{border:0}</style></head><body>
<script>
(function(){
 var rendered=false, timer;
 function send(status,height){parent.postMessage({type:'storyflop-ad',status:status,height:height},'*');}
 function inspect(){
  var root=document.getElementById('container-${unit.key}')||document.body;
  var creative=root.querySelector('iframe, a[href] img, a[href]');
  if(!creative)return;
  var bounds=creative.getBoundingClientRect();
  if(bounds.width<2||bounds.height<2)return;
  rendered=true;clearTimeout(timer);
  send('rendered',Math.max(${format === "native" ? 1 : unit.height},root.scrollHeight));
 }
 new MutationObserver(inspect).observe(document.documentElement,{subtree:true,childList:true,attributes:true});
 new ResizeObserver(inspect).observe(document.body);
 document.addEventListener('load',inspect,true);
 document.addEventListener('error',function(e){if(e.target.tagName==='SCRIPT'&&!rendered)send('empty',0);},true);
 timer=setTimeout(function(){if(!rendered)send('empty',0);},10000);
})();
</script>${content}</body></html>`;
}
