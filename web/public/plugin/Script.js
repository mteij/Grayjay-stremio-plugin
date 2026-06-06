let _settings = null;
let _stremioAddons = [];
let _tmdbKey = "";

function fetchUserSettings() {
    if (_settings) return _settings;

    if (!bridge.isLoggedIn()) {
        throw new ScriptException("No authentication found. Please log in.");
    }

    const response = http.GET("https://greyjay-stremio.netlify.app/api/settings", {}, true);

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
        id: new PlatformID("TMDB", movie.id.toString(), plugin.config.id, 1),
        name: movie.title || "Unknown Title",
        thumbnails: new Thumbnails([new Thumbnail("https://image.tmdb.org/t/p/w500" + movie.poster_path, 0)]),
        author: new PlatformAuthorLink(new PlatformID("TMDB", "Movie", plugin.config.id, 1), "Movie", "https://themoviedb.org", "https://themoviedb.org/favicon.ico"),
        datetime: movie.release_date ? Math.floor(new Date(movie.release_date).getTime() / 1000) : 0,
        url: "https://www.themoviedb.org/movie/" + movie.id,
        shareUrl: "https://www.themoviedb.org/movie/" + movie.id,
        duration: 0,
        viewCount: 0,
        isLive: false,
        isShort: false
    });
}

function mapTvToPlaylist(tv) {
    // Fetch TV details to get season/episode counts
    let numberOfSeasons = 0;
    let numberOfEpisodes = 0;
    try {
        const detailResp = http.GET(`https://api.themoviedb.org/3/tv/${tv.id}?api_key=${_tmdbKey}&language=en-US`, {});
        if (detailResp.code === 200) {
            const detail = JSON.parse(detailResp.body);
            numberOfSeasons = detail.number_of_seasons || 0;
            numberOfEpisodes = detail.number_of_episodes || 0;
        }
    } catch(e) { /* ignore */ }

    const countLabel = numberOfSeasons > 0
        ? (numberOfSeasons === 1 ? `1 Season · ${numberOfEpisodes} Episodes` : `${numberOfSeasons} Seasons · ${numberOfEpisodes} Episodes`)
        : "TV Series";

    return new PlatformPlaylist({
        id: new PlatformID("TMDB", tv.id.toString(), plugin.config.id, 1),
        name: tv.name || tv.original_name || "Unknown TV Show",
        author: new PlatformAuthorLink(new PlatformID("TMDB", "TV Series", plugin.config.id, 1), countLabel, "https://themoviedb.org", "https://themoviedb.org/favicon.ico"),
        thumbnail: "https://image.tmdb.org/t/p/w500" + tv.poster_path,
        url: "https://www.themoviedb.org/tv/" + tv.id,
        videoCount: numberOfEpisodes || 0
    });
}


source.enable = function(config) {
    try {
        fetchUserSettings();
    } catch(e) {
        // May fail if not logged in yet
    }
};

// --- Infinite Scroll Pager: Home ---
// Cycles through multiple TMDB endpoints for variety
const HOME_SECTIONS = [
    (page) => `https://api.themoviedb.org/3/trending/all/day?api_key=${_tmdbKey}&language=en-US&page=${page}`,
    (page) => `https://api.themoviedb.org/3/movie/popular?api_key=${_tmdbKey}&language=en-US&page=${page}`,
    (page) => `https://api.themoviedb.org/3/tv/popular?api_key=${_tmdbKey}&language=en-US&page=${page}`,
    (page) => `https://api.themoviedb.org/3/movie/top_rated?api_key=${_tmdbKey}&language=en-US&page=${page}`,
    (page) => `https://api.themoviedb.org/3/tv/top_rated?api_key=${_tmdbKey}&language=en-US&page=${page}`,
    (page) => `https://api.themoviedb.org/3/movie/now_playing?api_key=${_tmdbKey}&language=en-US&page=${page}`,
    (page) => `https://api.themoviedb.org/3/tv/on_the_air?api_key=${_tmdbKey}&language=en-US&page=${page}`,
];

