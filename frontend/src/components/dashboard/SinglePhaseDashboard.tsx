"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Activity,
    Zap,
    Gauge,
    TrendingUp,
    Home,
    BarChart3,
    Clock,
    RefreshCw,
    LogOut,
    User,
} from "lucide-react";
import { RealtimeGauges } from "./RealtimeGauges";
import { DataExport } from "./DataExport";

const RealtimePowerChart = dynamic(
    () =>
        import("./RealtimePowerChart").then((m) => ({
            default: m.RealtimePowerChart,
        })),
    { ssr: false },
);

const PowerQualityCharts = dynamic(
    () =>
        import("./PowerQualityCharts").then((m) => ({
            default: m.PowerQualityCharts,
        })),
    { ssr: false },
);

const EnergyConsumptionCharts = dynamic(
    () =>
        import("./EnergyConsumptionCharts").then((m) => ({
            default: m.EnergyConsumptionCharts,
        })),
    { ssr: false },
);

const BillingCalculation = dynamic(
    () =>
        import("./BillingCalculation").then((m) => ({
            default: m.BillingCalculation,
        })),
    { ssr: false },
);
import type {
    Meter,
    MeterSummary,
    RealtimeData,
    TimeseriesPoint,
    User as UserType,
} from "@/types";

interface SinglePhaseDashboardProps {
    meters: Meter[];
    readings: MeterSummary[];
    realtimeData: Record<string, RealtimeData>;
    timeseriesData: Record<string, TimeseriesPoint[]>;
    loading: boolean;
    error: string | null;
    wsConnected: boolean;
    onRefresh: () => void;
    onRequestTimeseries: (meterName: string) => void;
    user: UserType | null;
    onLogout: () => void;
}

interface SystemSummary {
    totalPower: number;
    voltage: number;
    current: number;
    powerFactor: number;
    frequency: number;
    lastUpdate: string;
}

