import { Router } from 'express';
import { getDatabase } from '@bigbash/infra';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const venues = await db('venue').select('*').orderBy('name');
    res.json(venues);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const venue = await db('venue').where('id', req.params.id).first();
    
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    
    res.json(venue);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;


