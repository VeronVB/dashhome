/**
 * @file system.ts
 * @description System statistics endpoints using Zod schemas
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { cacheService } from '../services/cache.service';
import os from 'os';
import fs from 'fs/promises';

// --- SCHEMATY ZOD ---

const systemStatsSchema = z.object({
  cpu: z.object({
    usage: z.number(),
    cores: z.number(),
    loadAverage: z.array(z.number()),
  }),
  ram: z.object({
    used: z.number(),
    total: z.number(),
    percentage: z.number(),
  }),
  disk: z.object({
    used: z.number(),
    total: z.number(),
    percentage: z.number(),
    available: z.number(),
  }),
  temp: z.object({
    value: z.number().nullable(),
    unit: z.enum(['C', 'F']),
  }),
  uptime: z.number(),
  hostname: z.string(),
  platform: z.string(),
  arch: z.string(),
});

const systemInfoSchema = z.object({
  hostname: z.string(),
  platform: z.string(),
  arch: z.string(),
  nodeVersion: z.string(),
  cpus: z.array(z.object({
    model: z.string(),
    speed: z.number(),
  })),
});

// --- FUNKCJE POMOCNICZE ---

async function readCpuUsage(): Promise<number> {
  try {
    const statContent = await fs.readFile('/proc/stat', 'utf8');
    const lines = statContent.split('\n');
    const values = lines[0].split(/\s+/).slice(1).map(Number);
    const [user, nice, system, idle, iowait, irq, softirq] = values;
    const total = user + nice + system + idle + iowait + irq + softirq;
    const used = total - idle;
    return Math.round((used / total) * 100);
  } catch {
    const cpus = os.cpus();
    const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
    const totalTick = cpus.reduce((acc, cpu) => acc + Object.values(cpu.times).reduce((a, b) => a + b), 0);
    return Math.round(((totalTick - totalIdle) / totalTick) * 100);
  }
}

async function readTemperature(): Promise<number | null> {
  const tempPaths = [
    '/sys/class/thermal/thermal_zone0/temp',
    '/sys/class/hwmon/hwmon0/temp1_input',
  ];
  for (const path of tempPaths) {
    try {
      const tempRaw = await fs.readFile(path, 'utf8');
      return Math.round(parseInt(tempRaw.trim()) / 1000);
    } catch { continue; }
  }
  return null;
}

async function getDiskUsage() {
  // Wersja uproszczona - w środowisku produkcyjnym warto użyć biblioteki 'check-disk-space'
  return { total: 512 * 1e9, used: 120 * 1e9, available: 392 * 1e9 };
}

// --- ROUTY ---

export default async function systemRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/system/stats
   */
  fastify.get('/system/stats', async (request, reply) => {
    const cacheKey = 'system:stats';
    const cached = await cacheService.get(cacheKey);
    if (cached) return reply.send(cached);

    try {
      const totalMem = os.totalmem();
      const usedMem = totalMem - os.freemem();
      const disk = await getDiskUsage();

      const stats = {
        cpu: {
          usage: await readCpuUsage(),
          cores: os.cpus().length,
          loadAverage: os.loadavg(),
        },
        ram: {
          used: Math.round(usedMem / (1024 ** 3) * 100) / 100,
          total: Math.round(totalMem / (1024 ** 3) * 100) / 100,
          percentage: Math.round((usedMem / totalMem) * 100),
        },
        disk: {
          used: Math.round(disk.used / (1024 ** 3)),
          total: Math.round(disk.total / (1024 ** 3)),
          percentage: Math.round((disk.used / disk.total) * 100),
          available: Math.round(disk.available / (1024 ** 3)),
        },
        temp: {
          value: await readTemperature(),
          unit: 'C' as const,
        },
        uptime: Math.round(os.uptime()),
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
      };

      // Walidacja Zod przed wysłaniem
      const result = systemStatsSchema.parse(stats);
      await cacheService.set(cacheKey, result, 5);
      return reply.send(result);
    } catch (error) {
      logger.error('Failed to get system stats:', error);
      return reply.code(500).send({ error: 'Failed to fetch system statistics' });
    }
  });

  /**
   * GET /api/system/info
   */
  fastify.get('/system/info', async (request, reply) => {
    const info = {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      cpus: os.cpus().map(cpu => ({
        model: cpu.model,
        speed: cpu.speed,
      })),
    };

    return reply.send(systemInfoSchema.parse(info));
  });
}