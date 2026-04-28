interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export default function Sparkline({ data, width = 80, height = 32, color }: SparklineProps) {
  if (!data || data.length < 2) {
    return <svg width={width} height={height} className="sparkline" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const isUp = data[data.length - 1] >= data[0];
  const strokeColor = color || (isUp ? "#22c55e" : "#ef4444");

  return (
    <svg width={width} height={height} className="sparkline" aria-hidden="true">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
