// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import type {
  ChartConfiguration,
  ChartDataset,
  ChartOptions,
  TooltipItem,
} from "chart.js";

export type EducationChartType =
  | "bar"
  | "bar-horizontal"
  | "bar-grouped-vertical"
  | "bar-grouped-horizontal"
  | "bar-stacked-vertical"
  | "bar-stacked-horizontal"
  | "bar-clustered"
  | "bar-diverging"
  | "line"
  | "area"
  | "area-stacked"
  | "pie"
  | "donut"
  | "scatter";

export type SimpleDatum = {
  name: string;
  value: number;
};

export type MultiSeriesDatum = {
  name: string;
  values: Record<string, number>;
};

export type DivergingDatum = {
  name: string;
  positive: number;
  negative: number;
};

export type ScatterDatum = {
  x: number;
  y: number;
  name?: string;
};

export type EducationChartDatum =
  | SimpleDatum
  | MultiSeriesDatum
  | DivergingDatum
  | ScatterDatum;

const DEFAULT_COLORS = [
  "var(--graph-0,#4A15A8)",
  "var(--graph-1,#5B45AD)",
  "var(--graph-2,#7E6CC0)",
  "var(--graph-3,#9F94CD)",
  "var(--graph-4,#6A31B8)",
  "var(--graph-5,#4D2A97)",
  "var(--graph-6,#8357C7)",
  "var(--graph-7,#A178D8)",
  "var(--graph-8,#C0A5E8)",
  "var(--graph-9,#DDCFF5)",
];

const AXIS = "var(--background-text,#7C7A83)";
const GRID = "var(--stroke,#CFCBD8)";
const PRIMARY_TEXT = "var(--background-text,#3E3C45)";
const BODY_FONT = "var(--body-font-family,'Times New Roman')";

function formatComma(value: number | string) {
  if (typeof value === "number") {
    return value.toLocaleString("en-US");
  }

  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return parsed.toLocaleString("en-US");
  }

  return value;
}

function isSimpleDatum(item: EducationChartDatum): item is SimpleDatum {
  return (
    typeof (item as SimpleDatum).name === "string" &&
    typeof (item as SimpleDatum).value === "number"
  );
}

function isMultiSeriesDatum(
  item: EducationChartDatum
): item is MultiSeriesDatum {
  return (
    typeof (item as MultiSeriesDatum).name === "string" &&
    typeof (item as MultiSeriesDatum).values === "object"
  );
}

function isDivergingDatum(item: EducationChartDatum): item is DivergingDatum {
  return (
    typeof (item as DivergingDatum).name === "string" &&
    typeof (item as DivergingDatum).positive === "number" &&
    typeof (item as DivergingDatum).negative === "number"
  );
}

function isScatterDatum(item: EducationChartDatum): item is ScatterDatum {
  return (
    typeof (item as ScatterDatum).x === "number" &&
    typeof (item as ScatterDatum).y === "number"
  );
}

function toSimpleData(data: EducationChartDatum[]) {
  return data.filter(isSimpleDatum).map((item) => ({
    name: item.name,
    value: item.value,
  }));
}

function toMultiSeriesData(data: EducationChartDatum[], series: string[]) {
  return data.filter(isMultiSeriesDatum).map((item) => ({
    name: item.name,
    values: series.map((serie) => item.values?.[serie] ?? 0),
  }));
}

function toDivergingData(data: EducationChartDatum[]) {
  return data.filter(isDivergingDatum).map((item) => ({
    name: item.name,
    positive: item.positive,
    negative: -Math.abs(item.negative),
  }));
}

function toScatterData(data: EducationChartDatum[]) {
  const scatterData = data.filter(isScatterDatum);

  if (scatterData.length > 0) {
    return scatterData.map((item, index) => ({
      x: item.x,
      y: item.y,
      name: item.name ?? String(index + 1),
    }));
  }

  return data.filter(isSimpleDatum).map((item, index) => ({
    x: index + 1,
    y: item.value,
    name: item.name,
  }));
}

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

function resolveColor(element: HTMLElement, value: string) {
  return resolveToken(element, value, "#7C7A83");
}

