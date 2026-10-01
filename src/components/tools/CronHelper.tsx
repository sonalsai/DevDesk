import React, { useState, useMemo } from 'react';
import { ToolLayout } from '../common/ToolLayout';
import { Calendar, Clock, Copy, Check, Info } from 'lucide-react';
import { useToast } from '@/hooks';

interface CronPreset {
  name: string;
  expression: string;
}

const CRON_PRESETS: CronPreset[] = [
  { name: 'Every minute', expression: '* * * * *' },
  { name: 'Every 5 minutes', expression: '*/5 * * * *' },
  { name: 'Every 15 minutes', expression: '*/15 * * * *' },
  { name: 'Every hour at :00', expression: '0 * * * *' },
  { name: 'Every day at midnight', expression: '0 0 * * *' },
  { name: 'Every weekday at 9:00 AM', expression: '0 9 * * 1-5' },
  { name: 'Every Sunday at midnight', expression: '0 0 * * 0' },
  { name: 'First day of every month at midnight', expression: '0 0 1 * *' },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function explainCron(expression: string): { explanation: string; isValid: boolean } {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    return {
      explanation: 'Invalid expression: Cron schedule must contain exactly 5 parts (minute hour dom month dow).',
      isValid: false,
    };
  }

  const [min, hour, dom, mon, dow] = parts;

  try {
    let text = 'Runs ';

    // Specific preset phrases
    if (min === '*' && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
      return { explanation: 'Runs every minute of every hour, every day.', isValid: true };
    }

    if (min.startsWith('*/') && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
      const step = min.replace('*/', '');
      return { explanation: `Runs every ${step} minutes.`, isValid: true };
    }

    // Time of day
    if (hour === '*' && min !== '*') {
      if (min === '0') text += 'at the start of every hour';
      else text += `at minute ${min} of every hour`;
    } else if (hour !== '*' && min !== '*') {
      const h = parseInt(hour, 10);
      const m = parseInt(min, 10);
      if (!isNaN(h) && !isNaN(m)) {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        const displayM = m.toString().padStart(2, '0');
        text += `at ${displayH}:${displayM} ${ampm}`;
      } else {
        text += `at ${hour}:${min}`;
      }
    } else {
      text += 'every hour';
    }

    // Days of week
    if (dow !== '*') {
      if (dow === '1-5') {
        text += ', Monday through Friday';
      } else if (dow === '0,6' || dow === '6,0' || dow === '7,6' || dow === '6,7') {
        text += ', on weekends (Saturday and Sunday)';
      } else {
        const dayNames = dow.split(',').map((d) => {
          const num = parseInt(d, 10);
          return DAYS[num % 7] || d;
        });
        text += `, on ${dayNames.join(', ')}`;
      }
    }

    // Day of month
    if (dom !== '*') {
      text += `, on day ${dom} of the month`;
    }

    // Month
    if (mon !== '*') {
      const monthNames = mon.split(',').map((m) => {
        const num = parseInt(m, 10);
        return MONTHS[num - 1] || m;
      });
      text += `, only in ${monthNames.join(', ')}`;
    }

    return { explanation: text + '.', isValid: true };
  } catch (err: any) {
    return { explanation: `Error parsing expression: ${err.message}`, isValid: false };
  }
}

// Compute next 5 simulated upcoming run times
function getNextOccurrences(expression: string, count = 5): string[] {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return [];

  const [minPart, hourPart] = parts;
  const results: string[] = [];
  const now = new Date();
  let cursor = new Date(now.getTime() + 60000); // start next minute

  for (let step = 0; step < 1000 && results.length < count; step++) {
    const curMin = cursor.getMinutes();
    const curHour = cursor.getHours();

    let minMatch = false;
    if (minPart === '*') minMatch = true;
    else if (minPart.startsWith('*/')) {
      const s = parseInt(minPart.replace('*/', ''), 10);
      if (curMin % s === 0) minMatch = true;
    } else if (parseInt(minPart, 10) === curMin) {
      minMatch = true;
    }

    let hourMatch = false;
    if (hourPart === '*') hourMatch = true;
    else if (parseInt(hourPart, 10) === curHour) hourMatch = true;

    if (minMatch && hourMatch) {
      results.push(new Date(cursor).toLocaleString());
    }

    cursor = new Date(cursor.getTime() + 60000); // step 1 min
  }

  return results;
}

