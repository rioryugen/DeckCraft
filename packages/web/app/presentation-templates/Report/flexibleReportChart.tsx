// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import type { ChartConfiguration, ChartOptions, Plugin } from "chart.js";
import * as z from "zod";

export const simpleDataSchema = z.object({
  name: z.string().meta({ description: "Data point name" }),
  value: z.number().meta({ description: "Data point value" }),
});

export const multiSeriesDataSchema = z.object({
  name: z.string().meta({ description: "Category name" }),
  values: z.any().meta({
    description:
      "Key-value pairs for each series (object with series names as keys and numbers as values)",
  }),
});

export const divergingDataSchema = z.object({
  name: z.string().meta({ description: "Category name" }),
  positive: z.number().meta({ description: "Positive value" }),
  negative: z.number().meta({ description: "Negative value" }),
});

export const scatterDataSchema = z.object({
  x: z.number().meta({ description: "X coordinate" }),
  y: z.number().meta({ description: "Y coordinate" }),
});

/** Two series over categorical labels (line stats slide). */
export const dualLinePointSchema = z.object({
  label: z.string().meta({ description: "Chart axis label" }),
  valueA: z.number().meta({ description: "First series value" }),
  valueB: z.number().meta({ description: "Second series value" }),
});
export const SimpleDataPointSchema = z.object({
  name: z.string(),
  value: z.number(),
});

export const MultiSeriesDataPointSchema = z.object({
  name: z.string(),
  values: z.any(),
});

export const DivergingDataPointSchema = z.object({
  name: z.string(),
  positive: z.number(),
  negative: z.number(),
});

export const ScatterDataPointSchema = z.object({
  x: z.number(),
  y: z.number(),
  name: z.string().optional(),
});


export const flexibleChartTypeSchema = z.enum([
  "bar",
  "bar-horizontal",
  "bar-grouped-vertical",
  "bar-grouped-horizontal",
  "bar-stacked-vertical",
  "bar-stacked-horizontal",
  "bar-clustered",
  "bar-diverging",
  "line",
  "line-dual",
  "area",
  "area-stacked",
  "pie",
  "donut",
  "scatter",
]);

export const flexibleChartDataSchema = z.object({
  type: flexibleChartTypeSchema.default("bar"),
  data: z.union([
    z.array(simpleDataSchema),
    z.array(multiSeriesDataSchema),
    z.array(divergingDataSchema),
    z.array(scatterDataSchema),
    z.array(dualLinePointSchema),
  ]),
  series: z.array(z.string()).optional().meta({ description: "Series names for grouped/stacked charts" }),
  divergingLabels: z.tuple([z.string(), z.string()]).optional(),
});

export type FlexibleChartData = z.infer<typeof flexibleChartDataSchema>;

const formatComma = (value: string | number) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toLocaleString("en-US") : String(value);
};

export function deriveSeriesNames(data: any[], explicit: string[]): string[] {
  if (explicit.length > 0) return explicit;
  const first = data[0];
  if (!first) return [];
  if (first.values != null && typeof first.values === "object" && !Array.isArray(first.values)) {
    return Object.keys(first.values);
  }
  if (typeof first.value === "number") return ["value"];
  return [];
}

export function transformMultiSeriesData(data: any[], series: string[]) {
  return data.map((item) => {
    const result: Record<string, any> = { name: item.name };
    series.forEach((s) => {
      if (item.values != null && typeof item.values === "object" && s in item.values) {
        result[s] = Number(item.values[s]) || 0;
      } else if (s === "value" && typeof item.value === "number") {
        result[s] = item.value;
      } else if (typeof item[s] === "number") {
        result[s] = item[s];
      } else {
        result[s] = Number(item.values?.[s]) || 0;
      }
    });
    return result;
  });
}

