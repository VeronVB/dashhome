import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '../db/client';
import { widgets } from '../db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';

const widgetQuerySchema = z.object({
  type: z.enum(['system-stats', 'docker-quick', 'pihole-stats', 'qbittorrent-stats', 'notes']).optional(),
});

const widgetParamsSchema = z.object({
  id: z.string().uuid(),
});

const widgetBodySchema = z.object({
  type: z.enum(['system-stats', 'docker-quick', 'pihole-stats', 'qbittorrent-stats', 'notes']),
  config: z.record(z.any()),
  position: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }),
});

export default async function widgetRoutes(fastify: FastifyInstance) {
  // GET /widgets
  fastify.get('/widgets', async (request, reply) => {
    const query = widgetQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ error: 'Invalid query parameters' });
    }
    
    try {
      const db = getDb();
      let widgetList;
      
      if (query.data.type) {
        widgetList = await db.select().from(widgets).where(eq(widgets.type, query.data.type));
      } else {
        widgetList = await db.select().from(widgets);
      }
      
      reply.send(widgetList);
    } catch (error) {
      logger.error('Failed to fetch widgets:', error);
      reply.code(500).send({ error: 'Failed to fetch widgets' });
    }
  });

  // POST /widgets
  fastify.post('/widgets', async (request, reply) => {
    const body = widgetBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'Invalid request body', details: body.error });
    }
    
    try {
      const db = getDb();
      const [newWidget] = await db.insert(widgets).values(body.data).returning();
      logger.info(`Widget created: ${newWidget.id} (${newWidget.type})`);
      reply.code(201).send(newWidget);
    } catch (error) {
      logger.error('Failed to create widget:', error);
      reply.code(500).send({ error: 'Failed to create widget' });
    }
  });

  // GET /widgets/:id
  fastify.get('/widgets/:id', async (request, reply) => {
    const params = widgetParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'Invalid widget ID' });
    }
    
    try {
      const db = getDb();
      const [widget] = await db.select().from(widgets).where(eq(widgets.id, params.data.id));
      
      if (!widget) {
        return reply.code(404).send({ error: 'Widget not found' });
      }
      
      reply.send(widget);
    } catch (error) {
      logger.error(`Failed to fetch widget ${params.data.id}:`, error);
      reply.code(500).send({ error: 'Failed to fetch widget' });
    }
  });

  // PUT /widgets/:id
  fastify.put('/widgets/:id', async (request, reply) => {
    const params = widgetParamsSchema.safeParse(request.params);
    const body = widgetBodySchema.partial().safeParse(request.body);
    
    if (!params.success) {
      return reply.code(400).send({ error: 'Invalid widget ID' });
    }
    if (!body.success) {
      return reply.code(400).send({ error: 'Invalid request body' });
    }
    
    try {
      const db = getDb();
      const [updatedWidget] = await db
        .update(widgets)
        .set({ ...body.data, updatedAt: new Date() })
        .where(eq(widgets.id, params.data.id))
        .returning();
      
      if (!updatedWidget) {
        return reply.code(404).send({ error: 'Widget not found' });
      }
      
      logger.info(`Widget updated: ${updatedWidget.id}`);
      reply.send(updatedWidget);
    } catch (error) {
      logger.error(`Failed to update widget ${params.data.id}:`, error);
      reply.code(500).send({ error: 'Failed to update widget' });
    }
  });

  // DELETE /widgets/:id
  fastify.delete('/widgets/:id', async (request, reply) => {
    const params = widgetParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'Invalid widget ID' });
    }
    
    try {
      const db = getDb();
      const [deletedWidget] = await db.delete(widgets).where(eq(widgets.id, params.data.id)).returning();
      
      if (!deletedWidget) {
        return reply.code(404).send({ error: 'Widget not found' });
      }
      
      logger.info(`Widget deleted: ${params.data.id}`);
      reply.code(204).send();
    } catch (error) {
      logger.error(`Failed to delete widget ${params.data.id}:`, error);
      reply.code(500).send({ error: 'Failed to delete widget' });
    }
  });
}