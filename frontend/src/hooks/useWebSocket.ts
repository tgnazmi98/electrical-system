"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type {
    WebSocketMessage,
    WebSocketOutgoingMessage,
} from "@/types/websocket";

// Heartbeat configuration
const HEARTBEAT_INTERVAL_MS = 25000; // Send ping every 25 seconds
const HEARTBEAT_TIMEOUT_MS = 10000; // Wait 10 seconds for pong response

// Exponential backoff configuration
const BASE_RECONNECT_DELAY_MS = 1000; // Start with 1 second
const MAX_RECONNECT_DELAY_MS = 30000; // Cap at 30 seconds
const MAX_RECONNECT_ATTEMPTS = 10;

interface UseWebSocketOptions {
    onMessage: (data: WebSocketMessage) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Event) => void;
    onMaxRetriesExceeded?: () => void;
}

export function useWebSocket({
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    onMaxRetriesExceeded,
}: UseWebSocketOptions) {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const [isConnected, setIsConnected] = useState(false);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);

    // Store callbacks in refs to avoid dependency issues with React Strict Mode
    const onMessageRef = useRef(onMessage);
    const onConnectRef = useRef(onConnect);
    const onDisconnectRef = useRef(onDisconnect);
    const onErrorRef = useRef(onError);
    const onMaxRetriesExceededRef = useRef(onMaxRetriesExceeded);
    const isMountedRef = useRef(true);

    // Update refs when callbacks change (no dependencies needed)
    useEffect(() => {
        onMessageRef.current = onMessage;
        onConnectRef.current = onConnect;
        onDisconnectRef.current = onDisconnect;
        onErrorRef.current = onError;
        onMaxRetriesExceededRef.current = onMaxRetriesExceeded;
    });

    const stopHeartbeat = useCallback(() => {
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
        }
        if (heartbeatTimeoutRef.current) {
            clearTimeout(heartbeatTimeoutRef.current);
            heartbeatTimeoutRef.current = null;
        }
    }, []);

    const startHeartbeat = useCallback(() => {
        stopHeartbeat();

        heartbeatIntervalRef.current = setInterval(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                // Send ping
                wsRef.current.send(
                    JSON.stringify({
                        type: "ping",
                        timestamp: Date.now(),
                    }),
                );

                // Set timeout waiting for pong
                heartbeatTimeoutRef.current = setTimeout(() => {
                    console.warn(
                        "Heartbeat timeout - no pong received, closing connection",
                    );
                    if (wsRef.current) {
                        wsRef.current.close();
                    }
                }, HEARTBEAT_TIMEOUT_MS);
            }
        }, HEARTBEAT_INTERVAL_MS);
    }, [stopHeartbeat]);

    const getReconnectDelay = useCallback(() => {
        const delay = Math.min(
            BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttemptsRef.current),
            MAX_RECONNECT_DELAY_MS,
        );
        return delay;
    }, []);

    const connect = useCallback(() => {
        if (typeof window === "undefined") return;
        if (!isMountedRef.current) return;

        // Guard against duplicate connections
        if (
            wsRef.current &&
            (wsRef.current.readyState === WebSocket.CONNECTING ||
                wsRef.current.readyState === WebSocket.OPEN)
        ) {
            return;
        }

        const wsProtocol =
            window.location.protocol === "https:" ? "wss:" : "ws:";
        const apiHost = process.env.NEXT_PUBLIC_WS_HOST || window.location.host;
        const wsUrl = `${wsProtocol}//${apiHost}/ws/readings/`;

        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
            if (!isMountedRef.current) return;
            console.log("WebSocket connected");
            setIsConnected(true);
            // Reset reconnect attempts on successful connection
            reconnectAttemptsRef.current = 0;
            setReconnectAttempts(0);
            // Start heartbeat
            startHeartbeat();
            onConnectRef.current?.();
        };

        wsRef.current.onmessage = (event: MessageEvent) => {
            if (!isMountedRef.current) return;
            try {
                const data = JSON.parse(event.data) as WebSocketMessage;

                // Handle pong response - clear heartbeat timeout
                if (data.type === "pong") {
                    if (heartbeatTimeoutRef.current) {
                        clearTimeout(heartbeatTimeoutRef.current);
                        heartbeatTimeoutRef.current = null;
                    }
                    return;
                }

                onMessageRef.current(data);
            } catch (err) {
                console.error("Error parsing WebSocket message:", err);
            }
        };

        wsRef.current.onerror = (err: Event) => {
            if (!isMountedRef.current) return;
            console.error("WebSocket error:", err);
            setIsConnected(false);
            onErrorRef.current?.(err);
        };

        wsRef.current.onclose = () => {
            if (!isMountedRef.current) return;
            setIsConnected(false);
            stopHeartbeat();
            onDisconnectRef.current?.();

            // Check if we've exceeded max reconnect attempts
            if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
                console.error(
                    `Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) exceeded`,
                );
                onMaxRetriesExceededRef.current?.();
                return;
            }

            const delay = getReconnectDelay();
            console.log(
                `WebSocket disconnected, reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`,
            );
            reconnectAttemptsRef.current += 1;
            setReconnectAttempts(reconnectAttemptsRef.current);
            reconnectTimeoutRef.current = setTimeout(connect, delay);
        };
    }, [startHeartbeat, stopHeartbeat, getReconnectDelay]);

    const disconnect = useCallback(() => {
        stopHeartbeat();
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        if (wsRef.current) {
            // Only close if the socket is OPEN or CONNECTING
            if (
                wsRef.current.readyState === WebSocket.OPEN ||
                wsRef.current.readyState === WebSocket.CONNECTING
            ) {
                wsRef.current.close();
            }
            wsRef.current = null;
        }
    }, [stopHeartbeat]);

    const send = useCallback((message: WebSocketOutgoingMessage) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
    }, []);

    const resetConnection = useCallback(() => {
        if (!isMountedRef.current) return;
        reconnectAttemptsRef.current = 0;
        setReconnectAttempts(0);
        disconnect();
        connect();
    }, [disconnect, connect]);

    useEffect(() => {
        isMountedRef.current = true;
        connect();
        return () => {
            isMountedRef.current = false;
            disconnect();
        };
        // Empty dependency array - we use refs for callbacks so this is stable
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        isConnected,
        send,
        disconnect,
        reconnectAttempts,
        resetConnection,
    };
}
