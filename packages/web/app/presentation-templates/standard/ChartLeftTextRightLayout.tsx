// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

"use client"

import React, { useEffect, useRef } from 'react'
import * as z from 'zod'
import Chart from "chart.js/auto"
import type { ChartConfiguration, ChartOptions, Plugin } from "chart.js"

const layoutId = 'chart-left-text-right-layout'
const layoutName = 'Chart Left Text Right'
const layoutDescription = 'A slide with header label, a left-side inline bar chart, and right-side title with paragraph.'

const ChartDatumSchema = z.object({
  label: z.string().min(1).max(12).default('A').meta({ description: 'Category label' }),
  value: z.number().min(0).max(100).default(60).meta({ description: 'Value 0–100' }),
})

const Schema = z.object({

  title: z
    .string()
    .min(16)
    .max(64)
    .default('Insights At A Glance')
    .meta({ description: 'Main heading (max ~7 words)' }),
  paragraph: z
    .string()
    .min(50)
    .max(200)
    .default(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    )
    .meta({ description: 'Supporting description' }),
  chart: z
    .object({
      type: z.enum(['bar', 'horizontalBar', 'line', 'pie']).default('line'),
      data: z.array(ChartDatumSchema).min(3).max(8).default([
        { label: 'A', value: 60 },
        { label: 'B', value: 42 },
        { label: 'C', value: 75 },
        { label: 'D', value: 30 },
      ]),

      showLabels: z.boolean().default(true),
    })
    .default({
      type: 'line',
      data: [
        { label: 'A', value: 60 },
        { label: 'B', value: 42 },
        { label: 'C', value: 75 },
        { label: 'D', value: 30 },
      ],

      showLabels: true,
    }),
})


const CHART_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
];
type SlideData = z.infer<typeof Schema>
type ChartDatum = z.infer<typeof ChartDatumSchema>
type StandardChartType = z.infer<typeof Schema>["chart"]["type"]

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
  resolveCssValue(element, "var(--background-text, #7f8491)", "#7f8491")

const chartLabelColor = (element: HTMLElement) =>
  resolveCssValue(element, "var(--background-text, #111827)", "#111827")

const chartFont = (element: HTMLElement) =>
  resolveCssValue(element, "var(--heading-font-family,Playfair Display)", "Playfair Display").replace(/^['"]|['"]$/g, "")

const chartColor = (element: HTMLElement, index: number) => {
  const slot = index % 10
  const fallback = CHART_COLORS[slot % CHART_COLORS.length]
  return resolveCssValue(element, `var(--graph-${slot}, ${fallback})`, fallback)
}

const valueLabelPlugin = (
  showLabels: boolean,
  chartType: StandardChartType,
  labelColor: string,
  fontFamily: string
): Plugin => ({
  id: `standardValueLabels-${chartType}-${showLabels ? "on" : "off"}`,
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

const StandardChart: React.FC<{
  type: StandardChartType
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
          top: type === "bar" || type === "line" ? 15 : 10,
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

    const gridColor = resolveCssValue(canvas, "var(--background-text, #E5E7EB)", "#E5E7EB")
    const axisOptions = {
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
                  backgroundColor: type === "line" ? (colors[0] || CHART_COLORS[0]) : colors,
                  borderColor: colors[0] || CHART_COLORS[0],
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

const dynamicSlideLayout: React.FC<SlideLayoutProps> = ({ data: slideData }) => {
  const data = slideData?.chart?.data || []
  const type = slideData?.chart?.type || 'bar'

  const showLabels = slideData?.chart?.showLabels !== false

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div
        className=" w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video relative z-20 mx-auto overflow-hidden"
        style={{ fontFamily: "var(--heading-font-family,Playfair Display)", backgroundColor: 'var(--background-color, #FFFFFF)' }}
      >
        <div className="w-full flex items-center justify-between px-10 pt-6">
          {((slideData as any)?.__companyName__ || (slideData as any)?._logo_url__) && <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">

              {(slideData as any)?._logo_url__ && <img src={(slideData as any)?._logo_url__} alt="logo" className="w-6 h-6" />}
              {(slideData as any)?.__companyName__ && <span className="text-[18px]  font-semibold" style={{ color: 'var(--background-text, #111827)' }}>{(slideData as any)?.__companyName__ || "Pitchdeck"}</span>}
            </div>
            <svg className="w-[220px] h-[2px]" viewBox="0 0 220 2" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="220" height="2" style={{ fill: 'var(--background-text, #111827)' }}></rect>
            </svg>
          </div>}
        </div>

        <div className="grid grid-cols-2 h-[calc(100%-64px)]">
          {/* Left: Chart visualization */}
          <div className="h-full px-10 pt-8">
            <div className="w-full h-full flex items-center">
              <div className="w-full" style={{ height: 320 }}>
                <StandardChart type={type} data={data} showLabels={showLabels} />
              </div>
            </div>
          </div>

          {/* Right: Text */}
          <div className="h-full px-12 flex flex-col justify-center">
            <h1 className="text-[64px] leading-[1.05] tracking-tight font-semibold" style={{ color: 'var(--background-text, #111827)' }}>
              {slideData?.title || 'Insights At A Glance'}
            </h1>
            <p className="mt-6 text-[16px] leading-[28px]" style={{ color: 'var(--background-text, #6B7280)' }}>
              {slideData?.paragraph ||
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export { Schema, layoutId, layoutName, layoutDescription }
export default dynamicSlideLayout
