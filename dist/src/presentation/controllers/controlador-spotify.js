"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControladorSpotify = void 0;
const spotify_service_1 = require("../../infrastructure/services/spotify-service");
const redis_service_1 = require("../../infrastructure/services/redis-service");
class ControladorSpotify {
    constructor() {
        this.spotifyService = new spotify_service_1.SpotifyService();
    }
    async search(req, res) {
        try {
            const query = req.query.q;
            if (!query) {
                return res.status(400).json({ error: 'Query parameter "q" is required' });
            }
            const cacheKey = `spotify:search:${query.toLowerCase().trim()}`;
            const cachedResults = await redis_service_1.redisService.get(cacheKey);
            if (cachedResults) {
                return res.json(JSON.parse(cachedResults));
            }
            const results = await this.spotifyService.searchTracks(query);
            if (results && results.tracks && results.tracks.items.length > 0) {
                await redis_service_1.redisService.set(cacheKey, JSON.stringify(results), 3600); // Cache for 1 hour
            }
            res.json(results);
        }
        catch (error) {
            console.error('Search error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.ControladorSpotify = ControladorSpotify;
