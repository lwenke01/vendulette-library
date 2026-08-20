import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  seasonsGet,
  seasonByIdGet,
  seasonByYearGet,
  seasonCurrentGet,
  seasonPost,
  seasonPut,
  seasonDelete,
  seasonReorderPost,
  vendulaCollectionsGet,
  vendulaCollectionById,
  vendulaCollectionsPost,
  vendulaCollectionsPut,
  vendulaDesignsGet,
  vendulaDesignsPost,
  vendulaDesignsPut,
  vendulaShapesGet,
  vendulaShapesPost,
  vendulaShapesPut,
} from './vendula.handler'

const apiHandler = new Hono<HonoENV>()

const _routes = apiHandler.get('/check', (c) => {
  return c.json({ status: 'ok' }, 200)
})

export type RPC = typeof _routes

export const setHandlers = (app: Hono<HonoENV>) => {
  app.on(['POST', 'GET'], '/api/auth/**', (c) => {
    const auth = c.get('auth')
    return auth.handler(c.req.raw)
  })

  apiHandler.use(
    '*',
    cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    })
  )

  // Seasons
  apiHandler.get('/seasons', ...seasonsGet)
  apiHandler.get('/seasons/:id', ...seasonByIdGet)
  apiHandler.get('/seasons/year/:year', ...seasonByYearGet)
  apiHandler.get('/seasons/current', ...seasonCurrentGet)
  apiHandler.post('/seasons', ...seasonPost)
  apiHandler.put('/admin/seasons/:id', ...seasonPut)
  apiHandler.delete('/admin/seasons/:id', ...seasonDelete)
  apiHandler.post('/admin/seasons/reorder', ...seasonReorderPost)

  // Collections
  apiHandler.get('/collections', ...vendulaCollectionsGet)
  apiHandler.get('/collections/:id', ...vendulaCollectionById)
  apiHandler.post('/collections', ...vendulaCollectionsPost)
  apiHandler.put('/admin/collections/:id', ...vendulaCollectionsPut)

  // Designs
  apiHandler.get('/designs', ...vendulaDesignsGet)
  apiHandler.post('/designs', ...vendulaDesignsPost)
  apiHandler.put('/admin/designs/:id', ...vendulaDesignsPut)

  // Shapes
  apiHandler.get('/shapes', ...vendulaShapesGet)
  apiHandler.post('/shapes', ...vendulaShapesPost)
  apiHandler.put('/admin/shapes/:id', ...vendulaShapesPut)

  app.route('/api', apiHandler)
  return app
}