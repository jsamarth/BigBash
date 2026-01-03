import { Router } from 'express';
import { getAllVenues, getVenueById } from '../controllers/venueController';

const router = Router();

router.get('/', getAllVenues);
router.get('/:id', getVenueById);

export default router;


