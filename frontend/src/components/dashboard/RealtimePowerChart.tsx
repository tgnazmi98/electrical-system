"use client";

import { useMemo } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    AreaChart,
} from "recharts";
import { Activity, RefreshCw } from "lucide-react";
import type { TimeseriesPoint } from "@/types";

// Format value with unit suffix (k, M, etc.)
const formatValueWithUnit = (value: number | null | undefined, unit = "") => {
    if (value === null || value === undefined) return "0" + unit;

    const absValue = Math.abs(value);

    if (absValue >= 1000000) {
        return (value / 1000000).toFixed(1) + "M" + unit;
    } else if (absValue >= 1000) {
        return (value / 1000).toFixed(1) + "k" + unit;
    } else if (absValue >= 1) {
        return value.toFixed(0) + unit;
    } else {
        return value.toFixed(2) + unit;
    }
};

// Y-axis tick formatter
const formatYAxis = (value: number, unit: string) => {
    return formatValueWithUnit(value, unit);
};

interface RealtimePowerChartProps {
    meterName: string;
    timeseriesData?: TimeseriesPoint[];
}

interface ChartDataPoint extends TimeseriesPoint {
    time: string;
    timestampMs: number;
}

interface TooltipPayloadItem {
    color: string;
    name: string;
    value: number;
    unit?: string;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadItem[];
    label?: string;
}

const EMPTY_TIMESERIES: TimeseriesPoint[] = [];

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background border rounded-lg p-3 shadow-lg">
                <p className="font-medium mb-2">{label}</p>
                {payload.map((entry) => (
                    <div
                        key={entry.name}
                        className="flex items-center space-x-2 text-sm"
                    >
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span>
                            {entry.name}:{" "}
                            {formatValueWithUnit(
                                entry.value,
                                entry.unit || "",
                            )}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function RealtimePowerChart({
    meterName,
    timeseriesData = EMPTY_TIMESERIES,
}: RealtimePowerChartProps) {
    // Process timeseries data for chart display
    const powerData = useMemo<ChartDataPoint[]>(() => {
        return timeseriesData.map((item) => ({
            ...item,
            time: new Date(item.timestamp).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            }),
            timestampMs: new Date(item.timestamp).getTime(),
            active_power: item.active_power || 0,
            voltage: item.voltage || 0,
            current: item.current || 0,
            power_factor: item.power_factor || 0,
        }));
    }, [timeseriesData]);

    const loading = timeseriesData.length === 0;

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-64">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    <span>Waiting for data...</span>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Real-time Power (Last 15 Minutes)
                </CardTitle>
                <CardDescription>
                    Live power consumption trend for {meterName} (
                    {powerData.length} data points)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] sm:h-[250px] lg:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={powerData}>
                            <defs>
                                <linearGradient
                                    id="powerGradient"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="#f59e0b"
                                        stopOpacity={0.3}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#f59e0b"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#f3f4f6"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="time"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) =>
                                    formatYAxis(value, "W")
                                }
                                width={50}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="active_power"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                fill="url(#powerGradient)"
                                name="Power"
                                unit="W"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Additional mini charts for voltage and current */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
                    {/* Voltage Chart */}
                    <div>
                        <h4 className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-center">
                            Voltage
                        </h4>
                        <div className="h-[80px] sm:h-[100px] lg:h-[120px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={powerData}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#f3f4f6"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="time"
                                        fontSize={9}
                                        tickLine={false}
                                        hide
                                    />
                                    <YAxis
                                        fontSize={9}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) =>
                                            formatYAxis(value, "V")
                                        }
                                        width={40}
                                        domain={["dataMin - 5", "dataMax + 5"]}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line
                                        type="monotone"
                                        dataKey="voltage"
                                        stroke="#3b82f6"
                                        strokeWidth={1.5}
                                        dot={false}
                                        name="Voltage"
                                        unit="V"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Current Chart */}
                    <div>
                        <h4 className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-center">
                            Current
                        </h4>
                        <div className="h-[80px] sm:h-[100px] lg:h-[120px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={powerData}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#f3f4f6"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="time"
                                        fontSize={9}
                                        tickLine={false}
                                        hide
                                    />
                                    <YAxis
                                        fontSize={9}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) =>
                                            formatYAxis(value, "A")
                                        }
                                        width={40}
                                        domain={[0, "dataMax + 1"]}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line
                                        type="monotone"
                                        dataKey="current"
                                        stroke="#10b981"
                                        strokeWidth={1.5}
                                        dot={false}
                                        name="Current"
                                        unit="A"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
