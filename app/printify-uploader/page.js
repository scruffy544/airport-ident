export default function Page() {
  return (
    <main style={{fontFamily:'system-ui',maxWidth:560,margin:'0 auto',padding:24}}>
      <h1 style={{fontSize:20,fontWeight:600,marginBottom:4}}>✈ AirportIDGear Uploader</h1>
      <p style={{fontSize:13,color:'#666',marginBottom:20}}>Die-Cut Sticker • Blueprint 600 • Printed Simply</p>
      <div id="app">
        <div style={{background:'#fff',border:'1px solid #ddd',borderRadius:10,padding:16,marginBottom:12}}>
          <label style={{fontSize:13,fontWeight:500,display:'block',marginBottom:6}}>Printify API Token</label>
          <input id="token" type="password" placeholder="Paste token here"
            style={{width:'100%',padding:'8px 12px',border:'1px solid #ccc',borderRadius:6,fontSize:14,boxSizing:'border-box'}} />
        </div>
        <div style={{background:'#fff',border:'1px solid #ddd',borderRadius:10,padding:16,marginBottom:12}}>
          <label style={{fontSize:13,fontWeight:500,display:'block',marginBottom:6}}>Select 2x PNG file</label>
          <input id="fileInput" type="file" accept=".png" />
          <p id="codeDisplay" style={{fontSize:13,color:'#1a5fa8',fontWeight:600,marginTop:8}}></p>
        </div>
        <button id="uploadBtn"
          style={{width:'100%',padding:12,background:'#2563eb',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:600,cursor:'pointer'}}>
          Create Product in Printify ↗
        </button>
        <div id="log" style={{background:'#111',borderRadius:8,padding:12,fontFamily:'monospace',fontSize:12,marginTop:12,display:'none'}}></div>
      </div>
      <script dangerouslySetInnerHTML={{__html: `
        const SHOP_ID = '27346744';
        const BLUEPRINT_ID = 600;
        const PROVIDER_ID = 73;
        const VARIANTS = [
          {id:72006,price:1099},{id:72007,price:1199},{id:72008,price:1299},{id:72009,price:1399},{id:72010,price:1499}
        ];

        document.getElementById('fileInput').addEventListener('change', function(e) {
          const f = e.target.files[0];
          if (!f) return;
          const code = f.name.split('-')[0].toUpperCase();
          document.getElementById('codeDisplay').textContent = 'Detected code: ' + code;
        });

        function addLog(msg, color) {
          const log = document.getElementById('log');
          log.style.display = 'block';
          log.innerHTML += '<div style="color:' + color + '">[' + new Date().toLocaleTimeString() + '] ' + msg + '</div>';
          log.scrollTop = log.scrollHeight;
        }

        document.getElementById('uploadBtn').addEventListener('click', async function() {
          const token = document.getElementById('token').value.trim();
          const fileInput = document.getElementById('fileInput');
          const file = fileInput.files[0];
          if (!token) { alert('Enter your API token.'); return; }
          if (!file) { alert('Select a PNG file first.'); return; }

          const code = file.name.split('-')[0].toUpperCase();
          this.disabled = true;
          this.textContent = 'Uploading...';

          try {
            addLog('Reading image...', '#adf');
            const base64 = await new Promise((res, rej) => {
              const r = new FileReader();
              r.onload = () => res(r.result.split(',')[1]);
              r.onerror = rej;
              r.readAsDataURL(file);
            });

            addLog('Uploading image to Printify...', '#adf');
            const imgRes = await fetch('/api/printify', {
              method: 'POST',
              headers: {'Content-Type':'application/json'},
              body: JSON.stringify({endpoint:'/v1/uploads/images.json',method:'POST',token,data:{file_name:file.name,contents:base64}})
            });
            const imgData = await imgRes.json();
            if (!imgRes.ok) throw new Error('Image upload failed: ' + JSON.stringify(imgData));
            addLog('Image uploaded ✓ ID: ' + imgData.id, '#4f4');

            addLog('Creating product...', '#adf');
            const title = code + ' Airport Oval Die-Cut Sticker/Luggage/Automobile Decal';
            const product = {
              title,
              blueprint_id: BLUEPRINT_ID,
              print_provider_id: PROVIDER_ID,
              variants: VARIANTS.map(v => ({id:v.id,price:v.price,is_enabled:true})),
              print_areas: [{
                variant_ids: VARIANTS.map(v => v.id),
                placeholders: [{position:'front',images:[{id:imgData.id,x:0.5,y:0.5,scale:1,angle:0}]}]
              }]
            };
            const prodRes = await fetch('/api/printify', {
              method: 'POST',
              headers: {'Content-Type':'application/json'},
              body: JSON.stringify({endpoint:'/v1/shops/' + SHOP_ID + '/products.json',method:'POST',token,data:product})
            });
            const prodData = await
