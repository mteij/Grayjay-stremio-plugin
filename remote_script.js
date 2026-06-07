let _settings = null;
let _stremioAddons = [];
let _tmdbKey = "";

function fetchUserSettings() {
    if (_settings) return _settings;

    const auth = plugin.getAuth();
    if (!auth) {
        throw new ScriptException("No authentication found. Please log in.");
    }

    let cookieString = "";
    if (typeof auth === 'object') {
        cookieString = Object.keys(auth).map(k => `${k}=${auth[k]}`).join("; ");
    } else {
        cookieString = auth;
    }

    const response = http.GET("https://greyjay-stremio.netlify.app/api/settings", {
        "Cookie": cookieString
    });

    if (response.code !== 200) {
        throw new ScriptException("Failed to load settings. HTTP " + response.code);
    }

    _settings = JSON.parse(response.body);
    _tmdbKey = _settings.tmdb_api_key;
    _stremioAddons = _settings.stremio_addons || [];

    if (!_tmdbKey) {
        throw new ScriptException("TMDB API Key is missing. Please configure it in the Web App.");
    }

    return _settings;
}

function mapMovieToVideo(movie) {
    return new PlatformVideo({
        id: new PlatformID("TMDB", movie.id.toString(), plugin.config.id),
        name: movie.title,
        thumbnails: new Thumbnails([new Thumbnail("https://image.tmdb.org/t/p/w500" + movie.poster_path, 0)]),
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
    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${_tmdbKey}&language=en-US&page=1`;
    const response = http.GET(url, {});
    if (response.code !== 200) {
        throw new ScriptException("TMDB API Error: " + response.code);
    }
    const movies = JSON.parse(response.body).results || [];

    return new VideoPager(movies.map(mapMovieToVideo), false);
};

source.search = function(query) {
    fetchUserSettings();
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${_tmdbKey}&query=${encodeURIComponent(query)}&page=1`;
    const response = http.GET(url, {});
    if (response.code !== 200) {
        throw new ScriptException("TMDB API Error: " + response.code);
    }
    const movies = JSON.parse(response.body).results || [];
    
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
    const tmdbUrl = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${_tmdbKey}&append_to_response=external_ids`;
    const tmdbResponse = http.GET(tmdbUrl, {});
    if (tmdbResponse.code !== 200) {
        throw new ScriptException("TMDB API Error: " + tmdbResponse.code);
    }
    const movieData = JSON.parse(tmdbResponse.body);
    
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

    return new PlatformVideoDetails({
        id: new PlatformID("TMDB", tmdbId, plugin.config.id),
        name: movieData.title,
        thumbnails: new Thumbnails([new Thumbnail("https://image.tmdb.org/t/p/w500" + movieData.poster_path, 0)]),
        author: new PlatformAuthorLink(new PlatformID("TMDB", "TMDB", plugin.config.id), "TMDB", "https://themoviedb.org", "https://themoviedb.org/favicon.ico"),
        datetime: Math.floor(new Date(movieData.release_date).getTime() / 1000),
        url: url,
        description: movieData.overview,
        video: new VideoSourceDescriptor(sources)
    });
};