export function transformDivergingData(data: any[]) {
  return data.map((item) => {
    if (typeof item.positive === "number" && typeof item.negative === "number") {
      return {
        name: item.name,
        positive: item.positive,
        negative: -Math.abs(item.negative),
      };
    }
    const v = Number(item.value);
    if (!Number.isNaN(v)) {
      return {
        name: item.name,
        positive: Math.max(0, v),
        negative: v < 0 ? v : 0,
      };
    }
    return { name: item.name, positive: 0, negative: 0 };
  });
}

export function normalizeScatterPoints(data: any[]) {
  return data.map((item, i) => {
    if (typeof item.x === "number" && typeof item.y === "number") {
      return { ...item, x: item.x, y: item.y };
    }
    if (typeof item.value === "number") {
      return { ...item, x: typeof item.x === "number" ? item.x : i + 1, y: item.value };
    }
    return { ...item, x: i + 1, y: 0 };
  });
}

/** Line-stats style rows: categorical `label` + two metrics (not a single `value` series). */
function dataIsDualLineShape(data: any[]): boolean {
  const row = data[0];
  return (
    !!row &&
    typeof row === "object" &&
    typeof row.label === "string" &&
    typeof row.valueA === "number" &&
    typeof row.valueB === "number" &&
    typeof row.value !== "number"
  );
}

const MULTI_SERIES_CHART_TYPES: FlexibleChartData["type"][] = [
  "bar-grouped-vertical",
  "bar-grouped-horizontal",
  "bar-stacked-vertical",
  "bar-stacked-horizontal",
  "bar-clustered",
  "area-stacked",
];

/**
 * Aligns `data`/`series` with `chartType`. Line-stats slides often keep `{ label, valueA, valueB }`
 * while bar/line/pie/etc. expect `name`/`value` or `values` + series keys.
 */
export function normalizeFlexibleChartData(
  chartType: FlexibleChartData["type"],
  data: any[],
  seriesIn: string[],
): { data: any[]; series: string[] } {
  const series = seriesIn ?? [];
  const rows = data ?? [];

  if (chartType === "line-dual") {
    if (dataIsDualLineShape(rows)) return { data: rows, series };
    return {
      data: rows.map((r, i) => ({
        label: r.label ?? r.name ?? `P${i + 1}`,
        valueA: typeof r.valueA === "number" ? r.valueA : typeof r.value === "number" ? r.value : 0,
        valueB: typeof r.valueB === "number" ? r.valueB : typeof r.value === "number" ? r.value : 0,
      })),
      series,
    };
  }

  if (!dataIsDualLineShape(rows)) {
    return { data: rows, series };
  }

  const dual = rows as Array<{ label: string; valueA: number; valueB: number }>;

  if (MULTI_SERIES_CHART_TYPES.includes(chartType)) {
    const keys = series.length >= 2 ? [series[0], series[1]] : ["A", "B"];
    const mapped = dual.map((r) => ({
      name: r.label,
      values: { [keys[0]]: r.valueA, [keys[1]]: r.valueB },
    }));
    return { data: mapped, series: keys };
  }

  if (chartType === "bar-diverging") {
    const mapped = dual.map((r) => ({
      name: r.label,
      positive: Math.max(0, r.valueA),
      negative: Math.max(0, r.valueB),
    }));
    return { data: mapped, series };
  }

  const mapped = dual.map((r) => ({
    name: r.label,
    value: r.valueA + r.valueB,
  }));
  return { data: mapped, series };
}

const graphVar = (index: number, fallback: string) => `var(--graph-${index % 10}, ${fallback})`;
const AXIS_TEXT = "var(--background-text,#232223)";
const BODY_FONT = "var(--body-font-family,'Source Sans 3')";
const ZERO_LINE = "var(--stroke,#9CA3AF)";

function cssVarParts(value: string) {
  const match = value.match(/^var\((--[^,\s)]+)\s*,?\s*([^)]+)?\)$/);
  if (!match) return null;

  return {
    name: match[1],
    fallback: match[2]?.trim(),
  };
}

