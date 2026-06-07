let _settings = null;
let _stremioAddons = [];
let _tmdbKey = "";
let _streamPrefs = null;

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
    _streamPrefs = _settings.stream_preferences || {
        resolutionOrder: ['4K', '1080P', '720P', '480P', '360P', '?'],
        codecOrder: ['HEVC', 'AV1', 'AVC'],
        qualityOrder: ['Bluray REMUX', 'Bluray', 'WEB-DL', 'WEBRip', 'HDRip', 'HC HD-Rip', 'DVDRip', 'HDTV', 'CAM', 'TS', 'TC', 'SCR'],
        hdrPreference: 'any',
        typeOrder: ['debrid', 'p2p', 'http'],
        maxSizeGB: null,
        minSeeders: null
    };

    if (!_tmdbKey) {
        throw new ScriptException("TMDB API Key is missing. Please configure it in the Web App.");
    }

    return _settings;
}

function mapMovieToVideo(movie) {
    // Fetch movie details to get runtime
    let runtimeMinutes = 0;
    try {
        const detailResp = http.GET(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${_tmdbKey}&language=en-US`, {});
        if (detailResp.code === 200) {
            const detail = JSON.parse(detailResp.body);
            runtimeMinutes = detail.runtime || 0;
        }
    } catch(e) { /* ignore */ }

    const durationLabel = runtimeMinutes > 0
        ? (runtimeMinutes >= 60
            ? `Movie · ${Math.floor(runtimeMinutes / 60)}h ${runtimeMinutes % 60}m`
            : `Movie · ${runtimeMinutes}m`)
        : "Movie";

    return new PlatformVideo({
        id: new PlatformID("TMDB", movie.id.toString(), plugin.config.id, 1),
        name: movie.title || "Unknown Title",
        thumbnails: new Thumbnails([new Thumbnail("https://image.tmdb.org/t/p/w500" + movie.poster_path, 0)]),
        author: new PlatformAuthorLink(new PlatformID("TMDB", "Movie", plugin.config.id, 1), durationLabel, "https://themoviedb.org", "https://themoviedb.org/favicon.ico"),
        datetime: movie.release_date ? Math.floor(new Date(movie.release_date).getTime() / 1000) : 0,
        url: "https://www.themoviedb.org/movie/" + movie.id,
        shareUrl: "https://www.themoviedb.org/movie/" + movie.id,
        duration: runtimeMinutes * 60,
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
class TmdbHomePager extends VideoPager {
    constructor(page) {
        const data = TmdbHomePager.fetch(page);
        super(data.items, data.hasMore, { page: page });
    }
    static fetch(page) {
        const url = `https://api.themoviedb.org/3/trending/all/day?api_key=${_tmdbKey}&language=en-US&page=${page}`;
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
        const data = TmdbHomePager.fetch(next);
        this.results = data.items;
        this.hasMore = data.hasMore;
        this.context.page = next;
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
    const startPage = Math.floor(Math.random() * 10) + 1;
    return new TmdbHomePager(startPage);
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
     * Returns false for streams that are temporary, unavailable, or non-playable notices.
     */
    function isStreamValid(stream) {
        const text = ((stream.name || "") + " " + (stream.title || "")).toLowerCase();
        if (/loading|reloading|updating|not available|unavailable|addon error|install addon|configure|sync debrid|debrid account|select this stream|\u26a0/.test(text)) return false;
        return true;
    }

    /**
     * Builds a clean, human-readable source name from a Stremio stream object.
     *
     * stream.name is typically multi-line, e.g.:
     *   "[TB ⚡]\nComet\n2160p"   or   "⚡ [TB]\nTorz\n4320p"
     * stream.title is multi-line with emoji prefixes, e.g.:
     *   "📁 The.Boys.S05E06.2160p\n🎬 hevc\n⭐ WEB | 🔗 ETHEL\n..."
     */
    function parseStreamName(stream) {
        const nameParts = (stream.name || "").split("\n").map(p => p.trim()).filter(Boolean);
        const addonName = nameParts[0] || "Stream";

        // Scan ALL name parts for a resolution token (it's usually the last line)
        const resRegex = /(8K|4K|4320p|2160p|1440p|1080p|720p|480p|360p)/i;
        let resolution = null;
        for (let i = nameParts.length - 1; i >= 0; i--) {
            const m = nameParts[i].match(resRegex);
            if (m) { resolution = m[1]; break; }
        }
        // Fallback: scan title for a resolution token
        if (!resolution && stream.title) {
            const m = stream.title.match(resRegex);
            if (m) resolution = m[1];
        }
        // Normalise labels
        if (resolution) {
            resolution = resolution
                .replace(/4320p/i, "8K")
                .replace(/2160p/i, "4K")
                .toUpperCase();
        } else {
            resolution = "?";
        }

        // Extract the first readable line from stream.title.
        // Many addons prefix lines with emoji (📁 🎬 ⭐ …) – strip leading non-ASCII chars.
        let fileTitle = "";
        if (stream.title) {
            const titleLines = stream.title.split("\n");
            for (const line of titleLines) {
                // Strip leading non-printable-ASCII characters (covers most emoji)
                const cleaned = line.replace(/^[^\x20-\x7E]+/, "").trim();
                // Accept the line if it has at least 6 printable chars and looks like a name
                if (cleaned.length >= 6 && /\w{3}/.test(cleaned)) {
                    fileTitle = cleaned.length > 65 ? cleaned.substring(0, 62) + "..." : cleaned;
                    break;
                }
            }
        }

        if (fileTitle) return `${resolution} | ${fileTitle}`;
        return `${addonName} · ${resolution}`;
    }

    // Helper to extract metadata from text
    function parseStreamMetadata(stream) {
        const text = ((stream.name || "") + " " + (stream.title || "")).toUpperCase();
        
        let resolution = "?";
        const resMatch = text.match(/(8K|4K|4320P|2160P|1440P|1080P|720P|480P|360P)/);
        if (resMatch) {
            resolution = resMatch[1].replace("4320P", "8K").replace("2160P", "4K");
        }

        let codec = "Unknown";
        if (text.includes("HEVC") || text.includes("H.265") || text.includes("X265")) codec = "HEVC";
        else if (text.includes("AV1")) codec = "AV1";
        else if (text.includes("AVC") || text.includes("H.264") || text.includes("X264")) codec = "AVC";

        let quality = "Unknown";
        if (text.includes("REMUX")) quality = "Bluray REMUX";
        else if (text.includes("WEB-DL")) quality = "WEB-DL";
        else if (text.includes("BLURAY")) quality = "Bluray";
        else if (text.includes("WEBRIP")) quality = "WEBRip";
        else if (text.includes("HDRIP")) quality = "HDRip";
        else if (text.includes("HC HD-RIP") || text.includes("HC HDRIP")) quality = "HC HD-Rip";
        else if (text.includes("DVDRIP")) quality = "DVDRip";
        else if (text.includes("HDTV")) quality = "HDTV";
        else if (text.includes("CAM")) quality = "CAM";
        else if (text.includes("TS")) quality = "TS";
        else if (text.includes("TC")) quality = "TC";
        else if (text.includes("SCR")) quality = "SCR";

        const isHDR = text.includes("HDR") || text.includes("DV") || text.includes("DOLBY VISION") || text.includes("10BIT");

        let type = "p2p";
        if (text.includes("DEBRID") || text.includes("RD") || text.includes("AD") || text.includes("PM") || text.includes("TB") || text.includes("TORBOX")) type = "debrid";
        else if (stream.url && stream.url.startsWith("http")) type = "http";

        let sizeGB = 0;
        if (stream.behaviorHints && stream.behaviorHints.videoSize) {
            sizeGB = stream.behaviorHints.videoSize / (1024 * 1024 * 1024);
        } else {
            const sizeMatch = text.match(/([0-9.]+)\s*(GB|MB)/i);
            if (sizeMatch) {
                sizeGB = parseFloat(sizeMatch[1]);
                if (sizeMatch[2].toUpperCase() === "MB") sizeGB /= 1024;
            }
        }

        let seeders = 0;
        const seedMatch = text.match(/👤\s*(\d+)/) || text.match(/S:\s*(\d+)/);
        if (seedMatch) seeders = parseInt(seedMatch[1]);

        return { resolution, codec, quality, isHDR, type, sizeGB, seeders };
    }

    function scoreStream(meta, prefs) {
        let score = 0;
        
        const resIdx = prefs.resolutionOrder.indexOf(meta.resolution);
        if (resIdx !== -1) score += (prefs.resolutionOrder.length - resIdx) * 100;

        const qualIdx = prefs.qualityOrder.indexOf(meta.quality);
        if (qualIdx !== -1) score += (prefs.qualityOrder.length - qualIdx) * 50;

        const codecIdx = prefs.codecOrder.indexOf(meta.codec);
        if (codecIdx !== -1) score += (prefs.codecOrder.length - codecIdx) * 25;

        if (prefs.hdrPreference === "prefer" && meta.isHDR) score += 30;

        const typeIdx = prefs.typeOrder.indexOf(meta.type);
        if (typeIdx !== -1) score += (prefs.typeOrder.length - typeIdx) * 40;

        return score;
    }

    const collectedStreams = [];

    for (const addon of _stremioAddons) {
        try {
            const streamUrl = addon.replace("manifest.json", streamEndpoint);
            const streamResp = http.GET(streamUrl, {});
            if (streamResp.code === 200) {
                const streamData = JSON.parse(streamResp.body);
                if (streamData && streamData.streams) {
                    for (const stream of streamData.streams) {
                        if (stream.url && isStreamValid(stream)) {
                            const meta = parseStreamMetadata(stream);
                            
                            // Hard filters
                            if (_streamPrefs.hdrPreference === "exclude" && meta.isHDR) continue;
                            if (_streamPrefs.maxSizeGB && meta.sizeGB > _streamPrefs.maxSizeGB) continue;
                            if (_streamPrefs.minSeeders && meta.type === "p2p" && meta.seeders < _streamPrefs.minSeeders) continue;

                            const score = scoreStream(meta, _streamPrefs);

                            collectedStreams.push({
                                streamObj: new VideoUrlSource({
                                    width: 1920,
                                    height: 1080,
                                    container: stream.url.includes(".m3u8") ? "application/x-mpegURL" : "video/mp4",
                                    url: stream.url,
                                    name: parseStreamName(stream),
                                    bitrate: 0
                                }),
                                score: score
                            });
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

    // Sort streams by score descending and add to sources
    collectedStreams.sort((a, b) => b.score - a.score);
    for (const item of collectedStreams) {
        sources.push(item.streamObj);
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
