/**
 * HackTracker-style Device Telemetry
 * Tracks phone vs laptop usage time — this data feeds the 25% automatic scoring
 *
 * How it works:
 * - Detects device type (mobile vs desktop)
 * - Tracks session duration on each device
 * - Logs interaction types (touch, click, scroll, keystroke)
 * - Calculates phone-first percentage for hackathon scoring
 * - Stores data in localStorage for persistence across sessions
 */
import { useState, useEffect, useCallback, useRef } from 'react';

interface TelemetryData {
  sessionId: string;
  startTime: number;
  deviceType: 'phone' | 'laptop' | 'tablet';
  phoneTimeMs: number;
  laptopTimeMs: number;
  tabletTimeMs: number;
  interactions: InteractionLog[];
  phoneFirstPercentage: number;
  totalInteractions: number;
  phoneInteractions: number;
  lastHeartbeat: number;
}

interface InteractionLog {
  timestamp: number;
  type: 'touch' | 'click' | 'scroll' | 'keystroke' | 'voice' | 'camera';
  device: 'phone' | 'laptop' | 'tablet';
}

type DeviceType = 'phone' | 'laptop' | 'tablet';

function detectDevice(): DeviceType {
  if (typeof navigator === 'undefined') return 'laptop';
  const ua = navigator.userAgent;
  if (/android|iphone|ipad|ipod|mobile/i.test(ua)) {
    if (/ipad/i.test(ua)) return 'tablet';
    return 'phone';
  }
  return 'laptop';
}

function getStorageKey(): string {
  return `pranaai_telemetry_${new Date().toISOString().split('T')[0]}`;
}

function loadTelemetry(): TelemetryData | null {
  try {
    const data = localStorage.getItem(getStorageKey());
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveTelemetry(data: TelemetryData): void {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(data));
  } catch {
    // Storage full — ignore
  }
}

export function useDeviceTelemetry() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [currentDevice, setCurrentDevice] = useState<DeviceType>('laptop');
  const lastSwitchRef = useRef<number>(Date.now());
  const deviceRef = useRef<DeviceType>('laptop');

  // Initialize telemetry session
  useEffect(() => {
    const existing = loadTelemetry();
    if (existing) {
      setTelemetry(existing);
      setCurrentDevice(existing.deviceType);
      deviceRef.current = existing.deviceType;
      lastSwitchRef.current = Date.now();
      return;
    }

    const device = detectDevice();
    const session: TelemetryData = {
      sessionId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      startTime: Date.now(),
      deviceType: device,
      phoneTimeMs: 0,
      laptopTimeMs: 0,
      tabletTimeMs: 0,
      interactions: [],
      phoneFirstPercentage: device === 'phone' ? 100 : 0,
      totalInteractions: 0,
      phoneInteractions: 0,
      lastHeartbeat: Date.now(),
    };

    setTelemetry(session);
    setCurrentDevice(device);
    deviceRef.current = device;
    saveTelemetry(session);
  }, []);

  // Track device switches (when user moves from phone to laptop or vice versa)
  useEffect(() => {
    const handleVisibilityChange = () => {
      // When tab becomes visible again, check if device changed
      const newDevice = detectDevice();
      if (newDevice !== deviceRef.current) {
        const now = Date.now();
        const elapsed = now - lastSwitchRef.current;

        setTelemetry(prev => {
          if (!prev) return prev;
          const updated = { ...prev };

          // Add time to the previous device
          switch (deviceRef.current) {
            case 'phone': updated.phoneTimeMs += elapsed; break;
            case 'laptop': updated.laptopTimeMs += elapsed; break;
            case 'tablet': updated.tabletTimeMs += elapsed; break;
          }

          updated.deviceType = newDevice;
          updated.phoneFirstPercentage = Math.round(
            (updated.phoneTimeMs / (updated.phoneTimeMs + updated.laptopTimeMs + updated.tabletTimeMs + 1)) * 100
          );

          saveTelemetry(updated);
          return updated;
        });

        deviceRef.current = newDevice;
        lastSwitchRef.current = now;
        setCurrentDevice(newDevice);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Log interactions
  const logInteraction = useCallback((type: InteractionLog['type']) => {
    const device = detectDevice();
    const log: InteractionLog = {
      timestamp: Date.now(),
      type,
      device,
    };

    setTelemetry(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        interactions: [...prev.interactions.slice(-100), log], // Keep last 100
        totalInteractions: prev.totalInteractions + 1,
        phoneInteractions: prev.phoneInteractions + (device === 'phone' ? 1 : 0),
        lastHeartbeat: Date.now(),
      };
      saveTelemetry(updated);
      return updated;
    });
  }, []);

  // Auto-heartbeat every 30s to track active time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      setTelemetry(prev => {
        if (!prev) return prev;
        const updated = { ...prev, lastHeartbeat: now };

        switch (deviceRef.current) {
          case 'phone': updated.phoneTimeMs += 30000; break;
          case 'laptop': updated.laptopTimeMs += 30000; break;
          case 'tablet': updated.tabletTimeMs += 30000; break;
        }

        updated.phoneFirstPercentage = Math.round(
          (updated.phoneTimeMs / (updated.phoneTimeMs + updated.laptopTimeMs + updated.tabletTimeMs + 1)) * 100
        );

        saveTelemetry(updated);
        return updated;
      });

      lastSwitchRef.current = now;
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Get formatted telemetry for display
  const getFormattedData = useCallback(() => {
    if (!telemetry) return null;

    const totalTime = telemetry.phoneTimeMs + telemetry.laptopTimeMs + telemetry.tabletTimeMs;
    const formatMs = (ms: number) => {
      const minutes = Math.floor(ms / 60000);
      const hours = Math.floor(minutes / 60);
      if (hours > 0) return `${hours}h ${minutes % 60}m`;
      return `${minutes}m`;
    };

    return {
      sessionId: telemetry.sessionId,
      deviceType: currentDevice,
      phoneTime: formatMs(telemetry.phoneTimeMs),
      laptopTime: formatMs(telemetry.laptopTimeMs),
      tabletTime: formatMs(telemetry.tabletTimeMs),
      totalTime: formatMs(totalTime),
      phoneFirstPercentage: telemetry.phoneFirstPercentage,
      totalInteractions: telemetry.totalInteractions,
      phoneInteractions: telemetry.phoneInteractions,
      phoneInteractionPercentage: telemetry.totalInteractions > 0
        ? Math.round((telemetry.phoneInteractions / telemetry.totalInteractions) * 100)
        : 0,
      interactionBreakdown: {
        touch: telemetry.interactions.filter(i => i.type === 'touch').length,
        click: telemetry.interactions.filter(i => i.type === 'click').length,
        scroll: telemetry.interactions.filter(i => i.type === 'scroll').length,
        keystroke: telemetry.interactions.filter(i => i.type === 'keystroke').length,
        voice: telemetry.interactions.filter(i => i.type === 'voice').length,
        camera: telemetry.interactions.filter(i => i.type === 'camera').length,
      },
    };
  }, [telemetry, currentDevice]);

  // Export telemetry as JSON (for hackathon submission)
  const exportTelemetry = useCallback(() => {
    const data = getFormattedData();
    if (!data) return null;
    return JSON.stringify(data, null, 2);
  }, [getFormattedData]);

  return {
    telemetry,
    currentDevice,
    logInteraction,
    getFormattedData,
    exportTelemetry,
  };
}
