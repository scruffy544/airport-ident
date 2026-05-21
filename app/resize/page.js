'use client';

import { useState, useRef, useEffect } from 'react';
import Header from '../../components/Header';

var PRINTIFY_PRODUCTS = [
  { id: 'mug11', name: '11oz Mug', width: 4350, height: 1850, desc: 'Wrap-around print area' },
  { id: 'mug15', name: '15oz Mug', width: 4350, height: 1985, desc: 'Wrap-around print area' },
  { id: 'poster18x24', name: 'Poster 18×24"', width: 5400, height: 7200, desc: '300 DPI' },
  { id: 'poster24x36', name: 'Poster 24×36"', width: 7200, height: 10800, desc: '300 DPI' },
  { id: 'poster11x14', name: 'Poster 11×14"', width: 3300, height: 4200, desc: '300 DPI' },
  { id: 'tshirt', name: 'T-Shirt (front)', width: 4500, height: 5400, desc: 'Standard front print' },
  { id: 'cap', name: 'Dad Hat / Ball Cap', width: 2400, height: 2100, desc: 'Front panel embroidery area' },
  { id: 'sticker3x3', name: 'Sticker 3×3"', width: 900, height: 900, desc: '300 DPI' },
  { id: 'sticker4x4', name: 'Sticker 4×4"', width: 1200, height: 1200, desc: '300 DPI' },
  { id: 'stickeroval', name: 'Oval Sticker', width: 1200, height: 900, desc: '4×3" at 300 DPI' },
  { id: 'coaster', name: 'Drink Coaster', width: 1200, height: 1200, desc: '4×4" at 300 DPI' },
  { id: 'towel', name: 'Beach Towel 30×60"', width: 4500, height: 9000, desc: 'Full print' },
  { id: 'towel36x72', name: 'Beach Towel 36×72"', width: 5400, height: 10800, desc: 'Full print' },
  { id: 'rug24x36', name: 'Outdoor Rug 24×36"', width: 5500, height: 3750, desc: 'Full print' },
  { id: 'rug36x60', name: 'Outdoor Rug 36×60"', width: 5500, height: 6250, desc: 'Full print' },
  { id: 'rug48x72', name: 'Outdoor Rug 48×72"', width: 5500, height: 8250, desc: 'Full print' },
  { id: 'blanket', name: 'Woven Coverlet / Blanket', width: 5500, height: 7400, desc: 'Full print' },
  { id: 'tote', name: 'Tote Bag', width: 3600, height: 3600, desc: 'Front print area' },
  { id: 'umbrella', name: 'Umbrella (full panel)', width: 4000, height: 4000, desc: 'Single panel design' },
  { id: 'custom', name: 'Custom Size', width: 3000, height: 3000, desc: 'Enter your own dimensions' }
];

var BG_COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Dark Green', value: '#0c1a12' },
  { name: 'Navy', value: '#0a0e1a' },
  { name: 'Dark Gray', value: '#1a1a1a' },
  { name: 'White', value: '#ffffff' },
  { name: 'Sky Blue', value: '#87CEEB' },
  { name: 'Transparent', value: 'transparent' }
];