export function SinglePhaseDashboard({
    meters,
    readings,
    realtimeData,
    timeseriesData,
    loading,
    error,
    wsConnected,
    onRefresh,
    onRequestTimeseries,
    user,
    onLogout,
}: SinglePhaseDashboardProps) {
    const [selectedMeter, setSelectedMeter] = useState<string | null>(null);

    useEffect(() => {
        // Set default meter to first available meter
        if (readings.length > 0 && !selectedMeter) {
            setSelectedMeter(readings[0].meter_name);
        }
    }, [readings, selectedMeter]);

    useEffect(() => {
        // Request initial timeseries data when meter is selected
        if (selectedMeter && onRequestTimeseries) {
            onRequestTimeseries(selectedMeter);
        }
    }, [selectedMeter, onRequestTimeseries]);

    // Get realtime data for selected meter from props
    const currentRealtimeData = selectedMeter
        ? realtimeData[selectedMeter]
        : null;

    // Get timeseries data for selected meter from props
    const currentTimeseriesData = selectedMeter
        ? timeseriesData[selectedMeter] || []
        : [];

    const getSystemSummary = (): SystemSummary | null => {
        if (!currentRealtimeData) return null;

        return {
            totalPower: currentRealtimeData.active_power || 0,
            voltage: currentRealtimeData.voltage || 0,
            current: currentRealtimeData.current || 0,
            powerFactor: currentRealtimeData.power_factor || 0,
            frequency: currentRealtimeData.frequency || 50,
            lastUpdate:
                currentRealtimeData.local_time || new Date().toISOString(),
        };
    };

    const summary = getSystemSummary();

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Loading electrical data...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Card className="w-96">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center">
                            <Zap className="h-5 w-5 mr-2" />
                            Connection Error
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            {error}
                        </p>
                        <Button
                            onClick={onRefresh}
                            variant="outline"
                            className="w-full"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry Connection
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-card">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <Home className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                            <div>
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
                                    Home Energy Monitor
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {readings.length > 1 && (
                                <select
                                    className="flex-1 sm:flex-initial sm:w-auto px-3 py-2 min-h-[44px] border rounded-md text-sm sm:text-base bg-background"
                                    value={selectedMeter || ""}
                                    onChange={(e) =>
                                        setSelectedMeter(e.target.value)
                                    }
                                >
                                    {readings.map((reading) => (
                                        <option
                                            key={reading.meter_name}
                                            value={reading.meter_name}
                                        >
                                            {reading.meter_name}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {user && (
                                <div className="flex items-center gap-2">
                                    <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                                        <User className="h-4 w-4" />
                                        <span>{user.username}</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onLogout}
                                        className="min-h-[44px] sm:min-h-0"
                                    >
                                        <LogOut className="h-4 w-4 sm:mr-2" />
                                        <span className="hidden sm:inline">
                                            Logout
                                        </span>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                {/* System Overview Cards */}
                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                                <CardTitle className="text-xs sm:text-sm font-medium">
                                    Active Power
                                </CardTitle>
                                <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                                <div className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                                    {summary.totalPower.toFixed(0)} W
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                    Real-time consumption
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                                <CardTitle className="text-xs sm:text-sm font-medium">
                                    Voltage
                                </CardTitle>
                                <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                                <div className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                                    {summary.voltage.toFixed(1)} V
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                    {summary.voltage > 250
                                        ? "High"
                                        : summary.voltage < 220
                                          ? "Low"
                                          : "Normal"}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                                <CardTitle className="text-xs sm:text-sm font-medium">
                                    Current
                                </CardTitle>
                                <Gauge className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                            </CardHeader>
                            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                                <div className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                                    {summary.current.toFixed(2)} A
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                    Load current
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                                <CardTitle className="text-xs sm:text-sm font-medium">
                                    Power Factor
                                </CardTitle>
                                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                                <div className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                                    {summary.powerFactor.toFixed(3)}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                    {summary.powerFactor > 0.95
                                        ? "Excellent"
                                        : summary.powerFactor > 0.85
                                          ? "Good"
                                          : "Poor"}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Main Content Tabs */}
                <Tabs defaultValue="overview" className="space-y-4">
                    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible scrollbar-hide">
                        <TabsList className="inline-flex sm:grid sm:w-full sm:grid-cols-4 min-w-max sm:min-w-0">
                            <TabsTrigger
                                value="overview"
                                className="px-4 sm:px-3 py-2.5 min-h-[44px] text-sm"
                            >
                                Overview
                            </TabsTrigger>
                            <TabsTrigger
                                value="power"
                                className="px-4 sm:px-3 py-2.5 min-h-[44px] text-sm whitespace-nowrap"
                            >
                                Power Quality
                            </TabsTrigger>
                            <TabsTrigger
                                value="energy"
                                className="px-4 sm:px-3 py-2.5 min-h-[44px] text-sm whitespace-nowrap"
                            >
                                Energy Usage
                            </TabsTrigger>
                            <TabsTrigger
                                value="analytics"
                                className="px-4 sm:px-3 py-2.5 min-h-[44px] text-sm"
                            >
                                Analytics
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Overview Tab - Real-time Gauges and Charts */}
                    <TabsContent value="overview" className="space-y-4">
                        {/* System Status - Full Width on Top */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Activity className="h-5 w-5 mr-2" />
                                    System Status
                                </CardTitle>
                                <CardDescription>
                                    Current operational status and alerts
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 border rounded-lg gap-1 sm:gap-0">
                                        <div className="flex items-center">
                                            <div className="h-2 w-2 rounded-full bg-green-500 mr-2 flex-shrink-0" />
                                            <span className="font-medium text-xs sm:text-sm">
                                                Meter Connection
                                            </span>
                                        </div>
                                        <span className="text-green-600 text-xs sm:text-sm">
                                            Online
                                        </span>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 border rounded-lg gap-1 sm:gap-0">
                                        <div className="flex items-center">
                                            <div className="h-2 w-2 rounded-full bg-blue-500 mr-2 flex-shrink-0" />
                                            <span className="font-medium text-xs sm:text-sm">
                                                Voltage Level
                                            </span>
                                        </div>
                                        <span className="text-blue-600 text-xs sm:text-sm">
                                            Normal
                                        </span>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 border rounded-lg gap-1 sm:gap-0">
                                        <div className="flex items-center">
                                            <div className="h-2 w-2 rounded-full bg-purple-500 mr-2 flex-shrink-0" />
                                            <span className="font-medium text-xs sm:text-sm">
                                                Power Quality
                                            </span>
                                        </div>
                                        <span className="text-purple-600 text-xs sm:text-sm">
                                            Good
                                        </span>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 border rounded-lg gap-1 sm:gap-0">
                                        <div className="flex items-center">
                                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mr-2 flex-shrink-0" />
                                            <span className="font-medium text-xs sm:text-sm">
                                                Last Reading
                                            </span>
                                        </div>
                                        <span className="text-muted-foreground text-xs sm:text-sm">
                                            {summary
                                                ? new Date(
                                                      summary.lastUpdate,
                                                  ).toLocaleTimeString()
                                                : "N/A"}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Real-time Meters - Full Width */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Gauge className="h-5 w-5 mr-2" />
                                    Real-time Meters
                                </CardTitle>
                                <CardDescription>
                                    Live electrical parameter readings for{" "}
                                    {selectedMeter}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {currentRealtimeData ? (
                                    <RealtimeGauges
                                        data={currentRealtimeData}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-64">
                                        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                                        <span>Loading real-time data...</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Real-time Power Chart */}
                        {selectedMeter && (
                            <RealtimePowerChart
                                meterName={selectedMeter}
                                timeseriesData={currentTimeseriesData}
                            />
                        )}
                    </TabsContent>

                    {/* Power Quality Tab */}
                    <TabsContent value="power" className="space-y-4">
                        {selectedMeter ? (
                            <PowerQualityCharts meterName={selectedMeter} />
                        ) : (
                            <Card>
                                <CardContent className="flex items-center justify-center h-64">
                                    <p>
                                        Select a meter to view power quality
                                        data
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Energy Usage Tab */}
                    <TabsContent value="energy" className="space-y-4">
                        {selectedMeter ? (
                            <EnergyConsumptionCharts
                                meterName={selectedMeter}
                            />
                        ) : (
                            <Card>
                                <CardContent className="flex items-center justify-center h-64">
                                    <p>
                                        Select a meter to view energy
                                        consumption data
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Analytics Tab */}
                    <TabsContent value="analytics" className="space-y-4">
                        {/* Data Export Component */}
                        <DataExport meterName={selectedMeter} />

                        {/* Billing Calculation Component */}
                        {selectedMeter ? (
                            <BillingCalculation meterName={selectedMeter} />
                        ) : (
                            <Card>
                                <CardContent className="flex items-center justify-center h-64">
                                    <p>Select a meter to view billing data</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Load Analysis Card */}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
