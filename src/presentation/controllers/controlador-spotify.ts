import { Request, Response } from 'express';
import { SpotifyService } from '../../infrastructure/services/spotify-service';
import { redisService } from '../../infrastructure/services/redis-service';

export class ControladorSpotify {
    private spotifyService: SpotifyService;

    constructor() {
        this.spotifyService = new SpotifyService();
    }

    async search(req: Request, res: Response) {
        try {
            const query = req.query.q as string;

            if (!query) {
                return res.status(400).json({ error: 'Query parameter "q" is required' });
            }

            const cacheKey = `spotify:search:${query.toLowerCase().trim()}`;
            const cachedResults = await redisService.get(cacheKey);

            if (cachedResults) {
                return res.json(JSON.parse(cachedResults));
            }

            const results = await this.spotifyService.searchTracks(query) as unknown as { tracks: { items: unknown[] } };

            if (results && results.tracks && results.tracks.items.length > 0) {
                await redisService.set(cacheKey, JSON.stringify(results), 3600); // Cache for 1 hour
            }

            res.json(results);
        } catch (error) {
            console.error('Search error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
