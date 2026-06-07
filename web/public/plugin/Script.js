let _settings = null;
let _stremioAddons = [];
let _tmdbKey = "";

function fetchUserSettings() {
    if (_settings && _tmdbKey) return _settings;

    if (!bridge.isLoggedIn()) {
        throw new ScriptException("No authentication found. Please log in.");
    }

    const response = http.GET("https://grayjay-stremio.netlify.app/api/settings", {}, true);

    if (response.code !== 200) {
        throw new ScriptException("Failed to load settings. HTTP " + response.code);
    }

    const tempSettings = JSON.parse(response.body);
    const tempTmdbKey = (tempSettings.tmdb_api_key || "").trim();

    if (!tempTmdbKey) {
        throw new ScriptException("TMDB API Key is missing! You must paste your TMDB API Key into the Settings Dashboard on the Web App.");
    }

    _settings = tempSettings;
    _tmdbKey = tempTmdbKey;
    _stremioAddons = _settings.stremio_addons || [];

    return _settings;
}
function tmdbGet(endpoint) {
    let url = endpoint.includes("?") ? endpoint + "&" : endpoint + "?";
    let headers = {};
    
    // TMDB v4 Read Access Tokens are long JWTs (> 40 chars)
    // TMDB v3 API Keys are 32-char hex strings
    if (_tmdbKey.length > 40) {
        headers["Authorization"] = "Bearer " + _tmdbKey;
    } else {
        url += "api_key=" + _tmdbKey + "&";
    }
    
    const response = http.GET(url, headers);
    if (response.code !== 200) {
        throw new ScriptException("TMDB API Error " + response.code + ": " + response.body + " | Key: [" + _tmdbKey + "] | Len: " + _tmdbKey.length);
    }
    return JSON.parse(response.body);
}

function getPosterUrl(tmdbId, tmdbPosterPath, tmdbBackdropPath) {
    const rpdbKey = _settings?.integrations?.rpdb_key;
    if (rpdbKey && rpdbKey.trim() !== '') {
        return `https://api.ratingposterdb.com/${rpdbKey}/tmdb/backdrop-default/movie-${tmdbId}.jpg`;
    }
    return "https://image.tmdb.org/t/p/w500" + (tmdbBackdropPath || tmdbPosterPath);
}

function mapMovieToVideo(movie) {
    return new PlatformVideo({
        id: new PlatformID("TMDB", movie.id.toString(), plugin.config.id),
        name: movie.title,
        thumbnails: new Thumbnails([new Thumbnail(getPosterUrl(movie.id, movie.poster_path, movie.backdrop_path), 0)]),
        author: new PlatformAuthorLink(new PlatformID("TMDB", "TMDB", plugin.config.id), "TMDB", "https://themoviedb.org", "https://themoviedb.org/favicon.ico"),
        datetime: Math.floor(new Date(movie.release_date).getTime() / 1000),
        url: "https://www.themoviedb.org/movie/" + movie.id
    });
}

source.enable = function(config) {
    try {
        fetchUserSettings();
    } catch(e) {
        // May fail if not logged in yet
    }
};

source.getHome = function() {
    fetchUserSettings();
    const movies = tmdbGet("https://api.themoviedb.org/3/movie/popular?language=en-US&page=1").results || [];

    return new VideoPager(movies.map(mapMovieToVideo), false);
};

