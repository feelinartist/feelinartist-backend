"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpotifyService = void 0;
const config_service_1 = require("./config-service");
class SpotifyService {
    constructor() {
        this.token = null;
        this.tokenExpiresAt = 0;
    }
    async getAccessToken() {
        if (this.token && Date.now() < this.tokenExpiresAt) {
            return this.token;
        }
        const clientId = await config_service_1.configService.get('SPOTIFY_CLIENT_ID');
        const clientSecret = await config_service_1.configService.get('SPOTIFY_CLIENT_SECRET');
        if (!clientId || !clientSecret) {
            // Warn only once or debug log to avoid spamming
            if (process.env.NODE_ENV === 'development') {
                console.warn('Spotify credentials missing. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in System Configuration.');
            }
            return null;
        }
        const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'grant_type=client_credentials'
            });
            if (!response.ok) {
                const error = await response.json();
                console.error('Spotify Auth Error:', error);
                return null;
            }
            const data = await response.json();
            this.token = data.access_token;
            this.tokenExpiresAt = Date.now() + (data.expires_in * 1000) - 60000; // Expire 1 min early
            return this.token;
        }
        catch (error) {
            console.error('Failed to authenticate with Spotify:', error);
            return null;
        }
    }
    async searchTracks(query) {
        const token = await this.getAccessToken();
        // Graceful fallback: return empty if no token (creds missing)
        if (!token)
            return { tracks: { items: [] } };
        try {
            const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok)
                return { tracks: { items: [] } };
            return await response.json();
        }
        catch (error) {
            console.error('Spotify Search Error:', error);
            return { tracks: { items: [] } };
        }
    }
    async getArtist(artistId) {
        const token = await this.getAccessToken();
        if (!token)
            return null;
        try {
            const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok)
                return null;
            return await response.json();
        }
        catch (error) {
            console.error('Spotify Get Artist Error:', error);
            return null;
        }
    }
    async getTrack(trackId) {
        const token = await this.getAccessToken();
        if (!token)
            return null;
        try {
            const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok)
                return null;
            return await response.json();
        }
        catch (error) {
            console.error('Spotify Get Track Error:', error);
            return null;
        }
    }
}
exports.SpotifyService = SpotifyService;
