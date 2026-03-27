"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Download,
    FileSpreadsheet,
    Zap,
    Activity,
    Table,
    Eye,
    X,
} from "lucide-react";
import api from "@/lib/api";

interface DataExportProps {
    meterName: string | null;
}

interface PreviewData {
    record_count: number;
    data: Record<string, unknown>[];
}

export function DataExport({ meterName }: DataExportProps) {
    const [dataType, setDataType] = useState<"power" | "energy">("power");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Set default dates (last 7 days)
    useEffect(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        setEndDate(end.toISOString().split("T")[0]);
        setStartDate(start.toISOString().split("T")[0]);
    }, []);

    const fetchPreview = async () => {
        if (!meterName || !startDate || !endDate) return;

        setLoading(true);
        setError(null);

        try {
            const response = await api.get<PreviewData>(
                `/api/export/${meterName}/?type=${dataType}&start_date=${startDate}&end_date=${endDate}&output=json`,
            );
            setPreviewData(response.data);
        } catch (err: unknown) {
            console.error("Error fetching preview:", err);
            const axiosError = err as {
                response?: { data?: { error?: string } };
            };
            setError(
                axiosError.response?.data?.error || "Failed to fetch data",
            );
            setPreviewData(null);
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = async () => {
        if (!meterName || !startDate || !endDate) return;

        setLoading(true);
        setError(null);

        try {
            const response = await api.get(
                `/api/export/${meterName}/?type=${dataType}&start_date=${startDate}&end_date=${endDate}&output=csv`,
                { responseType: "blob" },
            );

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute(
                "download",
                `${meterName}_${dataType}_${startDate}_to_${endDate}.csv`,
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error downloading CSV:", err);
            setError("Failed to download CSV");
        } finally {
            setLoading(false);
        }
    };

    const formatValue = (value: unknown, key: string): string => {
        if (value === null || value === undefined) return "-";
        if (key === "timestamp") return String(value);
        if (typeof value === "number") {
            if (key.includes("energy")) return value.toFixed(3);
            if (key.includes("power") || key.includes("demand"))
                return value.toFixed(1);
            if (key === "voltage") return value.toFixed(1);
            if (key === "current") return value.toFixed(2);
            if (key === "power_factor") return value.toFixed(3);
            if (key === "frequency") return value.toFixed(2);
            return value.toFixed(2);
        }
        return String(value);
    };

    const getColumnHeader = (key: string): string => {
        const headers: Record<string, string> = {
            timestamp: "Timestamp",
            voltage: "Voltage (V)",
            current: "Current (A)",
            active_power: "Active Power (W)",
            apparent_power: "Apparent Power (VA)",
            reactive_power: "Reactive Power (VAr)",
            power_factor: "Power Factor",
            frequency: "Frequency (Hz)",
            import_active_energy: "Import Energy (kWh)",
            export_active_energy: "Export Energy (kWh)",
            import_reactive_energy: "Import Reactive (kVArh)",
            export_reactive_energy: "Export Reactive (kVArh)",
            power_demand: "Power Demand (W)",
            maximum_power_demand: "Max Demand (W)",
        };
        return headers[key] || key;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Download className="h-5 w-5 mr-2" />
                    Data Export
                </CardTitle>
                <CardDescription>
                    Export meter data with custom date range
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
                {/* Data Type Selection */}
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <Button
                        variant={dataType === "power" ? "default" : "outline"}
                        onClick={() => {
                            setDataType("power");
                            setPreviewData(null);
                        }}
                        className="min-h-[44px] text-sm sm:text-base"
                    >
                        <Zap className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Power </span>Data
                    </Button>
                    <Button
                        variant={dataType === "energy" ? "default" : "outline"}
                        onClick={() => {
                            setDataType("energy");
                            setPreviewData(null);
                        }}
                        className="min-h-[44px] text-sm sm:text-base"
                    >
                        <Activity className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Energy </span>Data
                    </Button>
                </div>

                {/* Date Range Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                        <label htmlFor="start-date" className="block text-xs sm:text-sm font-medium mb-1">
                            Start Date
                        </label>
                        <input
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 min-h-[44px] border rounded-md text-sm bg-background"
                        />
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-xs sm:text-sm font-medium mb-1">
                            End Date
                        </label>
                        <input
                            id="end-date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 min-h-[44px] border rounded-md text-sm bg-background"
                        />
                    </div>
                </div>

                {/* Quick Select Buttons */}
                <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm text-muted-foreground self-center w-full sm:w-auto mb-1 sm:mb-0">
                        Quick select:
                    </span>
                    {[
                        { label: "Today", days: 0, mobileLabel: "Today" },
                        { label: "Yesterday", days: 1, mobileLabel: "Yest." },
                        { label: "Last 7 days", days: 7, mobileLabel: "7d" },
                        { label: "Last 30 days", days: 30, mobileLabel: "30d" },
                    ].map(({ label, days, mobileLabel }) => (
                        <Button
                            key={label}
                            variant="outline"
                            size="sm"
                            className="min-h-[36px] sm:min-h-[40px] text-xs sm:text-sm px-2 sm:px-3"
                            onClick={() => {
                                const end = new Date();
                                const start = new Date();
                                if (days === 0) {
                                    setStartDate(
                                        end.toISOString().split("T")[0],
                                    );
                                    setEndDate(end.toISOString().split("T")[0]);
                                } else if (days === 1) {
                                    start.setDate(start.getDate() - 1);
                                    setStartDate(
                                        start.toISOString().split("T")[0],
                                    );
                                    setEndDate(
                                        start.toISOString().split("T")[0],
                                    );
                                } else {
                                    start.setDate(start.getDate() - days);
                                    setStartDate(
                                        start.toISOString().split("T")[0],
                                    );
                                    setEndDate(end.toISOString().split("T")[0]);
                                }
                                setPreviewData(null);
                            }}
                        >
                            <span className="sm:hidden">{mobileLabel}</span>
                            <span className="hidden sm:inline">{label}</span>
                        </Button>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    <Button
                        onClick={fetchPreview}
                        disabled={
                            !meterName || !startDate || !endDate || loading
                        }
                        variant="outline"
                        className="min-h-[44px] order-2 sm:order-1"
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        {loading ? "Loading..." : "Preview"}
                    </Button>
                    <Button
                        onClick={downloadCSV}
                        disabled={!meterName || !startDate || !endDate}
                        className="min-h-[44px] order-1 sm:order-2"
                    >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Download CSV
                    </Button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-3 bg-destructive/10 text-destructive rounded-md">
                        {error}
                    </div>
                )}

                {/* Preview Table */}
                {previewData && (
                    <div className="border rounded-lg">
                        <div className="flex items-center justify-between p-2 sm:p-3 border-b bg-muted/50">
                            <div className="flex items-center">
                                <Table className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="font-medium text-xs sm:text-sm">
                                    Preview ({previewData.record_count} records)
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPreviewData(null)}
                                className="min-h-[36px] min-w-[36px] p-1"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="overflow-x-auto max-h-64 sm:max-h-96 -mx-px">
                            <table className="w-full text-xs sm:text-sm min-w-[600px]">
                                <thead className="bg-muted/30 sticky top-0">
                                    <tr>
                                        {previewData.data.length > 0 &&
                                            Object.keys(
                                                previewData.data[0],
                                            ).map((key) => (
                                                <th
                                                    key={key}
                                                    className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-medium whitespace-nowrap text-xs sm:text-sm"
                                                >
                                                    {getColumnHeader(key)}
                                                </th>
                                            ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.data
                                        .slice(0, 100)
                                        .map((row, idx) => (
                                            <tr
                                                key={`row-${idx}`}
                                                className="border-t hover:bg-muted/20"
                                            >
                                                {Object.entries(row).map(
                                                    ([key, value]) => (
                                                        <td
                                                            key={key}
                                                            className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap font-mono text-xs"
                                                        >
                                                            {formatValue(
                                                                value,
                                                                key,
                                                            )}
                                                        </td>
                                                    ),
                                                )}
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                            {previewData.data.length > 100 && (
                                <div className="p-2 sm:p-3 text-center text-xs sm:text-sm text-muted-foreground border-t">
                                    Showing first 100 of{" "}
                                    {previewData.record_count} records.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!meterName && (
                    <p className="text-center text-muted-foreground">
                        Select a meter to enable data export
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
