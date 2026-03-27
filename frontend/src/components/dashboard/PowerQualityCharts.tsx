"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart,
    Area,
    AreaChart,
} from "recharts";
import api from "@/lib/api";
import { Clock, Zap, Activity, Gauge, RefreshCw } from "lucide-react";

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

interface PowerQualityChartsProps {
    meterName: string;
}

interface PowerDataPoint {
    local_time: string;
    voltage: number;
    current: number;
    active_power: number;
    reactive_power: number;
    apparent_power: number;
    power_factor: number;
    frequency: number;
}

interface TooltipPayloadItem {
    color: string;
    name: string;
    value: number;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadItem[];
    label?: string;
}

const formatTooltipTime = (timeStr: string) => {
    try {
        const date = new Date(timeStr);
        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    } catch {
        return timeStr;
    }
};

const getUnit = (name: string) => {
    if (name.includes("Power Factor")) return "";
    if (name.includes("Frequency")) return " Hz";
    if (name.includes("Voltage")) return " V";
    if (name.includes("Current")) return " A";
    if (name.includes("Active Power")) return " W";
    if (name.includes("Reactive Power")) return " VAr";
    if (name.includes("Apparent Power")) return " VA";
    return "";
};

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length && label) {
        return (
            <div className="bg-background border rounded-lg p-3 shadow-lg">
                <p className="font-medium mb-2">
                    {formatTooltipTime(label)}
                </p>
                {payload.map((entry) => (
                    <div
                        key={entry.name}
                        className="flex items-center space-x-2"
                    >
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm">
                            {entry.name}:{" "}
                            {typeof entry.value === "number"
                                ? entry.value.toFixed(0)
                                : entry.value}
                            {getUnit(entry.name)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function PowerQualityCharts({ meterName }: PowerQualityChartsProps) {
    const [powerData, setPowerData] = useState<PowerDataPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [timeRange, setTimeRange] = useState("24");
    const [error, setError] = useState<string | null>(null);

    const fetchPowerQualityData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get<{ data: PowerDataPoint[] }>(
                `/api/power-quality/${meterName}/?hours=${timeRange}`,
            );
            setPowerData(response.data.data || []);
        } catch (err) {
            setError("Failed to load power quality data");
            console.error("Error fetching power quality data:", err);
        } finally {
            setLoading(false);
        }
    }, [meterName, timeRange]);

    useEffect(() => {
        if (meterName) {
            fetchPowerQualityData();
        }
    }, [meterName, timeRange, fetchPowerQualityData]);

    const formatTime = (timeStr: string) => {
        try {
            const date = new Date(timeStr);
            return date.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            });
        } catch {
            return timeStr;
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardContent className="flex items-center justify-center h-64">
                            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                            <span>Loading power quality data...</span>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center h-64">
                    <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">{error}</p>
                    <Button
                        onClick={fetchPowerQualityData}
                        variant="outline"
                        className="mt-4"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Controls */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Gauge className="h-5 w-5 mr-2" />
                        Power Quality Analysis - {meterName}
                    </CardTitle>
                    <CardDescription>
                        30-minute averaged power quality metrics in UTC+8
                        timezone
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            <label htmlFor="time-range-select" className="text-sm font-medium whitespace-nowrap">
                                Time Range:
                            </label>
                            <Select
                                value={timeRange}
                                onValueChange={setTimeRange}
                            >
                                <SelectTrigger id="time-range-select" className="w-full sm:w-32 min-h-[44px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="6">6 Hours</SelectItem>
                                    <SelectItem value="12">12 Hours</SelectItem>
                                    <SelectItem value="24">24 Hours</SelectItem>
                                    <SelectItem value="48">48 Hours</SelectItem>
                                    <SelectItem value="168">7 Days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={fetchPowerQualityData}
                            variant="outline"
                            size="sm"
                            className="min-h-[44px]"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {powerData.length === 0 ? (
                <Card>
                    <CardContent className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-lg font-medium">
                                No Power Data Available
                            </p>
                            <p className="text-sm text-muted-foreground">
                                No power quality data found for the selected
                                time range
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Power Metrics Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Zap className="h-5 w-5 mr-2" />
                                Power Metrics (30-min averages)
                            </CardTitle>
                            <CardDescription>
                                Active, Reactive, and Apparent Power over time
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px] sm:h-[300px] lg:h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={powerData}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#f3f4f6"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="local_time"
                                            tickFormatter={formatTime}
                                            fontSize={12}
                                        />
                                        <YAxis
                                            fontSize={11}
                                            tickFormatter={(value) =>
                                                formatValueWithUnit(value, "W")
                                            }
                                            width={55}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="active_power"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            dot={false}
                                            name="Active Power (W)"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="reactive_power"
                                            stroke="#ef4444"
                                            strokeWidth={2}
                                            dot={false}
                                            name="Reactive Power (VAr)"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="apparent_power"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            dot={false}
                                            name="Apparent Power (VA)"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Electrical Parameters Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Activity className="h-5 w-5 mr-2" />
                                Electrical Parameters
                            </CardTitle>
                            <CardDescription>
                                Voltage, Current, Power Factor, and Frequency
                                trends
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                {/* Voltage and Current */}
                                <div>
                                    <h4 className="text-xs sm:text-sm font-medium mb-2">
                                        Voltage & Current
                                    </h4>
                                    <div className="h-[200px] sm:h-[250px] lg:h-[300px]">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <ComposedChart data={powerData}>
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    stroke="#f3f4f6"
                                                    vertical={false}
                                                />
                                                <XAxis
                                                    dataKey="local_time"
                                                    tickFormatter={formatTime}
                                                    fontSize={10}
                                                />
                                                <YAxis
                                                    yAxisId="voltage"
                                                    orientation="left"
                                                    domain={[200, 260]}
                                                    tickFormatter={(value) =>
                                                        formatValueWithUnit(
                                                            value,
                                                            "V",
                                                        )
                                                    }
                                                    fontSize={10}
                                                    width={50}
                                                />
                                                <YAxis
                                                    yAxisId="current"
                                                    orientation="right"
                                                    tickFormatter={(value) =>
                                                        formatValueWithUnit(
                                                            value,
                                                            "A",
                                                        )
                                                    }
                                                    fontSize={10}
                                                    width={45}
                                                />
                                                <Tooltip
                                                    content={<CustomTooltip />}
                                                />
                                                <Line
                                                    yAxisId="voltage"
                                                    type="monotone"
                                                    dataKey="voltage"
                                                    stroke="#3b82f6"
                                                    strokeWidth={2}
                                                    dot={false}
                                                    name="Voltage (V)"
                                                />
                                                <Line
                                                    yAxisId="current"
                                                    type="monotone"
                                                    dataKey="current"
                                                    stroke="#f59e0b"
                                                    strokeWidth={2}
                                                    dot={false}
                                                    name="Current (A)"
                                                />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Power Factor and Frequency */}
                                <div>
                                    <h4 className="text-xs sm:text-sm font-medium mb-2">
                                        Power Factor & Frequency
                                    </h4>
                                    <div className="h-[200px] sm:h-[250px] lg:h-[300px]">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <ComposedChart data={powerData}>
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    stroke="#f3f4f6"
                                                    vertical={false}
                                                />
                                                <XAxis
                                                    dataKey="local_time"
                                                    tickFormatter={formatTime}
                                                    fontSize={10}
                                                />
                                                <YAxis
                                                    yAxisId="pf"
                                                    orientation="left"
                                                    domain={[0, 1]}
                                                    tickFormatter={(value) =>
                                                        value.toFixed(2)
                                                    }
                                                    fontSize={10}
                                                    width={35}
                                                />
                                                <YAxis
                                                    yAxisId="freq"
                                                    orientation="right"
                                                    domain={[49, 51]}
                                                    tickFormatter={(value) =>
                                                        `${value}Hz`
                                                    }
                                                    fontSize={10}
                                                    width={45}
                                                />
                                                <Tooltip
                                                    content={<CustomTooltip />}
                                                />
                                                <Area
                                                    yAxisId="pf"
                                                    type="monotone"
                                                    dataKey="power_factor"
                                                    stroke="#10b981"
                                                    fill="#10b981"
                                                    fillOpacity={0.3}
                                                    strokeWidth={2}
                                                    name="Power Factor"
                                                />
                                                <Line
                                                    yAxisId="freq"
                                                    type="monotone"
                                                    dataKey="frequency"
                                                    stroke="#8b5cf6"
                                                    strokeWidth={2}
                                                    dot={false}
                                                    name="Frequency (Hz)"
                                                />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Power Factor Quality Analysis */}
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Power Factor Quality Assessment
                            </CardTitle>
                            <CardDescription>
                                Analysis of power factor performance over time
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] sm:h-[250px] lg:h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={powerData}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#f3f4f6"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="local_time"
                                            tickFormatter={formatTime}
                                            fontSize={10}
                                        />
                                        <YAxis
                                            domain={[0, 1]}
                                            tickFormatter={(value) =>
                                                value.toFixed(2)
                                            }
                                            fontSize={10}
                                            width={35}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="power_factor"
                                            stroke="#10b981"
                                            fill="#10b981"
                                            fillOpacity={0.6}
                                            strokeWidth={2}
                                            name="Power Factor"
                                        />
                                        {/* Reference lines */}
                                        <Line
                                            type="monotone"
                                            dataKey={() => 0.95}
                                            stroke="#22c55e"
                                            strokeDasharray="5 5"
                                            strokeWidth={1}
                                            dot={false}
                                            name="Excellent (0.95+)"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey={() => 0.85}
                                            stroke="#f59e0b"
                                            strokeDasharray="5 5"
                                            strokeWidth={1}
                                            dot={false}
                                            name="Good (0.85+)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
