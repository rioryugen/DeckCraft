// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

"use client";

import React, { useEffect, useRef } from 'react';
import Chart from "chart.js/auto";
import type { ChartConfiguration, ChartOptions, Plugin } from "chart.js";

type AnyRecord = Record<string, any>;

const DEFAULT_COLORS = ["#8B5CF6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#3B82F6", "#84CC16", "#F97316", "#6366F1"];
const AXIS_COLOR = "var(--background-text,#7f8491)";
const GRID_COLOR = "var(--background-text,#7f8491)";
const FONT_FAMILY = "var(--body-font-family,var(--heading-font-family,Poppins))";
const DEFAULT_BAR_THICKNESS = 36;
const MAX_BAR_THICKNESS = 80;

const formatChartValue = (value: string | number) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric.toLocaleString("en-US") : String(value);
};

function cssVarParts(value: string) {
    const match = value.match(/^var\((--[^,\s)]+)\s*,?\s*([^)]+)?\)$/);
    if (!match) return null;

    return {
        name: match[1],
        fallback: match[2]?.trim(),
    };
}

function resolveToken(element: HTMLElement, value: unknown, fallback: string) {
    if (typeof value !== "string") return fallback;
    const parts = cssVarParts(value.trim());
    if (!parts) return value;

    const resolved = getComputedStyle(element)
        .getPropertyValue(parts.name)
        .trim();
    return resolved || parts.fallback || fallback;
}

