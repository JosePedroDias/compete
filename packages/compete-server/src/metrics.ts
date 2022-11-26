/**
 * basic metrics module which will be exposed at GET /metrics
 * used some code from https://github.com/siimon/prom-client/tree/master/lib/metrics
 */

const startTime = new Date();
let numConnections = 0;
let numRooms = 0;
let totalConnections = 0;
let totalRooms = 0;

export function getStartTime(): Date {
  return startTime;
}

export function getUptime(): number {
  return Math.round((Date.now() - startTime.valueOf()) / 1000);
}

export function increaseNumConnections() {
  ++numConnections;
  ++totalConnections;
}

export function increaseNumRooms() {
  ++numRooms;
  ++totalRooms;
}

export function decreaseNumConnections() {
  --numConnections;
}

export function decreaseNumRooms() {
  --numRooms;
}

/**
 * Gets application-related stats
 */
export function getAppStats() {
  return {
    connections: numConnections,
    rooms: numRooms,
    totalConnections,
    totalRooms,
  };
}

/**
 * Gets nodejs-related stats
 */
export function getNodeStats() {
  // cpu
  const cpuUsage = process.cpuUsage();
  const userUsageMicros = cpuUsage.user / 1e6;
  const systemUsageMicros = cpuUsage.system / 1e6;
  const cpuUsageCounter = userUsageMicros + systemUsageMicros;

  // memory
  const memUsage = process.memoryUsage();
  const heapTotal = memUsage.heapTotal;
  const heapUsed = memUsage.heapUsed;

  return {
    cpu: {
      user: userUsageMicros,
      system: systemUsageMicros,
      all: cpuUsageCounter,
    },
    memory: {
      heapTotal,
      heapUsed,
    },
    startTime,
    uptime: getUptime(),
  };
}

/**
 * Gets all stats
 */
export function getStats() {
  return {
    app: getAppStats(),
    node: getNodeStats(),
  };
}
