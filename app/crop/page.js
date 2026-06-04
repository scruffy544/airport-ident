'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Header from '../../components/Header';

export default function CropPage() {
  var _file = useState(null);
  var file = _file[0];
  var setFile = _file[1];
  var _fileName = useState('');
  var fileName = _fileName[0];
  var setFileName = _fileName[1];
  var _pdfDoc = useState(null);
  var pdfDoc = _pdfDoc[0];
  var setPdfDoc = _pdfDoc[1];
  var _previewUrl = useState(null);
  var previewUrl = _previewUrl[0];
  var setPreviewUrl = _previewUrl[1];
  var _pdfPage = useState(null);
  var pdfPage = _pdfPage[0];
  var setPdfPage = _pdfPage[1];
  var _loading = useState(false);
  var loading = _loading[0];
  var setLoading = _loading[1];
  var _exporting = useState(false);
  var exporting = _exporting[0];
  var setExporting = _exporting[1];
  var _error = useState('');
  var error = _error[0];
  var setError = _error[1];
  var _exportDpi = useState(600);
  var exportDpi = _exportDpi[0];
  var setExportDpi = _exportDpi[1];
  var _selection = useState(null);
  var selection = _selection[0];
  var setSelection = _selection[1];
  var _dragging = useState(false);
  var dragging = _dragging[0];
  var setDragging = _dragging[1];
  var _dragStart = useState(null);
  var dragStart = _dragStart[0];
  var setDragStart = _dragStart[1];
  var _previewSize = useState({ width: 0, height: 0 });
  var previewSize = _previewSize[0];
  var setPreviewSize = _previewSize[1];
  var _pdfSize = useState({ width: 0, height: 0 });
  var pdfSize = _pdfSize[0];
  var setPdfSize = _pdfSize[1];
  var _previewScale = useState(1);
  var previewScale = _previewScale[0];
  var setPreviewScale = _previewScale[1];
  var _result = useState(null);
  var result = _result[0];
  var setResult = _result[1];
  var _resultSize = useState(null);
  var resultSize = _resultSize[0];
  var setResultSize = _resultSize[1];

  var previewRef = useRef(null);
  var containerRef = useRef(null);
  var fileInputRef = useRef(null);
  var scriptLoaded = useRef(false);

  function loadPdfJs() {
    return new Promise(function(resolve, reject) {
      if (window.pdfjsLib) { resolve(); return; }
      if (scriptLoaded.current) {
        var check = setInterval(function() { if (window.pdfjsLib) { clearInterval(check); resolve(); } }, 100);
        return;
      }
      scriptLoaded.current = true;
      var script = document.createElement('script');
      script.textContent = 'import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs").then(function(mod) { window.pdfjsLib = mod; window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs"; document.dispatchEvent(new Event("pdfjsready")); });';
      script.type = 'module';
      document.head.appendChild(script);
      document.addEventListener('pdfjsready', function() { resolve(); }, { once: true });
      setTimeout(function() { reject(new Error('PDF.js failed to load')); }, 15000);
    });
  }

  function handleFileSelect(e) {
    var selectedFile = e.target.files[0];
    if (!selectedFile) return;
    if (selectedFile.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }
    setFile(selectedFile);
    setFileName(selectedFile.name.replace('.pdf', '').replace('.PDF', ''));
    setSelection(null);
    setResult(null);
    setResultSize(null);
    setError('');
    setLoading(true);

    var reader = new FileReader();
    reader.onload = function(ev) {
      loadPdfJs().then(function() {
        return window.pdfjsLib.getDocument({ data: ev.target.result }).promise;
      }).then(function(pdf) {
        setPdfDoc(pdf);
        return pdf.getPage(1);
      }).then(function(page) {
        setPdfPage(page);
        var viewport72 = page.getViewport({ scale: 1 });
        var pdfW = viewport72.width;
        var pdfH = viewport72.height;
        setPdfSize({ width: pdfW, height: pdfH });

        var maxW = 800;
        var maxH = 600;
        var s = Math.min(maxW / pdfW, maxH / pdfH);
        setPreviewScale(s);

        var canvas = document.createElement('canvas');
        var pw = Math.floor(pdfW * s);
        var ph = Math.floor(pdfH * s);
        canvas.width = pw;
        canvas.height = ph;
        setPreviewSize({ width: pw, height: ph });

        var ctx = canvas.getContext('2d');
        var viewport = page.getViewport({ scale: s });
        return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function() {
          setPreviewUrl(canvas.toDataURL('image/png'));
          setLoading(false);
        });
      }).catch(function(err) {
        setError('Error loading PDF: ' + err.message);
        setLoading(false);
      });
    };
    reader.readAsArrayBuffer(selectedFile);
  }

  function getRelativePos(e) {
    var rect = containerRef.current.getBoundingClientRect();
    var x, y;
    if (e.touches) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    return { x: Math.max(0, Math.min(x, previewSize.width)), y: Math.max(0, Math.min(y, previewSize.height)) };
  }

  function handleMouseDown(e) {
    if (!previewUrl) return;
    e.preventDefault();
    var pos = getRelativePos(e);
    setDragStart(pos);
    setDragging(true);
    setSelection(null);
    setResult(null);
    setResultSize(null);
  }

  function handleMouseMove(e) {
    if (!dragging || !dragStart) return;
    e.preventDefault();
    var pos = getRelativePos(e);
    var x = Math.min(dragStart.x, pos.x);
    var y = Math.min(dragStart.y, pos.y);
    var w = Math.abs(pos.x - dragStart.x);
    var h = Math.abs(pos.y - dragStart.y);
    setSelection({ x: x, y: y, width: w, height: h });
  }

  function handleMouseUp(e) {
    if (!dragging) return;
    setDragging(false);
    if (selection && selection.width > 20 && selection.height > 20) {
      // valid selection
    } else {
      setSelection(null);
    }
  }

  function handleExportCrop() {
    if (!pdfPage || !selection) return;
    setExporting(true);
    setError('');

    setTimeout(function() {
      try {
        var hiScale = exportDpi / 72;
        var selPdfX = selection.x / previewScale;
        var selPdfY = selection.y / previewScale;
        var selPdfW = selection.width / previewScale;
        var selPdfH = selection.height / previewScale;

        var cropW = Math.floor(selPdfW * hiScale);
        var cropH = Math.floor(selPdfH * hiScale);

        if (cropW * cropH > 100000000) {
          setError('Selected area too large at ' + exportDpi + ' DPI. Try a smaller selection or lower DPI.');
          setExporting(false);
          return;
        }

        var canvas = document.createElement('canvas');
        canvas.width = cropW;
        canvas.height = cropH;
        var ctx = canvas.getContext('2d');

        ctx.translate(-selPdfX * hiScale, -selPdfY * hiScale);

        var viewport = pdfPage.getViewport({ scale: hiScale });

        pdfPage.render({ canvasContext: ctx, viewport: viewport }).promise.then(function() {
          var dataUrl = canvas.toDataURL('image/png');
          setResult(dataUrl);
          setResultSize({ width: cropW, height: cropH });
          setExporting(false);
        }).catch(function(err) {
          setError('Export error: ' + err.message + '. Try a smaller selection or lower DPI.');
          setExporting(false);
        });
      } catch (err) {
        setError('Export error: ' + err.message);
        setExporting(false);
      }
    }, 100);
  }

  function handleDownload() {
    if (!result) return;
    var link = document.createElement('a');
    link.download = fileName + '-crop-' + exportDpi + 'dpi.png';
    link.href = result;
    link.click();
  }

  var selectionInfo = null;
  if (selection && selection.width > 0 && selection.height > 0) {
    var hiScale = exportDpi / 72;
    var estW = Math.floor((selection.width / previewScale) * hiScale);
    var estH = Math.floor((selection.height / previewScale) * hiScale);
    selectionInfo = { width: estW, height: estH };
  }

  return (
    <>
      <Header />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#94e8b4', letterSpacing: 4, marginBottom: 8 }}>TOOLS</div>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 12 }}>
            Sectional Chart <span style={{ color: '#94e8b4' }}>Crop & Convert</span>
          </h1>
          <p style={{ fontSize: 15, color: '#6a9a7a', lineHeight: 1.5 }}>
            Upload a FAA Sectional Chart PDF, select the area around your target airport, and export at high DPI for Printify. No more browser crashes on large files — only the selected area is rendered at high resolution.
          </p>
        </div>

        {/* Upload Section */}
        <div style={{ background: '#13261a', border: '1px solid #1e3828', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#5a8a6a', letterSpacing: 2, marginBottom: 12 }}>STEP 1: UPLOAD SECTIONAL PDF</div>
          <div
            onClick={function() { fileInputRef.current.click(); }}
            style={{ border: '2px dashed ' + (file ? '#3d7a52' : '#1e3828'), borderRadius: 8, padding: '24px 16px', textAlign: 'center', cursor: 'pointer', background: file ? '#1a2e2244' : 'transparent' }}
          >
            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} style={{ display: 'none' }} />
            {file ? (
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#94e8b4' }}>{file.name}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#5a8a6a', marginTop: 4 }}>
                  {(file.size / (1024 * 1024)).toFixed(1)} MB — Click to change
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 28, marginBottom: 4, opacity: 0.5 }}>🗺️</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#8ab89a' }}>Click to upload a Sectional Chart PDF</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#3d5a47', marginTop: 4 }}>Large files supported — only the crop is rendered at high DPI</div>
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#94e8b4', marginBottom: 8 }}>Loading preview...</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#5a8a6a' }}>Rendering low-resolution preview for selection</div>
          </div>
        )}

        {error && (
          <div style={{ background: '#2e1a1a', border: '1px solid #5a2828', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#e8a0a0' }}>
            {error}
          </div>
        )}

        {/* Preview and Selection */}
        {previewUrl && (
          <div style={{ background: '#13261a', border: '1px solid #1e3828', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#5a8a6a', letterSpacing: 2, marginBottom: 12 }}>STEP 2: SELECT AREA TO CROP</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#8ab89a', marginBottom: 12 }}>
              Click and drag on the chart to select the area around your airport
            </div>
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
              style={{
                position: 'relative',
                display: 'inline-block',
                cursor: 'crosshair',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid #1e3828'
              }}
            >
              <img
                ref={previewRef}
                src={previewUrl}
                alt="Sectional preview"
                style={{ display: 'block', maxWidth: '100%' }}
                draggable="false"
              />
              {selection && (
                <div style={{
                  position: 'absolute',
                  left: selection.x,
                  top: selection.y,
                  width: selection.width,
                  height: selection.height,
                  border: '2px solid #94e8b4',
                  background: 'rgba(148, 232, 180, 0.1)',
                  pointerEvents: 'none',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                }} />
              )}
            </div>

            {selectionInfo && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#0c1a12', borderRadius: 8 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#94e8b4' }}>
                  Crop will be: {selectionInfo.width.toLocaleString()} × {selectionInfo.height.toLocaleString()} pixels at {exportDpi} DPI
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#5a8a6a', marginTop: 4 }}>
                  {selectionInfo.width >= 4350 && selectionInfo.height >= 1850 ? '✅ Enough for mugs, towels, posters, all products' :
                   selectionInfo.width >= 3600 && selectionInfo.height >= 3600 ? '✅ Enough for tote bags, umbrellas, coasters' :
                   selectionInfo.width >= 1200 && selectionInfo.height >= 1200 ? '✅ Enough for coasters and stickers' :
                   '⚠️ Select a larger area for better print quality'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Export Controls */}
        {selection && selection.width > 20 && (
          <div style={{ background: '#13261a', border: '1px solid #1e3828', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#5a8a6a', letterSpacing: 2, marginBottom: 12 }}>STEP 3: EXPORT AT HIGH DPI</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#8ab89a' }}>Export DPI:</div>
              {[300, 450, 600].map(function(d) {
                return (
                  <button
                    key={d}
                    onClick={function() { setExportDpi(d); setResult(null); setResultSize(null); }}
                    style={{
                      padding: '8px 16px',
                      background: exportDpi === d ? '#3d7a52' : '#0c1a12',
                      border: '1px solid ' + (exportDpi === d ? '#94e8b4' : '#1e3828'),
                      borderRadius: 6,
                      color: exportDpi === d ? '#94e8b4' : '#5a8a6a',
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    {d} DPI
                  </button>
                );
              })}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#3d5a47', marginBottom: 16 }}>
              {exportDpi === 300 ? 'Good print quality — recommended for most products' :
               exportDpi === 450 ? 'High quality — great for large products' :
               'Maximum quality — best for posters and large prints'}
            </div>
            <button
              onClick={handleExportCrop}
              disabled={exporting}
              style={{
                width: '100%',
                padding: '14px 24px',
                background: exporting ? '#1e3828' : '#94e8b4',
                color: exporting ? '#3d5a47' : '#0c1a12',
                border: 'none',
                borderRadius: 8,
                fontFamily: "'DM Mono', monospace",
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: 2,
                cursor: exporting ? 'not-allowed' : 'pointer'
              }}
            >
              {exporting ? 'RENDERING HIGH-RES CROP...' : 'EXPORT HIGH-RES CROP'}
            </button>
            {exporting && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#5a8a6a', marginTop: 8, textAlign: 'center' }}>
                Rendering selected area at {exportDpi} DPI — this may take a moment for large selections
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{ background: '#13261a', border: '1px solid #1e3828', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#94e8b4' }}>
                  {fileName}-crop-{exportDpi}dpi.png
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#5a8a6a' }}>
                  {resultSize ? resultSize.width.toLocaleString() + ' × ' + resultSize.height.toLocaleString() + ' pixels at ' + exportDpi + ' DPI' : ''}
                </div>
              </div>
              <button
                onClick={handleDownload}
                style={{
                  padding: '12px 24px',
                  background: '#94e8b4',
                  color: '#0c1a12',
                  border: 'none',
                  borderRadius: 6,
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                DOWNLOAD PNG
              </button>
            </div>
            <div style={{ background: '#0c1a12', borderRadius: 8, padding: 8, textAlign: 'center' }}>
              <img
                src={result}
                alt="Cropped result"
                style={{ maxWidth: '100%', maxHeight: 500, borderRadius: 4 }}
              />
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#3d5a47', marginTop: 8, textAlign: 'center' }}>
              Ready for Printify — use the Image Resizer tool if you need exact product dimensions
            </div>
          </div>
        )}

        {/* Tips */}
        <div style={{ marginTop: 32, padding: '20px 0', borderTop: '1px solid #1e3828' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#3d5a47', lineHeight: 1.8 }}>
            TIPS: Select a generous area around your target airport — more surrounding terrain makes a better product.
            The pixel count shown updates as you adjust your selection. For coffee mugs, aim for at least 4,350 pixels wide.
            For coasters and stickers, 1,200 pixels is plenty. Use 600 DPI for large products like beach towels and posters.
            After downloading, use the Image Resizer at airportdiagram.com/resize to fit exact Printify product dimensions.
            All processing happens in your browser — no files are uploaded to any server.
          </div>
        </div>
      </div>
    </>
  );
}
