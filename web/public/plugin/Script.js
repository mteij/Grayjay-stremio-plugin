let _settings = null;
let _stremioAddons = [];
let _tmdbKey = "";

function fetchUserSettings() {
    if (_settings && _tmdbKey) return _settings;

    if (!bridge.isLoggedIn()) {
        throw new ScriptException("No authentication found. Please log in.");
    }

    // We append a timestamp to the URL to aggressively bust the Android HttpURLConnection cache
    const response = http.GET("https://grayjay-stremio.netlify.app/api/settings?t=" + Date.now(), {}, true);

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

function getPosterUrl(tmdbId, type, tmdbPosterPath, tmdbBackdropPath) {
    const rpdbKey = _settings?.integrations?.rpdb_key;
    if (rpdbKey && rpdbKey.trim() !== '') {
        // Free RPDB tiers only support poster-default, not backdrop-default. Grayjay will center-crop it.
        return `https://api.ratingposterdb.com/${rpdbKey}/tmdb/poster-default/${type}-${tmdbId}.jpg`;
    }
    return "https://image.tmdb.org/t/p/w500" + (tmdbBackdropPath || tmdbPosterPath);
}

function mapMovieToVideo(item) {
    const isTv = item.media_type === "tv" || item.name !== undefined;
    const type = isTv ? "tv" : "movie";
    const title = isTv ? item.name : item.title;
    const date = isTv ? item.first_air_date : item.release_date;

    if (isTv) {
        return new PlatformPlaylist({
            id: new PlatformID("TMDB", item.id.toString(), plugin.config.id),
            name: title || "Unknown Title",
            author: new PlatformAuthorLink(new PlatformID("TMDB", "TMDB", plugin.config.id), "TMDB", "https://themoviedb.org", "https://themoviedb.org/favicon.ico"),
            datetime: date ? Math.floor(new Date(date).getTime() / 1000) : 0,
            url: `https://www.themoviedb.org/tv/${item.id}`,
            videoCount: 0 // Will be populated when getPlaylist is called
        });
    }

    return new PlatformVideo({
        id: new PlatformID("TMDB", item.id.toString(), plugin.config.id),
        name: title || "Unknown Title",
        thumbnails: new Thumbnails([new Thumbnail(getPosterUrl(item.id, type, item.poster_path, item.backdrop_path), 0)]),
        author: new PlatformAuthorLink(new PlatformID("TMDB", "TMDB", plugin.config.id), "TMDB", "https://themoviedb.org", "https://themoviedb.org/favicon.ico"),
        datetime: date ? Math.floor(new Date(date).getTime() / 1000) : 0,
        url: `https://www.themoviedb.org/movie/${item.id}`,
        duration: 0 // Prevents UI glitches on Desktop
    });
}

source.enable = function(config) {
    try {
        fetchUserSettings();
    } catch(e) {
        // May fail if not logged in yet
    }
};

function getTmdbFeedUrl(page) {
    const category = (plugin.config.homeFeedCategory !== undefined ? plugin.config.homeFeedCategory : 0).toString();
    const type = (plugin.config.homeFeedType !== undefined ? plugin.config.homeFeedType : 0).toString();
    
    let endpoint = "";
    if (category === "0") { // Trending
        if (type === "1") endpoint = "trending/movie/day";
        else if (type === "2") endpoint = "trending/tv/day";
        else endpoint = "trending/all/day";
    } else {
        const media = (type === "2") ? "tv" : "movie";
        if (category === "1") endpoint = `${media}/popular`;
        else if (category === "2") endpoint = `${media}/top_rated`;
        else if (category === "3") {
            endpoint = (media === "tv") ? "tv/airing_today" : "movie/now_playing";
        }
    }
    return `https://api.themoviedb.org/3/${endpoint}?language=en-US&page=${page}`;
}

function getHomeMovies(page) {
    fetchUserSettings();
    const response = tmdbGet(getTmdbFeedUrl(page));
    const items = response.results || [];
    const hasMore = response.page < response.total_pages;

    const pager = new VideoPager(items.map(mapMovieToVideo), hasMore);
    pager.nextPage = function() {
        return getHomeMovies(page + 1);
    };
    return pager;
}

source.getHome = function() {
    return getHomeMovies(1);
};

function getSearchMovies(query, page) {
    fetchUserSettings();
    // Use multi-search to find both movies and tv shows
    const response = tmdbGet(`https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&page=${page}`);
    const items = response.results || [];
    const hasMore = response.page < response.total_pages;
    
    // Filter out people from multi-search
    const validItems = items.filter(item => item.media_type === "movie" || item.media_type === "tv");
    
    const pager = new VideoPager(validItems.map(mapMovieToVideo), hasMore);
    pager.nextPage = function() {
        return getSearchMovies(query, page + 1);
    };
    return pager;
}

source.search = function(query) {
    return getSearchMovies(query, 1);
};

source.isPlaylistUrl = function(url) {
    return url.includes("themoviedb.org/tv/") && !url.includes("/season/");
};

source.getPlaylist = function(url) {
    fetchUserSettings();
    
    const tmdbMatch = url.match(/\/tv\/(\d+)/);
    if (!tmdbMatch) throw new ScriptException("Invalid TMDB TV URL");
    const tvId = tmdbMatch[1];

    const showData = tmdbGet(`https://api.themoviedb.org/3/tv/${tvId}?append_to_response=external_ids`);
    const imdbId = showData.external_ids?.imdb_id;
    if (!imdbId) throw new ScriptException("No IMDB ID found for this TV show");

    const episodes = [];
    
    if (showData.seasons && showData.seasons.length > 0) {
        for (const season of showData.seasons) {
            if (season.season_number === 0) continue; // Skip specials
            
            const seasonData = tmdbGet(`https://api.themoviedb.org/3/tv/${tvId}/season/${season.season_number}`);
            if (seasonData.episodes) {
                for (const ep of seasonData.episodes) {
                    episodes.push(new PlatformVideo({
                        id: new PlatformID("TMDB", `${tvId}_${season.season_number}_${ep.episode_number}`, plugin.config.id),
                        name: `S${season.season_number}E${ep.episode_number} - ${ep.name}`,
                        thumbnails: new Thumbnails([new Thumbnail(getPosterUrl(tvId, "tv", ep.still_path || showData.poster_path, showData.backdrop_path), 0)]),
                        author: new PlatformAuthorLink(new PlatformID("TMDB", "TMDB", plugin.config.id), "TMDB", "https://themoviedb.org", ""),
                        datetime: ep.air_date ? Math.floor(new Date(ep.air_date).getTime() / 1000) : 0,
                        url: `https://www.themoviedb.org/tv/${tvId}/season/${season.season_number}/episode/${ep.episode_number}`,
                        duration: 0
                    }));
                }
            }
        }
    }

    return new PlatformPlaylistDetails({
        name: showData.name,
        author: new PlatformAuthorLink(new PlatformID("TMDB", "TMDB", plugin.config.id), "TMDB", "https://themoviedb.org", ""),
        datetime: Math.floor(new Date(showData.first_air_date).getTime() / 1000),
        url: url,
        videoCount: episodes.length,
        contents: new VideoPager(episodes, false)
    });
};

source.isContentDetailsUrl = function(url) {
    return url.includes("themoviedb.org/movie/") || url.includes("/season/");
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
    
    let isTv = url.includes("/season/");
    let tmdbId, season, episode, movieData, imdbId, type, name, date, overview;

    if (isTv) {
        const match = url.match(/\/tv\/(\d+)\/season\/(\d+)\/episode\/(\d+)/);
        if (!match) throw new ScriptException("Invalid Episode URL");
        tmdbId = match[1];
        season = match[2];
        episode = match[3];
        type = "series";

        movieData = tmdbGet(`https://api.themoviedb.org/3/tv/${tmdbId}?append_to_response=external_ids`);
        imdbId = movieData.external_ids?.imdb_id;
        name = `${movieData.name} - S${season}E${episode}`;
        date = movieData.first_air_date;
        overview = movieData.overview;
    } else {
        const tmdbMatch = url.match(/\/movie\/(\d+)/);
        if (!tmdbMatch) throw new ScriptException("Invalid TMDB URL");
        tmdbId = tmdbMatch[1];
        type = "movie";

        movieData = tmdbGet(`https://api.themoviedb.org/3/movie/${tmdbId}?append_to_response=external_ids`);
        imdbId = movieData.external_ids?.imdb_id;
        name = movieData.title;
        date = movieData.release_date;
        overview = movieData.overview;
    }
    
    if (!imdbId) throw new ScriptException(`No IMDB ID found for this ${type}`);

    // Query Stremio Addons for streams
    const sources = [];
    for (const addon of _stremioAddons) {
        try {
            const streamId = isTv ? `${imdbId}:${season}:${episode}` : imdbId;
            const streamUrl = addon.replace("manifest.json", `stream/${type}/${streamId}.json`);
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
        id: new PlatformID("TMDB", isTv ? `${tmdbId}_${season}_${episode}` : tmdbId, plugin.config.id),
        name: name,
        thumbnails: new Thumbnails([new Thumbnail(getPosterUrl(tmdbId, isTv ? "tv" : "movie", movieData.poster_path, movieData.backdrop_path), 0)]),
        author: new PlatformAuthorLink(new PlatformID("TMDB", "TMDB", plugin.config.id), "TMDB", "https://themoviedb.org", "https://themoviedb.org/favicon.ico"),
        datetime: date ? Math.floor(new Date(date).getTime() / 1000) : 0,
        url: url,
        description: overview,
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