function resolveToken(element: HTMLElement, value: string, fallback: string) {
  const parts = cssVarParts(value);
  if (!parts) return value;

  const resolved = getComputedStyle(element)
    .getPropertyValue(parts.name)
    .trim();
  return resolved || parts.fallback || fallback;
}

function resolveColor(element: HTMLElement, value: string, fallback = "#232223") {
  return resolveToken(element, value, fallback);
}

function resolveFont(element: HTMLElement) {
  return resolveToken(element, BODY_FONT, "Source Sans 3").replace(/^['"]|['"]$/g, "");
}

function toNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function withAlpha(color: string, alpha: number) {
  const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const raw = hex[1].length === 3
      ? hex[1].split("").map((char) => char + char).join("")
      : hex[1];
    const int = Number.parseInt(raw, 16);
    const rgb = [(int >> 16) & 255, (int >> 8) & 255, int & 255];
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
  }

  const rgb = color.trim().match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const channels = rgb[1].split(",").slice(0, 3).map((part) => part.trim());
    return `rgba(${channels.join(", ")}, ${alpha})`;
  }

  return color;
}

function colorLuminance(color: string) {
  const weights = [0.2126, 0.7152, 0.0722];
  const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const raw = hex[1].length === 3
      ? hex[1].split("").map((char) => char + char).join("")
      : hex[1];
    const int = Number.parseInt(raw, 16);
    const rgb = [(int >> 16) & 255, (int >> 8) & 255, int & 255];
    return rgb
      .map((value) => {
        const channel = value / 255;
        return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      })
      .reduce((sum, channel, index) => sum + channel * (weights[index] ?? 0), 0);
  }

  const rgb = color.trim().match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const channels = rgb[1].split(",").slice(0, 3).map((part) => Number(part.trim()));
    if (channels.every(Number.isFinite)) {
      return channels
        .map((value) => {
          const channel = value / 255;
          return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        })
        .reduce((sum, channel, index) => sum + channel * (weights[index] ?? 0), 0);
    }
  }

  return 0;
}

