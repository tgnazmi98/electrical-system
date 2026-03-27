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
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
    LineChart,
    Line,
} from "recharts";
import api from "@/lib/api";
import {
    Battery,
    TrendingUp,
    Calendar,
    Clock,
    RefreshCw,
    ArrowUp,
    ArrowDown,
} from "lucide-react";

// Format value with unit suffix (k, M, etc.)
const formatValueWithUnit = (value: number | null | undefined, unit = "") => {
    if (value === null || value === undefined) return "0" + unit;
    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
        return (value / 1000000).toFixed(1) + "M" + unit;
    } else if (absValue >= 1000) {
        return (value / 1000).toFixed(1) + "k" + unit;
    } else if (absValue >= 1) {
        return value.toFixed(1) + unit;
    } else {
        return value.toFixed(3) + unit;
    }
};

interface EnergyConsumptionChartsProps {
    meterName: string;
}

interface EnergyDataPoint {
    local_time?: string;
    date?: string;
    month?: string;
    import_energy: number;
    export_energy?: number;
    net_consumption?: number;
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
    formatLabel?: (label: string) => string;
}

type ViewMode = "hourly" | "daily" | "monthly";

const CustomTooltip = ({
    active,
    payload,
    label,
    formatLabel,
}: CustomTooltipProps) => {
    if (active && payload && payload.length && label) {
        return (
            <div className="bg-background border rounded-lg p-3 shadow-lg">
                <p className="font-medium mb-2">
                    {formatLabel ? formatLabel(label) : label}
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
                                ? entry.value.toFixed(3)
                                : entry.value}{" "}
                            kWh
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function EnergyConsumptionCharts({
    meterName,
}: EnergyConsumptionChartsProps) {
    const [energyData, setEnergyData] = useState<EnergyDataPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("hourly");
    const [error, setError] = useState<string | null>(null);

    const getApiParams = useCallback(() => {
        switch (viewMode) {
            case "hourly":
                return { period: "30min", range: "24h" };
            case "daily":
                return { period: "daily", range: "15d" };
            case "monthly":
                return { period: "monthly", range: "12m" };
            default:
                return { period: "30min", range: "24h" };
        }
    }, [viewMode]);

    const fetchEnergyData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params = getApiParams();
            const response = await api.get<{
                consumption_data: EnergyDataPoint[];
            }>(
                `/api/energy-consumption/${meterName}/?period=${params.period}&range=${params.range}`,
            );
            setEnergyData(response.data.consumption_data || []);
        } catch (err) {
            setError("Failed to load energy consumption data");
            console.error("Error fetching energy data:", err);
        } finally {
            setLoading(false);
        }
    }, [meterName, getApiParams]);

    useEffect(() => {
        if (meterName) {
            fetchEnergyData();
        }
    }, [meterName, viewMode, fetchEnergyData]);

    const formatTime = (timeStr: string) => {
        try {
            if (viewMode === "monthly") {
                const [year, month] = timeStr.split("-");
                return new Date(
                    parseInt(year),
                    parseInt(month) - 1,
                ).toLocaleDateString("en-US", {
                    month: "short",
                    year: "2-digit",
                });
            } else if (viewMode === "daily") {
                return new Date(timeStr).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                });
            } else {
                return new Date(timeStr).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                });
            }
        } catch {
            return timeStr;
        }
    };

    const formatTooltipTime = (timeStr: string) => {
        try {
            if (viewMode === "monthly") {
                const [year, month] = timeStr.split("-");
                return new Date(
                    parseInt(year),
                    parseInt(month) - 1,
                ).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                });
            } else if (viewMode === "daily") {
                return new Date(timeStr).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                });
            } else {
                return new Date(timeStr).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                });
            }
        } catch {
            return timeStr;
        }
    };

    const getTimeKey = (item: EnergyDataPoint): string => {
        if (viewMode === "monthly") return item.month || "";
        if (viewMode === "daily") return item.date || "";
        return item.local_time || "";
    };

    const getEnergyUnit = () => {
        if (viewMode === "monthly") return "kWh/month";
        if (viewMode === "daily") return "kWh/day";
        return "kWh/30min";
    };

    const calculateTotalConsumption = () => {
        return energyData.reduce((total, item) => {
            return total + (item.import_energy || 0);
        }, 0);
    };

    const calculateAverageConsumption = () => {
        if (energyData.length === 0) return 0;
        return calculateTotalConsumption() / energyData.length;
    };

    const findPeakConsumption = ():
        | (EnergyDataPoint & { consumption: number })
        | null => {
        if (energyData.length === 0) return null;
        return energyData.reduce(
            (peak, item) => {
                const consumption = item.import_energy || 0;
                return consumption > (peak?.consumption || 0)
                    ? { ...item, consumption }
                    : peak;
            },
            null as (EnergyDataPoint & { consumption: number }) | null,
        );
    };

    const totalConsumption = calculateTotalConsumption();
    const avgConsumption = calculateAverageConsumption();
    const peakConsumption = findPeakConsumption();

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardContent className="flex items-center justify-center h-64">
                            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                            <span>Loading energy consumption data...</span>
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
                    <Battery className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">{error}</p>
                    <Button
                        onClick={fetchEnergyData}
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
            {/* Controls and Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Battery className="h-5 w-5 mr-2" />
                        Energy Consumption Analysis - {meterName}
                    </CardTitle>
                    <CardDescription>
                        Energy usage calculated from cumulative meter readings
                        (UTC+8 timezone)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <label htmlFor="view-mode-select" className="text-sm font-medium whitespace-nowrap">
                                View Mode:
                            </label>
                            <Select
                                value={viewMode}
                                onValueChange={(value) =>
                                    setViewMode(value as ViewMode)
                                }
                            >
                                <SelectTrigger id="view-mode-select" className="w-full sm:w-40 min-h-[44px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hourly">
                                        Half-hourly (24h)
                                    </SelectItem>
                                    <SelectItem value="daily">
                                        Daily (15 days)
                                    </SelectItem>
                                    <SelectItem value="monthly">
                                        Monthly (12 months)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={fetchEnergyData}
                            variant="outline"
                            size="sm"
                            className="min-h-[44px]"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>

                    {/* Summary Stats */}
                    {energyData.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-6">
                            <div className="text-center p-2 sm:p-4 border rounded-lg">
                                <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-blue-500" />
                                <div className="text-sm sm:text-lg lg:text-2xl font-bold truncate">
                                    {totalConsumption.toFixed(2)} kWh
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Total
                                </div>
                            </div>

                            <div className="text-center p-2 sm:p-4 border rounded-lg">
                                <Clock className="h-4 w-4 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-green-500" />
                                <div className="text-sm sm:text-lg lg:text-2xl font-bold truncate">
                                    {avgConsumption.toFixed(3)} kWh
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    <span className="hidden sm:inline">
                                        Average{" "}
                                    </span>
                                    {viewMode === "monthly"
                                        ? "/month"
                                        : viewMode === "daily"
                                          ? "/day"
                                          : "/30min"}
                                </div>
                            </div>

                            {peakConsumption && (
                                <div className="text-center p-2 sm:p-4 border rounded-lg">
                                    <ArrowUp className="h-4 w-4 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-red-500" />
                                    <div className="text-sm sm:text-lg lg:text-2xl font-bold truncate">
                                        {peakConsumption.consumption.toFixed(3)}{" "}
                                        kWh
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Peak
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {energyData.length === 0 ? (
                <Card>
                    <CardContent className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <Battery className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-lg font-medium">
                                No Energy Data Available
                            </p>
                            <p className="text-sm text-muted-foreground">
                                No consumption data found for the selected time
                                range
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Main Energy Consumption Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Battery className="h-5 w-5 mr-2" />
                                {viewMode === "hourly"
                                    ? "Half-hourly"
                                    : viewMode === "daily"
                                      ? "Daily"
                                      : "Monthly"}{" "}
                                Energy Usage
                            </CardTitle>
                            <CardDescription>
                                Actual energy consumption calculated from
                                cumulative readings ({getEnergyUnit()})
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px] sm:h-[300px] lg:h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={energyData}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#f3f4f6"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey={getTimeKey}
                                            tickFormatter={formatTime}
                                            fontSize={12}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            fontSize={11}
                                            tickFormatter={(value) =>
                                                formatValueWithUnit(value, "Wh")
                                            }
                                            width={55}
                                        />
                                        <Tooltip content={<CustomTooltip formatLabel={formatTooltipTime} />} />
                                        <Legend />
                                        <Bar
                                            dataKey="import_energy"
                                            stackId="energy"
                                            fill="#3b82f6"
                                            name="Energy Consumed"
                                            radius={[0, 0, 0, 0]}
                                        />
                                        {energyData.some(
                                            (item) =>
                                                (item.export_energy || 0) > 0,
                                        ) && (
                                            <Bar
                                                dataKey="export_energy"
                                                stackId="energy"
                                                fill="#10b981"
                                                name="Energy Exported"
                                                radius={[2, 2, 0, 0]}
                                            />
                                        )}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cumulative Energy Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Cumulative Energy Consumption</CardTitle>
                            <CardDescription>
                                Running total of energy consumption over time
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] sm:h-[250px] lg:h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={energyData.map((item, index) => ({
                                            ...item,
                                            cumulative: energyData
                                                .slice(0, index + 1)
                                                .reduce(
                                                    (sum, d) =>
                                                        sum +
                                                        (d.import_energy || 0),
                                                    0,
                                                ),
                                        }))}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#f3f4f6"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey={getTimeKey}
                                            tickFormatter={formatTime}
                                            fontSize={10}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            fontSize={10}
                                            tickFormatter={(value) =>
                                                formatValueWithUnit(value, "Wh")
                                            }
                                            width={50}
                                        />
                                        <Tooltip content={<CustomTooltip formatLabel={formatTooltipTime} />} />
                                        <Area
                                            type="monotone"
                                            dataKey="cumulative"
                                            stroke="#3b82f6"
                                            fill="#3b82f6"
                                            fillOpacity={0.3}
                                            strokeWidth={2}
                                            name="Cumulative Energy (kWh)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Energy Import vs Export (if applicable) */}
                    {energyData.some(
                        (item) => (item.export_energy || 0) > 0,
                    ) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <ArrowUp className="h-4 w-4 mr-1 text-green-500" />
                                    <ArrowDown className="h-4 w-4 mr-2 text-blue-500" />
                                    Import vs Export Analysis
                                </CardTitle>
                                <CardDescription>
                                    Bidirectional energy flow analysis (import
                                    from grid vs export to grid)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[200px] sm:h-[250px] lg:h-[300px]">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <LineChart data={energyData}>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#f3f4f6"
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey={getTimeKey}
                                                tickFormatter={formatTime}
                                                fontSize={10}
                                                interval="preserveStartEnd"
                                            />
                                            <YAxis
                                                fontSize={10}
                                                tickFormatter={(value) =>
                                                    formatValueWithUnit(
                                                        value,
                                                        "Wh",
                                                    )
                                                }
                                                width={50}
                                            />
                                            <Tooltip
                                                content={<CustomTooltip />}
                                            />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="import_energy"
                                                stroke="#3b82f6"
                                                strokeWidth={2}
                                                dot={false}
                                                name="Import Energy (kWh)"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="export_energy"
                                                stroke="#10b981"
                                                strokeWidth={2}
                                                dot={false}
                                                name="Export Energy (kWh)"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="net_consumption"
                                                stroke="#f59e0b"
                                                strokeWidth={2}
                                                strokeDasharray="5 5"
                                                dot={false}
                                                name="Net Consumption (kWh)"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Load Pattern Analysis */}
                    {viewMode === "hourly" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Load Pattern Analysis</CardTitle>
                                <CardDescription>
                                    Typical daily consumption pattern for
                                    residential loads
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                                        <div className="text-center p-2 sm:p-3 border rounded-lg">
                                            <div className="text-xs sm:text-sm font-medium">
                                                Peak Hour
                                            </div>
                                            <div className="text-sm sm:text-lg font-bold truncate">
                                                {peakConsumption
                                                    ? formatTime(
                                                          getTimeKey(
                                                              peakConsumption,
                                                          ),
                                                      )
                                                    : "N/A"}
                                            </div>
                                        </div>

                                        <div className="text-center p-2 sm:p-3 border rounded-lg">
                                            <div className="text-xs sm:text-sm font-medium">
                                                Low Load
                                            </div>
                                            <div className="text-sm sm:text-lg font-bold truncate">
                                                {energyData.length > 0
                                                    ? formatTime(
                                                          getTimeKey(
                                                              energyData.reduce(
                                                                  (
                                                                      min,
                                                                      item,
                                                                  ) =>
                                                                      (item.import_energy ||
                                                                          0) <
                                                                      (min.import_energy ||
                                                                          Infinity)
                                                                          ? item
                                                                          : min,
                                                              ),
                                                          ),
                                                      )
                                                    : "N/A"}
                                            </div>
                                        </div>

                                        <div className="text-center p-2 sm:p-3 border rounded-lg">
                                            <div className="text-xs sm:text-sm font-medium">
                                                Load Factor
                                            </div>
                                            <div className="text-sm sm:text-lg font-bold truncate">
                                                {peakConsumption?.consumption
                                                    ? (
                                                          (avgConsumption /
                                                              peakConsumption.consumption) *
                                                          100
                                                      ).toFixed(1) + "%"
                                                    : "N/A"}
                                            </div>
                                        </div>

                                        <div className="text-center p-2 sm:p-3 border rounded-lg">
                                            <div className="text-xs sm:text-sm font-medium">
                                                Daily Total
                                            </div>
                                            <div className="text-sm sm:text-lg font-bold truncate">
                                                {totalConsumption.toFixed(2)}{" "}
                                                kWh
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
