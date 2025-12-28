import { Request, Response } from 'express';
import { getDatabase } from '@bigbash/infra';

export async function getAllVenues(req: Request, res: Response) {
  try {
    const db = getDatabase();
    const venues = await db('venue').select('*').orderBy('name');
    res.json(venues);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
}

export async function getVenueById(req: Request, res: Response) {
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
}


