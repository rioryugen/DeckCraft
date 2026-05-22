// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

"use client"

import React, { useEffect, useRef } from "react"
import * as z from "zod"
import Chart from "chart.js/auto"
import type { ChartConfiguration, ChartOptions, Plugin } from "chart.js"

const layoutId = "tableorChart"
const layoutName = "Table Or Chart"
const layoutDescription = "Swift: Generic data table with option to render a chart (bar, horizontalBar, line, pie)"

const ChartDatumSchema = z.object({
  label: z.string().min(1).max(12).default("A"),
  value: z.number().min(0).max(1000000).default(60),
})

const TableRowSchema = z.object({
  cells: z
    .array(z.string().min(0).max(200))
    .min(2)
    .max(10)
    .default(["Row 1", "Value", "Value"])
    .meta({ description: "Row cells; count should match columns length" }),
})

const Schema = z
  .object({
    title: z.string().min(6).max(60).default("Data Table or Chart"),
    description: z
      .string()
      .min(20)
      .max(220)
      .default(
        "Present structured information in a flexible table or visualize it with a chart."
      ),

    mode: z.enum(["table", "chart"]).default("table"),

    // Table configuration (generic)
    columns: z
      .array(z.string().min(1).max(40))
      .min(2)
      .max(10)
      .default(["Column 1", "Column 2", "Column 3"]),
    rows: z
      .array(TableRowSchema)
      .min(1)
      .max(30)
      .default([
        { cells: ["Row A", "✓", "-"] },
        { cells: ["Row B", "Text", "123"] },
        { cells: ["Row C", "More text", "456"] },
      ]),

    // Chart configuration (parity with @standard ChartLeftTextRightLayout)
    chart: z
      .object({
        type: z.enum(["bar", "horizontalBar", "line", "pie"]).default("line"),
        data: z.array(ChartDatumSchema).min(3).max(12).default([
          { label: "A", value: 60 },
          { label: "B", value: 42 },
          { label: "C", value: 75 },
          { label: "D", value: 30 },
        ]),

        showLabels: z.boolean().default(true),
      })
      .default({
        type: "line",
        data: [
          { label: "A", value: 60 },
          { label: "B", value: 42 },
          { label: "C", value: 75 },
          { label: "D", value: 30 },
        ],

        showLabels: true,
      }),

    website: z.string().min(6).max(60).default("www.yourwebsite.com"),
  })
  .default({
    title: "Data Table or Chart",
    description:
      "Present structured information in a flexible table or visualize it with a chart.",
    mode: "table",
    columns: ["Column 1", "Column 2", "Column 3"],
    rows: [
      { cells: ["Row A", "✓", "-"] },
      { cells: ["Row B", "Text", "123"] },
      { cells: ["Row C", "More text", "456"] },
    ],
    chart: {
      type: "line",
      data: [
        { label: "A", value: 60 },
        { label: "B", value: 42 },
        { label: "C", value: 75 },
        { label: "D", value: 30 },
      ],

      showLabels: true,
    },
    website: "www.yourwebsite.com",
  })

const CHART_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
];

type SlideData = z.infer<typeof Schema>
type ChartDatum = z.infer<typeof ChartDatumSchema>
type SwiftChartType = z.infer<typeof Schema>["chart"]["type"]

interface SlideLayoutProps {
  data?: Partial<SlideData>
}

const resolveCssValue = (element: HTMLElement, value: string, fallback: string) => {
  const match = value.match(/^var\((--[^,\s)]+)\s*,?\s*([^)]+)?\)$/)
  if (!match) return value

  const resolved = getComputedStyle(element).getPropertyValue(match[1]).trim()
  return resolved || match[2]?.trim() || fallback
}

const chartTextColor = (element: HTMLElement) =>
  resolveCssValue(element, "var(--background-text, #6B7280)", "#6B7280")

const chartLabelColor = (element: HTMLElement) =>
  resolveCssValue(element, "var(--background-text, #111827)", "#111827")

