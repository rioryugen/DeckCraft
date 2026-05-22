// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

"use client";

import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import type { ChartConfiguration, ChartOptions, Plugin } from "chart.js";

type GeneralChartType = "bar" | "line" | "area" | "pie" | "scatter";
type GeneralChartDatum = {
    name?: string;
    value?: number;
    x?: number;
    y?: number;
};

const CHART_COLORS = [
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

const chartColor = (element: HTMLElement, index: number) => {
    const slot = index % 10;
    const fallback = CHART_COLORS[slot % CHART_COLORS.length];
    return resolveCssValue(element, `var(--graph-${slot}, ${fallback})`, fallback);
};

const chartTextColor = (element: HTMLElement, fallback = "#7f8491") =>
    resolveCssValue(element, `var(--background-text, ${fallback})`, fallback);

const chartFont = (element: HTMLElement) =>
    resolveCssValue(element, "var(--heading-font-family,Poppins)", "Poppins").replace(/^['"]|['"]$/g, "");

const withAlpha = (color: string, alpha: number) => {
    const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!hex) {
        const rgb = color.trim().match(/^rgba?\(([^)]+)\)$/i);
        if (rgb) {
            const channels = rgb[1].split(",").slice(0, 3).map((part) => part.trim());
            return `rgba(${channels.join(", ")}, ${alpha})`;
        }

        return color;
    }

    const raw = hex[1].length === 3
        ? hex[1].split("").map((char) => char + char).join("")
        : hex[1];
    const int = Number.parseInt(raw, 16);
    return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`;
};

const pieLabelPlugin = (showLabels: boolean, textColor: string, fontFamily: string): Plugin => ({
    id: `generalPieLabels-${showLabels ? "on" : "off"}`,
    afterDatasetsDraw(chart) {
        if (!showLabels) return;

        const dataset: any = chart.data.datasets[0];
        const values = dataset?.data ?? [];
        const total = values.reduce((sum: number, value: unknown) => sum + Math.abs(Number(value) || 0), 0);
        if (!total) return;

        const meta = chart.getDatasetMeta(0);
        const ctx = chart.ctx;
        ctx.save();
        ctx.fillStyle = textColor;
        ctx.font = `600 12px ${fontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        meta.data.forEach((element: any, index) => {
            const value = Math.abs(Number(values[index]) || 0);
            const percent = value / total;
            if (percent < 0.05) return;

            const arc = element.getProps(["x", "y", "startAngle", "endAngle", "innerRadius", "outerRadius"], true);
            const angle = (arc.startAngle + arc.endAngle) / 2;
            const radius = arc.innerRadius + (arc.outerRadius - arc.innerRadius) * 0.72;
            const label = chart.data.labels?.[index] ?? "";
            ctx.fillText(`${label} ${Math.round(percent * 100)}%`, arc.x + Math.cos(angle) * radius, arc.y + Math.sin(angle) * radius);
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

export const GeneralChart: React.FC<{
    type?: GeneralChartType;
    data: GeneralChartDatum[];
    showLegend: boolean;
    showTooltip: boolean;
}> = ({ type = "bar", data, showLegend, showTooltip }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const themeVersion = useThemeVersion(canvasRef);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const textColor = chartTextColor(canvas);
        const gridColor = chartTextColor(canvas, "#9333ea");
        const fontFamily = chartFont(canvas);
        const colors = data.map((_, index) => chartColor(canvas, index));
        const labels = data.map((item, index) => item.name ?? `P${index + 1}`);
        const values = data.map((item) => Number(item.value) || 0);
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
                    top: type === "pie" ? 0 : 20,
                    right: type === "pie" ? 0 : 30,
                    bottom: 0,
                    left: 0,
                },
            },
            plugins: {
                legend: {
                    display: showLegend,
                    labels: {
                        color: textColor,
                        font: {
                            family: fontFamily,
                            size: 10,
                            weight: 600,
                        },
                    },
                },
                tooltip: {
                    enabled: showTooltip,
                },
            },
        };

        const scaleOptions = {
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
                        radius: 70,
                    } as ChartOptions,
                    plugins: [pieLabelPlugin(true, chartTextColor(canvas, "#4b5563"), fontFamily)],
                }
                : type === "scatter"
                    ? {
                        type: "scatter",
                        data: {
                            datasets: [
                                {
                                    label: "value",
                                    data: data.map((item) => ({
                                        x: Number(item.x) || 0,
                                        y: Number(item.y) || 0,
                                    })),
                                    backgroundColor: colors,
                                    borderColor: colors,
                                    clip: false,
                                    pointRadius: 4,
                                    pointHoverRadius: 5,
                                },
                            ],
                        },
                        options: {
                            ...commonOptions,
                            scales: {
                                x: {
                                    ...scaleOptions,
                                    type: "linear",
                                },
                                y: {
                                    ...scaleOptions,
                                    type: "linear",
                                    grace: "8%",
                                },
                            },
                        } as ChartOptions,
                    }
                    : {
                        type: type === "line" || type === "area" ? "line" : "bar",
                        data: {
                            labels,
                            datasets: [
                                {
                                    label: "value",
                                    data: values,
                                    backgroundColor: type === "area"
                                        ? withAlpha(colors[0] || CHART_COLORS[0], 0.6)
                                        : type === "line"
                                            ? colors[0] || CHART_COLORS[0]
                                            : colors,
                                    borderColor: colors[0] || CHART_COLORS[0],
                                    borderRadius: type === "bar" ? 8 : undefined,
                                    borderWidth: type === "line" || type === "area" ? 3 : 0,
                                    clip: type === "bar" ? undefined : false,
                                    fill: type === "area",
                                    pointBackgroundColor: colors[0] || CHART_COLORS[0],
                                    pointBorderColor: colors[0] || CHART_COLORS[0],
                                    pointRadius: type === "line" ? 4 : 0,
                                    tension: type === "line" || type === "area" ? 0.35 : 0,
                                    maxBarThickness: 70,
                                },
                            ],
                        },
                        options: {
                            ...commonOptions,
                            scales: {
                                x: {
                                    ...scaleOptions,
                                    type: "category",
                                },
                                y: {
                                    ...scaleOptions,
                                    type: "linear",
                                    beginAtZero: true,
                                    grace: "8%",
                                },
                            },
                        } as ChartOptions,
                    };

        const chart = new Chart(canvas, config);

        return () => {
            chart.destroy();
        };
    }, [data, showLegend, showTooltip, themeVersion, type]);

    return <canvas ref={canvasRef} className="h-full w-full" />;
};
