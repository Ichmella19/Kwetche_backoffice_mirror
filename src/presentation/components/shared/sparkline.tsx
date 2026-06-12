"use client";

import { useMemo } from "react";

interface SparklineProps {
  /** Valeurs y. Une seule valeur ou tableau vide → ligne plate. */
  values: number[];
  /** Largeur en px (par défaut 100% du conteneur). */
  width?: number;
  /** Hauteur en px. */
  height?: number;
  /** Couleur de la ligne — accepte n'apos;importe quelle valeur CSS color. */
  color?: string;
  /** Si défini, dessine une zone remplie sous la ligne. */
  fill?: boolean;
  /** Aria label pour l'apos;accessibilité (sinon `hidden`). */
  label?: string;
}

/**
 * Sparkline ultra-léger en SVG inline. Pas de dépendance externe, pas
 * d'apos;animation. Adapte la viewport et garde le ratio.
 */
export function Sparkline({
  values,
  width = 200,
  height = 48,
  color = "currentColor",
  fill = true,
  label,
}: SparklineProps) {
  const path = useMemo(() => buildPath(values, width, height), [
    values,
    width,
    height,
  ]);

  if (values.length === 0) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        aria-hidden={!label}
        aria-label={label}
        className="block"
      >
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke={color}
          strokeOpacity={0.25}
          strokeDasharray="3 3"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      aria-hidden={!label}
      aria-label={label}
      className="block"
    >
      {fill && (
        <path
          d={`${path.line} L ${width} ${height} L 0 ${height} Z`}
          fill={color}
          fillOpacity={0.12}
        />
      )}
      <path
        d={path.line}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function buildPath(values: number[], w: number, h: number): { line: string } {
  if (values.length === 0) return { line: "" };
  if (values.length === 1) {
    return { line: `M 0 ${h / 2} L ${w} ${h / 2}` };
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = w / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * stepX;
    // y inversé (SVG : 0 en haut) + petit padding vertical pour ne pas coller au bord.
    const norm = (v - min) / span;
    const padding = 4;
    const y = h - padding - norm * (h - padding * 2);
    return `${x.toFixed(2)} ${y.toFixed(2)}`;
  });
  return { line: `M ${points.join(" L ")}` };
}
