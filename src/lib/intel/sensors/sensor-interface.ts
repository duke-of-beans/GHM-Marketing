// src/lib/intel/sensors/sensor-interface.ts
// Intelligence Engine — Sprint IE-02
// Defines the contract every sensor must implement + the sensor registry.

export interface SensorCollectParams {
  target: {
    domain: string;
    googlePlaceId?: string;
  };
  credentials: Record<string, string>;
  previousMetrics?: Record<string, unknown>;
}

export interface SensorResult {
  sensorId: string;
  success: boolean;
  metrics: Record<string, unknown>;
  cost?: number;
  error?: string;
  collectedAt: Date;
}

export interface SensorInterface {
  sensorId: string;
  displayName: string;
  /** Vertical IDs this sensor is valid for */
  verticals: string[];
  /** Whether the sensor requires stored credentials to run */
  requiresCredentials: boolean;
  collect(params: SensorCollectParams): Promise<SensorResult>;
}

// ── Sensor Registry ─────────────────────────────────────────────────────────
// Lazy-loaded to avoid importing all sensors on every module load.

const REGISTRY: Record<string, () => SensorInterface> = {};
let registryBootstrapped = false;

async function bootstrapRegistry(): Promise<void> {
  if (registryBootstrapped) return;
  const [{ PageSpeedSensor }, { AhrefsSensor }] = await Promise.all([
    import("./pagespeed"),
    import("./ahrefs"),
  ]);
  REGISTRY["pagespeed"] = () => new PageSpeedSensor();
  REGISTRY["ahrefs"] = () => new AhrefsSensor();
  registryBootstrapped = true;
}

export async function getSensor(
  sensorId: string
): Promise<SensorInterface | null> {
  await bootstrapRegistry();
  const factory = REGISTRY[sensorId];
  if (!factory) return null;
  return factory();
}

export async function getAllSensorIds(): Promise<string[]> {
  await bootstrapRegistry();
  return Object.keys(REGISTRY);
}