export const CronHelper: React.FC = () => {
  const { showToast } = useToast();
  const [expression, setExpression] = useState<string>('0 9 * * 1-5');
  const [copied, setCopied] = useState<boolean>(false);

  // Visual builder fields
  const [builderMinute, setBuilderMinute] = useState<string>('0');
  const [builderHour, setBuilderHour] = useState<string>('9');
  const [builderDom, setBuilderDom] = useState<string>('*');
  const [builderMonth, setBuilderMonth] = useState<string>('*');
  const [builderDow, setBuilderDow] = useState<string>('1-5');

  const { explanation, isValid } = useMemo(() => {
    return explainCron(expression);
  }, [expression]);

  const upcomingRuns = useMemo(() => {
    if (!isValid) return [];
    return getNextOccurrences(expression);
  }, [expression, isValid]);

  const applyBuilder = () => {
    const built = `${builderMinute} ${builderHour} ${builderDom} ${builderMonth} ${builderDow}`;
    setExpression(built);
    showToast('Applied builder expression', 'info', 1500);
  };

  const copyExpression = () => {
    navigator.clipboard.writeText(expression);
    setCopied(true);
    showToast('Copied cron expression', 'success', 1500);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <ToolLayout
      toolId="cron-helper"
      title="Cron Helper"
      description="Translate cron expressions into human-readable schedules, build crons visually, and view upcoming runs."
      icon={Calendar}
      actions={
        <div className="toolbar-group">
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Presets:</span>
          {CRON_PRESETS.slice(0, 4).map((p) => (
            <button
              key={p.name}
              className="btn btn-subtle btn-sm"
              onClick={() => setExpression(p.expression)}
            >
              {p.name}
            </button>
          ))}
        </div>
      }
    >
      {/* Expression Input & Copy Box */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Cron Expression (5-field syntax)
            </label>
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="* * * * *"
              style={{
                width: '100%',
                fontFamily: 'var(--font-mono)',
                fontSize: 18,
                fontWeight: 600,
                color: 'var(--accent)',
              }}
            />
          </div>

          <button
            className={`btn ${copied ? 'btn-primary' : 'btn-secondary'}`}
            onClick={copyExpression}
            style={{ alignSelf: 'flex-end', height: '36px' }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied ✓' : 'Copy'}</span>
          </button>
        </div>

        {/* Human Translation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            backgroundColor: isValid ? 'var(--accent-subtle)' : 'var(--danger-subtle)',
            border: `1px solid ${isValid ? 'var(--accent-border)' : 'var(--danger)'}`,
            borderRadius: 'var(--radius-md)',
            color: isValid ? 'var(--text-primary)' : 'var(--danger)',
            fontSize: 13.5,
            fontWeight: 500,
          }}
        >
          <Clock size={16} style={{ color: isValid ? 'var(--accent)' : 'var(--danger)', flexShrink: 0 }} />
          <span>{explanation}</span>
        </div>
      </div>

      {/* Visual Builder & Upcoming Runs Split */}
      <div className="tool-split-container">
        {/* Visual Builder */}
        <div className="tool-panel">
          <div className="tool-panel-header">
            <span>Visual Builder</span>
            <button className="btn btn-primary btn-sm" onClick={applyBuilder}>
              Apply to Input
            </button>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Minute (0-59 or * or */5):
              </label>
              <input
                type="text"
                value={builderMinute}
                onChange={(e) => setBuilderMinute(e.target.value)}
                style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 12.5 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Hour (0-23 or *):
              </label>
              <input
                type="text"
                value={builderHour}
                onChange={(e) => setBuilderHour(e.target.value)}
                style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 12.5 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Day of Month (1-31 or *):
              </label>
              <input
                type="text"
                value={builderDom}
                onChange={(e) => setBuilderDom(e.target.value)}
                style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 12.5 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Month (1-12 or *):
              </label>
              <input
                type="text"
                value={builderMonth}
                onChange={(e) => setBuilderMonth(e.target.value)}
                style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 12.5 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Day of Week (0-6, 1-5, or *):
              </label>
              <input
                type="text"
                value={builderDow}
                onChange={(e) => setBuilderDow(e.target.value)}
                style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 12.5 }}
              />
            </div>
          </div>
        </div>

        {/* Next Upcoming Runs */}
        <div className="tool-panel">
          <div className="tool-panel-header">
            <span>Next Estimated Executions</span>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcomingRuns.length > 0 ? (
              upcomingRuns.map((time, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: 12.5,
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', fontSize: 11, width: 16 }}>
                    {idx + 1}.
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {time}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                Enter a valid cron expression to calculate upcoming execution times.
              </div>
            )}

            <div
              style={{
                marginTop: 'auto',
                padding: '10px 12px',
                backgroundColor: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                fontSize: 11.5,
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Info size={14} style={{ color: 'var(--accent)' }} />
              <span>Standard 5-field cron: minute, hour, day-of-month, month, day-of-week.</span>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};
