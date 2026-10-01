import React, { useState, useMemo } from 'react';
import { ToolLayout } from '../common/ToolLayout';
import { Palette, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks';

// Color conversions
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace(/^#/, '');
  if (![3, 6].includes(cleanHex.length)) return null;

  let r = 0, g = 0, b = 0;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [r, g, b].map((x) => clamp(x).toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

// Relative luminance for contrast
function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export const ColorConverter: React.FC = () => {
  const { showToast } = useToast();
  const [hexColor, setHexColor] = useState<string>('#3B82F6');
  const [alpha, setAlpha] = useState<number>(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const parsed = useMemo(() => {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return null;

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);

    const lum = getLuminance(rgb.r, rgb.g, rgb.b);
    // Contrast with white (lum 1) and black (lum 0)
    const contrastWhite = (1 + 0.05) / (lum + 0.05);
    const contrastBlack = (lum + 0.05) / (0 + 0.05);

    return {
      hex: rgbToHex(rgb.r, rgb.g, rgb.b).toUpperCase(),
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      hsla: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${alpha})`,
      hsv: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`,
      contrastWhite: contrastWhite.toFixed(2),
      contrastBlack: contrastBlack.toFixed(2),
      isDark: lum < 0.4,
    };
  }, [hexColor, alpha]);

  const copyVal = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(label);
    showToast(`Copied ${label}`, 'success', 1500);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleHexChange = (val: string) => {
    setHexColor(val);
  };

  return (
    <ToolLayout
      toolId="color-converter"
      title="Color Converter"
      description="Convert colors between HEX, RGB, RGBA, HSL, and HSV with live preview and contrast scores."
      icon={Palette}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: 16 }}>
        {/* Color Picker & Preview Panel */}
        <div
          className="tool-panel"
          style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {/* Swatch */}
          <div
            className="color-preview-large"
            style={{
              backgroundColor: parsed ? parsed.rgba : '#3B82F6',
              color: parsed?.isDark ? '#FFFFFF' : '#000000',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <span>{parsed ? parsed.hex : 'Invalid Color'}</span>
          </div>

          {/* Color Picker Input & Controls */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Visual Color Picker:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="color"
                value={parsed ? parsed.hex : '#3B82F6'}
                onChange={(e) => handleHexChange(e.target.value)}
                style={{
                  width: '50px',
                  height: '36px',
                  padding: 2,
                  cursor: 'pointer',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
              <input
                type="text"
                value={hexColor}
                onChange={(e) => handleHexChange(e.target.value)}
                placeholder="#3B82F6"
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  textTransform: 'uppercase',
                }}
              />
            </div>
          </div>

          {/* Alpha Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-muted)' }}>Opacity (Alpha):</span>
              <strong style={{ color: 'var(--text-primary)' }}>{Math.round(alpha * 100)}%</strong>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={alpha}
              onChange={(e) => setAlpha(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
          </div>

          {/* Contrast Indicators */}
          {parsed && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                backgroundColor: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                fontSize: 11.5,
              }}
            >
              <span>
                White text ratio: <strong>{parsed.contrastWhite}:1</strong>
              </span>
              <span>
                Black text ratio: <strong>{parsed.contrastBlack}:1</strong>
              </span>
            </div>
          )}
        </div>

        {/* Color Formats Table */}
        <div className="tool-panel">
          <div className="tool-panel-header">
            <span>Color Formats</span>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'HEX', val: parsed?.hex },
              { label: 'RGB', val: parsed?.rgb },
              { label: 'RGBA', val: parsed?.rgba },
              { label: 'HSL', val: parsed?.hsl },
              { label: 'HSLA', val: parsed?.hsla },
              { label: 'HSV', val: parsed?.hsv },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      width: 50,
                      fontWeight: 600,
                      fontSize: 11.5,
                      color: 'var(--text-muted)',
                    }}
                  >
                    {item.label}
                  </span>
                  <code style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    {item.val || '—'}
                  </code>
                </div>

                <button
                  className={`btn btn-subtle btn-sm ${copiedKey === item.label ? 'btn-primary' : ''}`}
                  onClick={() => item.val && copyVal(item.val, item.label)}
                  disabled={!item.val}
                >
                  {copiedKey === item.label ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedKey === item.label ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};