function resolveFont(element: HTMLElement) {
  return resolveToken(element, BODY_FONT, "Times New Roman").replace(
    /^['"]|['"]$/g,
    ""
  );
}

function withAlpha(color: string, alpha: number) {
  const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const raw =
      hex[1].length === 3
        ? hex[1]
            .split("")
            .map((char) => char + char)
            .join("")
        : hex[1];
    const int = Number.parseInt(raw, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const rgb = color.trim().match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const [r, g, b] = rgb[1].split(",").map((part) => part.trim());
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return color;
}

function getChartColor(colors: string[], index: number) {
  return colors[index % colors.length];
}

function makeDatasets(
  data: { name: string; values: number[] }[],
  series: string[],
  colors: string[],
  overrides: Partial<ChartDataset<"bar" | "line">> = {}
) {
  return series.map((serie, index) => ({
    label: serie,
    data: data.map((item) => item.values[index] ?? 0),
    backgroundColor: getChartColor(colors, index),
    borderColor: getChartColor(colors, index),
    borderRadius: 10,
    borderWidth: 2,
    pointRadius: 0,
    tension: 0.35,
    ...overrides,
  }));
}

function makeValueLabelPlugin(
  mode: "bar" | "bar-horizontal" | "pie" | "none",
  textColor: string,
  fontFamily: string
) {
  return {
    id: `educationValueLabels-${mode}`,
    afterDatasetsDraw(chart: any) {
      if (mode === "none") return;

      const ctx = chart.ctx as CanvasRenderingContext2D;
      ctx.save();

      if (mode === "bar" || mode === "bar-horizontal") {
        const dataset = chart.data.datasets[0];
        const meta = chart.getDatasetMeta(0);
        if (!dataset || meta.hidden) {
          ctx.restore();
          return;
        }

        ctx.fillStyle = textColor;
        ctx.font = `600 12px ${fontFamily}`;
        ctx.textBaseline = "middle";

        meta.data.forEach((element: any, index: number) => {
          const value = dataset.data[index];
          const position = element.tooltipPosition();
          const text = formatComma(
            typeof value === "number" ? value : Number(value)
          );

          if (mode === "bar-horizontal") {
            ctx.textAlign = "left";
            ctx.fillText(text, position.x + 8, position.y);
          } else {
            ctx.textAlign = "center";
            ctx.fillText(text, position.x, position.y - 16);
          }
        });
      }

      if (mode === "pie") {
        const dataset = chart.data.datasets[0];
        const meta = chart.getDatasetMeta(0);
        const values = dataset?.data ?? [];
        const total = values.reduce(
          (sum: number, value: number) => sum + Math.abs(Number(value) || 0),
          0
        );
        if (!total) {
          ctx.restore();
          return;
        }

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `700 14px ${fontFamily}`;
        ctx.fillStyle = textColor;
        ctx.shadowColor = "rgba(0,0,0,0.18)";
        ctx.shadowBlur = 1;
        ctx.shadowOffsetY = 1;

        meta.data.forEach((element: any, index: number) => {
          const value = Number(values[index]) || 0;
          const percent = Math.abs(value) / total;
          if (percent < 0.08) return;

          const label = String(chart.data.labels?.[index] ?? "");
          const text =
            label.length <= 10
              ? `${label} ${(percent * 100).toFixed(0)}%`
              : `${(percent * 100).toFixed(0)}%`;
          const arc = element.getProps(
            ["x", "y", "startAngle", "endAngle", "innerRadius", "outerRadius"],
            true
          );
          const angle = (arc.startAngle + arc.endAngle) / 2;
          const radius =
            arc.innerRadius + (arc.outerRadius - arc.innerRadius) * 0.55;
          const x = arc.x + Math.cos(angle) * radius;
          const y = arc.y + Math.sin(angle) * radius;

          ctx.fillText(text, x, y);
        });
      }

      ctx.restore();
    },
  };
}

function makeBaseOptions({
  axisColor,
  fontFamily,
  gridColor,
  showLegend,
  showTooltip,
}: {
  axisColor: string;
  fontFamily: string;
  gridColor: string;
  showLegend: boolean;
  showTooltip: boolean;
}): ChartOptions {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    resizeDelay: 0,
    color: axisColor,
    layout: {
      padding: 6,
    },
    font: {
      family: fontFamily,
    },
    plugins: {
      legend: {
        display: showLegend,
        labels: {
          boxHeight: 8,
          boxWidth: 8,
          color: axisColor,
          font: {
            family: fontFamily,
            size: 12,
          },
          usePointStyle: true,
        },
      },
      tooltip: {
        enabled: showTooltip,
        callbacks: {
          label(context: TooltipItem<any>) {
            const datasetLabel = context.dataset.label
              ? `${context.dataset.label}: `
              : "";
            const parsed = context.parsed as any;
            const value =
              typeof parsed === "number"
                ? parsed
                : parsed?.y ?? parsed?.x ?? context.raw;
            return `${datasetLabel}${formatComma(Number(value))}`;
          },
        },
      },
    },
    scales: {
      x: categoryScale(axisColor, gridColor, fontFamily, true, false),
      y: linearScale(axisColor, gridColor, fontFamily, true, true),
    },
  };
}

function withoutScales(options: ChartOptions) {
  const next = { ...options } as ChartOptions & { scales?: unknown };
  delete next.scales;
  return next;
}

function categoryScale(
  axisColor: string,
  gridColor: string,
  fontFamily: string,
  display: boolean,
  showGrid: boolean
) {
  return {
    display,
    grid: {
      color: gridColor,
      display: showGrid,
      drawTicks: false,
    },
    border: {
      color: gridColor,
      display: false,
    },
    ticks: {
      color: axisColor,
      font: {
        family: fontFamily,
        size: 12,
      },
      maxRotation: 0,
      padding: 10,
    },
  };
}

function linearScale(
  axisColor: string,
  gridColor: string,
  fontFamily: string,
  display: boolean,
  showGrid: boolean
) {
  return {
    beginAtZero: true,
    display,
    grid: {
      color: gridColor,
      display: showGrid,
      drawTicks: false,
    },
    border: {
      color: gridColor,
      display: false,
    },
    ticks: {
      color: axisColor,
      font: {
        family: fontFamily,
        size: 12,
      },
      padding: 8,
      callback(value: string | number) {
        return formatComma(value);
      },
    },
  };
}

function makeChartConfig({
  canvas,
  chartData,
  chartType,
  divergingLabels,
  series,
  showLegend,
  showTooltip,
}: {
  canvas: HTMLCanvasElement;
  chartData: EducationChartDatum[];
  chartType: EducationChartType;
  divergingLabels: [string, string];
  series: string[];
  showLegend: boolean;
  showTooltip: boolean;
}): ChartConfiguration {
  const axisColor = resolveColor(canvas, AXIS);
  const gridColor = resolveColor(canvas, GRID);
  const primaryText = resolveColor(canvas, PRIMARY_TEXT);
  const primaryLabelText = resolveColor(canvas, "var(--primary-text,#ffffff)");
  const fontFamily = resolveFont(canvas);
  const colors = DEFAULT_COLORS.map((color) => resolveColor(canvas, color));
  const baseOptions = makeBaseOptions({
    axisColor,
    fontFamily,
    gridColor,
    showLegend,
    showTooltip,
  });
  const simpleData = toSimpleData(chartData);
  const labels = simpleData.map((item) => item.name);
  const values = simpleData.map((item) => item.value);

  switch (chartType) {
    case "bar":
      return {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: values.map((_, index) =>
                getChartColor(colors, index)
              ),
              borderRadius: 18,
              barThickness: 30,
            },
          ],
        },
        options: {
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            legend: { display: false },
          },
          scales: {
            x: categoryScale(axisColor, gridColor, fontFamily, true, false),
            y: linearScale(axisColor, gridColor, fontFamily, false, false),
          },
        },
        plugins: [makeValueLabelPlugin("bar", axisColor, fontFamily)],
      } as ChartConfiguration;

    case "bar-horizontal":
      return {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: values.map((_, index) =>
                getChartColor(colors, index)
              ),
              borderRadius: 10,
            },
          ],
        },
        options: {
          ...baseOptions,
          indexAxis: "y",
          plugins: {
            ...baseOptions.plugins,
            legend: { display: false },
          },
          scales: {
            x: linearScale(axisColor, gridColor, fontFamily, true, true),
            y: categoryScale(axisColor, gridColor, fontFamily, true, false),
          },
        },
      } as ChartConfiguration;

    case "bar-grouped-vertical":
    case "bar-clustered": {
      const multiData = toMultiSeriesData(chartData, series);
      return {
        type: "bar",
        data: {
          labels: multiData.map((item) => item.name),
          datasets: makeDatasets(multiData, series, colors, {
            borderWidth: 0,
            barPercentage: 0.78,
            categoryPercentage: 0.7,
          }),
        },
        options: {
          ...baseOptions,
          scales: {
            x: categoryScale(axisColor, gridColor, fontFamily, true, false),
            y: linearScale(axisColor, gridColor, fontFamily, true, true),
          },
        },
      } as ChartConfiguration;
    }

    case "bar-grouped-horizontal": {
      const multiData = toMultiSeriesData(chartData, series);
      return {
        type: "bar",
        data: {
          labels: multiData.map((item) => item.name),
          datasets: makeDatasets(multiData, series, colors, {
            borderWidth: 0,
            barPercentage: 0.78,
            categoryPercentage: 0.7,
          }),
        },
        options: {
          ...baseOptions,
          indexAxis: "y",
          scales: {
            x: linearScale(axisColor, gridColor, fontFamily, true, true),
            y: categoryScale(axisColor, gridColor, fontFamily, true, false),
          },
        },
      } as ChartConfiguration;
    }

    case "bar-stacked-vertical": {
      const multiData = toMultiSeriesData(chartData, series);
      return {
        type: "bar",
        data: {
          labels: multiData.map((item) => item.name),
          datasets: makeDatasets(multiData, series, colors, { borderWidth: 0 }),
        },
        options: {
          ...baseOptions,
          scales: {
            x: {
              ...categoryScale(axisColor, gridColor, fontFamily, true, false),
              stacked: true,
            },
            y: {
              ...linearScale(axisColor, gridColor, fontFamily, true, true),
              stacked: true,
            },
          },
        },
      } as ChartConfiguration;
    }

    case "bar-stacked-horizontal": {
      const multiData = toMultiSeriesData(chartData, series);
      return {
        type: "bar",
        data: {
          labels: multiData.map((item) => item.name),
          datasets: makeDatasets(multiData, series, colors, { borderWidth: 0 }),
        },
        options: {
          ...baseOptions,
          indexAxis: "y",
          scales: {
            x: {
              ...linearScale(axisColor, gridColor, fontFamily, true, true),
              stacked: true,
            },
            y: {
              ...categoryScale(axisColor, gridColor, fontFamily, true, false),
              stacked: true,
            },
          },
        },
      } as ChartConfiguration;
    }

    case "bar-diverging": {
      const divergingData = toDivergingData(chartData);
      return {
        type: "bar",
        data: {
          labels: divergingData.map((item) => item.name),
          datasets: [
            {
              label: divergingLabels[0],
              data: divergingData.map((item) => item.positive),
              backgroundColor: getChartColor(colors, 0),
              borderRadius: 8,
              borderWidth: 0,
            },
            {
              label: divergingLabels[1],
              data: divergingData.map((item) => item.negative),
              backgroundColor: getChartColor(colors, 2),
              borderRadius: 8,
              borderWidth: 0,
            },
          ],
        },
        options: {
          ...baseOptions,
          indexAxis: "y",
          scales: {
            x: {
              ...linearScale(axisColor, gridColor, fontFamily, true, true),
              stacked: true,
            },
            y: {
              ...categoryScale(axisColor, gridColor, fontFamily, true, false),
              stacked: true,
            },
          },
        },
      } as ChartConfiguration;
    }

    case "line":
      return {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              data: values,
              borderColor: getChartColor(colors, 0),
              backgroundColor: getChartColor(colors, 0),
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.35,
            },
          ],
        },
        options: {
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            legend: { display: false },
          },
          scales: {
            x: categoryScale(axisColor, gridColor, fontFamily, true, true),
            y: linearScale(axisColor, gridColor, fontFamily, true, false),
          },
        },
      } as ChartConfiguration;

    case "area":
      return {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              data: values,
              borderColor: getChartColor(colors, 0),
              backgroundColor: withAlpha(getChartColor(colors, 0), 0.22),
              borderWidth: 2,
              fill: true,
              pointRadius: 0,
              tension: 0.35,
            },
          ],
        },
        options: {
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            legend: { display: false },
          },
          scales: {
            x: categoryScale(axisColor, gridColor, fontFamily, true, false),
            y: linearScale(axisColor, gridColor, fontFamily, true, true),
          },
        },
      } as ChartConfiguration;

    case "area-stacked": {
      const multiData = toMultiSeriesData(chartData, series);
      return {
        type: "line",
        data: {
          labels: multiData.map((item) => item.name),
          datasets: makeDatasets(multiData, series, colors, {
            fill: true,
            backgroundColor(context: any) {
              const index = context.datasetIndex ?? 0;
              return withAlpha(getChartColor(colors, index), 0.22);
            },
          }),
        },
        options: {
          ...baseOptions,
          scales: {
            x: categoryScale(axisColor, gridColor, fontFamily, true, false),
            y: {
              ...linearScale(axisColor, gridColor, fontFamily, true, true),
              stacked: true,
            },
          },
        },
      } as ChartConfiguration;
    }

    case "pie":
    case "donut":
      return {
        type: chartType === "donut" ? "doughnut" : "pie",
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: values.map((_, index) =>
                getChartColor(colors, index)
              ),
              borderColor: "transparent",
              borderWidth: 0,
              hoverBorderWidth: 0,
              spacing: 0,
            },
          ],
        },
        options: {
          ...withoutScales(baseOptions),
          cutout: chartType === "donut" ? "52%" : undefined,
          layout: {
            padding: 18,
          },
          plugins: {
            ...baseOptions.plugins,
            legend: { display: false },
          },
        },
        plugins: [makeValueLabelPlugin("pie", primaryLabelText, fontFamily)],
      } as ChartConfiguration;

    case "scatter": {
      const scatterData = toScatterData(chartData);
      const labelMap = new Map<number, string>();
      const xTicks = Array.from(
        new Set(scatterData.map((item) => item.x))
      ).sort((a, b) => a - b);
      const minTick = xTicks[0] ?? 0;
      const maxTick = xTicks[xTicks.length - 1] ?? 1;
      scatterData.forEach((item) => labelMap.set(item.x, item.name));

      return {
        type: "scatter",
        data: {
          datasets: [
            {
              label: "",
              data: scatterData.map((item) => ({ x: item.x, y: item.y })),
              backgroundColor: scatterData.map((_, index) =>
                getChartColor(colors, index)
              ),
              pointRadius: 5,
            },
          ],
        },
        options: {
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            legend: { display: false },
          },
          scales: {
            x: {
              ...linearScale(axisColor, gridColor, fontFamily, true, false),
              min: minTick - 0.5,
              max: maxTick + 0.5,
              ticks: {
                color: axisColor,
                font: { family: fontFamily, size: 12 },
                padding: 10,
                stepSize: 1,
                callback(value: string | number) {
                  return labelMap.get(Number(value)) ?? String(value);
                },
              },
            },
            y: linearScale(axisColor, gridColor, fontFamily, true, true),
          },
        },
      } as ChartConfiguration;
    }

    default:
      return {
        type: "bar",
        data: {
          labels: ["Unsupported"],
          datasets: [{ data: [0], backgroundColor: primaryText }],
        },
        options: {
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            legend: { display: false },
            tooltip: { enabled: false },
          },
          scales: {
            x: { display: false },
            y: { display: false },
          },
        },
      } as ChartConfiguration;
  }
}

export default function EducationChartPrimitives({
  chartType,
  chartData,
  series,
  showLegend,
  showTooltip,
  divergingLabels,
}: {
  chartType: EducationChartType;
  chartData: EducationChartDatum[];
  series: string[];
  showLegend: boolean;
  showTooltip: boolean;
  divergingLabels: [string, string];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let frame: number | null = null;
    let chart: Chart | null = null;

    const renderChart = () => {
      chart?.destroy();
      chart = new Chart(
        canvas,
        makeChartConfig({
          canvas,
          chartData: chartData ?? [],
          chartType,
          divergingLabels,
          series: series ?? [],
          showLegend,
          showTooltip,
        })
      );
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
  }, [chartType, chartData, divergingLabels, series, showLegend, showTooltip]);

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
