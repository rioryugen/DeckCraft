// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

"use client";

import React from 'react'
import * as z from "zod";
import { IconSchema } from '../defaultSchemes';
import { RemoteSvgIcon } from '@/app/hooks/useRemoteSvgIcon';
import { GeneralChart } from "./GeneralChartPrimitives";

export const layoutId = 'chart-with-bullets-slide'
export const layoutName = 'Chart with Bullet Boxes'
export const layoutDescription = 'A slide layout with title, description, chart on the left and colored bullet boxes with icons on the right. Only choose this if data is available.'

const barPieLineAreaChartDataSchema = z.object({
    type: z.union([z.literal('bar'), z.literal('pie'), z.literal('line'), z.literal('area')]),
    data: z.array(z.object({
        name: z.string().meta({ description: "Data point name" }),
        value: z.number().meta({ description: "Data point value" }),
    })).min(2).max(5)
})

const scatterChartDataSchema = z.object({
    type: z.literal('scatter'),
    data: z.array(z.object({
        x: z.number().meta({ description: "X coordinate" }),
        y: z.number().meta({ description: "Y coordinate" }),
    })).min(2).max(20)
})

const chartWithBulletsSlideSchema = z.object({
    title: z.string().min(3).max(40).default('Market Size').meta({
        description: "Main title of the slide",
    }),
    description: z.string().min(10).max(150).default('Businesses face challenges with outdated technology and rising costs, limiting efficiency and growth in competitive markets.').meta({
        description: "Description text below the title",
    }),
    chartData: z.union([barPieLineAreaChartDataSchema, scatterChartDataSchema]).default({
        type: 'bar',
        data: [
            { name: 'Q1', value: 5 },
            { name: 'Q1', value: 5 },
            { name: 'Q1', value: 5 },
        ]
    }
    ),

    showLegend: z.boolean().default(false).meta({
        description: "Whether to show chart legend",
    }),
    showTooltip: z.boolean().default(true).meta({
        description: "Whether to show chart tooltip",
    }),
    bulletPoints: z.array(z.object({
        title: z.string().min(2).max(80).meta({
            description: "Bullet point title",
        }),
        description: z.string().min(10).max(150).meta({
            description: "Bullet point description",
        }),
        icon: IconSchema,
    })).min(1).max(3).default([
        {
            title: 'Total Addressable Market',
            description: 'Companies can use TAM to plan future expansion and investment.',
            icon: {
                __icon_url__: 'https://DeckCraft-public.s3.ap-southeast-1.amazonaws.com/static/icons/bold/chart-line-up-bold.svg',
                __icon_query__: 'target market scope'
            }
        },
        {
            title: 'Serviceable Available Market',
            description: 'Indicates more measurable market segments for sales efforts.',
            icon: {
                __icon_url__: 'https://DeckCraft-public.s3.ap-southeast-1.amazonaws.com/static/icons/bold/chart-line-up-bold.svg',
                __icon_query__: 'pie chart analysis'
            }
        },
        {
            title: 'Serviceable Obtainable Market',
            description: 'Help companies plan development strategies according to the market.',
            icon: {
                __icon_url__: 'https://DeckCraft-public.s3.ap-southeast-1.amazonaws.com/static/icons/bold/chart-line-up-bold.svg',
                __icon_query__: 'trending up growth'
            }
        }
    ]).meta({
        description: "List of bullet points with colored boxes and icons",
    })
})

export const Schema = chartWithBulletsSlideSchema


export type ChartWithBulletsSlideData = z.infer<typeof chartWithBulletsSlideSchema>

interface ChartWithBulletsSlideLayoutProps {
    data?: Partial<ChartWithBulletsSlideData>
}


const ChartWithBulletsSlideLayout: React.FC<ChartWithBulletsSlideLayoutProps> = ({ data: slideData }) => {
    const chartData = slideData?.chartData?.data || [];
    const chartType = slideData?.chartData?.type;
    const showLegend = slideData?.showLegend || false;
    const showTooltip = slideData?.showTooltip !== false;
    const bulletPoints = slideData?.bulletPoints || []

    return (
        <>


            <link
                href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
                rel="stylesheet"
            />
            <div
                className="w-full rounded-sm max-w-[1280px] shadow-lg max-h-[720px] aspect-video bg-white relative z-20 mx-auto overflow-hidden"
                style={{
                    fontFamily: 'var(--heading-font-family,Poppins)',
                    background: "var(--background-color,#ffffff)"
                }}
            >
                {((slideData as any)?.__companyName__ || (slideData as any)?._logo_url__) && (
                    <div className="absolute top-0 left-0 right-0 px-8 sm:px-12 lg:px-20 pt-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">

                                {(slideData as any)?._logo_url__ && <img src={(slideData as any)?._logo_url__} alt="logo" className="w-6 h-6" />}
                                {(slideData as any)?.__companyName__ && <span className="text-sm sm:text-base font-semibold" style={{ color: 'var(--background-text, #111827)' }}>
                                    {(slideData as any)?.__companyName__ || 'Company Name'}
                                </span>}
                            </div>
                        </div>
                    </div>
                )}
                {/* Main Content */}
                <div className="flex h-full px-8 sm:px-12 lg:px-20 pt-8 pb-8">
                    {/* Left Section - Title, Description, Chart */}
                    <div className="flex-1 flex flex-col pr-8">
                        {/* Title */}
                        <h1 style={{ color: "var(--background-text, #111827)" }} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
                            {slideData?.title || 'Market Size'}
                        </h1>

                        {/* Description */}
                        <p style={{ color: "var(--background-text, #4b5563)" }} className="text-base text-gray-700 leading-relaxed mb-8">
                            {slideData?.description || 'Businesses face challenges with outdated technology and rising costs, limiting efficiency and growth in competitive markets.'}
                        </p>

                        {/* Chart Container */}
                        <div className="flex-1 min-h-0 overflow-hidden rounded-lg shadow-sm border border-gray-100 p-4"
                            style={{
                                borderColor: 'var(--stroke, #F8F9FA)',
                            }}
                        >
                            <div className="h-full max-h-[460px] min-h-0 w-full overflow-hidden">
                                <GeneralChart
                                    type={chartType}
                                    data={chartData}
                                    showLegend={showLegend}
                                    showTooltip={showTooltip}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Section - Bullet Point Boxes */}
                    <div className="flex-shrink-0 w-80 flex flex-col justify-center space-y-4">
                        {bulletPoints.map((bullet, index) => (
                            <div
                                key={index}
                                className="rounded-2xl p-6 text-white"
                                style={{
                                    backgroundColor: 'var(--primary-color,#9333ea)'
                                }}
                            >
                                {/* Icon and Title */}
                                <div className="flex items-center space-x-3 mb-3">
                                    <div style={{ background: "var(--primary-color,#9333ea)" }} className="w-8 h-8 rounded-lg flex items-center justify-center">
                                        <RemoteSvgIcon
                                            url={bullet.icon.__icon_url__}
                                            strokeColor={"currentColor"}
                                            className="w-5 h-5"
                                            color="var(--primary-text, #ffffff)"
                                            title={bullet.icon.__icon_query__}
                                        />
                                    </div>
                                    <h3 style={{ color: "var(--primary-text, #ffffff)" }} className="text-lg font-semibold">
                                        {bullet.title}
                                    </h3>
                                </div>

                                {/* Description */}
                                <p style={{ color: "var(--primary-text, #ffffff)" }} className="text-sm leading-relaxed opacity-90">
                                    {bullet.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}

export default ChartWithBulletsSlideLayout
