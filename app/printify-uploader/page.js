'use client';
import { useState, useRef } from 'react';

const SHOP_ID = '27346744';
const BLUEPRINT_ID = 600;
const PROVIDER_ID = 73;
const VARIANTS = [
  { id: 72006, size: '2x2', price: 1099 },
  { id: 72007, size: '3x3', price: 1199 },
  { id: 72008, size: '4x4', price: 1299 },
  { id: 72009, size: '5x5', price: 1399 },
  { id: 72010, size: '6x6', price: 1499 }
];

export default function Page() {
  const [token, setToken] = useState('');
  const [file, setFile] = useState(null);
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState(null);
  const [log, setLog] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef();

  const addLog = (msg, type='info') => setLog(l => [...l, {msg, type, time: new Date().toLocaleTimeString()}]);

  const handleFile = (f) => {
    if (!f || !f.name.endsWith('.png')) { alert('Please select a PNG file.'); return; }
    setFile(f);
    setDone(false);
    setLog([]);
    const extracted = f.name.split('-')[0].toUpperCase();
    setCode(extracted);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const startUpload = async () => {
    if (!token) { alert('Enter your API token.'); return; }
    if (!file) { alert('Select a PNG file first.'); return; }
    setUploading(true);
    setDone(false);
    setLog([]);

    try {
      addLog('Reading image...');
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(',')[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });

      addLog('Uploading image to Printify...');
      const imgRes = await fetch('/api/printify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: '/v1/uploads/images.json',
          method: 'POST',
          token,
          data: { file_name: file.name, contents: base64 }
        })
      });

      const imgData = await imgRes.json();
      if (!imgRes.ok) throw new Error('Image upload failed: ' + JSON.stringify(imgData));
      addLog('Image uploaded ✓ ID: ' + imgData.id, 'ok');

      addLog('Creating product...');
      const title = `${code} Airport Oval Die-Cut Sticker/Luggage/Automobile Decal`;
      const product = {
        title,
        blueprint_id: BLUEPRINT_ID,
        print_provider_id: PROVIDER_ID,
        variants: VARIANTS.map(v => ({ id: v.id, price: v.price, is_enabled: true })),
        print_areas: [{
          variant_ids: VARIANTS.map(v => v.id),
          placeholders: [{ position: 'front', images: [{ id: imgData.id, x: 0.5, y: 0.5, scale: 1, angle: 0 }] }]
        }]
      };

      const prodRes = await fetch('/api/printify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: `/v1/shops/${SHOP_ID}/products.json`,
          method: 'POST',
          token,
          data: product
        })
      });

      const prodData = await prodRes.json();
      if (!prodRes.ok) throw new Error('Product creation failed: ' + JSON.stringify(prodData));
      addLog('Product created ✓ ID: ' + prodData.id, 'ok');

      addLog('Publishing to Etsy...');
      const pubRes = await fetch('/api/printify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: `/v1/shops/${SHOP_ID}/products/${prodData.id}/publish.json`,
          method: 'POST',
          token,
          data: { title: true, description: true, images: true, variants: true, tags: true, keyFeatures: true, shipping_template: true }
        })
      });

      if (!pubRes.ok) {
        addLog('Publish needs manual review in Printify.', 'info');
      } else {
        addLog('Published to Etsy ✓', 'ok');
      }

      addLog('Done!', 'ok');
      setDone(true);

    } catch(e) {
      addLog('ERROR: ' + e.message, 'err');
    }
    setUploading(false);
  };

  return (
    <div style={{fontFamily:'system-ui',maxWidth:560,margin:'0 auto',padding:24}}>
      <h1 style={{fontSize:20,fontWeight:600,marginBottom:4}}>✈ AirportIDGear Uploader</h1>
      <p style={{fontSize:13,color:'#666',marginBottom:20}}>Die-Cut Sticker • Blueprint 600 • Printed Simply</p>

      <div style={{background:'#fff',border:'1px solid #ddd',borderRadius:10,padding:16,marginBottom:12}}>
        <label style={{fontSize:13,fontWeight:500,display:'block',marginBottom:6}}>Printify API Token</label>
        <input type="password" value={token} onChange={e=>setToken(e.target.value)}
          placeholder="Paste token here"
          style={{width:'100%',padding:'8px 12px',border:'1px solid #ccc',borderRadius:6,fontSize:14,boxSizing:'border-box'}} />
      </div>

      <div style={{background:'#fff',border:'1px solid #ddd',borderRadius:10,padding:16,marginBottom:12}}>
        <label style={{fontSize:13,fontWeight:500,display:'block',marginBottom:6}}>Select 2x PNG file</label>
        <button onClick={()=>fileRef.current.click()}
          style={{padding:'8px 16px',background:'#f5f5f5',border:'1px solid #ccc',borderRadius:6,cursor:'pointer',fontSize:14}}>
          {file ? file.name : 'Choose PNG file...'}
        </button>
        <input ref={fileRef} type="file" accept=".png" style={{display:'none'}} onChange={e=>handleFile(e.target.files[0])} />
        {preview && <img src={preview} style={{maxWidth:180,display:'block',margin:'12px auto 0',borderRadius:6}} />}
        {code && <p style={{fontSize:13,color:'#1a5fa8',fontWeight:600,marginTop:8}}>Detected code: {code}</p>}
      </div>

      <div style={{background:'#fff',border:'1px solid #ddd',borderRadius:10,padding:16,marginBottom:12}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:6,marginBottom:12}}>
          {VARIANTS.map(v=>(
            <div key={v.id} style={{textAlign:'center',background:'#f5f5f5',borderRadius:6,padding:'6px 4px'}}>
              <div style={{fontSize:11,color:'#666'}}>{v.size}"</div>
              <div style={{fontSize:13,fontWeight:600}}>${(v.price/100).toFixed(2)}</div>
            </div>
          ))}
        </div>
        <button onClick={startUpload} disabled={uploading||!file||!token}
          style={{width:'100%',padding:12,background:uploading?'#aaa':'#2563eb',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:600,cursor:'pointer'}}>
          {uploading ? 'Uploading...' : 'Create Product in Printify ↗'}
        </button>
      </div>

      {log.length > 0 && (
        <div style={{background:'#111',borderRadius:8,padding:12,fontFamily:'monospace',fontSize:12,maxHeight:240,overflowY:'auto'}}>
          {log.map((l,i)=>(
            <div key={i} style={{color:l.type==='ok'?'#4f4':l.type==='err'?'#f66':'#adf'}}>
              [{l.time}] {l.msg}
            </div>
          ))}
        </div>
      )}

      {done && (
        <div style={{background:'#f0fff4',border:'1px solid #86efac',borderRadius:8,padding:16,textAlign:'center',marginTop:12}}>
          <h3 style={{color:'#166534',marginBottom:4}}>✓ Product created for {code}!</h3>
          <p style={{fontSize:13,color:'#444'}}>Check Printify dashboard to confirm.</p>
          <button onClick={()=>{setFile(null);setPreview(null);setCode('');setDone(false);setLog([]);fileRef.current.value='';}}
            style={{marginTop:8,padding:'6px 14px',background:'#fff',border:'1px solid #2563eb',color:'#2563eb',borderRadius:6,cursor:'pointer'}}>
            Upload another airport
          </button>
        </div>
      )}
    </div>
  );
}export default function Page() {
  return (
    <div style={{padding:24}}>
      <h1>Printify Uploader</h1>
      <p>Loading...</p>
    </div>
  );
}