function resolveFont(element: HTMLElement) {
    return resolveToken(element, FONT_FAMILY, "Poppins").replace(/^['"]|['"]$/g, "");
}

function resolveColor(element: HTMLElement, value: unknown, fallback = "#7f8491") {
    return resolveToken(element, value, fallback);
}

function graphColor(element: HTMLElement, index: number, fallback?: string) {
    const slot = index % 10;
    const colorFallback = fallback || DEFAULT_COLORS[slot % DEFAULT_COLORS.length];
    return resolveColor(element, `var(--graph-${slot}, ${colorFallback})`, colorFallback);
}

function toNumber(value: unknown) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
}

function boundedBarThickness(value: unknown, fallback = DEFAULT_BAR_THICKNESS) {
    const size = toNumber(value) || fallback;
    return Math.min(size, MAX_BAR_THICKNESS);
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

function colorLuminance(color: unknown) {
    if (typeof color !== "string") return 0;
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
    return colorLuminance(color) > 0.52 ? "#111827" : "#ffffff";
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function numberOrPercent(value: unknown) {
    if (typeof value === "number") return value;
    if (typeof value === "string") return value;
    return undefined;
}

function parentSize(canvas: HTMLCanvasElement) {
    const parent = canvas.parentElement;
    return {
        width: parent?.clientWidth || canvas.clientWidth || 320,
        height: parent?.clientHeight || canvas.clientHeight || 240,
    };
}

function boundedPieRadius(canvas: HTMLCanvasElement, value: unknown, hasLegend: boolean) {
    if (typeof value === "string") return value;

    const { width, height } = parentSize(canvas);
    const legendSpace = hasLegend ? 34 : 0;
    const usableHeight = Math.max(120, height - legendSpace);
    const maxRadius = Math.max(48, Math.min(width, usableHeight) * 0.36);
    const desired = toNumber(value) || maxRadius;

    return Math.min(desired, maxRadius);
}

function pieCutout(innerRadius: unknown, outerRadius: unknown) {
    if (innerRadius === undefined || innerRadius === null) return 0;
    if (typeof innerRadius === "string") return innerRadius;

    const inner = toNumber(innerRadius);
    const outer = toNumber(outerRadius);
    if (!inner || !outer) return inner || 0;

    return `${Math.min(85, Math.round((inner / outer) * 100))}%`;
}

function isSvgPaintReference(value: unknown) {
    return typeof value === "string" && value.trim().startsWith("url(");
}

function areaFillColor(canvas: HTMLCanvasElement, fill: unknown, fallback: string, alpha: number) {
    if (isSvgPaintReference(fill)) {
        return withAlpha(fallback, alpha);
    }

    const resolved = resolveColor(canvas, fill, fallback);
    return isSvgPaintReference(resolved) ? withAlpha(fallback, alpha) : withAlpha(resolved, alpha);
}

function marginPadding(margin?: AnyRecord) {
    return {
        top: Math.max(8, toNumber(margin?.top) + 4),
        right: Math.max(10, toNumber(margin?.right) + 4),
        left: Math.max(0, toNumber(margin?.left) + 4),
        bottom: Math.max(8, toNumber(margin?.bottom) + 8),
    };
}

function flattenChildren(children: React.ReactNode): React.ReactElement<any>[] {
    return React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<any>[];
}

function childrenOfType(children: React.ReactNode, type: React.ComponentType<any>) {
    return flattenChildren(children).filter((child) => child.type === type);
}

function hasChild(children: React.ReactNode, type: React.ComponentType<any>) {
    return childrenOfType(children, type).length > 0;
}

function firstChildOfType(children: React.ReactNode, type: React.ComponentType<any>) {
    return childrenOfType(children, type)[0];
}

function fallbackValue(item: AnyRecord, datasetIndex: number) {
    if (typeof item.value === "number") return item.value;
    if (typeof item[`value${datasetIndex + 1}`] === "number") return item[`value${datasetIndex + 1}`];
    if (datasetIndex === 0 && typeof item.positive === "number") return item.positive;
    if (datasetIndex === 1 && typeof item.negative === "number") return item.negative;
    return 0;
}

function valueForKey(item: AnyRecord, key: string | undefined, datasetIndex: number) {
    if (key && typeof item[key] === "number") return item[key];
    return fallbackValue(item, datasetIndex);
}

function scalarValueForKey(item: AnyRecord, key: string | undefined) {
    if (key && typeof item[key] === "number") return item[key];
    if (typeof item.value === "number") return item.value;
    if (typeof item.value1 === "number") return item.value1;
    if (typeof item.positive === "number") return item.positive;
    return 0;
}

function categoryLabels(data: AnyRecord[], dataKey?: string) {
    return data.map((item, index) =>
        String(item?.[dataKey || ""] ?? item?.name ?? item?.label ?? item?.category ?? `P${index + 1}`)
    );
}

function scaleColor(canvas: HTMLCanvasElement, props?: AnyRecord, fallback = AXIS_COLOR) {
    return resolveColor(canvas, props?.tick?.fill || props?.axisLine?.stroke || fallback, "#7f8491");
}

function scaleFontSize(props?: AnyRecord, fallback = 10) {
    return toNumber(props?.tick?.fontSize) || fallback;
}

function baseOptions(
    canvas: HTMLCanvasElement,
    children: React.ReactNode,
    margin: AnyRecord | undefined,
): ChartOptions {
    const axisColor = resolveColor(canvas, AXIS_COLOR, "#7f8491");
    const fontFamily = resolveFont(canvas);

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
            padding: marginPadding(margin),
        },
        interaction: {
            intersect: false,
            mode: "nearest",
        },
        plugins: {
            legend: {
                display: hasChild(children, Legend),
                labels: {
                    boxWidth: 9,
                    boxHeight: 9,
                    color: axisColor,
                    font: {
                        family: fontFamily,
                        size: 9,
                        weight: 700,
                    },
                    padding: 8,
                    usePointStyle: true,
                },
            },
            tooltip: {
                enabled: hasChild(children, Tooltip),
            },
        },
    } as ChartOptions;
}

function categoryScale(canvas: HTMLCanvasElement, props?: AnyRecord, stacked = false) {
    const axisColor = scaleColor(canvas, props);
    const fontFamily = resolveFont(canvas);
    return {
        type: "category",
        display: props !== null,
        offset: true,
        stacked,
        grid: {
            color: withAlpha(resolveColor(canvas, GRID_COLOR, "#7f8491"), 0.18),
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
                size: scaleFontSize(props, 10),
                weight: 700,
            },
            maxRotation: 0,
            padding: 6,
            callback(this: any, value: string | number) {
                const label = typeof this.getLabelForValue === "function"
                    ? this.getLabelForValue(Number(value))
                    : String(value);
                return typeof props?.tickFormatter === "function" ? props.tickFormatter(label) : label;
            },
        },
    };
}