export default function ResizePage() {
  var _product = useState(PRINTIFY_PRODUCTS[0]);
  var product = _product[0];
  var setProduct = _product[1];
  var _customW = useState(3000);
  var customW = _customW[0];
  var setCustomW = _customW[1];
  var _customH = useState(3000);
  var customH = _customH[0];
  var setCustomH = _customH[1];
  var _image = useState(null);
  var image = _image[0];
  var setImage = _image[1];
  var _imageName = useState('');
  var imageName = _imageName[0];
  var setImageName = _imageName[1];
  var _imageObj = useState(null);
  var imageObj = _imageObj[0];
  var setImageObj = _imageObj[1];
  var _bgColor = useState('#0c1a12');
  var bgColor = _bgColor[0];
  var setBgColor = _bgColor[1];
  var _scale = useState(80);
  var scale = _scale[0];
  var setScale = _scale[1];
  var _posX = useState(50);
  var posX = _posX[0];
  var setPosX = _posX[1];
  var _posY = useState(50);
  var posY = _posY[0];
  var setPosY = _posY[1];
  var _exporting = useState(false);
  var exporting = _exporting[0];
  var setExporting = _exporting[1];
  var canvasRef = useRef(null);
  var fileInputRef = useRef(null);

  var targetW = product.id === 'custom' ? customW : product.width;
  var targetH = product.id === 'custom' ? customH : product.height;

  function handleFileSelect(e) {
    var file = e.target.files[0];
    if (!file) return;
    setImageName(file.name.replace(/\.[^.]+$/, ''));
    var reader = new FileReader();
    reader.onload = function(ev) {
      setImage(ev.target.result);
      var img = new Image();
      img.onload = function() { setImageObj(img); };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function handleProductChange(e) {
    var found = PRINTIFY_PRODUCTS.find(function(p) { return p.id === e.target.value; });
    if (found) setProduct(found);
  }

  useEffect(function() {
    drawPreview();
  }, [imageObj, bgColor, scale, posX, posY, product, customW, customH]);

  function drawPreview() {
    var canvas = canvasRef.current;
    if (!canvas) return;
    var maxPreview = 400;
    var ratio = targetW / targetH;
    var previewW, previewH;
    if (ratio >= 1) {
      previewW = maxPreview;
      previewH = maxPreview / ratio;
    } else {
      previewH = maxPreview;
      previewW = maxPreview * ratio;
    }
    canvas.width = previewW;
    canvas.height = previewH;
    var ctx = canvas.getContext('2d');

    if (bgColor === 'transparent') {
      ctx.clearRect(0, 0, previewW, previewH);
      var tileSize = 10;
      for (var ty = 0; ty < previewH; ty += tileSize) {
        for (var tx = 0; tx < previewW; tx += tileSize) {
          ctx.fillStyle = ((tx / tileSize + ty / tileSize) % 2 === 0) ? '#cccccc' : '#ffffff';
          ctx.fillRect(tx, ty, tileSize, tileSize);
        }
      }
    } else {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, previewW, previewH);
    }

    if (imageObj) {
      var imgRatio = imageObj.width / imageObj.height;
      var drawW = previewW * (scale / 100);
      var drawH = drawW / imgRatio;
      if (drawH > previewH * (scale / 100)) {
        drawH = previewH * (scale / 100);
        drawW = drawH * imgRatio;
      }
      var drawX = (previewW - drawW) * (posX / 100);
      var drawY = (previewH - drawH) * (posY / 100);
      ctx.drawImage(imageObj, drawX, drawY, drawW, drawH);
    }
  }

  function handleExport() {
    if (!imageObj) return;
    setExporting(true);

    setTimeout(function() {
      var canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      var ctx = canvas.getContext('2d');

      if (bgColor === 'transparent') {
        ctx.clearRect(0, 0, targetW, targetH);
      } else {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, targetW, targetH);
      }

      var imgRatio = imageObj.width / imageObj.height;
      var drawW = targetW * (scale / 100);
      var drawH = drawW / imgRatio;
      if (drawH > targetH * (scale / 100)) {
        drawH = targetH * (scale / 100);
        drawW = drawH * imgRatio;
      }
      var drawX = (targetW - drawW) * (posX / 100);
      var drawY = (targetH - drawH) * (posY / 100);
      ctx.drawImage(imageObj, drawX, drawY, drawW, drawH);

      canvas.toBlob(function(blob) {
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.download = imageName + '-' + product.id + '-' + targetW + 'x' + targetH + '.png';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setExporting(false);
      }, 'image/png');
    }, 100);
  }

  return (
    <>
      <Header />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#94e8b4', letterSpacing: 4, marginBottom: 8 }}>TOOLS</div>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 12 }}>
            Product Image <span style={{ color: '#94e8b4' }}>Resizer</span>
          </h1>
          <p style={{ fontSize: 15, color: '#6a9a7a', lineHeight: 1.5 }}>
            Resize and position your airport diagrams to fit Printify product dimensions. Select a product, upload your image, adjust positioning, and export at the exact size Printify requires.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Left column - Controls */}
          <div>
            {/* Product Selection */}
            <div style={{ background: '#13261a', border: '1px solid #1e3828', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#5a8a6a', letterSpacing: 2, marginBottom: 12 }}>SELECT PRODUCT</div>
              <select
                value={product.id}
                onChange={handleProductChange}
                style={{ width: '100%', padding: '10px 12px', background: '#0c1a12', border: '1px solid #1e3828', borderRadius: 6, color: '#d4e8dc', fontFamily: "'DM Mono', monospace", fontSize: 13, cursor: 'pointer', marginBottom: 8 }}
              >
                {PRINTIFY_PRODUCTS.map(function(p) {
                  return <option key={p.id} value={p.id}>{p.name} — {p.width}×{p.height}px</option>;
                })}
              </select>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#3d5a47' }}>{product.desc}</div>

              {product.id === 'custom' && (
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#5a8a6a', marginBottom: 4 }}>WIDTH (px)</div>
                    <input type="number" value={customW} onChange={function(e) { setCustomW(parseInt(e.target.value) || 100); }} style={{ width: '100%', padding: '8px', background: '#0c1a12', border: '1px solid #1e3828', borderRadius: 4, color: '#d4e8dc', fontFamily: "'DM Mono', monospace", fontSize: 13 }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#5a8a6a', marginBottom: 4 }}>HEIGHT (px)</div>
                    <input type="number" value={customH} onChange={function(e) { setCustomH(parseInt(e.target.value) || 100); }} style={{ width: '100%', padding: '8px', background: '#0c1a12', border: '1px solid #1e3828', borderRadius: 4, color: '#d4e8dc', fontFamily: "'DM Mono', monospace", fontSize: 13 }} />
                  </div>
                </div>
              )}

              <div style={{ marginTop: 10, padding: '8px 12px', background: '#0c1a12', borderRadius: 6 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#94e8b4' }}>Output: {targetW} × {targetH} px</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#3d5a47' }}>
                  Aspect ratio: {(targetW / targetH).toFixed(2)}:1
                </div>
              </div>
            </div>

            {/* Upload */}
            <div style={{ background: '#13261a', border: '1px solid #1e3828', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#5a8a6a', letterSpacing: 2, marginBottom: 12 }}>UPLOAD IMAGE</div>
              <div
                onClick={function() { fileInputRef.current.click(); }}
                style={{ border: '2px dashed ' + (image ? '#3d7a52' : '#1e3828'), borderRadius: 8, padding: '24px 16px', textAlign: 'center', cursor: 'pointer', background: image ? '#1a2e2244' : 'transparent' }}
              >
                <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg,.svg" onChange={handleFileSelect} style={{ display: 'none' }} />
                {image ? (
                  <div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#94e8b4' }}>{imageName}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#5a8a6a', marginTop: 4 }}>
                      {imageObj ? imageObj.width + ' × ' + imageObj.height + ' px' : 'Loading...'} — Click to change
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 24, marginBottom: 4, opacity: 0.5 }}>📁</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#5a8a6a' }}>Click to upload PNG, JPG, or SVG</div>
                  </div>
                )}
              </div>
            </div>

            {/* Background Color */}
            <div style={{ background: '#13261a', border: '1px solid #1e3828', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#5a8a6a', letterSpacing: 2, marginBottom: 12 }}>BACKGROUND COLOR</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {BG_COLORS.map(function(c) {
                  var isSelected = bgColor === c.value;
                  return (
                    <button
                      key={c.value}
                      onClick={function() { setBgColor(c.value); }}
                      style={{
                        width: 36, height: 36, borderRadius: 6,
                        border: '2px solid ' + (isSelected ? '#94e8b4' : '#1e3828'),
                        background: c.value === 'transparent' ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 12px 12px' : c.value,
                        cursor: 'pointer'
                      }}
                      title={c.name}
                    />
                  );
                })}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                  <input
                    type="color"
                    value={bgColor === 'transparent' ? '#000000' : bgColor}
                    onChange={function(e) { setBgColor(e.target.value); }}
                    style={{ width: 36, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }}
                  />
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#3d5a47' }}>Custom</div>
                </div>
              </div>
            </div>

            {/* Position Controls */}
            <div style={{ background: '#13261a', border: '1px solid #1e3828', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#5a8a6a', letterSpacing: 2, marginBottom: 12 }}>POSITION & SCALE</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#8ab89a' }}>Scale</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#94e8b4' }}>{scale}%</span>
                </div>
                <input type="range" min="10" max="100" value={scale} onChange={function(e) { setScale(parseInt(e.target.value)); }} style={{ width: '100%', accentColor: '#94e8b4' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#8ab89a' }}>Horizontal</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#94e8b4' }}>{posX === 50 ? 'Center' : posX < 50 ? 'Left' : 'Right'}</span>
                </div>
                <input type="range" min="0" max="100" value={posX} onChange={function(e) { setPosX(parseInt(e.target.value)); }} style={{ width: '100%', accentColor: '#94e8b4' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#8ab89a' }}>Vertical</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#94e8b4' }}>{posY === 50 ? 'Center' : posY < 50 ? 'Top' : 'Bottom'}</span>
                </div>
                <input type="range" min="0" max="100" value={posY} onChange={function(e) { setPosY(parseInt(e.target.value)); }} style={{ width: '100%', accentColor: '#94e8b4' }} />
              </div>
              <button
                onClick={function() { setScale(80); setPosX(50); setPosY(50); }}
                style={{ padding: '6px 14px', background: '#0c1a12', border: '1px solid #1e3828', borderRadius: 6, color: '#5a8a6a', fontFamily: "'DM Mono', monospace", fontSize: 11, cursor: 'pointer' }}
              >
                Reset to Center
              </button>
            </div>
          </div>

          {/* Right column - Preview and Export */}
          <div>
            <div style={{ background: '#13261a', border: '1px solid #1e3828', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#5a8a6a', letterSpacing: 2, marginBottom: 12 }}>PREVIEW</div>
              <div style={{ background: '#0c1a12', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                <canvas
                  ref={canvasRef}
                  style={{ maxWidth: '100%', borderRadius: 4, border: '1px solid #1e3828' }}
                />
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#3d5a47', marginTop: 8, textAlign: 'center' }}>
                Preview — actual export will be {targetW} × {targetH} px
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={!imageObj || exporting}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: !imageObj || exporting ? '#1e3828' : '#94e8b4',
                color: !imageObj || exporting ? '#3d5a47' : '#0c1a12',
                border: 'none',
                borderRadius: 8,
                fontFamily: "'DM Mono', monospace",
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: 2,
                cursor: !imageObj || exporting ? 'not-allowed' : 'pointer'
              }}
            >
              {exporting ? 'EXPORTING...' : 'EXPORT FOR PRINTIFY'}
            </button>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#3d5a47', marginTop: 8, textAlign: 'center' }}>
              Exports as PNG at exact Printify dimensions. Ready to upload.
            </div>
          </div>
        </div>

        <div style={{ marginTop: 32, padding: '20px 0', borderTop: '1px solid #1e3828' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#3d5a47', lineHeight: 1.8 }}>
            TIPS: Select your product first, then upload your airport diagram. Use the scale slider to size the diagram within the canvas. Use horizontal and vertical sliders to position it. The background color fills the space around your image. Click "Custom Size" in the product dropdown if your product dimensions aren't listed. All processing happens in your browser.
          </div>
        </div>
      </div>
    </>
  );
}
