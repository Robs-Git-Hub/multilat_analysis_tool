
// src/components/prototypes/HorizontalColorbar.tsx
"use client";

interface HorizontalColorbarProps {
  title: string;
  min: number;
  max: number;
  // The colorscale is an array of [stop, color] tuples, e.g., [[0, 'blue'], [1, 'red']]
  colorscale: [number, string][];
}

/**
 * A custom, responsive horizontal colorbar component built with React and Tailwind CSS.
 * It creates a gradient based on a Plotly-style colorscale.
 */
export const HorizontalColorbar: React.FC<HorizontalColorbarProps> = ({
  title,
  min,
  max,
  colorscale,
}) => {
  // Create a CSS linear-gradient string from the Plotly colorscale
  const gradientString = `linear-gradient(to right, ${colorscale
    .map(([stop, color]) => `${color} ${stop * 100}%`)
    .join(', ')})`;

  return (
    <div className="w-full px-4 md:px-0 mb-2">
      <div className="text-center text-xs font-medium text-gray-600 mb-1">
        {title}
      </div>
      <div className="flex items-center gap-x-2">
        <span className="text-xs text-gray-500">{Math.round(min)}</span>
        <div
          className="h-3 w-full rounded-full border border-gray-200"
          style={{ background: gradientString }}
        />
        <span className="text-xs text-gray-500">{Math.round(max)}</span>
      </div>
    </div>
  );
};