function linearScale(canvas: HTMLCanvasElement, props?: AnyRecord, stacked = false, beginAtZero = true) {
    const axisColor = scaleColor(canvas, props);
    const fontFamily = resolveFont(canvas);
    return {
        type: "linear",
        display: props !== null,
        beginAtZero,
        grace: "8%",
        stacked,
        grid: {
            color: withAlpha(resolveColor(canvas, GRID_COLOR, "#7f8491"), 0.22),
            drawTicks: false,
        },
        border: {
            display: false,
        },
        ticks: {
            color: axisColor,
            font: {
                family: fontFamily,
                size: scaleFontSize(props, 10),
                weight: 700,
            },
            padding: 6,
            callback(value: string | number) {
                return typeof props?.tickFormatter === "function" ? props.tickFormatter(value) : formatChartValue(value);
            },
        },
    };
}

function barRadius(radius: unknown) {
    if (Array.isArray(radius)) return Math.max(...radius.map(toNumber));
    return toNumber(radius) || 4;
}

function barLabelPlugin(canvas: HTMLCanvasElement, bars: React.ReactElement<any>[], horizontal: boolean): Plugin {
    const fontFamily = resolveFont(canvas);
    const axisColor = resolveColor(canvas, AXIS_COLOR, "#7f8491");

    return {
        id: `neoBarLabels-${horizontal ? "h" : "v"}-${bars.length}`,
        afterDatasetsDraw(chart) {
            const area = chart.chartArea;
            const ctx = chart.ctx;
            ctx.save();
            ctx.font = `700 10px ${fontFamily}`;
            ctx.textBaseline = "middle";

            chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
                const bar = bars[datasetIndex];
                const labelList = firstChildOfType(bar?.props?.children, LabelList);
                const labelProp = bar?.props?.label;
                const stackedLabel = Boolean(bar?.props?.stackId);
                if (!labelList && !labelProp && !stackedLabel) return;

                const meta = chart.getDatasetMeta(datasetIndex);
                const position = labelList?.props?.position || labelProp?.position;
                const inside = stackedLabel || position === "middle" || position === "inside" || position === "center";

                meta.data.forEach((element: any, index: number) => {
                    const raw = Array.isArray(dataset.data) ? dataset.data[index] : 0;
                    const value = toNumber(raw);
                    if (!value) return;

                    const fillColor = Array.isArray(dataset.backgroundColor)
                        ? dataset.backgroundColor[index]
                        : dataset.backgroundColor;
                    const bar = element.getProps(["x", "y", "base"], true);
                    ctx.fillStyle = inside ? readableTextColor(fillColor) : resolveColor(canvas, labelList?.props?.fill, axisColor);

                    if (horizontal) {
                        const segmentWidth = Math.abs(bar.x - bar.base);
                        if (inside && segmentWidth < 18) return;
                        ctx.textAlign = inside ? "center" : value < 0 ? "right" : "left";
                        const x = inside
                            ? (bar.x + bar.base) / 2
                            : bar.x + (value < 0 ? -6 : 6);
                        ctx.fillText(
                            formatChartValue(value),
                            clamp(x, area.left + 4, area.right - 4),
                            clamp(bar.y, area.top + 6, area.bottom - 6),
                        );
                        return;
                    }

                    const segmentHeight = Math.abs(bar.base - bar.y);
                    if (inside && segmentHeight < 18) return;
                    ctx.textAlign = "center";
                    const y = inside ? (bar.y + bar.base) / 2 : bar.y - 8;
                    ctx.fillText(
                        formatChartValue(value),
                        clamp(bar.x, area.left + 4, area.right - 4),
                        clamp(y, area.top + 6, area.bottom - 6),
                    );
                });
            });

            ctx.restore();
        },
    };
}

