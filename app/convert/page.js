'use client';

import { useState, useRef } from 'react';
import Header from '../../components/Header';

export default function ConvertPage() {
  var _file = useState(null);
  var file = _file[0];
  var setFile = _file[1];
  var _fileName = useState('');
  var fileName = _fileName[0];
  var setFileName = _fileName[1];
  var _pages = useState([]);
  var pages = _pages[0];
  var setPages = _pages[1];
  var _loading = useState(false);
  var loading = _loading[0];
  var setLoading = _loading[1];
  var _error = useState('');
  var error = _error[0];
  var setError = _error[1];
  var _dpi = useState(300);
  var dpi = _dpi[0];
  var setDpi = _dpi[1];
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
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs';
      script.type = 'module';
      
      var script2 = document.createElement('script');
      script2.textContent = 'import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs").then(function(mod) { window.pdfjsLib = mod; window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs"; document.dispatchEvent(new Event("pdfjsready")); });';
      script2.type = 'module';
      document.head.appendChild(script2);
      
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
    setPages([]);
    setError('');
  }

  function handleConvert() {
    if (!file) return;
    setLoading(true);
    setError('');
    setPages([]);

    var reader = new FileReader();
    reader.onload = function(e) {
      var arrayBuffer = e.target.result;
      
      loadPdfJs().then(function() {
        var pdfjsLib = window.pdfjsLib;
        var loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        
        return loadingTask.promise.then(function(pdf) {
          var numPages = pdf.numPages;
          var pagePromises = [];
          
          for (var i = 1; i <= numPages; i++) {
            pagePromises.push(
              (function(pageNum) {
                return pdf.getPage(pageNum).then(function(page) {
                  var scale = dpi / 72;
                  var viewport = page.getViewport({ scale: scale });
                  
                  var canvas = document.createElement('canvas');
                  canvas.width = viewport.width;
                  canvas.height = viewport.height;
                  var ctx = canvas.getContext('2d');
                  
                  return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function() {
                    return {
                      pageNum: pageNum,
                      dataUrl: canvas.toDataURL('image/png'),
                      width: viewport.width,
                      height: viewport.height
                    };
                  });
                });
              })(i)
            );
          }
          
          return Promise.all(pagePromises);
        });
      }).then(function(results) {
        setPages(results);
        setLoading(false);
      }).catch(function(err) {
        setError('Error converting PDF: ' + err.message);
        setLoading(false);
      });
    };
    reader.readAsArrayBuffer(file);
  }

  function downloadPage(page) {
    var link = document.createElement('a');
    link.download = fileName + (pages.length > 1 ? '-page' + page.pageNum : '') + '.png';
    link.href = page.dataUrl;
    link.click();
  }

  function downloadAll() {
    pages.forEach(function(page) {
      downloadPage(page);
    });
  }

  return (
    <>
      <Header />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#94e8b4', letterSpacing: 4, marginBottom: 8 }}>TOOLS</div>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 12 }}>
            PDF to PNG <span style={{ color: '#94e8b4' }}>Converter</span>
          </h1>
          <p style={{ fontSize: 15, color: '#6a9a7a', lineHeight: 1.5 }}>
            Convert FAA airport diagram PDFs to high-resolution PNG images for use with Printify. 
            All processing happens in your browser — no files are uploaded to any server.
          </p>
        </div>

        <div style={{ background: '#13261a', border: '1px solid #1e3828', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#5a8a6a', letterSpacing: 2, marginBottom: 16 }}>UPLOAD PDF</div>
          
          <div
            onClick={function() { fileInputRef.current.click(); }}
            style={{
              border: '2px dashed ' + (file ? '#3d7a52' : '#1e3828'),
              borderRadius: 8,
              padding: '40px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: file ? '#1a2e2244' : 'transparent',
              transition: 'all 0.15s ease',
              marginBottom: 16
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            {file ? (
              <div>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#94e8b4', marginBottom: 4 }}>{file.name}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#5a8a6a' }}>
                  {(file.size / 1024).toFixed(0)} KB — Click to change file
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>📄</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#8ab89a', marginBottom: 4 }}>Click to select a PDF file</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#3d5a47' }}>or drag and drop here</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#5a8a6a', letterSpacing: 1 }}>RESOLUTION:</div>
            {[150, 300, 600].map(function(d) {
              return (
                <button
                  key={d}
                  onClick={function() { setDpi(d); }}
                  style={{
                    padding: '6px 14px',
                    background: dpi === d ? '#3d7a52' : '#0c1a12',
                    border: '1px solid ' + (dpi === d ? '#94e8b4' : '#1e3828'),
                    borderRadius: 6,
                    color: dpi === d ? '#94e8b4' : '#5a8a6a',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  {d} DPI
                </button>
              );
            })}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#3d5a47', marginBottom: 16 }}>
            {dpi === 150 ? 'Good for web/preview' : dpi === 300 ? 'Recommended for print (Printify)' : 'Maximum quality — large file size'}
          </div>

          <button
            onClick={handleConvert}
            disabled={!file || loading}
            style={{
              width: '100%',
              padding: '14px 24px',
              background: !file || loading ? '#1e3828' : '#94e8b4',
              color: !file || loading ? '#3d5a47' : '#0c1a12',
              border: 'none',
              borderRadius: 8,
              fontFamily: "'DM Mono', monospace",
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: 2,
              cursor: !file || loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'CONVERTING...' : 'CONVERT TO PNG'}
          </button>
        </div>

        {error && (
          <div style={{ background: '#2e1a1a', border: '1px solid #5a2828', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#e8a0a0' }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#94e8b4', marginBottom: 8 }}>Converting at {dpi} DPI...</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#5a8a6a' }}>This may take a few seconds for high-resolution output</div>
          </div>
        )}

        {pages.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#5a8a6a', letterSpacing: 2 }}>
                {pages.length} PAGE{pages.length > 1 ? 'S' : ''} CONVERTED
              </div>
              {pages.length > 1 && (
                <button
                  onClick={downloadAll}
                  style={{
                    padding: '8px 16px',
                    background: '#1e3828',
                    border: '1px solid #3d7a52',
                    borderRadius: 6,
                    color: '#94e8b4',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    cursor: 'pointer'
                  }}
                >
                  DOWNLOAD ALL
                </button>
              )}
            </div>

            {pages.map(function(page) {
              return (
                <div key={page.pageNum} style={{ background: '#13261a', border: '1px solid #1e3828', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#94e8b4' }}>
                        {pages.length > 1 ? 'Page ' + page.pageNum : fileName + '.png'}
                      </div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#3d5a47' }}>
                        {page.width} x {page.height} px at {dpi} DPI
                      </div>
                    </div>
                    <button
                      onClick={function() { downloadPage(page); }}
                      style={{
                        padding: '10px 20px',
                        background: '#94e8b4',
                        color: '#0c1a12',
                        border: 'none',
                        borderRadius: 6,
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      DOWNLOAD PNG
                    </button>
                  </div>
                  <div style={{ background: '#0c1a12', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                    <img
                      src={page.dataUrl}
                      alt={'Page ' + page.pageNum}
                      style={{ maxWidth: '100%', maxHeight: 500, borderRadius: 4 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 40, padding: '20px 0', borderTop: '1px solid #1e3828' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#3d5a47', lineHeight: 1.6 }}>
            TIPS: Use 300 DPI for Printify products. FAA airport diagrams are typically single-page PDFs.
            All conversion happens locally in your browser — your files never leave your computer.
          </div>
        </div>
      </div>
    </>
  );
}