function readableTextColor(color: unknown) {
  const resolved = Array.isArray(color) ? color[0] : color;
  if (typeof resolved !== "string") return "#ffffff";
  return colorLuminance(resolved) > 0.52 ? "#232223" : "#ffffff";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function labelsFrom(data: any[], key = "name") {
  return data.map((item, index) => String(item?.[key] ?? item?.label ?? `P${index + 1}`));
}

function valuesFrom(data: any[], key: string) {
  return data.map((item) => toNumber(item?.[key]));
}

function resolvedGraphColors(canvas: HTMLCanvasElement, count: number, fallback: string) {
  return Array.from({ length: Math.max(1, count) }, (_, index) =>
    resolveColor(canvas, graphVar(index, fallback), fallback)
  );
}

type ReportChartUi = {
  compact: boolean;
  tickFs: number;
  tickPad: number;
  labelFs: number;
  labelOffTop: number;
  labelOffSide: number;
  layoutPadding: { top: number; right: number; left: number; bottom: number };
  lineStroke: number;
  dotR: number;
  dotStroke: number;
  maxBarThickness: number;
  borderRadius: number;
  piePadding: number;
  pieLabelMinPct: number;
  pieLabelFs: number;
};

function reportChartUi(compact: boolean): ReportChartUi {
  return {
    compact,
    tickFs: compact ? 6 : 10,
    tickPad: compact ? 5 : 9,
    labelFs: compact ? 8 : 14,
    labelOffTop: compact ? 4 : 10,
    labelOffSide: compact ? 4 : 8,
    layoutPadding: compact
      ? { top: 11, right: 14, left: 2, bottom: 4 }
      : { top: 24, right: 24, left: 4, bottom: 10 },
    lineStroke: compact ? 2 : 3,
    dotR: compact ? 2.5 : 4,
    dotStroke: compact ? 1 : 2,
    maxBarThickness: compact ? 20 : 35,
    borderRadius: compact ? 4 : 8,
    piePadding: compact ? 4 : 10,
    pieLabelMinPct: compact ? 0.12 : 0.06,
    pieLabelFs: compact ? 8 : 12,
  };
}

function reportBaseOptions(axisColor: string, fontFamily: string, ui: ReportChartUi): ChartOptions {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    resizeDelay: 0,
    color: axisColor,
    font: {
      family: fontFamily,
    },
    layout: {
      padding: ui.layoutPadding,
    },
    interaction: {
      intersect: false,
      mode: "nearest",
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
  } as ChartOptions;
}

function reportCategoryScale(axisColor: string, fontFamily: string, ui: ReportChartUi, stacked = false) {
  return {
    type: "category",
    offset: true,
    stacked,
    grid: {
      color: withAlpha(axisColor, 0.16),
      display: false,
      drawTicks: false,
    },
    border: {
      display: false,
    },
    ticks: {
      autoSkip: true,
      color: axisColor,
      font: {
        family: fontFamily,
        size: ui.tickFs,
        weight: 500,
      },
      maxRotation: 0,
      padding: ui.tickPad,
    },
  };
}

function reportLinearScale(axisColor: string, fontFamily: string, ui: ReportChartUi, stacked = false, beginAtZero = true) {
  return {
    type: "linear",
    beginAtZero,
    grace: "8%",
    stacked,
    grid: {
      color: withAlpha(axisColor, 0.22),
      drawTicks: false,
      lineWidth: 1,
    },
    border: {
      display: false,
    },
    ticks: {
      color: axisColor,
      font: {
        family: fontFamily,
        size: ui.tickFs,
        weight: 500,
      },
      padding: ui.tickPad,
      callback(value: string | number) {
        return formatComma(value);
      },
    },
  };
}

function reportBarDataset(data: number[], color: string, ui: ReportChartUi, extra: Record<string, unknown> = {}) {
  return {
    data,
    backgroundColor: color,
    borderColor: color,
    borderWidth: 0,
    borderRadius: ui.borderRadius,
    borderSkipped: false,
    categoryPercentage: 0.72,
    barPercentage: 0.78,
    maxBarThickness: ui.maxBarThickness,
    ...extra,
  };
}

function reportValueLabelPlugin(mode: "vertical" | "horizontal" | "none", axisColor: string, fontFamily: string, ui: ReportChartUi): Plugin {
  return {
    id: `reportValueLabels-${mode}-${ui.compact ? "compact" : "default"}`,
    afterDatasetsDraw(chart) {
      if (mode === "none") return;

      const ctx = chart.ctx;
      const area = chart.chartArea;
      ctx.save();
      ctx.font = `600 ${ui.labelFs}px ${fontFamily}`;
      ctx.textBaseline = "middle";

      chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        if (meta.hidden) return;

        const rawColor = Array.isArray(dataset.backgroundColor)
          ? dataset.backgroundColor[0]
          : dataset.backgroundColor;
        ctx.fillStyle = mode === "horizontal"
          ? readableTextColor(rawColor)
          : typeof rawColor === "string" ? rawColor : axisColor;

        meta.data.forEach((element: any, index: number) => {
          const raw = Array.isArray(dataset.data) ? dataset.data[index] : 0;
          const value = typeof raw === "object" ? toNumber(raw?.y ?? raw?.x) : toNumber(raw);
          if (!value) return;

          const position = element.tooltipPosition();
          if (mode === "horizontal") {
            const negative = value < 0;
            ctx.textAlign = negative ? "left" : "right";
            const x = clamp(
              position.x + (negative ? ui.labelOffSide : -ui.labelOffSide),
              area.left + 3,
              area.right - 3,
            );
            const y = clamp(position.y, area.top + ui.labelFs / 2, area.bottom - ui.labelFs / 2);
            ctx.fillText(formatComma(value), x, y);
            return;
          }

          ctx.textAlign = "center";
          const y = clamp(
            position.y + (value < 0 ? ui.labelOffTop : -ui.labelOffTop),
            area.top + ui.labelFs / 2,
            area.bottom - ui.labelFs / 2,
          );
          const x = clamp(position.x, area.left + 3, area.right - 3);
          ctx.fillText(formatComma(value), x, y);
        });
      });

      ctx.restore();
    },
  };
}

