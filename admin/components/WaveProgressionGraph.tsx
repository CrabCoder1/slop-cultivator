import { useMemo } from 'react';
import { calculateWaveProgression } from '../../shared/utils/map-wave-config-service';
import type { GrowthCurveType } from '../../shared/types/map-wave-config';

interface WaveProgressionGraphProps {
  wave1SpendLimit: number;
  growthCurveType: GrowthCurveType;
  maxWaves?: number;
}

export default function WaveProgressionGraph({
  wave1SpendLimit,
  growthCurveType,
  maxWaves = 20,
}: WaveProgressionGraphProps) {
  // Calculate wave progression data
  const progression = useMemo(
    () => calculateWaveProgression(wave1SpendLimit, growthCurveType, maxWaves),
    [wave1SpendLimit, growthCurveType, maxWaves]
  );

  // Calculate graph dimensions and scaling
  const { width, height, padding, xScale, yScale, maxSpend, yTicks, xTicks } = useMemo(() => {
    const width = 800;
    const height = 400;
    const padding = { top: 20, right: 40, bottom: 50, left: 70 };

    const maxSpend = Math.max(...progression.map(p => p.spendLimit));
    const minSpend = Math.min(...progression.map(p => p.spendLimit));

    // Calculate nice y-axis range
    const yRange = maxSpend - minSpend;
    const yPadding = yRange * 0.1;
    const yMax = maxSpend + yPadding;
    const yMin = Math.max(0, minSpend - yPadding);

    // Scaling functions
    const xScale = (wave: number) => {
      const chartWidth = width - padding.left - padding.right;
      return padding.left + ((wave - 1) / (maxWaves - 1)) * chartWidth;
    };

    const yScale = (spend: number) => {
      const chartHeight = height - padding.top - padding.bottom;
      return height - padding.bottom - ((spend - yMin) / (yMax - yMin)) * chartHeight;
    };

    // Generate tick marks
    const yTickCount = 5;
    const yTicks = Array.from({ length: yTickCount }, (_, i) => {
      const value = yMin + (i / (yTickCount - 1)) * (yMax - yMin);
      return Math.round(value);
    });

    const xTickCount = Math.min(10, maxWaves);
    const xTickInterval = Math.ceil(maxWaves / xTickCount);
    const xTicks = Array.from(
      { length: Math.ceil(maxWaves / xTickInterval) },
      (_, i) => (i * xTickInterval) + 1
    ).filter(wave => wave <= maxWaves);

    return { width, height, padding, xScale, yScale, maxSpend, yTicks, xTicks };
  }, [progression, maxWaves]);

  // Generate SVG path for the line
  const linePath = useMemo(() => {
    const points = progression.map(
      p => `${xScale(p.waveNumber)},${yScale(p.spendLimit)}`
    );
    return `M ${points.join(' L ')}`;
  }, [progression, xScale, yScale]);

  // Generate area fill path
  const areaPath = useMemo(() => {
    const chartBottom = height - padding.bottom;
    const points = progression.map(
      p => `${xScale(p.waveNumber)},${yScale(p.spendLimit)}`
    );
    const firstPoint = `${xScale(1)},${chartBottom}`;
    const lastPoint = `${xScale(maxWaves)},${chartBottom}`;
    return `M ${firstPoint} L ${points.join(' L ')} L ${lastPoint} Z`;
  }, [progression, xScale, yScale, height, padding, maxWaves]);

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <div className="mb-2">
        <h3 className="text-lg font-semibold text-amber-400">
          📈 Wave Progression Preview
        </h3>
        <p className="text-sm text-slate-400">
          Spend limits across {maxWaves} waves ({growthCurveType} curve)
        </p>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{ maxHeight: '400px' }}
      >
        {/* Grid lines */}
        <g className="grid-lines">
          {/* Horizontal grid lines */}
          {yTicks.map((tick) => (
            <line
              key={`h-grid-${tick}`}
              x1={padding.left}
              y1={yScale(tick)}
              x2={width - padding.right}
              y2={yScale(tick)}
              stroke="#334155"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          ))}

          {/* Vertical grid lines */}
          {xTicks.map((wave) => (
            <line
              key={`v-grid-${wave}`}
              x1={xScale(wave)}
              y1={padding.top}
              x2={xScale(wave)}
              y2={height - padding.bottom}
              stroke="#334155"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          ))}
        </g>

        {/* Area fill under the line */}
        <path
          d={areaPath}
          fill="url(#gradient)"
          opacity="0.3"
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Main line */}
        <path
          d={linePath}
          fill="none"
          stroke="#a78bfa"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {progression.map((point) => (
          <circle
            key={`point-${point.waveNumber}`}
            cx={xScale(point.waveNumber)}
            cy={yScale(point.spendLimit)}
            r="4"
            fill="#8b5cf6"
            stroke="#a78bfa"
            strokeWidth="2"
          >
            <title>
              Wave {point.waveNumber}: {point.spendLimit} spend
            </title>
          </circle>
        ))}

        {/* X-axis */}
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="#64748b"
          strokeWidth="2"
        />

        {/* Y-axis */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="#64748b"
          strokeWidth="2"
        />

        {/* X-axis labels */}
        {xTicks.map((wave) => (
          <text
            key={`x-label-${wave}`}
            x={xScale(wave)}
            y={height - padding.bottom + 25}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="12"
            fontWeight="500"
          >
            {wave}
          </text>
        ))}

        {/* X-axis title */}
        <text
          x={padding.left + (width - padding.left - padding.right) / 2}
          y={height - 10}
          textAnchor="middle"
          fill="#cbd5e1"
          fontSize="14"
          fontWeight="600"
        >
          Wave Number
        </text>

        {/* Y-axis labels */}
        {yTicks.map((tick) => (
          <text
            key={`y-label-${tick}`}
            x={padding.left - 10}
            y={yScale(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            fill="#94a3b8"
            fontSize="12"
            fontWeight="500"
          >
            {tick.toLocaleString()}
          </text>
        ))}

        {/* Y-axis title */}
        <text
          x={15}
          y={padding.top + (height - padding.top - padding.bottom) / 2}
          textAnchor="middle"
          fill="#cbd5e1"
          fontSize="14"
          fontWeight="600"
          transform={`rotate(-90, 15, ${padding.top + (height - padding.top - padding.bottom) / 2})`}
        >
          Spend Limit
        </text>
      </svg>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-purple-500"></div>
          <span className="text-slate-300">Current Configuration</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Max Spend:</span>
          <span className="text-amber-400 font-semibold">
            {maxSpend.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
