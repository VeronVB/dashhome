// apps/api/src/routes/widgets.ts - POPRAWIONY

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../db/client';
import { widgets } from '../db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';

// --- SCHEMATY ZOD ---

const widgetPositionSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1),
  h: z.number().int().min(1),
});

const widgetTypeSchema = z.enum([
  'system-stats',
  'docker-quick',
  'pihole-stats',
  'qbittorrent-stats',
  'notes',
]);

const widgetConfigSchema = z.record(z.any());

const widgetQuerySchema = z.object({
  type: widgetTypeSchema.optional(),
});

const widgetParamsSchema = z.object({
  id: z.string().uuid(),
});

const widgetBodySchema = z.object({
  type: widgetTypeSchema,
  config: widgetConfigSchema,
  position: widgetPositionSchema,
});

// ✅ KLUCZ: Używaj z.string() zamiast z.date() w response schemas
const widgetResponseSchema = z.object({
  id: z.string().uuid(),
  type: widgetTypeSchema,
  config: widgetConfigSchema,
  position: widgetPositionSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Helper do serializacji
function serializeWidget(widget: any) {
  return {
    ...widget,
    createdAt: widget.createdAt instanceof Date ? widget.createdAt.toISOString() : widget.createdAt,
    updatedAt: widget.updatedAt instanceof Date ? widget.updatedAt.toISOString() : widget.updatedAt,
  };
}

// --- ROUTY (BEZ schema w route definition) ---

export default async function widgetRoutes(fastify: FastifyInstance) {
  // GET /widgets - BEZ SCHEMA
  fastify.get('/widgets', async (request, reply) => {
    try {
      const db = getDb();
      const widgetList = await db.select().from(widgets);
      return widgetList.map(serializeWidget);
    } catch (error) {
      logger.error('Failed to fetch widgets:', error);
      return reply.code(500).send({ error: 'Failed to fetch widgets' });
    }
  });

  // POST /widgets - BEZ SCHEMA
  fastify.post('/widgets', async (request, reply) => {
    // Manualna walidacja
    const result = widgetBodySchema.safeParse(request.body);
    if (!result.success) {
      return reply.code(400).send({ 
        error: 'Validation failed', 
        details: result.error.issues 
      });
    }
    
    try {
      const db = getDb();
      const [newWidget] = await db.insert(widgets).values(result.data).returning();
      
      logger.info(`Widget created: ${newWidget.id}`);
      return reply.code(201).send(serializeWidget(newWidget));
    } catch (error) {
      logger.error('Failed to create widget:', error);
      return reply.code(500).send({ error: 'Failed to create widget' });
    }
  });

  // GET /widgets/:id
  fastify.get('/widgets/:id', async (request, reply) => {
    const result = widgetParamsSchema.safeParse(request.params);
    if (!result.success) {
      return reply.code(400).send({ error: 'Invalid widget ID' });
    }
    
    const { id } = result.data;
    
    try {
      const db = getDb();
      const [widget] = await db.select().from(widgets).where(eq(widgets.id, id));
      
      if (!widget) {
        return reply.code(404).send({ error: 'Widget not found' });
      }
      
      return serializeWidget(widget);
    } catch (error) {
      logger.error(`Failed to fetch widget ${id}:`, error);
      return reply.code(500).send({ error: 'Failed to fetch widget' });
    }
  });

  // PUT /widgets/:id
  fastify.put('/widgets/:id', async (request, reply) => {
    const paramsResult = widgetParamsSchema.safeParse(request.params);
    if (!paramsResult.success) {
      return reply.code(400).send({ error: 'Invalid widget ID' });
    }
    
    const bodyResult = widgetBodySchema.partial().safeParse(request.body);
    if (!bodyResult.success) {
      return reply.code(400).send({ 
        error: 'Validation failed', 
        details: bodyResult.error.issues 
      });
    }
    
    const { id } = paramsResult.data;
    const body = bodyResult.data;
    
    try {
      const db = getDb();
      const [updatedWidget] = await db
        .update(widgets)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(widgets.id, id))
        .returning();
      
      if (!updatedWidget) {
        return reply.code(404).send({ error: 'Widget not found' });
      }
      
      logger.info(`Widget updated: ${id}`);
      return serializeWidget(updatedWidget);
    } catch (error) {
      logger.error(`Failed to update widget ${id}:`, error);
      return reply.code(500).send({ error: 'Failed to update widget' });
    }
  });

  // DELETE /widgets/:id
  fastify.delete('/widgets/:id', async (request, reply) => {
    const result = widgetParamsSchema.safeParse(request.params);
    if (!result.success) {
      return reply.code(400).send({ error: 'Invalid widget ID' });
    }
    
    const { id } = result.data;
    
    try {
      const db = getDb();
      const [deleted] = await db.delete(widgets).where(eq(widgets.id, id)).returning();
      
      if (!deleted) {
        return reply.code(404).send({ error: 'Widget not found' });
      }
      
      logger.info(`Widget deleted: ${id}`);
      return reply.code(204).send();
    } catch (error) {
      logger.error(`Failed to delete widget ${id}:`, error);
      return reply.code(500).send({ error: 'Failed to delete widget' });
    }
  });
}