source.search = function(query) {
    fetchUserSettings();
    const movies = tmdbGet(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&page=1`).results || [];
    
    return new VideoPager(movies.map(mapMovieToVideo), false);
};

source.getSearchCapabilities = () => {
    return {
        types: [Type.Feed.Videos],
        sorts: [Type.Order.Chronological],
        filters: []
    };
};

source.getContentDetails = function(url) {
    fetchUserSettings();
    
    // Extract TMDB ID from url
    const tmdbMatch = url.match(/\/movie\/(\d+)/);
    if (!tmdbMatch) throw new ScriptException("Invalid TMDB URL");
    const tmdbId = tmdbMatch[1];

    // Get Movie Details + External IDs (IMDB ID)
    const movieData = tmdbGet(`https://api.themoviedb.org/3/movie/${tmdbId}?append_to_response=external_ids`);
    
    const imdbId = movieData.external_ids?.imdb_id;
    if (!imdbId) throw new ScriptException("No IMDB ID found for this movie");

    // Query Stremio Addons for streams
    const sources = [];
    for (const addon of _stremioAddons) {
        try {
            const streamUrl = addon.replace("manifest.json", `stream/movie/${imdbId}.json`);
            const streamResp = http.GET(streamUrl, {});
            if (streamResp.code === 200) {
                const streamData = JSON.parse(streamResp.body);
                if (streamData && streamData.streams) {
                    for (const stream of streamData.streams) {
                        if (stream.url) {
                            sources.push(new VideoUrlSource({
                                width: 1920,
                                height: 1080,
                                container: stream.url.includes(".m3u8") ? "application/x-mpegURL" : "video/mp4",
                                url: stream.url,
                                name: `${stream.name || "Stream"} - ${stream.title || ""}`,
                                bitrate: 0
                            }));
                        }
                    }
                }
            }
        } catch(e) {
            // Ignore addon errors
        }
    }

    // Sort sources to prefer AAC and WEBRip to avoid audio codec limitations
    sources.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        const aScore = (aName.includes("aac") ? 2 : 0) + (aName.includes("webrip") || aName.includes("web-dl") ? 1 : 0);
        const bScore = (bName.includes("aac") ? 2 : 0) + (bName.includes("webrip") || bName.includes("web-dl") ? 1 : 0);
        
        return bScore - aScore;
    });

    return new PlatformVideoDetails({
        id: new PlatformID("TMDB", tmdbId, plugin.config.id),
        name: movieData.title,
        thumbnails: new Thumbnails([new Thumbnail(getPosterUrl(tmdbId, movieData.poster_path, movieData.backdrop_path), 0)]),
        author: new PlatformAuthorLink(new PlatformID("TMDB", "TMDB", plugin.config.id), "TMDB", "https://themoviedb.org", "https://themoviedb.org/favicon.ico"),
        datetime: Math.floor(new Date(movieData.release_date).getTime() / 1000),
        url: url,
        description: movieData.overview,
        video: new VideoSourceDescriptor(sources)
    });
};

source.getPlaybackTracker = function(url) {
    try {
        fetchUserSettings();
    } catch(e) {
        return null;
    }

    const traktToken = _settings.integrations?.trakt?.access_token;
    if (!traktToken) return null; // Trakt not connected

    // Extract TMDB ID from url
    const tmdbMatch = url.match(/\/movie\/(\d+)/);
    const tmdbId = tmdbMatch ? tmdbMatch[1] : null;
    
    if (!tmdbId) return null;

    // We pass trakt_client_id from our settings API endpoint now!
    const traktClientId = _settings.trakt_client_id;
    if (!traktClientId) return null;

    const payloadObj = {
        movie: { ids: { tmdb: parseInt(tmdbId) } },
        app_version: "1.0",
        app_date: "2024-01-01"
    };

    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${traktToken}`,
        "trakt-api-version": "2",
        "trakt-api-key": traktClientId
    };

    return {
        getEventTracker: function() {
            return {
                onEvent: function(event) {
                    // event object properties may vary depending on platform (could have type, progress, duration, positionMs)
                    // Common Grayjay tracker pattern for Playback events:
                    // Because we are relying on a generic implementation, we use positionMs / durationMs if available.
                    
                    const positionMs = event.positionMs || event.position || 0;
                    const durationMs = event.durationMs || event.duration || 1; // avoid division by zero
                    const progress = Math.min((positionMs / durationMs) * 100, 100);

                    const progressPayload = JSON.stringify({
                        ...payloadObj,
                        progress: progress
                    });

                    // type 1: Play, 2: Pause, 3: Stop? Or sometimes they pass event.type
                    // Since it's a generic tracker, let's catch standard methods if called directly,
                    // or handle generic `onEvent`
                    // However, standard Grayjay API defines onPlay, onProgress, onStop directly on the tracker.
                }
            };
        },
        onPlay: function() {
            http.POST("https://api.trakt.tv/scrobble/start", JSON.stringify({ ...payloadObj, progress: 0 }), headers);
        },
        onProgress: function(positionMs, durationMs) {
            // Trakt requires progress as a percentage (0 to 100)
            const dur = durationMs || 1;
            const progress = Math.min((positionMs / dur) * 100, 100);
            
            http.POST("https://api.trakt.tv/scrobble/pause", JSON.stringify({ ...payloadObj, progress }), headers);
        },
        onStop: function(positionMs, durationMs) {
            const dur = durationMs || 1;
            const progress = Math.min((positionMs / dur) * 100, 100);
            
            if (progress > 80) {
                // Scrobble stop (mark as watched) if more than 80%
                http.POST("https://api.trakt.tv/scrobble/stop", JSON.stringify({ ...payloadObj, progress }), headers);
            } else {
                // Otherwise just pause so progress is saved
                http.POST("https://api.trakt.tv/scrobble/pause", JSON.stringify({ ...payloadObj, progress }), headers);
            }
        }
    };
};
