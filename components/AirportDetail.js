'use client';

export default function RunwayDiagram({ runways, size = 160, color = '#94e8b4' }) {
  const parsed = runways.split(';').map(r => {
    const m = r.trim().match(/^(\d+\w?\/\d+\w?):\s*([\d,]+)x(\d+)/);
    if (!m) return null;
    const ids = m[1];
    const len = parseInt(m[2].replace(/,/g, ''));
    const wid = parseInt(m[3]);
    const hdg = parseInt(ids.split('/')[0].replace(/[LRC]/g, '')) * 10;
    return { ids, len, wid, hdg };
  }).filter(Boolean);

  const maxLen = Math.max(...parsed.map(r => r.len), 1);
  const scale = (size * 0.35) / maxLen;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={size*0.44} fill="none" stroke={color} strokeWidth="0.5" opacity="0.15" />
      <circle cx={size/2} cy={size/2} r={size*0.3} fill="none" stroke={color} strokeWidth="0.5" opacity="0.1" />
      {parsed.map((rwy, i) => {
        const rad = ((rwy.hdg - 90) * Math.PI) / 180;
        const rLen = rwy.len * scale;
        const rWid = Math.max(rwy.wid * scale * 0.3, 2);
        const cx = size / 2, cy = size / 2;
        const x1 = cx - Math.cos(rad) * rLen / 2;
        const y1 = cy - Math.sin(rad) * rLen / 2;
        const x2 = cx + Math.cos(rad) * rLen / 2;
        const y2 = cy + Math.sin(rad) * rLen / 2;
        const px = Math.sin(rad) * rWid / 2;
        const py = -Math.cos(rad) * rWid / 2;
        return (
          <g key={i}>
            <polygon points={`${x1-px},${y1-py} ${x1+px},${y1+py} ${x2+px},${y2+py} ${x2-px},${y2-py}`} fill={color} opacity="0.8" />
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0c1a12" strokeWidth="0.7" strokeDasharray="2.5 2.5" opacity="0.5" />
            <text x={x1-Math.cos(rad)*9} y={y1-Math.sin(rad)*9} fill={color} fontSize={size*0.04} textAnchor="middle" dominantBaseline="middle" fontFamily="'DM Mono', monospace" opacity="0.7">{rwy.ids.split('/')[0]}</text>
            <text x={x2+Math.cos(rad)*9} y={y2+Math.sin(rad)*9} fill={color} fontSize={size*0.04} textAnchor="middle" dominantBaseline="middle" fontFamily="'DM Mono', monospace" opacity="0.7">{rwy.ids.split('/')[1]}</text>
          </g>
        );
      })}
    </svg>
  );
}