function reportPieLabelPlugin(axisColor: string, fontFamily: string, ui: ReportChartUi): Plugin {
  return {
    id: `reportPieLabels-${ui.compact ? "compact" : "default"}`,
    afterDatasetsDraw(chart) {
      const dataset: any = chart.data.datasets[0];
      const values = dataset?.data ?? [];
      const total = values.reduce((sum: number, value: unknown) => sum + Math.abs(toNumber(value)), 0);
      if (!total) return;

      const meta = chart.getDatasetMeta(0);
      const ctx = chart.ctx;
      ctx.save();
      ctx.font = `700 ${ui.pieLabelFs}px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      meta.data.forEach((element: any, index: number) => {
        const value = Math.abs(toNumber(values[index]));
        const percent = value / total;
        if (percent < ui.pieLabelMinPct) return;

        const arc = element.getProps(["x", "y", "startAngle", "endAngle", "innerRadius", "outerRadius"], true);
        const angle = (arc.startAngle + arc.endAngle) / 2;
        const radius = arc.innerRadius + (arc.outerRadius - arc.innerRadius) * 0.58;
        const x = arc.x + Math.cos(angle) * radius;
        const y = arc.y + Math.sin(angle) * radius;
        const fill = Array.isArray(dataset.backgroundColor)
          ? dataset.backgroundColor[index]
          : dataset.backgroundColor;

        ctx.fillStyle = readableTextColor(fill) || axisColor;
        ctx.fillText(`${Math.round(percent * 100)}%`, x, y);
      });

      ctx.restore();
    },
  };
}

function reportZeroLinePlugin(color: string): Plugin {
  return {
    id: "reportZeroLine",
    afterDraw(chart) {
      const scale = chart.scales.x;
      if (!scale) return;

      const x = scale.getPixelForValue(0);
      const area = chart.chartArea;
      if (x < area.left || x > area.right) return;

      const ctx = chart.ctx;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, area.top);
      ctx.lineTo(x, area.bottom);
      ctx.stroke();
      ctx.restore();
    },
  };
}

function reportCartesianOptions({
  axisColor,
  fontFamily,
  horizontal = false,
  stacked = false,
  ui,
}: {
  axisColor: string;
  fontFamily: string;
  horizontal?: boolean;
  stacked?: boolean;
  ui: ReportChartUi;
}): ChartOptions {
  const base = reportBaseOptions(axisColor, fontFamily, ui);

  return {
    ...base,
    indexAxis: horizontal ? "y" : "x",
    scales: horizontal
      ? {
        x: reportLinearScale(axisColor, fontFamily, ui, stacked),
        y: reportCategoryScale(axisColor, fontFamily, ui, stacked),
      }
      : {
        x: reportCategoryScale(axisColor, fontFamily, ui, stacked),
        y: reportLinearScale(axisColor, fontFamily, ui, stacked),
      },
  } as ChartOptions;
}

function makeReportChartConfig({
  canvas,
  chartType,
  chartData,
  colorFallback,
  density,
  dualLineColors,
  series,
}: Omit<FlexibleReportChartProps, "data"> & {
  canvas: HTMLCanvasElement;
  chartData: any[];
}): ChartConfiguration | null {
  const compact = density === "compact";
  const ui = reportChartUi(compact);
  const axisColor = resolveColor(canvas, AXIS_TEXT, "#232223");
  const fontFamily = resolveFont(canvas);
  const zeroLineColor = resolveColor(canvas, ZERO_LINE, "#9CA3AF");
  const { data: normalizedData, series: normalizedSeries } = normalizeFlexibleChartData(
    chartType,
    chartData,
    series ?? [],
  );
  const effectiveSeries = deriveSeriesNames(normalizedData as any[], normalizedSeries);
  const colorCount = Math.max(10, effectiveSeries.length, normalizedData.length);
  const colors = resolvedGraphColors(canvas, colorCount, colorFallback ?? "#157CFF");
  const resolvedDualLineColors: [string, string] = [
    resolveColor(canvas, dualLineColors?.[0] ?? "var(--graph-0,#9fb6ff)", "#9fb6ff"),
    resolveColor(canvas, dualLineColors?.[1] ?? "var(--graph-1,#4d4ef3)", "#4d4ef3"),
  ];

  if (chartType === "pie" || chartType === "donut") {
    return {
      type: chartType === "pie" ? "pie" : "doughnut",
      data: {
        labels: labelsFrom(normalizedData as any[]),
        datasets: [
          {
            data: valuesFrom(normalizedData as any[], "value"),
            backgroundColor: (normalizedData as any[]).map((_, index) => colors[index % colors.length]),
            borderColor: "transparent",
            borderWidth: 0,
            hoverBorderWidth: 0,
            spacing: 0,
          },
        ],
      },
      options: {
        ...reportBaseOptions(axisColor, fontFamily, ui),
        cutout: chartType === "donut" ? (compact ? "58%" : "68%") : 0,
        layout: {
          padding: ui.piePadding,
        },
      },
      plugins: [reportPieLabelPlugin(axisColor, fontFamily, ui)],
    } as ChartConfiguration;
  }

  if (chartType === "scatter") {
    const scatterPoints = normalizeScatterPoints(normalizedData as any[]);
    return {
      type: "scatter",
      data: {
        datasets: [
          {
            data: scatterPoints.map((point) => ({ x: point.x, y: point.y })),
            backgroundColor: scatterPoints.map((_, index) => colors[index % colors.length]),
            borderColor: scatterPoints.map((_, index) => colors[index % colors.length]),
            borderWidth: 0,
            clip: false,
            pointRadius: ui.dotR + (compact ? 0.5 : 1),
            pointHoverRadius: ui.dotR + (compact ? 0.5 : 1),
          },
        ],
      },
      options: {
        ...reportBaseOptions(axisColor, fontFamily, ui),
        scales: {
          x: reportLinearScale(axisColor, fontFamily, ui, false, false),
          y: reportLinearScale(axisColor, fontFamily, ui, false, false),
        },
      },
    } as ChartConfiguration;
  }

  if (chartType === "line" || chartType === "line-dual") {
    const dual = chartType === "line-dual";
    return {
      type: "line",
      data: {
        labels: dual ? labelsFrom(normalizedData as any[], "label") : labelsFrom(normalizedData as any[]),
        datasets: dual
          ? [
            {
              data: valuesFrom(normalizedData as any[], "valueA"),
              borderColor: resolvedDualLineColors[0],
              backgroundColor: resolvedDualLineColors[0],
              borderWidth: ui.lineStroke,
              clip: false,
              cubicInterpolationMode: "monotone",
              pointBackgroundColor: resolvedDualLineColors[0],
              pointBorderColor: resolvedDualLineColors[0],
              pointBorderWidth: ui.dotStroke,
              pointRadius: ui.dotR,
              tension: 0.35,
            },
            {
              data: valuesFrom(normalizedData as any[], "valueB"),
              borderColor: resolvedDualLineColors[1],
              backgroundColor: resolvedDualLineColors[1],
              borderWidth: ui.lineStroke,
              clip: false,
              cubicInterpolationMode: "monotone",
              pointBackgroundColor: resolvedDualLineColors[1],
              pointBorderColor: resolvedDualLineColors[1],
              pointBorderWidth: ui.dotStroke,
              pointRadius: ui.dotR,
              tension: 0.35,
            },
          ]
          : [
            {
              data: valuesFrom(normalizedData as any[], "value"),
              borderColor: colors[0],
              backgroundColor: colors[0],
              borderWidth: ui.lineStroke,
              clip: false,
              cubicInterpolationMode: "monotone",
              pointBackgroundColor: colors[0],
              pointBorderColor: colors[0],
              pointBorderWidth: ui.dotStroke,
              pointRadius: ui.dotR,
              tension: 0.35,
            },
          ],
      },
      options: reportCartesianOptions({ axisColor, fontFamily, ui }),
    } as ChartConfiguration;
  }

  if (chartType === "area") {
    return {
      type: "line",
      data: {
        labels: labelsFrom(normalizedData as any[]),
        datasets: [
          {
            data: valuesFrom(normalizedData as any[], "value"),
            borderColor: colors[0],
            backgroundColor: withAlpha(colors[0], 0.22),
            borderWidth: compact ? 1.5 : 2,
            clip: false,
            cubicInterpolationMode: "monotone",
            fill: true,
            pointRadius: 0,
            tension: 0.35,
          },
        ],
      },
      options: reportCartesianOptions({ axisColor, fontFamily, ui }),
    } as ChartConfiguration;
  }

  if (chartType === "area-stacked") {
    const transformedData = transformMultiSeriesData(normalizedData as any[], effectiveSeries);
    return {
      type: "line",
      data: {
        labels: labelsFrom(transformedData),
        datasets: effectiveSeries.map((name, index) => ({
          data: valuesFrom(transformedData, name),
          borderColor: colors[index % colors.length],
          backgroundColor: withAlpha(colors[index % colors.length], 0.4),
          borderWidth: compact ? 1.5 : 2,
          clip: false,
          cubicInterpolationMode: "monotone",
          fill: true,
          pointRadius: 0,
          stack: "area",
          tension: 0.35,
        })),
      },
      options: reportCartesianOptions({ axisColor, fontFamily, stacked: true, ui }),
    } as ChartConfiguration;
  }

  if (chartType === "bar-diverging") {
    const transformedData = transformDivergingData(normalizedData as any[]);
    return {
      type: "bar",
      data: {
        labels: labelsFrom(transformedData),
        datasets: [
          reportBarDataset(valuesFrom(transformedData, "positive"), colors[0], ui, {
            stack: "stack",
          }),
          reportBarDataset(valuesFrom(transformedData, "negative"), colors[3], ui, {
            stack: "stack",
          }),
        ],
      },
      options: reportCartesianOptions({ axisColor, fontFamily, horizontal: true, stacked: true, ui }),
      plugins: [reportZeroLinePlugin(zeroLineColor), reportValueLabelPlugin("horizontal", axisColor, fontFamily, ui)],
    } as ChartConfiguration;
  }

  if (chartType === "bar-grouped-vertical" || chartType === "bar-grouped-horizontal" || chartType === "bar-clustered") {
    const transformedData = transformMultiSeriesData(normalizedData as any[], effectiveSeries);
    const horizontal = chartType === "bar-grouped-horizontal";
    const clustered = chartType === "bar-clustered";
    return {
      type: "bar",
      data: {
        labels: labelsFrom(transformedData),
        datasets: effectiveSeries.map((name, index) => reportBarDataset(
          valuesFrom(transformedData, name),
          colors[index % colors.length],
          ui,
          clustered
            ? {
              barPercentage: 0.62,
              categoryPercentage: 0.82,
              maxBarThickness: Math.max(compact ? 6 : 15, (compact ? 22 : 50) / Math.max(1, effectiveSeries.length)),
            }
            : {},
        )),
      },
      options: reportCartesianOptions({ axisColor, fontFamily, horizontal, ui }),
      plugins: [reportValueLabelPlugin(horizontal ? "horizontal" : "vertical", axisColor, fontFamily, ui)],
    } as ChartConfiguration;
  }

  if (chartType === "bar-stacked-vertical" || chartType === "bar-stacked-horizontal") {
    const transformedData = transformMultiSeriesData(normalizedData as any[], effectiveSeries);
    const horizontal = chartType === "bar-stacked-horizontal";
    return {
      type: "bar",
      data: {
        labels: labelsFrom(transformedData),
        datasets: effectiveSeries.map((name, index) => reportBarDataset(
          valuesFrom(transformedData, name),
          colors[index % colors.length],
          ui,
          { stack: "stack" },
        )),
      },
      options: reportCartesianOptions({ axisColor, fontFamily, horizontal, stacked: true, ui }),
      plugins: [reportValueLabelPlugin(horizontal ? "horizontal" : "vertical", axisColor, fontFamily, ui)],
    } as ChartConfiguration;
  }

  if (chartType === "bar-horizontal") {
    return {
      type: "bar",
      data: {
        labels: labelsFrom(normalizedData as any[]),
        datasets: [
          reportBarDataset(valuesFrom(normalizedData as any[], "value"), colors[0], ui),
        ],
      },
      options: reportCartesianOptions({ axisColor, fontFamily, horizontal: true, ui }),
      plugins: [reportValueLabelPlugin("horizontal", axisColor, fontFamily, ui)],
    } as ChartConfiguration;
  }

  if (chartType === "bar") {
    return {
      type: "bar",
      data: {
        labels: labelsFrom(normalizedData as any[]),
        datasets: [
          reportBarDataset(valuesFrom(normalizedData as any[], "value"), colors[0], ui),
        ],
      },
      options: reportCartesianOptions({ axisColor, fontFamily, ui }),
      plugins: [reportValueLabelPlugin("vertical", axisColor, fontFamily, ui)],
    } as ChartConfiguration;
  }

  return null;
}

export type ChartDensity = "default" | "compact";

export type FlexibleReportChartProps = {
  chartType: FlexibleChartData["type"];
  data: any[];
  series?: string[];
  colorFallback?: string;
  /** For `line-dual` only */
  dualLineColors?: [string, string];
  /** Smaller type, margins, and labels for multi-chart dashboards */
  density?: ChartDensity;
};

export function FlexibleReportChart({
  chartType,
  data: chartData,
  series = [],
  colorFallback = "#157CFF",
  dualLineColors = ["var(--graph-0,#9fb6ff)", "var(--graph-1,#4d4ef3)"],
  density = "default",
}: FlexibleReportChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let frame: number | null = null;
    let chart: Chart | null = null;

    const renderChart = () => {
      const config = makeReportChartConfig({
        canvas,
        chartType,
        chartData,
        colorFallback,
        density,
        dualLineColors,
        series,
      });

      chart?.destroy();
      chart = config ? new Chart(canvas, config) : null;
    };

    const scheduleRender = () => {
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }

      frame = requestAnimationFrame(() => {
        frame = null;
        renderChart();
      });
    };

    renderChart();

    const observer = new MutationObserver(scheduleRender);
    let node: HTMLElement | null = canvas.parentElement;
    while (node) {
      observer.observe(node, {
        attributeFilter: ["class", "data-theme", "style"],
        attributes: true,
      });
      node = node.parentElement;
    }

    return () => {
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
      observer.disconnect();
      chart?.destroy();
    };
  }, [chartData, chartType, colorFallback, density, dualLineColors, series]);

  if (!flexibleChartTypeSchema.safeParse(chartType).success) {
    return <div className="flex h-full items-center justify-center text-gray-500">Unsupported chart type</div>;
  }

  return <canvas ref={canvasRef} className="block h-full w-full" />;
}
