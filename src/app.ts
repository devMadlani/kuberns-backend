import cors from 'cors';
import express, { Router } from 'express';

import asyncHandler from './middlewares/asyncHandler';
import errorMiddleware from './middlewares/error.middleware';
import notFoundMiddleware from './middlewares/notfound.middleware';
import gitRouter from './modules/git/git.routes';

const app = express();
const routes = Router();

app.use(cors());
app.use(express.json());

routes.get(
  '/health',
  asyncHandler(async (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Service is healthy',
      data: {
        status: 'OK',
      },
    });
  }),
);

app.use(routes);
app.use('/git', gitRouter);
app.use('/api', gitRouter);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
