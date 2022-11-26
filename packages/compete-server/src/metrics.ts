/**
 * basic metrics module which will be exposed at GET /metrics
 * used some code from https://github.com/siimon/prom-client/tree/master/lib/metrics
 */

import { monitorEventLoopDelay } from 'node:perf_hooks';

const startTime = new Date();
let numConnections = 0;
let numRooms = 0;
let totalConnections = 0;
let totalRooms = 0;

const histogram = monitorEventLoopDelay({
  resolution: 20, // in ms
});
histogram.enable();
let eventLoopLagSeconds = 0;

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

function _reportEventLoopLag(start: [number, number]) {
  const delta = process.hrtime(start);
  const nanoSecs = delta[0] * 1e9 + delta[1];
  eventLoopLagSeconds = nanoSecs / 1e9;
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

  // event loop
  // https://nodejs.org/api/perf_hooks.html#perf_hooksmonitoreventloopdelayoptions

  setImmediate(_reportEventLoopLag, process.hrtime());

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
    eventLoopLag: {
      min: histogram.min / 1e9,
      max: histogram.max / 1e9,
      mean: histogram.mean / 1e9,
      stddev: histogram.stddev / 1e9,
      p50: histogram.percentile(50) / 1e9,
      p90: histogram.percentile(90) / 1e9,
      p99: histogram.percentile(99) / 1e9,
      eventLoopLagSeconds,
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
