(function(){
function run(){
  var DASH=window.__VCE_DASH||'';
  function tx(x){return(x.textContent||'').replace(/\s+/g,' ').trim()}
  function esc(t){return String(t).replace(/[&<>"]/g,function(x){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[x]})}
  function note(m){var d=document.getElementById('vce-st');if(!d){d=document.createElement('div');d.id='vce-st';d.style.cssText='position:fixed;left:10px;right:10px;bottom:20px;max-width:440px;margin:auto;background:#18181b;color:#fff;padding:12px 14px;border-radius:10px;z-index:2147483647;font:14px/1.4 system-ui,sans-serif;text-align:center';document.body.appendChild(d)}d.innerHTML='<div>'+m+'</div><div style="margin-top:6px"><a href="#" id="vce-sx" style="color:#9cf">Close</a></div>';document.getElementById('vce-sx').onclick=function(e){e.preventDefault();d.remove()}}
  function extract(doc){
    var data=null;
    [].forEach.call(doc.querySelectorAll('table'),function(t){
      if(data)return;
      var rows=[].map.call(t.querySelectorAll('tr'),function(tr){return[].map.call(tr.children,tx)});
      var hi=-1,pi=-1,i;
      for(i=0;i<rows.length;i++){
        if(hi<0&&/^held/i.test(rows[i][0])&&rows[i].length>2)hi=i;
        if(pi<0&&/^presentee/i.test(rows[i][0])&&rows[i].length>2)pi=i;
      }
      if(hi<1||pi<1)return;
      for(i=hi-1;i>=0;i--){if(rows[i].length==rows[hi].length){data={names:rows[i],held:rows[hi],pres:rows[pi]};break}}
    });
    if(!data)return null;
    var list=[],j;
    for(j=1;j<data.held.length;j++){
      var n=data.names[j],h=+data.held[j],p=+data.pres[j];
      if(n&&!isNaN(h)&&!isNaN(p))list.push([n,h,p]);
    }
    return list.length?list:null;
  }
  function show(list){
    if(DASH){var u=DASH+'#d='+encodeURIComponent(JSON.stringify(list));note('Opening your dashboard... If it does not open, <a href="'+u+'" style="color:#7cf">tap here</a>.');location.href=u;return}
    var R=+prompt('Required attendance %',75)||75,H=0,P=0,body='';
  function e(s){return String(s).replace(/[&<>"]/g,function(x){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[x]})}
  function f(h,p){
    if(!h)return[0,'No classes yet',1];
    var pc=p/h*100;
    if(pc>=R){var s=Math.floor(p*100/R-h+1e-9);return[pc,s>0?'Can miss '+s:'Attend next class',1]}
    if(R>=100)return[pc,'Cannot reach '+R+'%',0];
    return[pc,'Attend next '+Math.ceil((R*h-100*p)/(100-R)-1e-9)+' in a row',0];
  }
  list.forEach(function(x){
    var r=f(x[1],x[2]),act=/^(ECA|CCA)/i.test(x[0]);
    if(!act){H+=x[1];P+=x[2]}
    body+='<tr><td>'+e(x[0])+(act?' <i>(not in overall)</i>':'')+'</td><td>'+x[1]+'</td><td>'+x[2]+'</td><td style="color:'+(r[2]?'#1f7a4d':'#b3342b')+';font-weight:700">'+r[0].toFixed(1)+'%</td><td>'+r[1]+'</td></tr>';
  });
  var t=f(H,P),old=document.getElementById('vce-att');if(old)old.remove();
  var d=document.createElement('div');d.id='vce-att';
  d.style.cssText='position:fixed;top:10px;right:10px;left:10px;max-width:560px;margin:auto;max-height:85vh;overflow:auto;background:#fff;color:#18181b;border:2px solid #18181b;border-radius:10px;padding:14px;z-index:2147483647;font:14px/1.5 system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.35)';
  d.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:18px">Overall '+t[0].toFixed(2)+'% ('+P+'/'+H+')</b><button id="vce-x" style="font-size:18px;cursor:pointer">×</button></div><div style="margin:4px 0 10px;color:'+(t[2]?'#1f7a4d':'#b3342b')+';font-weight:700">'+t[1]+' across all subjects (target '+R+'%)</div><table style="width:100%;border-collapse:collapse"><tr style="text-align:left"><th>Subject</th><th>Held</th><th>Pres.</th><th>%</th><th>Action</th></tr>'+body+'</table>';
  document.body.appendChild(d);
  document.getElementById('vce-x').onclick=function(){d.remove()};
  }
  try{
  var here=extract(document);
  if(here){show(here);return}
  var link=null;
  document.querySelectorAll('tr').forEach(function(tr){
    if(link||!/studying/i.test(tx(tr)))return;
    [].forEach.call(tr.querySelectorAll('a'),function(a){if(!link&&/^\d+(\.\d+)?$/.test(tx(a)))link=a});
  });
  if(!link){note('Attendance not found. Log in to the ERP, then open the dashboard (the semester list) and try again.');return}
  note('Reading your current semester attendance...');
  var cap=null,orig=window.open;
  window.open=function(u){cap=u;return{closed:false,focus:function(){},close:function(){},document:{write:function(){},close:function(){}}}};
  link.click();
  var tries=0,iv=setInterval(function(){
    tries++;
    if(!cap&&tries<30)return;
    clearInterval(iv);window.open=orig;
    if(!cap){note('Step 2 failed: the page did not try to open an attendance address.');return}
    note('Found the attendance link. Fetching the page...');
    var ac=new AbortController(),to=setTimeout(function(){ac.abort()},12000);
    fetch(new URL(cap,location.href).href,{credentials:'include',signal:ac.signal}).then(function(r){return r.text()}).then(function(h){
      clearTimeout(to);
      note('Fetched '+h.length+' characters. Looking for the summary table...');
      var doc=new DOMParser().parseFromString(h,'text/html'),l=extract(doc);
      if(l){note('Found '+l.length+' subjects.');show(l)}
      else if(doc.querySelector('input[type=password]'))note('Your ERP session has expired. Log in again, open the dashboard and tap the bookmark once more.');
      else note('The attendance page loaded ('+h.length+' characters) but had no summary table. Refresh the dashboard (F5) and try once more.');
    }).catch(function(e){note('Could not read the attendance page: '+esc(e&&e.message||e))});
  },100);
  }catch(e){note('Error: '+esc(e&&e.message||e))}
}
run();
})();