function pieLabelPlugin(canvas: HTMLCanvasElement): Plugin {
    const fontFamily = resolveFont(canvas);

    return {
        id: "neoPieLabels",
        afterDatasetsDraw(chart) {
            const dataset: any = chart.data.datasets[0];
            const values = dataset?.data ?? [];
            const total = values.reduce((sum: number, value: unknown) => sum + Math.abs(toNumber(value)), 0);
            if (!total) return;

            const meta = chart.getDatasetMeta(0);
            const ctx = chart.ctx;
            ctx.save();
            ctx.font = `700 10px ${fontFamily}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            meta.data.forEach((element: any, index: number) => {
                const value = Math.abs(toNumber(values[index]));
                const percent = value / total;
                if (percent < 0.06) return;

                const arc = element.getProps(["x", "y", "startAngle", "endAngle", "innerRadius", "outerRadius"], true);
                const angle = (arc.startAngle + arc.endAngle) / 2;
                const radius = arc.innerRadius + (arc.outerRadius - arc.innerRadius) * 0.58;
                const x = arc.x + Math.cos(angle) * radius;
                const y = arc.y + Math.sin(angle) * radius;
                const fill = Array.isArray(dataset.backgroundColor)
                    ? dataset.backgroundColor[index]
                    : dataset.backgroundColor;

                ctx.fillStyle = readableTextColor(fill);
                ctx.fillText(`${Math.round(percent * 100)}%`, x, y);
            });

            ctx.restore();
        },
    };
}

function zeroLinePlugin(canvas: HTMLCanvasElement, referenceLine?: React.ReactElement<any>): Plugin {
    const color = resolveColor(canvas, referenceLine?.props?.stroke || "var(--stroke,#9CA3AF)", "#9CA3AF");

    return {
        id: "neoZeroLine",
        afterDraw(chart) {
            const xScale = chart.scales.x;
            if (!xScale) return;

            const x = xScale.getPixelForValue(0);
            const area = chart.chartArea;
            if (x < area.left || x > area.right) return;

            const ctx = chart.ctx;
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = toNumber(referenceLine?.props?.strokeWidth) || 1;
            ctx.beginPath();
            ctx.moveTo(x, area.top);
            ctx.lineTo(x, area.bottom);
            ctx.stroke();
            ctx.restore();
        },
    };
}

function makeBarConfig(canvas: HTMLCanvasElement, props: AnyRecord, children: React.ReactNode): ChartConfiguration {
    const data = (props.data || []) as AnyRecord[];
    const bars = childrenOfType(children, Bar);
    const xAxis = firstChildOfType(children, XAxis);
    const yAxis = firstChildOfType(children, YAxis);
    const referenceLine = firstChildOfType(children, ReferenceLine);
    const horizontal = props.layout === "vertical";
    const categoryAxis = horizontal ? yAxis : xAxis;
    const labels = categoryLabels(data, categoryAxis?.props?.dataKey);
    const stacked = bars.some((bar) => bar.props.stackId);
    const stackThickness = new Map<string, number>();
    bars.forEach((bar) => {
        const stackKey = bar.props.stackId ? String(bar.props.stackId) : "";
        const size = boundedBarThickness(bar.props.barSize, 0);
        if (!stackKey || !size) return;
        stackThickness.set(stackKey, Math.max(stackThickness.get(stackKey) ?? 0, size));
    });

    return {
        type: "bar",
        data: {
            labels,
            datasets: bars.map((bar, datasetIndex) => {
                const cells = childrenOfType(bar.props.children, Cell);
                const fallback = DEFAULT_COLORS[datasetIndex % DEFAULT_COLORS.length];
                const cellColors = cells.length > 0
                    ? data.map((_, index) => resolveColor(canvas, cells[index]?.props?.fill, graphColor(canvas, index, fallback)))
                    : undefined;
                const color = resolveColor(canvas, bar.props.fill, graphColor(canvas, datasetIndex, fallback));
                const stackKey = bar.props.stackId ? String(bar.props.stackId) : "";

                return {
                    label: bar.props.name || bar.props.dataKey || `Series ${datasetIndex + 1}`,
                    data: data.map((item) => valueForKey(item, bar.props.dataKey, datasetIndex)),
                    backgroundColor: cellColors || color,
                    borderColor: cellColors || color,
                    borderWidth: 0,
                    borderRadius: barRadius(bar.props.radius),
                    borderSkipped: false,
                    barPercentage: 0.76,
                    categoryPercentage: props.barCategoryGap ? 0.68 : 0.78,
                    maxBarThickness: stackThickness.get(stackKey) || boundedBarThickness(bar.props.barSize),
                    stack: bar.props.stackId,
                };
            }),
        },
        options: {
            ...baseOptions(canvas, children, props.margin),
            indexAxis: horizontal ? "y" : "x",
            scales: horizontal
                ? {
                    x: linearScale(canvas, xAxis?.props, stacked),
                    y: categoryScale(canvas, yAxis?.props, stacked),
                }
                : {
                    x: categoryScale(canvas, xAxis?.props, stacked),
                    y: linearScale(canvas, yAxis?.props, stacked),
                },
        } as ChartOptions,
        plugins: [
            barLabelPlugin(canvas, bars, horizontal),
            ...(referenceLine ? [zeroLinePlugin(canvas, referenceLine)] : []),
        ],
    } as ChartConfiguration;
}

function makeLineConfig(canvas: HTMLCanvasElement, props: AnyRecord, children: React.ReactNode): ChartConfiguration {
    const data = (props.data || []) as AnyRecord[];
    const lines = childrenOfType(children, Line);
    const xAxis = firstChildOfType(children, XAxis);
    const yAxis = firstChildOfType(children, YAxis);
    const labels = categoryLabels(data, xAxis?.props?.dataKey);

    return {
        type: "line",
        data: {
            labels,
            datasets: lines.map((line, datasetIndex) => {
                const fallback = DEFAULT_COLORS[datasetIndex % DEFAULT_COLORS.length];
                const color = resolveColor(canvas, line.props.stroke, graphColor(canvas, datasetIndex, fallback));
                return {
                    label: line.props.name || line.props.dataKey || `Series ${datasetIndex + 1}`,
                    data: data.map((item) => valueForKey(item, line.props.dataKey, datasetIndex)),
                    borderColor: color,
                    backgroundColor: color,
                    borderWidth: toNumber(line.props.strokeWidth) || 3,
                    clip: false,
                    cubicInterpolationMode: line.props.type === "monotone" ? "monotone" : undefined,
                    pointBackgroundColor: color,
                    pointBorderColor: color,
                    pointBorderWidth: toNumber(line.props.dot?.strokeWidth) || 0,
                    pointRadius: typeof line.props.dot === "boolean" && !line.props.dot ? 0 : toNumber(line.props.dot?.r) || 4,
                    tension: line.props.type === "monotone" ? 0.35 : 0,
                };
            }),
        },
        options: {
            ...baseOptions(canvas, children, props.margin),
            scales: {
                x: categoryScale(canvas, xAxis?.props),
                y: linearScale(canvas, yAxis?.props),
            },
        } as ChartOptions,
    } as ChartConfiguration;
}

function makeAreaConfig(canvas: HTMLCanvasElement, props: AnyRecord, children: React.ReactNode): ChartConfiguration {
    const data = (props.data || []) as AnyRecord[];
    const areas = childrenOfType(children, Area);
    const xAxis = firstChildOfType(children, XAxis);
    const yAxis = firstChildOfType(children, YAxis);
    const labels = categoryLabels(data, xAxis?.props?.dataKey);
    const stacked = areas.some((area) => area.props.stackId);

    return {
        type: "line",
        data: {
            labels,
            datasets: areas.map((area, datasetIndex) => {
                const fallback = DEFAULT_COLORS[datasetIndex % DEFAULT_COLORS.length];
                const themeColor = graphColor(canvas, datasetIndex, fallback);
                const colorSource = isSvgPaintReference(area.props.stroke)
                    ? undefined
                    : area.props.stroke || (isSvgPaintReference(area.props.fill) ? undefined : area.props.fill);
                const color = resolveColor(canvas, colorSource, themeColor);
                const fillAlpha = toNumber(area.props.fillOpacity) || (isSvgPaintReference(area.props.fill) ? 0.28 : 0.35);
                return {
                    label: area.props.name || area.props.dataKey || `Series ${datasetIndex + 1}`,
                    data: data.map((item) => valueForKey(item, area.props.dataKey, datasetIndex)),
                    borderColor: color,
                    backgroundColor: areaFillColor(canvas, area.props.fill, color, fillAlpha),
                    borderWidth: toNumber(area.props.strokeWidth) || 2,
                    clip: false,
                    cubicInterpolationMode: area.props.type === "monotone" ? "monotone" : undefined,
                    fill: true,
                    pointRadius: 0,
                    stack: area.props.stackId,
                    tension: area.props.type === "monotone" ? 0.35 : 0,
                };
            }),
        },
        options: {
            ...baseOptions(canvas, children, props.margin),
            scales: {
                x: categoryScale(canvas, xAxis?.props, stacked),
                y: linearScale(canvas, yAxis?.props, stacked),
            },
        } as ChartOptions,
    } as ChartConfiguration;
}

function makePieConfig(canvas: HTMLCanvasElement, props: AnyRecord, children: React.ReactNode): ChartConfiguration {
    const pie = firstChildOfType(children, Pie);
    const data = (pie?.props?.data || []) as AnyRecord[];
    const cells = childrenOfType(pie?.props?.children, Cell);
    const dataKey = pie?.props?.dataKey || "value";
    const nameKey = pie?.props?.nameKey || "name";
    const outerRadius = boundedPieRadius(canvas, pie?.props?.outerRadius, hasChild(children, Legend));
    const innerRadius = numberOrPercent(pie?.props?.innerRadius);
    const colors = data.map((_, index) =>
        resolveColor(canvas, cells[index]?.props?.fill, graphColor(canvas, index))
    );

    return {
        type: pie?.props?.innerRadius ? "doughnut" : "pie",
        data: {
            labels: categoryLabels(data, nameKey),
            datasets: [
                {
                    data: data.map((item) => scalarValueForKey(item, dataKey)),
                    backgroundColor: colors,
                    borderColor: "transparent",
                    borderWidth: 0,
                    hoverBorderWidth: 0,
                    spacing: 0,
                },
            ],
        },
        options: {
            ...baseOptions(canvas, children, props.margin),
            cutout: pieCutout(innerRadius, pie?.props?.outerRadius),
            radius: outerRadius ?? "72%",
            layout: {
                padding: 12,
            },
        } as ChartOptions,
        plugins: [pieLabelPlugin(canvas)],
    } as ChartConfiguration;
}

function makeScatterConfig(canvas: HTMLCanvasElement, props: AnyRecord, children: React.ReactNode): ChartConfiguration {
    const scatter = firstChildOfType(children, Scatter);
    const data = ((scatter?.props?.data || props.data || []) as AnyRecord[]).map((item, index) => ({
        x: typeof item.x === "number" ? item.x : index + 1,
        y: typeof item.y === "number" ? item.y : toNumber(item.value),
    }));
    const cells = childrenOfType(scatter?.props?.children, Cell);
    const colors = data.map((_, index) => resolveColor(canvas, cells[index]?.props?.fill, graphColor(canvas, index)));
    const xAxis = firstChildOfType(children, XAxis);
    const yAxis = firstChildOfType(children, YAxis);

    return {
        type: "scatter",
        data: {
            datasets: [
                {
                    data,
                    backgroundColor: colors,
                    borderColor: colors,
                    borderWidth: 0,
                    clip: false,
                    pointRadius: 4,
                    pointHoverRadius: 4,
                },
            ],
        },
        options: {
            ...baseOptions(canvas, children, props.margin),
            scales: {
                x: linearScale(canvas, xAxis?.props, false, false),
                y: linearScale(canvas, yAxis?.props, false, false),
            },
        } as ChartOptions,
    } as ChartConfiguration;
}

function ChartCanvas({
    children,
    configFactory,
    props,
}: {
    children: React.ReactNode;
    configFactory: (canvas: HTMLCanvasElement, props: AnyRecord, children: React.ReactNode) => ChartConfiguration;
    props: AnyRecord;
}) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let chart: Chart | null = null;
        let frame: number | null = null;
        let secondFrame: number | null = null;

        const renderChart = () => {
            chart?.destroy();
            chart = new Chart(canvas, configFactory(canvas, props, children));
        };

        const scheduleRender = () => {
            if (frame !== null) {
                cancelAnimationFrame(frame);
            }
            if (secondFrame !== null) {
                cancelAnimationFrame(secondFrame);
            }

            frame = requestAnimationFrame(() => {
                frame = null;
                secondFrame = requestAnimationFrame(() => {
                    secondFrame = null;
                    renderChart();
                });
            });
        };

        scheduleRender();

        const observer = new MutationObserver(scheduleRender);
        let node: HTMLElement | null = canvas.parentElement;
        while (node) {
            observer.observe(node, {
                attributeFilter: ["class", "data-theme", "style"],
                attributes: true,
            });
            node = node.parentElement;
        }
        const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(scheduleRender) : null;
        if (canvas.parentElement) {
            resizeObserver?.observe(canvas.parentElement);
        }

        return () => {
            if (frame !== null) {
                cancelAnimationFrame(frame);
            }
            if (secondFrame !== null) {
                cancelAnimationFrame(secondFrame);
            }
            observer.disconnect();
            resizeObserver?.disconnect();
            chart?.destroy();
        };
    }, [children, configFactory, props]);

    return (
        <div className="absolute inset-0 min-h-0 overflow-hidden">
            <canvas ref={canvasRef} className="block h-full max-h-full w-full max-w-full" style={{ height: "100%", width: "100%" }} />
        </div>
    );
}

export const ResponsiveContainer: React.FC<any> = ({ children, className, height = "100%", maxHeight, width = "100%" }) => (
    <div
        className={className}
        style={{
            height,
            maxHeight: maxHeight ?? "100%",
            minHeight: 0,
            overflow: "hidden",
            position: "relative",
            width,
            maxWidth: "100%",
        }}
    >
        {children}
    </div>
);

export const BarChart: React.FC<any> = ({ children, ...props }) => (
    <ChartCanvas configFactory={makeBarConfig} props={props}>
        {children}
    </ChartCanvas>
);

export const LineChart: React.FC<any> = ({ children, ...props }) => (
    <ChartCanvas configFactory={makeLineConfig} props={props}>
        {children}
    </ChartCanvas>
);

export const AreaChart: React.FC<any> = ({ children, ...props }) => (
    <ChartCanvas configFactory={makeAreaConfig} props={props}>
        {children}
    </ChartCanvas>
);

export const PieChart: React.FC<any> = ({ children, ...props }) => (
    <ChartCanvas configFactory={makePieConfig} props={props}>
        {children}
    </ChartCanvas>
);

export const ScatterChart: React.FC<any> = ({ children, ...props }) => (
    <ChartCanvas configFactory={makeScatterConfig} props={props}>
        {children}
    </ChartCanvas>
);

export const Bar: React.FC<any> = () => null;
export const Line: React.FC<any> = () => null;
export const Area: React.FC<any> = () => null;
export const Pie: React.FC<any> = () => null;
export const Scatter: React.FC<any> = () => null;
export const Cell: React.FC<any> = () => null;
export const XAxis: React.FC<any> = () => null;
export const YAxis: React.FC<any> = () => null;
export const CartesianGrid: React.FC<any> = () => null;
export const Tooltip: React.FC<any> = () => null;
export const Legend: React.FC<any> = () => null;
export const LabelList: React.FC<any> = () => null;
export const ReferenceLine: React.FC<any> = () => null;
export const Text: React.FC<any> = () => null;