class TmdbHomePager extends VideoPager {
    constructor() {
        super([], true, { section: 0, page: 1 });
        const data = TmdbHomePager.fetch(0, 1);
        this.results = data.items;
        this.hasMore = data.hasMore;
    }
    static fetch(section, page) {
        const url = HOME_SECTIONS[section](page);
        const response = http.GET(url, {});
        const body = JSON.parse(response.body);
        const totalPages = body.total_pages || 1;

        const items = (body.results || [])
            .filter(i => i.media_type === "movie" || i.media_type === "tv"
                      || body.results[0]?.title !== undefined   // movie-only endpoint
                      || body.results[0]?.name !== undefined)   // tv-only endpoint
            .map(i => {
                // Movie-only endpoints don't set media_type, detect by field presence
                const isMovie = i.media_type === "movie" || (i.title && !i.name);
                const isTv    = i.media_type === "tv"    || (i.name  && !i.title);
                if (isTv) return mapTvToPlaylist(i);
                return mapMovieToVideo(i);
            });

        // Move to next section after exhausting all pages
        const nextPage    = page < totalPages ? page + 1 : 1;
        const nextSection = page < totalPages ? section : (section + 1) % HOME_SECTIONS.length;
        const hasMore     = section < HOME_SECTIONS.length - 1 || page < totalPages;

        return { items, hasMore, nextSection, nextPage };
    }
    nextPage() {
        const data = TmdbHomePager.fetch(this.context.section, this.context.page);
        this.results      = data.items;
        this.hasMore      = data.hasMore;
        this.context.section = data.nextSection;
        this.context.page    = data.nextPage;
        return this;
    }
}


// --- Infinite Scroll Pager: Search ---
class TmdbSearchPager extends VideoPager {
    constructor(query, page) {
        const data = TmdbSearchPager.fetch(query, page);
        super(data.items, data.hasMore, { query: query, page: page });
    }
    static fetch(query, page) {
        const url = `https://api.themoviedb.org/3/search/multi?api_key=${_tmdbKey}&query=${encodeURIComponent(query)}&page=${page}`;
        const response = http.GET(url, {});
        const body = JSON.parse(response.body);
        const items = (body.results || []).filter(i => i.media_type === "movie" || i.media_type === "tv").map(i => {
            if (i.media_type === "tv") return mapTvToPlaylist(i);
            return mapMovieToVideo(i);
        });
        return { items, hasMore: page < (body.total_pages || 1) };
    }
    nextPage() {
        const next = this.context.page + 1;
        const data = TmdbSearchPager.fetch(this.context.query, next);
        this.results = data.items;
        this.hasMore = data.hasMore;
        this.context.page = next;
        return this;
    }
}

source.getHome = function() {
    fetchUserSettings();
    return new TmdbHomePager();
};

