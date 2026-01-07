/**
 * @file docker.ts
 * @description Docker API proxy endpoints using stable Zod patterns
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { dockerService } from '../services/docker.service';
import { logger } from '../utils/logger';

// --- SCHEMATY ZOD ---

const containerSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string(),
  status: z.string(),
  state: z.string(),
  ports: z.array(z.object({
    privatePort: z.number(),
    publicPort: z.number().optional().nullable(),
    type: z.string(),
  })),
  // Używamy z.any() dla pola daty, ponieważ Fastify automatycznie 
  // zamieni obiekt Date na string ISO podczas wysyłania odpowiedzi.
  created: z.any(), 
});

const containerStatsSchema = z.object({
  cpuUsage: z.number(),
  memoryUsage: z.number(),
  memoryLimit: z.number(),
  networkIO: z.object({
    rxBytes: z.number(),
    txBytes: z.number(),
  }),
});

const dockerSystemInfoSchema = z.object({
  containers: z.number(),
  images: z.number(),
  volumes: z.number(),
  networks: z.number(),
});

const containerActionSchema = z.object({
  action: z.enum(['start', 'stop', 'restart']),
});

const dockerQuerySchema = z.object({
  // Zamiast preprocess używamy z.coerce, co jest standardem w Fastify Type Provider Zod.
  // Automatycznie konwertuje stringi "true"/"false" z URL na wartości boolean.
  all: z.coerce.boolean().optional().default(false),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

// --- ROUTY ---

export default async function dockerRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/docker/containers
   * Pobiera listę kontenerów
   */
  fastify.get('/docker/containers', {
    schema: {
      tags: ['Docker'],
      summary: 'List containers',
      querystring: dockerQuerySchema,
      response: {
        200: z.array(containerSchema),
      },
    },
  }, async (request, reply) => {
    const { all, limit } = request.query;
    
    try {
      const containers = await dockerService.listContainers(all);
      const limitedContainers = limit ? containers.slice(0, limit) : containers;
      return reply.send(limitedContainers);
    } catch (error) {
      logger.error('Failed to fetch Docker containers:', error);
      return reply.code(500).send({ error: 'Failed to fetch Docker containers' });
    }
  });

  /**
   * GET /api/docker/containers/:id/stats
   * Pobiera statystyki konkretnego kontenera
   */
  fastify.get('/docker/containers/:id/stats', {
    schema: {
      tags: ['Docker'],
      summary: 'Get container stats',
      params: z.object({ id: z.string() }),
      response: {
        200: containerStatsSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    
    try {
      const stats = await dockerService.getContainerStats(id);
      return reply.send(stats);
    } catch (error) {
      logger.error(`Failed to fetch container stats for ${id}:`, error);
      return reply.code(500).send({ error: 'Failed to fetch container stats' });
    }
  });

  /**
   * POST /api/docker/containers/:id/action
   * Wykonuje akcję (start/stop/restart) na kontenerze
   */
  fastify.post('/docker/containers/:id/action', {
    schema: {
      tags: ['Docker'],
      summary: 'Container action',
      params: z.object({ id: z.string() }),
      body: containerActionSchema,
      response: {
        200: z.object({
          success: z.boolean(),
          message: z.string(),
        }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const { action } = request.body;
    
    try {
      switch (action) {
        case 'start': await dockerService.startContainer(id); break;
        case 'stop': await dockerService.stopContainer(id); break;
        case 'restart': await dockerService.restartContainer(id); break;
      }
      
      return reply.send({
        success: true,
        message: `Container ${action}ed successfully`,
      });
    } catch (error) {
      logger.error(`Failed to ${action} container ${id}:`, error);
      return reply.code(500).send({ error: `Failed to ${action} container` });
    }
  });

  /**
   * GET /api/docker/system
   * Pobiera ogólne informacje o systemie Docker
   */
  fastify.get('/docker/system', {
    schema: {
      tags: ['Docker'],
      summary: 'Docker system info',
      response: {
        200: dockerSystemInfoSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const systemInfo = await dockerService.getSystemInfo();
      return reply.send(systemInfo);
    } catch (error) {
      logger.error('Failed to fetch Docker system info:', error);
      return reply.code(500).send({ error: 'Failed to fetch Docker system info' });
    }
  });
}