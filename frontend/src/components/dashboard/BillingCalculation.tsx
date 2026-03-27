"use client";

import { useState, useEffect, useCallback } from "react";
import { format, parse } from "date-fns";
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
} from "recharts";
import {
    ChevronDown,
    ChevronUp,
    DollarSign,
    TrendingUp,
    Zap,
    RefreshCw,
} from "lucide-react";
import api from "@/lib/api";
import type { BillingData, MonthlyBilling } from "@/types/meter";

interface BillingCalculationProps {
    meterName: string | null;
}

export function BillingCalculation({ meterName }: BillingCalculationProps) {
    const [billingData, setBillingData] = useState<BillingData | null>(null);
    const [tariffType, setTariffType] = useState<"GENERAL" | "TOU">("GENERAL");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

    const fetchBillingData = useCallback(async () => {
        if (!meterName) return;

        setLoading(true);
        setError(null);

        try {
            const response = await api.get<BillingData>(
                `/api/billing/${meterName}/?tariff_type=${tariffType}`,
            );
            setBillingData(response.data);
        } catch (err) {
            setError("Failed to load billing data");
            console.error("Error fetching billing data:", err);
        } finally {
            setLoading(false);
        }
    }, [meterName, tariffType]);

    useEffect(() => {
        fetchBillingData();
    }, [meterName, tariffType, fetchBillingData]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("ms-MY", {
            style: "currency",
            currency: "MYR",
        }).format(value);
    };

    const formatKwh = (value: number) => {
        return value.toFixed(2) + " kWh";
    };

    /**
     * Formats a billing period into "Month Year" format.
     * Uses end_month since most of the billing period falls in that month.
     */
    const formatBillingPeriod = (
        start_month?: string,
        end_month?: string,
        fallback?: string,
    ): string => {
        try {
            const monthToFormat = end_month || start_month;

            if (!monthToFormat) {
                return fallback || "Unknown Period";
            }

            const parsedDate = parse(monthToFormat, "yyyy-MM", new Date());
            return format(parsedDate, "MMMM yyyy");
        } catch (error) {
            console.warn("Failed to format billing period:", error);

            if (start_month && end_month) {
                return `20/${start_month.split("-")[1]} - 19/${end_month.split("-")[1]}`;
            }

            return fallback || "Invalid Date";
        }
    };

    const toggleExpand = (month: string | undefined) => {
        if (month === undefined) return;
        setExpandedMonth(expandedMonth === month ? null : month);
    };

    if (!meterName) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">
                        Select a meter to view billing data
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardContent className="flex items-center justify-center h-64">
                            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                            <span>Loading billing data...</span>
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
                        onClick={fetchBillingData}
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

    if (!billingData) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Controls */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <DollarSign className="h-5 w-5 mr-2" />
                        Monthly Billing Calculator - {meterName}
                    </CardTitle>
                    <CardDescription>
                        Calculate electricity bills using Malaysia residential
                        tariff rates
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 flex-shrink-0" />
                            <label htmlFor="tariff-type-select" className="text-sm font-medium whitespace-nowrap">
                                Tariff Type:
                            </label>
                            <Select
                                value={tariffType}
                                onValueChange={(value) =>
                                    setTariffType(value as "GENERAL" | "TOU")
                                }
                            >
                                <SelectTrigger id="tariff-type-select" className="w-full sm:w-48 min-h-[44px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GENERAL">
                                        General Tariff (Flat Rate)
                                    </SelectItem>
                                    <SelectItem value="TOU">
                                        Time of Use (ToU)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={fetchBillingData}
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

            {/* Summary Cards */}
            {billingData.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium">
                                Total Cost
                            </CardTitle>
                            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                        </CardHeader>
                        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                            <div className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                                {formatCurrency(
                                    billingData.summary.total_cost_rm,
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                                {billingData.summary.periods_analyzed ||
                                    billingData.summary.months_analyzed}{" "}
                                periods
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium">
                                Avg Per Period
                            </CardTitle>
                            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                            <div className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                                {formatCurrency(
                                    billingData.summary.avg_monthly_cost_rm,
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                                Per period
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium">
                                Total Usage
                            </CardTitle>
                            <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                            <div className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                                {formatKwh(
                                    billingData.summary.total_consumption_kwh,
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                                Total
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium">
                                Avg Usage
                            </CardTitle>
                            <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                            <div className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                                {formatKwh(
                                    billingData.summary
                                        .avg_monthly_consumption_kwh,
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                                Per period
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Cost & Consumption Trend Chart */}
            {billingData.billing_data.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <TrendingUp className="h-5 w-5 mr-2" />
                            Billing Overview
                        </CardTitle>
                        <CardDescription>
                            Energy consumption and billing costs over{" "}
                            {billingData.summary.periods_analyzed ||
                                billingData.summary.months_analyzed}{" "}
                            periods
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart
                                data={billingData.billing_data.map((item) => ({
                                    ...item,
                                    period_display: item.period || item.month,
                                    period_label: formatBillingPeriod(
                                        item.start_month,
                                        item.end_month,
                                        item.month,
                                    ),
                                }))}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="period_label"
                                    tick={{ fontSize: 11 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                />
                                <YAxis
                                    yAxisId="left"
                                    label={{
                                        value: "Cost (RM)",
                                        angle: -90,
                                        position: "insideLeft",
                                        offset: 10,
                                    }}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    label={{
                                        value: "Consumption (kWh)",
                                        angle: 90,
                                        position: "insideRight",
                                        offset: 10,
                                    }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "rgba(0, 0, 0, 0.75)",
                                        border: "none",
                                        borderRadius: "8px",
                                        color: "#fff",
                                    }}
                                    formatter={(
                                        value: number,
                                        name: string,
                                    ) => {
                                        if (name === "Total Cost") {
                                            return [
                                                formatCurrency(value),
                                                name,
                                            ];
                                        }
                                        return [
                                            typeof value === "number"
                                                ? value.toFixed(2)
                                                : value,
                                            name,
                                        ];
                                    }}
                                    labelFormatter={(label: string) => {
                                        return `Period: ${label}`;
                                    }}
                                />
                                <Legend
                                    wrapperStyle={{ paddingTop: "20px" }}
                                    iconType="square"
                                />
                                <Bar
                                    yAxisId="left"
                                    dataKey="total_amount_rm"
                                    fill="#3b82f6"
                                    name="Total Cost (RM)"
                                />
                                <Bar
                                    yAxisId="right"
                                    dataKey="consumption_kwh"
                                    fill="#10b981"
                                    name="Energy Consumption (kWh)"
                                    opacity={0.7}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Monthly Breakdown Table */}
            {billingData.billing_data.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-2" />
                            Monthly Billing Details
                        </CardTitle>
                        <CardDescription>
                            Click on a month to see detailed cost breakdown
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {billingData.billing_data.map((billing) => (
                                <div
                                    key={billing.month}
                                    className="border rounded-lg"
                                >
                                    {/* Collapse Header */}
                                    <button
                                        onClick={() =>
                                            toggleExpand(billing.month)
                                        }
                                        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">
                                                    {formatBillingPeriod(
                                                        billing.start_month,
                                                        billing.end_month,
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {formatKwh(
                                                        billing.consumption_kwh,
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-sm">
                                                    {formatCurrency(
                                                        billing.total_amount_rm,
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {expandedMonth === billing.month ? (
                                            <ChevronUp className="h-4 w-4 ml-2 flex-shrink-0" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
                                        )}
                                    </button>

                                    {/* Expanded Details */}
                                    {expandedMonth === billing.month && (
                                        <div className="px-4 pb-4 pt-0 space-y-3 border-t bg-muted/30">
                                            {/* Energy Charges */}
                                            {tariffType === "GENERAL" &&
                                            billing.energy_charge_rm !==
                                                undefined ? (
                                                <div className="space-y-2 text-sm pt-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">
                                                            Energy Charge (
                                                            {
                                                                billing.energy_rate_sen
                                                            }{" "}
                                                            sen/kWh)
                                                        </span>
                                                        <span className="font-medium">
                                                            {formatCurrency(
                                                                billing.energy_charge_rm,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">
                                                            Capacity Charge
                                                            (4.55 sen/kWh)
                                                        </span>
                                                        <span className="font-medium">
                                                            {formatCurrency(
                                                                billing.capacity_charge_rm,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">
                                                            Network Charge
                                                            (12.85 sen/kWh)
                                                        </span>
                                                        <span className="font-medium">
                                                            {formatCurrency(
                                                                billing.network_charge_rm,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">
                                                            Fuel Adjustment
                                                        </span>
                                                        <span className="font-medium">
                                                            {formatCurrency(
                                                                billing.afa_charge_rm,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">
                                                            Retail Charge
                                                            {billing.retail_charge_rm ===
                                                                0 && (
                                                                <span className="text-xs">
                                                                    {" "}
                                                                    (waived)
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span className="font-medium">
                                                            {formatCurrency(
                                                                billing.retail_charge_rm,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : tariffType === "TOU" &&
                                              billing.tou_breakdown ? (
                                                <div className="space-y-2 text-sm pt-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">
                                                            Peak Energy Charge (
                                                            {
                                                                billing
                                                                    .tou_breakdown
                                                                    .peak_rate_sen
                                                            }{" "}
                                                            sen/kWh)
                                                        </span>
                                                        <span className="font-medium">
                                                            {formatCurrency(
                                                                billing.tou_breakdown.peak_cost_rm,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">
                                                            Off-Peak Energy Charge (
                                                            {
                                                                billing
                                                                    .tou_breakdown
                                                                    .offpeak_rate_sen
                                                            }{" "}
                                                            sen/kWh)
                                                        </span>
                                                        <span className="font-medium">
                                                            {formatCurrency(
                                                                billing.tou_breakdown.offpeak_cost_rm,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">
                                                            Capacity Charge
                                                            (4.55 sen/kWh)
                                                        </span>
                                                        <span className="font-medium">
                                                            {formatCurrency(
                                                                billing.capacity_charge_rm,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">
                                                            Network Charge
                                                            (12.85 sen/kWh)
                                                        </span>
                                                        <span className="font-medium">
                                                            {formatCurrency(
                                                                billing.network_charge_rm,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">
                                                            Fuel Adjustment
                                                        </span>
                                                        <span className="font-medium">
                                                            {formatCurrency(
                                                                billing.afa_charge_rm,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">
                                                            Retail Charge
                                                        </span>
                                                        <span className="font-medium">
                                                            {formatCurrency(
                                                                billing.retail_charge_rm,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : null}


                                            {/* Subtotal */}
                                            <div className="border-t pt-2 flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    Subtotal
                                                </span>
                                                <span className="font-medium">
                                                    {formatCurrency(
                                                        billing.subtotal_before_incentive_rm,
                                                    )}
                                                </span>
                                            </div>

                                            {/* Efficiency Incentive */}
                                            {billing.efficiency_incentive_rm >
                                                0 && (
                                                <div className="border-t pt-2 flex justify-between text-sm">
                                                    <span className="text-green-600 font-medium">
                                                        Energy Efficiency
                                                        Incentive
                                                        {billing.efficiency_rate_sen && (
                                                            <span className="text-xs ml-1">
                                                                ({billing.efficiency_rate_sen} sen/kWh)
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="text-green-600 font-medium">
                                                        -
                                                        {formatCurrency(
                                                            billing.efficiency_incentive_rm,
                                                        )}
                                                    </span>
                                                </div>
                                            )}

                                            {/* KWTB Charge */}
                                            <div className="border-t pt-2 flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    KWTB Charge (1.6%)
                                                </span>
                                                <span className="font-medium">
                                                    {formatCurrency(
                                                        billing.kwtb_charge_rm,
                                                    )}
                                                </span>
                                            </div>

                                            {/* Total */}
                                            <div className="border-t pt-2 flex justify-between text-base font-bold">
                                                <span>Total Amount</span>
                                                <span>
                                                    {formatCurrency(
                                                        billing.total_amount_rm,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
