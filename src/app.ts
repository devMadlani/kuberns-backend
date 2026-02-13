import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Router } from 'express';

import { FRONTEND_URL } from './config/env';
import asyncHandler from './middlewares/asyncHandler';
import errorMiddleware from './middlewares/error.middleware';
import notFoundMiddleware from './middlewares/notfound.middleware';
import authRouter from './modules/auth/auth.routes';
import deploymentRouter from './modules/deployment/deployment.routes';
import gitRouter from './modules/git/git.routes';
import webAppRouter from './modules/webapp/webapp.routes';

const app = express();
const routes = Router();

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);
app.use(cookieParser());
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
app.use('/auth', authRouter);
app.use('/api/auth', authRouter);
app.use('/git', gitRouter);
app.use('/api', gitRouter);
app.use('/webapps', webAppRouter);
app.use('/api/webapps', webAppRouter);
app.use('/', deploymentRouter);
app.use('/api', deploymentRouter);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