source.search = function(query) {
    fetchUserSettings();
    return new TmdbSearchPager(query, 1);
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
    
    let imdbId;
    let streamEndpoint;
    let title = "Unknown Title";
    let poster = "";
    let description = "";
    let idStr = "";

    if (url.includes("/episode/")) {
        // TV Episode URL
        const tvMatch = url.match(/\/tv\/(\d+)\/season\/(\d+)\/episode\/(\d+)/);
        if (!tvMatch) throw new ScriptException("Invalid TMDB TV URL");
        const tvId = tvMatch[1];
        const season = tvMatch[2];
        const episode = tvMatch[3];
        
        const imdbMatch = url.match(/imdb=(tt\d+)/);
        imdbId = imdbMatch ? imdbMatch[1] : null;
        if (!imdbId) throw new ScriptException("No IMDB ID found for this TV episode");

        streamEndpoint = `stream/series/${imdbId}:${season}:${episode}.json`;
        idStr = `TV_${tvId}_${season}_${episode}`;
        
        // Fetch episode details to populate the PlatformVideoDetails
        const epUrl = `https://api.themoviedb.org/3/tv/${tvId}/season/${season}/episode/${episode}?api_key=${_tmdbKey}`;
        const epResp = http.GET(epUrl, {});
        if (epResp.code === 200) {
            const epData = JSON.parse(epResp.body);
            title = `S${season}E${episode} - ${epData.name || "Episode"}`;
            poster = epData.still_path ? "https://image.tmdb.org/t/p/w500" + epData.still_path : "";
            description = epData.overview || "";
        } else {
            title = `S${season}E${episode}`;
        }
    } else {
        // Movie URL
        const tmdbMatch = url.match(/\/movie\/(\d+)/);
        if (!tmdbMatch) throw new ScriptException("Invalid TMDB Movie URL");
        const tmdbId = tmdbMatch[1];

        const tmdbUrl = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${_tmdbKey}&append_to_response=external_ids`;
        const tmdbResponse = http.GET(tmdbUrl, {});
        const movieData = JSON.parse(tmdbResponse.body);
        
        imdbId = movieData.external_ids?.imdb_id;
        if (!imdbId) throw new ScriptException("No IMDB ID found for this movie");

        streamEndpoint = `stream/movie/${imdbId}.json`;
        idStr = tmdbId;
        title = movieData.title || "Unknown Movie";
        poster = movieData.poster_path ? "https://image.tmdb.org/t/p/w500" + movieData.poster_path : "";
        description = movieData.overview || "";
    }

    // Build the subtitle endpoint from the stream endpoint
    // e.g. stream/movie/tt1234.json -> subtitles/movie/tt1234.json
    const subtitleEndpoint = streamEndpoint.replace("stream/", "subtitles/");

    // Query Stremio Addons for streams AND subtitles
    const sources = [];
    const subtitles = [];

    /**
     * Returns false for streams that are temporary, unavailable, or have no audio.
     */
    function isStreamValid(stream) {
        const text = ((stream.name || "") + " " + (stream.title || "")).toLowerCase();
        // Filter out temporary/loading/unavailable streams
        if (/loading|reloading|updating|not available|unavailable|addon error|install addon|configure|\u26a0/.test(text)) return false;
        return true;
    }

    /**
     * Builds a clean, human-readable source name from a Stremio stream object.
     * stream.name is often "AddonName\nResolution" and stream.title has full file info.
     */
    function parseStreamName(stream) {
        const nameParts = (stream.name || "").split("\n");
        const addonName = nameParts[0] ? nameParts[0].trim() : "Stream";
        const nameQuality = nameParts[1] ? nameParts[1].trim() : "";

        // Try to extract resolution (e.g. 720p, 1080p, 4K, 2160p) from title or name quality
        const combined = (stream.title || "") + " " + nameQuality;
        const resMatch = combined.match(/(4K|2160p|1440p|1080p|720p|480p|360p)/i);
        const resolution = resMatch ? resMatch[1].toUpperCase().replace("2160P", "4K") : (nameQuality || "?");

        // Build a clean label: "[Resolution] | Title (truncated)" or fall back to addon name
        const fileTitle = (stream.title || "").trim();
        if (fileTitle) {
            // Truncate long titles
            const short = fileTitle.length > 60 ? fileTitle.substring(0, 57) + "..." : fileTitle;
            return `${resolution} | ${short}`;
        }
        return `${addonName} ${resolution}`;
    }

    for (const addon of _stremioAddons) {
        try {
            const streamUrl = addon.replace("manifest.json", streamEndpoint);
            const streamResp = http.GET(streamUrl, {});
            if (streamResp.code === 200) {
                const streamData = JSON.parse(streamResp.body);
                if (streamData && streamData.streams) {
                    for (const stream of streamData.streams) {
                        if (stream.url && isStreamValid(stream)) {
                            sources.push(new VideoUrlSource({
                                width: 1920,
                                height: 1080,
                                container: stream.url.includes(".m3u8") ? "application/x-mpegURL" : "video/mp4",
                                url: stream.url,
                                name: parseStreamName(stream),
                                bitrate: 0
                            }));
                        }
                    }
                }
            }
        } catch(e) {
            // Ignore addon stream errors
        }

        // Fetch subtitles from this addon
        try {
            const subUrl = addon.replace("manifest.json", subtitleEndpoint);
            const subResp = http.GET(subUrl, {});
            if (subResp.code === 200) {
                const subData = JSON.parse(subResp.body);
                if (subData && subData.subtitles) {
                    for (const sub of subData.subtitles) {
                        if (sub.url) {
                            subtitles.push(new SubtitleSource({
                                url: sub.url,
                                name: sub.lang || sub.id || "Unknown",
                                format: sub.url.includes(".vtt") ? "text/vtt" : "text/srt"
                            }));
                        }
                    }
                }
            }
        } catch(e) {
            // Ignore addon subtitle errors
        }
    }

    return new PlatformVideoDetails({
        id: new PlatformID("TMDB", idStr, plugin.config.id, 1),
        name: title,
        thumbnails: new Thumbnails([new Thumbnail(poster, 0)]),
        author: new PlatformAuthorLink(new PlatformID("TMDB", url.includes("/episode/") ? "TV Series" : "Movie", plugin.config.id, 1), url.includes("/episode/") ? "TV Series" : "Movie", "https://themoviedb.org", "https://themoviedb.org/favicon.ico"),
        datetime: 0,
        url: url,
        shareUrl: url,
        duration: 0,
        viewCount: 0,
        isLive: false,
        description: description,
        video: new VideoSourceDescriptor(sources),
        subtitles: subtitles
    });
};

source.isContentDetailsUrl = function(url) {
    return url.startsWith("https://www.themoviedb.org/movie/") || url.includes("/episode/");
};

source.isChannelUrl = function(url) {
    return false;
};

source.isPlaylistUrl = function(url) {
    return url.startsWith("https://www.themoviedb.org/tv/") && !url.includes("/episode/");
};

function mapEpisodeToVideo(showData, season, episode, imdbId) {
    // We attach the imdbId directly to the URL so getContentDetails doesn't need to look it up again
    const epUrl = `https://www.themoviedb.org/tv/${showData.id}/season/${episode.season_number}/episode/${episode.episode_number}?imdb=${imdbId}`;
    return new PlatformVideo({
        id: new PlatformID("TMDB", `TV_${showData.id}_${episode.season_number}_${episode.episode_number}`, plugin.config.id, 1),
        name: `S${episode.season_number}E${episode.episode_number} - ${episode.name || "Episode"}`,
        thumbnails: new Thumbnails([new Thumbnail(episode.still_path ? "https://image.tmdb.org/t/p/w500" + episode.still_path : "https://image.tmdb.org/t/p/w500" + showData.poster_path, 0)]),
        author: new PlatformAuthorLink(new PlatformID("TMDB", showData.id.toString(), plugin.config.id, 1), showData.name, `https://www.themoviedb.org/tv/${showData.id}`, "https://themoviedb.org/favicon.ico"),
        datetime: episode.air_date ? Math.floor(new Date(episode.air_date).getTime() / 1000) : 0,
        url: epUrl,
        shareUrl: epUrl,
        duration: (episode.runtime || 0) * 60,
        viewCount: 0,
        isLive: false,
        isShort: false
    });
}

source.getPlaylist = function(url) {
    fetchUserSettings();
    
    const tmdbMatch = url.match(/\/tv\/(\d+)/);
    if (!tmdbMatch) throw new ScriptException("Invalid TMDB TV URL");
    const tvId = tmdbMatch[1];

    const tmdbUrl = `https://api.themoviedb.org/3/tv/${tvId}?api_key=${_tmdbKey}&append_to_response=external_ids`;
    const tmdbResponse = http.GET(tmdbUrl, {});
    const showData = JSON.parse(tmdbResponse.body);
    
    const imdbId = showData.external_ids?.imdb_id;
    if (!imdbId) throw new ScriptException("No IMDB ID found for this TV show");

    const episodes = [];
    
    // Fetch all seasons synchronously
    if (showData.seasons && showData.seasons.length > 0) {
        for (const season of showData.seasons) {
            // Skip season 0 (usually specials)
            if (season.season_number === 0) continue;
            
            try {
                const seasonUrl = `https://api.themoviedb.org/3/tv/${tvId}/season/${season.season_number}?api_key=${_tmdbKey}`;
                const seasonResponse = http.GET(seasonUrl, {});
                if (seasonResponse.code === 200) {
                    const seasonData = JSON.parse(seasonResponse.body);
                    if (seasonData.episodes) {
                        for (const ep of seasonData.episodes) {
                            episodes.push(mapEpisodeToVideo(showData, season, ep, imdbId));
                        }
                    }
                }
            } catch(e) {
                // Ignore failure for a single season
            }
        }
    }

    return new PlatformPlaylistDetails({
        id: new PlatformID("TMDB", tvId, plugin.config.id, 1),
        url: url,
        name: showData.name || "Unknown TV Show",
        author: new PlatformAuthorLink(new PlatformID("TMDB", "TV Series", plugin.config.id, 1), "TV Series", "https://themoviedb.org", "https://themoviedb.org/favicon.ico"),
        thumbnail: "https://image.tmdb.org/t/p/w500" + showData.poster_path,
        videoCount: episodes.length,
        contents: new VideoPager(episodes, false)
    });
};
