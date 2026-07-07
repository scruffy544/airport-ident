export default function Page() {
  return (
    <main style={{fontFamily:'system-ui',maxWidth:560,margin:'0 auto',padding:24}}>
      <h1 style={{fontSize:20,fontWeight:600,marginBottom:4}}>✈ AirportIDGear Uploader</h1>
      <p style={{fontSize:13,color:'#666',marginBottom:20}}>Die-Cut Sticker • Blueprint 600 • Printed Simply</p>
      <div id="app">
        <div style={{background:'#fff',border:'1px solid #ddd',borderRadius:10,padding:16,marginBottom:12}}>
          <label style={{fontSize:13,fontWeight:500,display:'block',marginBottom:6}}>Printify API Token</label>
          <input id="tkn" type="password" placeholder="Paste token here" style={{width:'100%',padding:'8px 12px',border:'1px solid #ccc',borderRadius:6,fontSize:14,boxSizing:'border-box'}} />
        </div>
        <div style={{background:'#fff',border:'1px solid #ddd',borderRadius:10,padding:16,marginBottom:12}}>
          <label style={{fontSize:13,fontWeight:500,display:'block',marginBottom:6}}>Select 2x PNG file</label>
          <input id="fi" type="file" accept=".png" />
          <p id="cd" style={{fontSize:13,color:'#1a5fa8',fontWeight:600,marginTop:8}}></p>
        </div>
        <button id="btn" style={{width:'100%',padding:12,background:'#2563eb',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:600,cursor:'pointer'}}>
          Create Product in Printify ↗
        </button>
        <div id="lg" style={{background:'#111',borderRadius:8,padding:12,fontFamily:'monospace',fontSize:12,marginTop:12,minHeight:40,display:'none'}}></div>
      </div>
      <script dangerouslySetInnerHTML={{__html:`
var S='27358665',B=600,P=73,V=[{id:72006,p:1099},{id:72007,p:1199},{id:72008,p:1299},{id:72009,p:1399},{id:72010,p:1499}];
function lg(m,c){var d=document.getElementById('lg');d.style.display='block';d.innerHTML+='<div style="color:'+c+'">'+m+'</div>';}
document.getElementById('fi').onchange=function(e){
  var f=e.target.files[0];if(!f)return;
  document.getElementById('cd').textContent='Code: '+f.name.split('-')[0].toUpperCase();
};
document.getElementById('btn').onclick=async function(){
  var t=document.getElementById('tkn').value.trim(),fi=document.getElementById('fi'),f=fi.files[0];
  if(!t||!f){alert('Enter token and select file');return;}
  var code=f.name.split('-')[0].toUpperCase();
  document.getElementById('lg').innerHTML='';
  lg('Reading file...','#adf');
  var b64=await new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(r.result.split(',')[1]);};r.onerror=rej;r.readAsDataURL(f);});
  lg('Uploading image...','#adf');
  var r1=await fetch('/api/printify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint:'/v1/uploads/images.json',method:'POST',token:t,data:{file_name:f.name,contents:b64}})});
  var d1=await r1.json();if(!r1.ok){lg('ERROR: '+JSON.stringify(d1),'#f66');return;}
  lg('Image uploaded ID:'+d1.id,'#4f4');
  var prod={title:code+' Airport Oval Die-Cut Sticker/Luggage/Automobile Decal',blueprint_id:B,print_provider_id:P,variants:V.map(function(v){return{id:v.id,price:v.p,is_enabled:true};}),print_areas:[{variant_ids:V.map(function(v){return v.id;}),placeholders:[{position:'front',images:[{id:d1.id,x:0.5,y:0.5,scale:1,angle:0}]}]}]};
  lg('Creating product...','#adf');
  var r2=await fetch('/api/printify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint:'/v1/shops/'+S+'/products.json',method:'POST',token:t,data:prod})});
  var d2=await r2.json();if(!r2.ok){lg('ERROR: '+JSON.stringify(d2),'#f66');return;}
  lg('Product created ID:'+d2.id,'#4f4');
  lg('Publishing...','#adf');
  var r3=await fetch('/api/printify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint:'/v1/shops/'+S+'/products/'+d2.id+'/publish.json',method:'POST',token:t,data:{title:true,description:true,images:true,variants:true,tags:true,keyFeatures:true,shipping_template:true}})});
  if(!r3.ok){lg('Note: publish manually in Printify dashboard','#ff0');}else{lg('Published to Etsy!','#4f4');}
  lg('DONE: '+code+' created','#4f4');
};
      `}} />
    </main>
  );
}
