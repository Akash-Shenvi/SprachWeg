import express from 'express';
import { createWebinar, getAdminWebinars, getPublicWebinars, getTrainerAssignedWebinars, getWebinarBySlug, updateWebinar } from '../controllers/webinar.controller';
import { authorize, isAdmin, isAuth } from '../middlewares/auth.middleware';

const router = express.Router();

router.get('/', getPublicWebinars);
router.get('/admin', isAuth, isAdmin, getAdminWebinars);
router.get('/trainer/assigned', isAuth, authorize('trainer'), getTrainerAssignedWebinars);
router.post('/admin', isAuth, isAdmin, createWebinar);
router.put('/admin/:id', isAuth, isAdmin, updateWebinar);
router.get('/:slug', getWebinarBySlug);

export default router;
