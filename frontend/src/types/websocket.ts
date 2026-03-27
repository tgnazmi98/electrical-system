import type { RealtimeData, TimeseriesPoint, MeterSummary } from "./meter";

export interface WebSocketFullUpdate {
    type: "full_update";
    summary?: MeterSummary[];
    realtime?: Record<string, RealtimeData>;
    timeseries_point?: Record<string, TimeseriesPoint>;
}

export interface WebSocketInitialTimeseries {
    type: "initial_timeseries";
    meter_name: string;
    data: TimeseriesPoint[];
}

export interface WebSocketPong {
    type: "pong";
    timestamp: number;
    server_time: string;
}

export type WebSocketMessage =
    | WebSocketFullUpdate
    | WebSocketInitialTimeseries
    | WebSocketPong;

export type WebSocketOutgoingMessage =
    | { type: "request_update" }
    | { type: "request_timeseries"; meter_name: string }
    | { type: "ping"; timestamp: number };