const chartFont = (element: HTMLElement) =>
  resolveCssValue(element, "var(--heading-font-family,Albert Sans)", "Albert Sans").replace(/^['"]|['"]$/g, "")

const chartColor = (element: HTMLElement, index: number) => {
  const slot = index % 10
  const fallback = CHART_COLORS[slot % CHART_COLORS.length]
  return resolveCssValue(element, `var(--graph-${slot}, ${fallback})`, fallback)
}

const valueLabelPlugin = (
  showLabels: boolean,
  chartType: SwiftChartType,
  labelColor: string,
  fontFamily: string
): Plugin => ({
  id: `swiftValueLabels-${chartType}-${showLabels ? "on" : "off"}`,
  afterDatasetsDraw(chart) {
    if (!showLabels) return

    const ctx = chart.ctx
    const area = chart.chartArea
    ctx.save()
    ctx.fillStyle = labelColor
    ctx.font = `600 12px ${fontFamily}`
    ctx.textBaseline = "middle"

    chart.data.datasets.forEach((dataset: any, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex)

      meta.data.forEach((element: any, index) => {
        const raw = Array.isArray(dataset.data) ? dataset.data[index] : 0
        const value = Number(raw)
        if (!Number.isFinite(value)) return

        if (chartType === "horizontalBar") {
          const point = element.tooltipPosition()
          ctx.textAlign = "left"
          ctx.fillText(String(value), Math.min(point.x + 8, area.right - 4), point.y)
          return
        }

        if (chartType === "pie") {
          const label = chart.data.labels?.[index] ?? ""
          const arc = element.getProps(["x", "y", "startAngle", "endAngle", "innerRadius", "outerRadius"], true)
          const angle = (arc.startAngle + arc.endAngle) / 2
          const radius = arc.innerRadius + (arc.outerRadius - arc.innerRadius) * 0.62
          ctx.textAlign = "center"
          ctx.fillText(String(label), arc.x + Math.cos(angle) * radius, arc.y + Math.sin(angle) * radius)
          return
        }

        const point = element.tooltipPosition()
        ctx.textAlign = "center"
        const labelY = chartType === "line" && point.y - 14 < area.top + 8
          ? point.y + 16
          : Math.max(area.top + 8, point.y - 14)
        ctx.fillText(String(value), point.x, Math.min(area.bottom - 8, labelY))
      })
    })

    ctx.restore()
  },
})

const SwiftChart: React.FC<{
  type: SwiftChartType
  data: ChartDatum[]
  showLabels: boolean
}> = ({ type, data, showLabels }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [themeVersion, setThemeVersion] = React.useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let frame: number | null = null
    const scheduleThemeRefresh = () => {
      if (frame !== null) {
        cancelAnimationFrame(frame)
      }

      frame = requestAnimationFrame(() => {
        frame = null
        setThemeVersion((version) => version + 1)
      })
    }

    const observer = new MutationObserver(scheduleThemeRefresh)
    let node: HTMLElement | null = canvas.parentElement
    while (node) {
      observer.observe(node, {
        attributeFilter: ["class", "data-theme", "style"],
        attributes: true,
      })
      node = node.parentElement
    }

    return () => {
      if (frame !== null) {
        cancelAnimationFrame(frame)
      }
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const textColor = chartTextColor(canvas)
    const labelColor = chartLabelColor(canvas)
    const fontFamily = chartFont(canvas)
    const labels = data.map((item) => item.label)
    const values = data.map((item) => item.value)
    const colors = data.map((_, index) => chartColor(canvas, index))
    const primaryColor = chartColor(canvas, 0)
    const isHorizontal = type === "horizontalBar"

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
          top: 10,
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
    }

    const axisOptions = {
      grid: {
        color: "#E5E7EB",
        borderDash: [3, 3],
      },
      ticks: {
        color: textColor,
        font: {
          family: fontFamily,
          weight: 600,
        },
      },
    }

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
              layout: {
                padding: 10,
              },
              radius: 120,
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
                  backgroundColor:
                    type === "line"
                      ? primaryColor
                      : colors,
                  borderColor: primaryColor,
                  borderRadius: type === "bar" ? 6 : type === "horizontalBar" ? 6 : undefined,
                  borderWidth: type === "line" ? 3 : 0,
                  fill: false,
                  pointRadius: type === "line" ? 3 : 0,
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
                      ...axisOptions,
                      type: "linear",
                      beginAtZero: true,
                    }
                  : {
                      ...axisOptions,
                      type: "category",
                    },
                y: isHorizontal
                  ? {
                      ...axisOptions,
                      type: "category",
                    }
                  : {
                      ...axisOptions,
                      type: "linear",
                      beginAtZero: true,
                    },
              },
            } as ChartOptions,
            plugins: [valueLabelPlugin(showLabels, type, labelColor, fontFamily)],
          }

    const chart = new Chart(canvas, config)

    return () => {
      chart.destroy()
    }
  }, [data, showLabels, themeVersion, type])

  return <canvas ref={canvasRef} className="h-full w-full" />
}

