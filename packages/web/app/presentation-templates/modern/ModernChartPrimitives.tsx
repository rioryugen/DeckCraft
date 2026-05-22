// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

"use client";

import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import type { ChartConfiguration, ChartOptions, Plugin } from "chart.js";

type SimpleChartType = "bar" | "horizontalBar" | "line" | "pie";
type SimpleChartDatum = {
  label: string;
  value: number;
};
type MultiLineDatum = Record<string, string | number>;

const DEFAULT_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#ec4899",
  "#6366f1",
];

const resolveCssValue = (element: HTMLElement, value: string, fallback: string) => {
  const match = value.match(/^var\((--[^,\s)]+)\s*,?\s*([^)]+)?\)$/);
  if (!match) return value;

  const resolved = getComputedStyle(element).getPropertyValue(match[1]).trim();
  return resolved || match[2]?.trim() || fallback;
};

const chartTextColor = (element: HTMLElement, fallback = "#7f8491") =>
  resolveCssValue(element, `var(--background-text, ${fallback})`, fallback);

const chartLabelColor = (element: HTMLElement) =>
  resolveCssValue(element, "var(--background-text, #111827)", "#111827");

const chartFont = (element: HTMLElement) =>
  resolveCssValue(element, "var(--heading-font-family,Montserrat)", "Montserrat").replace(/^['"]|['"]$/g, "");

const graphColor = (element: HTMLElement, index: number, fallback = DEFAULT_COLORS[index % DEFAULT_COLORS.length]) => {
  const slot = index % 10;
  return resolveCssValue(element, `var(--graph-${slot}, ${fallback})`, fallback);
};

const valueLabelPlugin = (
  showLabels: boolean,
  chartType: SimpleChartType,
  labelColor: string,
  fontFamily: string
): Plugin => ({
  id: `modernValueLabels-${chartType}-${showLabels ? "on" : "off"}`,
  afterDatasetsDraw(chart) {
    if (!showLabels) return;

    const ctx = chart.ctx;
    const area = chart.chartArea;
    ctx.save();
    ctx.fillStyle = labelColor;
    ctx.font = `600 12px ${fontFamily}`;
    ctx.textBaseline = "middle";

    chart.data.datasets.forEach((dataset: any, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);

      meta.data.forEach((element: any, index) => {
        const raw = Array.isArray(dataset.data) ? dataset.data[index] : 0;
        const value = Number(raw);
        if (!Number.isFinite(value)) return;

        if (chartType === "horizontalBar") {
          const point = element.tooltipPosition();
          ctx.textAlign = "left";
          ctx.fillText(String(value), Math.min(point.x + 8, area.right - 4), point.y);
          return;
        }

        if (chartType === "pie") {
          const label = chart.data.labels?.[index] ?? "";
          const arc = element.getProps(["x", "y", "startAngle", "endAngle", "innerRadius", "outerRadius"], true);
          const angle = (arc.startAngle + arc.endAngle) / 2;
          const radius = arc.innerRadius + (arc.outerRadius - arc.innerRadius) * 0.62;
          ctx.textAlign = "center";
          ctx.fillText(String(label), arc.x + Math.cos(angle) * radius, arc.y + Math.sin(angle) * radius);
          return;
        }

        const point = element.tooltipPosition();
        ctx.textAlign = "center";
        const labelY = chartType === "line" && point.y - 14 < area.top + 8
          ? point.y + 16
          : Math.max(area.top + 8, point.y - 14);
        ctx.fillText(String(value), point.x, Math.min(area.bottom - 8, labelY));
      });
    });

    ctx.restore();
  },
});

const useThemeVersion = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
  const [themeVersion, setThemeVersion] = React.useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let frame: number | null = null;
    const scheduleThemeRefresh = () => {
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }

      frame = requestAnimationFrame(() => {
        frame = null;
        setThemeVersion((version) => version + 1);
      });
    };

    const observer = new MutationObserver(scheduleThemeRefresh);
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
    };
  }, [canvasRef]);

  return themeVersion;
};

const axisOptions = (textColor: string, fontFamily: string, gridColor: string) => ({
  grid: {
    color: gridColor,
  },
  ticks: {
    color: textColor,
    font: {
      family: fontFamily,
      size: 12,
      weight: 600,
    },
  },
});

