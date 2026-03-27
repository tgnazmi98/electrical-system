"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import api from "@/lib/api";
import { SinglePhaseDashboard } from "./SinglePhaseDashboard";
import type {
    Meter,
    MeterSummary,
    RealtimeData,
    TimeseriesPoint,
    WebSocketMessage,
} from "@/types";

const MAX_TIMESERIES_POINTS = 450; // ~15 minutes at 2-second intervals

export function Dashboard() {
    const { logout, user } = useAuth();
    const [meters, setMeters] = useState<Meter[]>([]);
    const [readings, setReadings] = useState<MeterSummary[]>([]);
    const [realtimeData, setRealtimeData] = useState<
        Record<string, RealtimeData>
    >({});
    const [timeseriesData, setTimeseriesData] = useState<
        Record<string, TimeseriesPoint[]>
    >({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleWebSocketMessage = useCallback((data: WebSocketMessage) => {
        if (data.type === "full_update") {
            // Update summary/readings
            if (data.summary) {
                setReadings(data.summary);
            }

            // Update realtime data for all meters
            if (data.realtime) {
                setRealtimeData((prev) => ({ ...prev, ...data.realtime }));
            }

            // Append new timeseries points
            if (data.timeseries_point) {
                setTimeseriesData((prev) => {
                    const updated = { ...prev };
                    Object.entries(data.timeseries_point!).forEach(
                        ([meterName, point]) => {
                            const existing = updated[meterName] || [];
                            // Check if this point already exists (by timestamp)
                            const lastPoint = existing[existing.length - 1];
                            if (
                                !lastPoint ||
                                lastPoint.timestamp !== point.timestamp
                            ) {
                                const newData = [...existing, point];
                                // Keep only the last MAX_TIMESERIES_POINTS
                                updated[meterName] = newData.slice(
                                    -MAX_TIMESERIES_POINTS,
                                );
                            }
                        },
                    );
                    return updated;
                });
            }

            setLoading(false);
        } else if (data.type === "initial_timeseries") {
            // Handle initial timeseries load for a meter
            if (data.meter_name && data.data) {
                setTimeseriesData((prev) => ({
                    ...prev,
                    [data.meter_name]: data.data,
                }));
            }
        }
    }, []);

    const { isConnected, send } = useWebSocket({
        onMessage: handleWebSocketMessage,
        onConnect: () => {
            setError(null);
        },
        onError: () => {
            setError("WebSocket connection error");
        },
    });

    const fetchInitialMeters = async () => {
        try {
            const metersResponse = await api.get<
                { results?: Meter[] } | Meter[]
            >("/api/meters/");
            const metersData = Array.isArray(metersResponse.data)
                ? metersResponse.data
                : metersResponse.data.results || [];
            setMeters(metersData);
        } catch (err) {
            console.error("Error fetching meters:", err);
        }
    };

    const requestTimeseries = useCallback(
        (meterName: string) => {
            send({
                type: "request_timeseries",
                meter_name: meterName,
            });
        },
        [send],
    );

    useEffect(() => {
        fetchInitialMeters();
    }, []);

    const handleRefresh = () => {
        send({ type: "request_update" });
    };

    return (
        <SinglePhaseDashboard
            meters={meters}
            readings={readings}
            realtimeData={realtimeData}
            timeseriesData={timeseriesData}
            loading={loading}
            error={error}
            wsConnected={isConnected}
            onRefresh={handleRefresh}
            onRequestTimeseries={requestTimeseries}
            user={user}
            onLogout={logout}
        />
    );
}
