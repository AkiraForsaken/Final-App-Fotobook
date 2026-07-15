import { Router } from 'express';
import { photosRouter } from './photos.routes.js';
import { feedRouter, discoveryRouter } from './feed.routes.js';
import { albumsRouter } from './albums.routes.js';
import { authRouter } from './auth.routes.js';
import { usersRouter } from './users.routes.js';
import { adminRouter } from './admin.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/photos', photosRouter);
apiRouter.use('/albums', albumsRouter);
apiRouter.use('/feed', feedRouter);
apiRouter.use('/discovery', discoveryRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/admin', adminRouter);