const TableOrChart: React.FC<SlideLayoutProps> = ({ data: slideData }) => {
  const mode = slideData?.mode || "table"
  const columns = slideData?.columns || []
  const rows = slideData?.rows || []

  const cData = slideData?.chart?.data || []
  const type = slideData?.chart?.type || "bar"

  const showLabels = slideData?.chart?.showLabels !== false

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div
        className=" w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
        style={{
          fontFamily: "var(--heading-font-family,Albert Sans)",
          backgroundColor: "var(--background-color, #FFFFFF)",
        }}
      >
        {/* Header */}
        <div className="px-12 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rotate-45" style={{ backgroundColor: "var(--background-text, #111827)" }}></div>
            <div className="flex items-center gap-1">

              {(slideData as any)?._logo_url__ && <img src={(slideData as any)?._logo_url__} alt="logo" className="w-6 h-6" />}
              {(slideData as any)?.__companyName__ && <span className="text-[16px]" style={{ color: "var(--background-text, #6B7280)" }}>{(slideData as any)?.__companyName__}</span>}
            </div>
          </div>
        </div>

        {/* Title and description */}
        <div className="px-12 pt-3">
          <h1 className="text-[48px] leading-[1.1] font-semibold" style={{ color: "var(--background-text, #111827)" }}>{slideData?.title}</h1>
          <p className="mt-3 text-[16px] max-w-[900px]" style={{ color: "var(--background-text, #6B7280)" }}>{slideData?.description}</p>
        </div>

        {/* Content area: Table or Chart */}
        <div className="px-12 pt-6">
          {mode === "table" ? (
            <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--primary-color, #BFF4FF)' }}>
              <div className="overflow-x-auto rounded-lg bg-white ring-1" style={{ borderColor: 'var(--stroke, #E5E7EB)' }}>
                <table className="w-full border-separate border-spacing-0">
                  <thead className="w-full">
                    <tr>
                      {columns.map((col, idx) => (
                        <th
                          key={idx}
                          className="text-left  w-full text-[14px] font-semibold px-4 py-3 border-b first:rounded-tl-md last:rounded-tr-md"
                          style={{
                            color: 'var(--primary-text, #111827)',
                            borderColor: 'var(--stroke, #E5E7EB)',
                            backgroundColor: 'var(--primary-color, #BFF4FF)'
                          }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rIdx) => (
                      <tr key={rIdx} className="align-top">
                        {columns.map((_, cIdx) => (
                          <td
                            key={cIdx}
                            className={`text-[14px] px-4 py-3 border-t ${rIdx === rows.length - 1 ? 'first:rounded-bl-md last:rounded-br-md' : ''}`}
                            style={{
                              color: 'var(--primary-text, #6B7280)',
                              borderColor: 'rgba(0,0,0,0.08)',
                              backgroundColor: rIdx % 2 === 0 ? 'var(--primary-color, #BFF4FF)' : 'var(--card-color, #F3F4F6)'
                            }}
                          >
                            {row.cells[cIdx] || ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="w-full h-[360px] rounded-xl p-4" >
              <SwiftChart type={type} data={cData} showLabels={showLabels} />
            </div>
          )}
        </div>

        {/* Footer (standardized like IntroSlideLayout) */}
        <div className="absolute bottom-8 left-12 right-12 flex items-center">
          <span className="text-[14px]" style={{ color: "var(--background-text, #6B7280)" }}>{slideData?.website}</span>
          <div className="ml-6 h-[2px] flex-1" style={{ backgroundColor: "var(--background-text, #111827)" }}></div>
        </div>
        <div className="absolute bottom-7 right-6 w-8 h-8 rotate-45" style={{ backgroundColor: "var(--background-text, #111827)" }}></div>
      </div>
    </>
  )
}

export { Schema, layoutId, layoutName, layoutDescription }
export default TableOrChart
