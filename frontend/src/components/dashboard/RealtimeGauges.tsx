"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { RealtimeData } from "@/types";

// Dynamic import to avoid SSR issues with react-gauge-component
const GaugeComponent = dynamic(() => import("react-gauge-component"), {
    ssr: false,
    loading: () => (
        <div className="h-32 flex items-center justify-center">
            <div className="animate-pulse bg-muted rounded-full w-24 h-12" />
        </div>
    ),
});

interface RealtimeGaugesProps {
    data: RealtimeData;
}

export function RealtimeGauges({ data }: RealtimeGaugesProps) {
    // Responsive gauge dimensions
    const [gaugeHeight, setGaugeHeight] = useState(160);

    useEffect(() => {
        const updateGaugeSize = () => {
            const width = window.innerWidth;
            if (width < 640) {
                setGaugeHeight(100);
            } else if (width < 768) {
                setGaugeHeight(120);
            } else if (width < 1024) {
                setGaugeHeight(140);
            } else {
                setGaugeHeight(160);
            }
        };

        updateGaugeSize();
        window.addEventListener("resize", updateGaugeSize);
        return () => window.removeEventListener("resize", updateGaugeSize);
    }, []);

    // Gauge common styles
    const gaugeStyle = {
        width: "100%",
        height: gaugeHeight,
    };

    // Values
    const voltageValue = data.voltage || 0;
    const currentValue = data.current || 0;
    const powerValue = data.active_power || 0;
    const pfValue = data.power_factor || 0;
    const frequencyValue = data.frequency || 50;
    const apparentPowerValue = data.apparent_power || 0;
    const reactivePowerValue = Math.abs(data.reactive_power || 0);

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {/* Voltage Gauge */}
            <div className="text-center">
                <GaugeComponent
                    type="semicircle"
                    arc={{
                        width: 0.2,
                        padding: 0.005,
                        cornerRadius: 1,
                        subArcs: [
                            { limit: 207, color: "#ef4444", showTick: true },
                            { limit: 220, color: "#f59e0b", showTick: true },
                            { limit: 245, color: "#10b981", showTick: true },
                            { limit: 253, color: "#f59e0b", showTick: true },
                            { limit: 260, color: "#ef4444", showTick: true },
                        ],
                    }}
                    pointer={{
                        color: "#1f2937",
                        length: 0.8,
                        width: 15,
                    }}
                    labels={{
                        valueLabel: { hide: true },
                        tickLabels: {
                            type: "outer",
                            ticks: [
                                { value: 207 },
                                { value: 230 },
                                { value: 253 },
                            ],
                            defaultTickValueConfig: {
                                style: { fontSize: 10 },
                            },
                        },
                    }}
                    value={voltageValue}
                    minValue={180}
                    maxValue={260}
                    style={gaugeStyle}
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Voltage
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                    {voltageValue.toFixed(1)} V
                </p>
            </div>

            {/* Current Gauge */}
            <div className="text-center">
                <GaugeComponent
                    type="semicircle"
                    arc={{
                        width: 0.2,
                        padding: 0.005,
                        cornerRadius: 1,
                        subArcs: [
                            { limit: 37.8, color: "#10b981", showTick: true },
                            { limit: 50.4, color: "#f59e0b", showTick: true },
                            { limit: 63, color: "#ef4444", showTick: true },
                        ],
                    }}
                    pointer={{
                        color: "#1f2937",
                        length: 0.8,
                        width: 15,
                    }}
                    labels={{
                        valueLabel: { hide: true },
                        tickLabels: {
                            type: "outer",
                            ticks: [
                                { value: 0 },
                                { value: 31.5 },
                                { value: 63 },
                            ],
                            defaultTickValueConfig: {
                                style: { fontSize: 10 },
                            },
                        },
                    }}
                    value={currentValue}
                    minValue={0}
                    maxValue={63}
                    style={gaugeStyle}
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Current
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                    {currentValue.toFixed(2)} A
                </p>
            </div>

            {/* Power Gauge */}
            <div className="text-center">
                <GaugeComponent
                    type="semicircle"
                    arc={{
                        width: 0.2,
                        padding: 0.005,
                        cornerRadius: 1,
                        subArcs: [
                            { limit: 7800, color: "#10b981", showTick: true },
                            { limit: 10400, color: "#f59e0b", showTick: true },
                            { limit: 13000, color: "#ef4444", showTick: true },
                        ],
                    }}
                    pointer={{
                        color: "#1f2937",
                        length: 0.8,
                        width: 15,
                    }}
                    labels={{
                        valueLabel: { hide: true },
                        tickLabels: {
                            type: "outer",
                            ticks: [
                                { value: 0 },
                                { value: 6500 },
                                { value: 13000 },
                            ],
                            defaultTickValueConfig: {
                                style: { fontSize: 10 },
                                formatTextValue: (value: number) =>
                                    value >= 1000
                                        ? `${(value / 1000).toFixed(0)}kW`
                                        : `${value}`,
                            },
                        },
                    }}
                    value={powerValue}
                    minValue={0}
                    maxValue={13000}
                    style={gaugeStyle}
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Active Power
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                    {powerValue >= 1000
                        ? `${(powerValue / 1000).toFixed(2)} kW`
                        : `${powerValue.toFixed(0)} W`}
                </p>
            </div>

            {/* Power Factor Gauge */}
            <div className="text-center">
                <GaugeComponent
                    type="semicircle"
                    arc={{
                        width: 0.2,
                        padding: 0.005,
                        cornerRadius: 1,
                        subArcs: [
                            { limit: 0.85, color: "#ef4444", showTick: true },
                            { limit: 0.95, color: "#f59e0b", showTick: true },
                            { limit: 1, color: "#10b981", showTick: true },
                        ],
                    }}
                    pointer={{
                        color: "#1f2937",
                        length: 0.8,
                        width: 15,
                    }}
                    labels={{
                        valueLabel: { hide: true },
                        tickLabels: {
                            type: "outer",
                            ticks: [{ value: 0 }, { value: 0.5 }, { value: 1 }],
                            defaultTickValueConfig: {
                                style: { fontSize: 10 },
                            },
                        },
                    }}
                    value={pfValue}
                    minValue={0}
                    maxValue={1}
                    style={gaugeStyle}
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Power Factor
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                    {pfValue.toFixed(3)}
                </p>
            </div>

            {/* Frequency Gauge */}
            <div className="text-center">
                <GaugeComponent
                    type="semicircle"
                    arc={{
                        width: 0.2,
                        padding: 0.005,
                        cornerRadius: 1,
                        subArcs: [
                            { limit: 49, color: "#ef4444", showTick: true },
                            { limit: 49.5, color: "#f59e0b", showTick: true },
                            { limit: 50.5, color: "#10b981", showTick: true },
                            { limit: 51, color: "#f59e0b", showTick: true },
                            { limit: 52, color: "#ef4444", showTick: true },
                        ],
                    }}
                    pointer={{
                        color: "#1f2937",
                        length: 0.8,
                        width: 15,
                    }}
                    labels={{
                        valueLabel: { hide: true },
                        tickLabels: {
                            type: "outer",
                            ticks: [
                                { value: 49 },
                                { value: 50 },
                                { value: 51 },
                            ],
                            defaultTickValueConfig: {
                                style: { fontSize: 10 },
                            },
                        },
                    }}
                    value={frequencyValue}
                    minValue={48}
                    maxValue={52}
                    style={gaugeStyle}
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Frequency
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                    {frequencyValue.toFixed(2)} Hz
                </p>
            </div>

            {/* Apparent Power Gauge */}
            <div className="text-center">
                <GaugeComponent
                    type="semicircle"
                    arc={{
                        width: 0.2,
                        padding: 0.005,
                        cornerRadius: 1,
                        subArcs: [
                            { limit: 8700, color: "#10b981", showTick: true },
                            { limit: 11600, color: "#f59e0b", showTick: true },
                            { limit: 14500, color: "#ef4444", showTick: true },
                        ],
                    }}
                    pointer={{
                        color: "#1f2937",
                        length: 0.8,
                        width: 15,
                    }}
                    labels={{
                        valueLabel: { hide: true },
                        tickLabels: {
                            type: "outer",
                            ticks: [
                                { value: 0 },
                                { value: 7250 },
                                { value: 14500 },
                            ],
                            defaultTickValueConfig: {
                                style: { fontSize: 10 },
                                formatTextValue: (value: number) =>
                                    value >= 1000
                                        ? `${(value / 1000).toFixed(0)}k`
                                        : `${value}`,
                            },
                        },
                    }}
                    value={apparentPowerValue}
                    minValue={0}
                    maxValue={14500}
                    style={gaugeStyle}
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Apparent Power
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                    {apparentPowerValue >= 1000
                        ? `${(apparentPowerValue / 1000).toFixed(2)} kVA`
                        : `${apparentPowerValue.toFixed(0)} VA`}
                </p>
            </div>

            {/* Reactive Power Gauge */}
            <div className="text-center">
                <GaugeComponent
                    type="semicircle"
                    arc={{
                        width: 0.2,
                        padding: 0.005,
                        cornerRadius: 1,
                        subArcs: [
                            { limit: 3000, color: "#10b981", showTick: true },
                            { limit: 6000, color: "#f59e0b", showTick: true },
                            { limit: 10000, color: "#ef4444", showTick: true },
                        ],
                    }}
                    pointer={{
                        color: "#1f2937",
                        length: 0.8,
                        width: 15,
                    }}
                    labels={{
                        valueLabel: { hide: true },
                        tickLabels: {
                            type: "outer",
                            ticks: [
                                { value: 0 },
                                { value: 5000 },
                                { value: 10000 },
                            ],
                            defaultTickValueConfig: {
                                style: { fontSize: 10 },
                                formatTextValue: (value: number) =>
                                    value >= 1000
                                        ? `${(value / 1000).toFixed(0)}k`
                                        : `${value}`,
                            },
                        },
                    }}
                    value={reactivePowerValue}
                    minValue={0}
                    maxValue={10000}
                    style={gaugeStyle}
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Reactive Power
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                    {reactivePowerValue >= 1000
                        ? `${(reactivePowerValue / 1000).toFixed(2)} kVAr`
                        : `${reactivePowerValue.toFixed(0)} VAr`}
                </p>
            </div>
        </div>
    );
}