export const ModernSimpleChart: React.FC<{
  type: SimpleChartType;
  data: SimpleChartDatum[];
  showLabels: boolean;
  className?: string;
}> = ({ type, data, showLabels, className }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const themeVersion = useThemeVersion(canvasRef);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const textColor = chartTextColor(canvas);
    const labelColor = chartLabelColor(canvas);
    const fontFamily = chartFont(canvas);
    const labels = data.map((item) => item.label);
    const values = data.map((item) => item.value);
    const colors = data.map((_, index) => graphColor(canvas, index));
    const isHorizontal = type === "horizontalBar";
    const gridColor = resolveCssValue(canvas, "var(--background-text, #E5E7EB)", "#E5E7EB");

    const commonOptions: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      color: textColor,
      font: {
        family: fontFamily,
      },
      layout: {
        padding: {
          top: type === "bar" ? 20 : 10,
          right: 20,
          bottom: 10,
          left: isHorizontal ? 20 : 0,
        },
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: textColor,
            font: {
              family: fontFamily,
              weight: 600,
            },
          },
        },
        tooltip: {
          enabled: true,
        },
      },
    };

    const config: ChartConfiguration =
      type === "pie"
        ? {
            type: "pie",
            data: {
              labels,
              datasets: [
                {
                  label: "value",
                  data: values,
                  backgroundColor: colors,
                  borderWidth: 0,
                  hoverBorderWidth: 0,
                },
              ],
            },
            options: {
              ...commonOptions,
              radius: 100,
            } as ChartOptions,
            plugins: [valueLabelPlugin(showLabels, type, textColor, fontFamily)],
          }
        : {
            type: type === "line" ? "line" : "bar",
            data: {
              labels,
              datasets: [
                {
                  label: "value",
                  data: values,
                  backgroundColor: type === "line" ? (colors[0] || DEFAULT_COLORS[0]) : colors,
                  borderColor: colors[0] || DEFAULT_COLORS[0],
                  borderRadius: type === "bar" ? 8 : type === "horizontalBar" ? 6 : undefined,
                  borderWidth: type === "line" ? 3 : 0,
                  fill: false,
                  pointBackgroundColor: colors[0] || DEFAULT_COLORS[0],
                  pointBorderColor: colors[0] || DEFAULT_COLORS[0],
                  pointRadius: type === "line" ? 4 : 0,
                  tension: type === "line" ? 0.35 : 0,
                },
              ],
            },
            options: {
              ...commonOptions,
              indexAxis: isHorizontal ? "y" : "x",
              scales: {
                x: isHorizontal
                  ? {
                      ...axisOptions(textColor, fontFamily, gridColor),
                      type: "linear",
                      beginAtZero: true,
                    }
                  : {
                      ...axisOptions(textColor, fontFamily, gridColor),
                      type: "category",
                    },
                y: isHorizontal
                  ? {
                      ...axisOptions(textColor, fontFamily, gridColor),
                      type: "category",
                    }
                  : {
                      ...axisOptions(textColor, fontFamily, gridColor),
                      type: "linear",
                      beginAtZero: true,
                    },
              },
            } as ChartOptions,
            plugins: [valueLabelPlugin(showLabels, type, labelColor, fontFamily)],
          };

    const chart = new Chart(canvas, config);

    return () => {
      chart.destroy();
    };
  }, [data, showLabels, themeVersion, type]);

  return <canvas ref={canvasRef} className={className || "h-full w-full"} />;
};

export const ModernMultiLineChart: React.FC<{
  data: MultiLineDatum[];
  seriesKeys: string[];
  colors?: string[];
}> = ({ data, seriesKeys, colors = DEFAULT_COLORS }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const themeVersion = useThemeVersion(canvasRef);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const textColor = chartTextColor(canvas, "#234CD9");
    const fontFamily = chartFont(canvas);
    const gridColor = resolveCssValue(canvas, "var(--background-text, #E5E7EB)", "#E5E7EB");
    const labels = data.map((item) => String(item.year ?? ""));

    const config: ChartConfiguration = {
      type: "line",
      data: {
        labels,
        datasets: seriesKeys.map((key, index) => {
          const color = graphColor(canvas, index, colors[index % colors.length]);
          return {
            label: key
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase()),
            data: data.map((item) => (typeof item[key] === "number" ? item[key] : 0)),
            borderColor: color,
            backgroundColor: color,
            borderWidth: 3,
            fill: false,
            pointBackgroundColor: color,
            pointBorderColor: color,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.35,
          };
        }),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        color: textColor,
        font: {
          family: fontFamily,
        },
        layout: {
          padding: {
            top: 10,
            right: 20,
            bottom: 10,
            left: 0,
          },
        },
        plugins: {
          legend: {
            display: true,
            labels: {
              color: textColor,
              font: {
                family: fontFamily,
                size: 12,
                weight: 600,
              },
              usePointStyle: true,
            },
          },
          tooltip: {
            enabled: true,
          },
        },
        scales: {
          x: {
            ...axisOptions(textColor, fontFamily, gridColor),
            type: "category",
          },
          y: {
            ...axisOptions(textColor, fontFamily, gridColor),
            type: "linear",
            beginAtZero: true,
          },
        },
      } as ChartOptions,
    };

    const chart = new Chart(canvas, config);

    return () => {
      chart.destroy();
    };
  }, [colors, data, seriesKeys, themeVersion]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
};
