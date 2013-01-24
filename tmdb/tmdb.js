/**
 * TMDB plugin for Media Player Showtime
 *
 *  Copyright (C) 2012 Fábio Ferreira (facanferff)
 * 
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
 
(function(plugin) {
	var plugin_info = plugin.getDescriptor();
    var PREFIX = plugin_info.id;

    var service = plugin.createService(plugin_info.title, PREFIX + ":start", "video", true,
			   plugin.path + "logo.png");
						   
    var settings = plugin.createSettings(plugin_info.title,
					  plugin.path + "logo.png",
					 plugin_info.synopsis);

    var store_auth = plugin.createStore('auth', true);
    if (!store_auth.session) {
        store_auth.session = "";
    }

    settings.createInfo("info",
				 plugin.path + "logo.png",
				 "Plugin developed by facanferff, creator of Youtube, Navi-X and Oceanus plugins.");

    settings.createString("searchSource", "Search Source", "http://www.navixtreme.com/cgi-bin/boseman/Scrapers/ct_gsearchv20?q=srcsite//", function (v) { service.searchSource = v; });

    settings.createDivider("TMDB View");
    settings.createBool("cast", "Show Cast", true, function (v) { service.cast = v; });
    settings.createBool("crew", "Show Crew", true, function (v) { service.crew = v; });
    settings.createBool("trailers", "Show Trailers", true, function (v) { service.trailers = v; });
    settings.createBool("collection", "Show Collection", true, function (v) { service.collection = v; });
    settings.createBool("similar_movies", "Show Similar Movies", true, function (v) { service.similar_movies = v; });
    settings.createBool("extras", "Show Extras", true, function (v) { service.extras = v; });

    settings.createDivider("Home page");
    settings.createBool("upcoming", "Show Upcoming", true, function (v) { service.upcoming = v; });
    settings.createBool("now_playing", "Show Now Playing", true, function (v) { service.now_playing = v; });
    settings.createBool("popular", "Show Popular", true, function (v) { service.popular = v; });
    settings.createBool("top_rated", "Show Top Rated", true, function (v) { service.top_rated = v; });

    var api = new TMDB();
    api.init();
    var imdb = new IMDB();
    var util = new Util();
    var shortener = new GoogleUrlShortener();
    var kim = new KidsInMind();

    function pageMenu(page) {
        page.appendAction("navopen", PREFIX + ":standard:lists", true, { title: "Standard Lists", icon: plugin.path + "views/img/list.png", hidden: true });
        page.appendAction("navopen", PREFIX + ":genre:list", true, { title: "Genres", icon: plugin.path + "views/img/list.bmp", hidden: true });

        page.appendAction("navopen", PREFIX + ":search", true, { title: "Search", icon: plugin.path + "views/img/search.png", hidden: true });
        
        page.appendAction("navopen", PREFIX + ":user", true, { title: "User Profile", icon: plugin.path + "views/img/user.png", hidden: true });
    }

    plugin.addURI(PREFIX + ":text:(.*):(.*):(.*)", function (page, title, data, mode) {
        // Page Menu
        pageMenu(page);

        page.type = "directory";
        page.metadata.glwview = plugin.path + "views/text.view";

        var content = unescape(data);

        if (mode == "1")
            content = showtime.httpGet(content).toString();

        page.appendPassiveItem("bodytext", new showtime.RichText(content));

        page.metadata.title = unescape(title);
        page.metadata.content = content;
        page.metadata.lines = content.replace(/\n\n/g, "\n").split("\n").length;

        page.loading = false;
    });

    function pageController(page, loader) {
        var offset = 1;

        function paginator() {
            while(true) {    
                var data = loader(offset);
                page.entries = data.total_results;
                var total_pages = data.total_pages;

                var items = data.results;
                for each (var it in items) {
                    var metadata = {
                        title: it.original_title,
                        icon: "tmdb:image:poster:" + it.poster_path
                    }
                    if (it.backdrop_path)
                        metadata.background = "tmdb:image:backdrop:" + it.backdrop_path;
                    page.appendItem(PREFIX + ":movie:" + it.id + ":2", "directory", metadata);
                }

                page.loading = false;

                if(offset == total_pages)     
                    break;

                offset++;
                page.contents = "movies";
            }

            return offset < page.entries;
        }
    
        paginator();    
        page.paginator = paginator;
    }

    plugin.addURI(PREFIX + ":lists:(.*)", function (page, id) {
        page.type = "directory";
        page.loading = false;

        page.metadata.glwview = plugin.path + "views/loading.view";
        
        pageController(page, function(offset) {
            return api.getData("movie", null, id, offset);
        });

        page.metadata.title = "List";

        page.loading = false;
    });

    plugin.addURI(PREFIX + ":kim:parentsguide:(.*)", function (page, title) {
        page.type = "directory";
        page.metadata.glwview = plugin.path + "views/kim_parentsguide.view";

        var kim_url = kim.searchMovie(unescape(title));
        if (kim_url) {
            var rating = kim.getMovie(kim_url);
            var guide = kim.getParentsGuide(kim_url);

            page.metadata.ratings = [
                { 
                    title: "Sex/Nudity",
                    rating: parseInt(rating.nudity) / 10
                },
                {
                    title: "Violence/Gore",
                    rating: parseInt(rating.violence) / 10
                },
                {
                    title: "Profanity",
                    rating: parseInt(rating.profanity) / 10
                }
            ];

            var content = "";
            if (guide.nudity) content += "SEX/NUDITY\n" + guide.nudity + "\n";
            if (guide.violence) content += "VIOLENCE/GORE\n" + guide.violence + "\n";
            if (guide.profanity) content += "PROFANITY\n" + guide.profanity + "\n";
        }
        else var content = "No Parents Guide has been found.";

        page.metadata.content = new showtime.RichText(content);

        page.metadata.title = unescape(title);

        page.loading = false;
    });

    plugin.addURI(PREFIX + ":imdb:parentsguide:(.*)", function (page, id) {
        page.type = "directory";
        page.metadata.glwview = plugin.path + "views/text.view";

        var parentsguide = imdb.getParentsGuide(id);
        var body = "";
        if (parentsguide)
            body = showtime.entityDecode(parentsguide.replace(/<br\/>/g, "\n").replace(/<(.+?)>/g, ""));
        else
            body = "No information found for this movie.";

        page.metadata.content = new showtime.RichText(body);

        page.metadata.title = "IMDB - Parent's Guide";

        page.loading = false;
    });

    plugin.addURI(PREFIX + ":search", function (page) {
        page.type = "directory";
        page.metadata.glwview = plugin.path + "views/lists.view";

        page.metadata.curPage = PREFIX + ":search";

        pageMenu(page);

        var search = showtime.textDialog('Search for Movies/Persons/Companies:', true, false);

        if (search.rejected) {
            return;
        }
        var searchstring = search.input;
        if (searchstring.length == 0) {
            return;
        }

        //var searchstring = unescape(input);

        var search_movies = [];
        var search_persons = [];

        var data = showtime.JSONDecode(showtime.httpGet("http://api.themoviedb.org/3/search/movie", {
            'api_key': api.key,
            'query': searchstring
        }).toString());

        for (var i in data.results) {
            var it = data.results[i];
            search_movies.push({
                title: it.title,
                image: "tmdb:image:poster:" + it.poster_path,
                url: PREFIX + ":movie:" + it.id + ":1"
            });
        }

        page.appendPassiveItem("list", search_movies, { title: "Search Movies" });


        var data = showtime.JSONDecode(showtime.httpGet("http://api.themoviedb.org/3/search/person", {
            'api_key': api.key,
            'query': searchstring
        }).toString());

        for (var i in data.results) {
            var item = data.results[i];
            var image = item.profile_path;
            if (!image || image == "null") image = plugin.path + "views/img/nophoto.png";
            else image = "tmdb:image:profile:" + image;
            search_persons.push({
                title: item.name,
                image: image,
                url: PREFIX + ":person:" + item.id
            });
        }

        page.appendPassiveItem("list", search_persons, { title: "Search Persons" });


        var search_companies = [];
        var data = showtime.JSONDecode(showtime.httpGet("http://api.themoviedb.org/3/search/company", {
            'api_key': api.key,
            'query': searchstring
        }).toString());

        for (var i in data.results) {
            var item = data.results[i];
            var image = item.logo_path;
            if (!image || image == "null") image = plugin.path + "views/img/nophoto.png";
            else image = "tmdb:image:logo:" + image;
            search_companies.push({
                title: item.name,
                image: image,
                url: PREFIX + ":company:" + item.id
            });
        }

        page.appendPassiveItem("list", search_companies, { title: "Search Companies" });

        page.loading = false;
    });

    //plugin.addURI(PREFIX + ":standard:lists", function (page) {
    function startPage(page) {
        page.type = "directory";
        page.metadata.glwview = plugin.path + "views/loading.view";
        page.loading = false;

        page.metadata.curPage = PREFIX + ":standard:lists";

        pageMenu(page);

        if (service.upcoming) {
        var data = api.getData("movie", null, "upcoming");
        if (data) {
            var upcoming = [];
            for (var i in data.results) {
                var it = data.results[i];
                var image = "tmdb:image:profile:" + it.poster_path;
                if (!it.poster_path || it.poster_path == "null") image = plugin.path + "views/img/nophoto.png";

                var background = "tmdb:image:backdrop:" + it.backdrop_path;
                if (!it.backdrop_path || it.backdrop_path == "null") background = plugin.path + "views/img/background.png";

                upcoming.push({
                    title: it.title,
                    image: image,
                    url: PREFIX + ":movie:" + it.id + ":1",
                    background: background
                });
            }
            upcoming.push({
                title: "See more",
                image: plugin.path + "views/img/add.png",
                url: PREFIX + ":lists:upcoming"
            });
            page.appendPassiveItem("list", upcoming, { title: "Upcoming" });
        }
    }


        if (service.now_playing) {
        var data = api.getData("movie", null, "now_playing");
        if (data) {
            var now_playing = [];
            for (var i in data.results) {
                var it = data.results[i];
                var image = "tmdb:image:profile:" + it.poster_path;
                if (!it.poster_path || it.poster_path == "null") image = plugin.path + "views/img/nophoto.png";

                var background = "tmdb:image:backdrop:" + it.backdrop_path;
                if (!it.backdrop_path || it.backdrop_path == "null") background = plugin.path + "views/img/background.png";

                now_playing.push({
                    title: it.title,
                    image: image,
                    url: PREFIX + ":movie:" + it.id + ":1",
                    background: background
                });
            }
            now_playing.push({
                title: "See more",
                image: plugin.path + "views/img/add.png",
                url: PREFIX + ":lists:now_playing"
            });
            page.appendPassiveItem("list", now_playing, { title: "Now Playing" });
        }
    }

        if (service.popular) {
        var data = api.getData("movie", null, "popular");
        if (data) {
            var popular = [];
            for (var i in data.results) {
                var it = data.results[i];
                var image = "tmdb:image:profile:" + it.poster_path;
                if (!it.poster_path || it.poster_path == "null") image = plugin.path + "views/img/nophoto.png";

                var background = "tmdb:image:backdrop:" + it.backdrop_path;
                if (!it.backdrop_path || it.backdrop_path == "null") background = plugin.path + "views/img/background.png";

                popular.push({
                    title: it.title,
                    image: image,
                    url: PREFIX + ":movie:" + it.id + ":1",
                    background: background
                });
            }
            popular.push({
                title: "See more",
                image: plugin.path + "views/img/add.png",
                url: PREFIX + ":lists:popular"
            });
            page.appendPassiveItem("list", popular, { title: "Popular" });
        }
    }

        if (service.top_rated) {
        var data = api.getData("movie", null, "top_rated");
        if (data) {
            var top_rated = [];
            for (var i in data.results) {
                var it = data.results[i];
                var image = "tmdb:image:profile:" + it.poster_path;
                if (!it.poster_path || it.poster_path == "null") image = plugin.path + "views/img/nophoto.png";

                var background = "tmdb:image:backdrop:" + it.backdrop_path;
                if (!it.backdrop_path || it.backdrop_path == "null") background = plugin.path + "views/img/background.png";

                top_rated.push({
                    title: it.title,
                    image: image,
                    url: PREFIX + ":movie:" + it.id + ":1",
                    background: background
                });
            }
            top_rated.push({
                title: "See more",
                image: plugin.path + "views/img/add.png",
                url: PREFIX + ":lists:top_rated"
            });
            page.appendPassiveItem("list", top_rated, { title: "Top Rated" });
        }
    }

        page.loading = false;
        page.metadata.glwview = plugin.path + "views/lists.view";
        //});
    }

    function GoogleUrlShortener() {
        this.key = "AIzaSyCSDI9_w8ROa1UoE2CNIUdDQnUhNbp9XR4";

        this.shorten_link = function (link) {
            try {
                var data = showtime.JSONDecode(showtime.httpPost("https://www.googleapis.com/urlshortener/v1/url?key=" + this.key, '{"longUrl": "' + link + '"}', {}, {
                    'Content-Type': 'application/json'
                }).toString());
                return data.id;
            }
            catch (ex) {
                showtime.trace("Shorten Link: " + ex);
                return link;
            }
        }
    }

    function IMDB() {
        this.getParentsGuide = function (id) {
            try {
                var data = showtime.httpGet("http://www.imdb.com/title/" + id + "/parentalguide").toString();
                var init = data.indexOf('<div id="swiki.2.view">');
                var end = data.indexOf('<div id="swiki_control2">');
                data = data.slice(init, end).replace(/\r?\n/g, "");
                var split = data.split('<div class="section">');
                var j = 0;
                var body = "";
                for (var i in split) {
                    if (i > 5)
                        break;
                    var item = split[i];
                    var title = item.match("<span>(.+?)<\/span>");
                    if (item.indexOf('<p id="swiki.2.' + (i + 1) + '.1"></p>') != -1)
                        continue;
                    var paragraph = item.match('<p id="swiki.2...1">(.+?)<\/p>');
                    if (title && paragraph) {
                        body += title[1] + "\n" + paragraph[1] + "\n\n";
                        j++;
                    }
                }
                if (j == 0) {
                    return false;
                }
                else {
                    return body;
                }
            }
            catch (ex) { return false; }
        }
    }

    function Util() {
        this.insertionSort = function(array, field) {
            for (var i = 0, j, tmp; i < array.length; ++i) {
                tmp = array[i];

                for (j = i - 1; j >= 0 && array[j][field] > tmp[field]; --j)
                    array[j + 1] = array[j];
                array[j + 1] = tmp;
            }

            return array;
        }
    }

    function TMDB() {
        this.key = "78d57cc453f9a284f483a0969ee65578";
        this.session = "";

        this.init = function () {
            for (var i in store_auth) {
                var value = store_auth[i];
                this[i] = value;
            }
        }

        this.authenticated = function () {
            if (this.session && this.session != "") {
                var data = this.getData("account");
                this.id = data.id;
                return true;
            }
            else return false;
        }

        this.addFavorite = function (movie_id) {
            var body = {
                'movie_id': movie_id,
                'favorite': true
            };

            try {
                var data = showtime.httpPost("http://api.themoviedb.org/3/account/" + this.id + "/favorite", showtime.JSONEncode(body), {
                    'api_key': this.key,
                    'session_id': this.session
                }, {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }).toString();

                showtime.notify("Added succesfully movie to favorites.", 2);
            }
            catch (ex) {
                showtime.trace(ex);
                showtime.notify("Failed to add movie to favorites.", 2);
            }
        }

        this.addWatchList = function (movie_id) {
            var body = {
                'movie_id': movie_id,
                'movie_watchlist': true
            };

            try {
                var data = showtime.httpPost("http://api.themoviedb.org/3/account/" + this.id + "/movie_watchlist", showtime.JSONEncode(body), {
                    'api_key': this.key,
                    'session_id': this.session
                }, {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }).toString();

                showtime.notify("Added succesfully movie to Watch List.", 2);
            }
            catch (ex) {
                showtime.trace(ex);
                showtime.notify("Failed to add movie to Watch List.", 2);
            }
        }

        this.request_token = function () {
            try {
                var request = showtime.httpGet("http://api.themoviedb.org/3/authentication/token/new", {
                    "api_key": this.key
                });
                var data = showtime.JSONDecode(request.toString());

                if (data.success) {
                    this.request_token = data.request_token;

                    data.url = request.headers["Authentication-Callback"];
                    return data;
                }
                else return null;
            }
            catch (ex) {
                return null;
            }
        }

        this.session_id = function () {
            try {
                var request = showtime.httpGet("http://api.themoviedb.org/3/authentication/session/new", {
                    "api_key": this.key,
                    "request_token": this.request_token
                });
                var data = showtime.JSONDecode(request.toString());

                if (data.success) {
                    this.session = data.session_id;

                    store_auth.session = this.session;
                    
                    var match = this.expires.match("(.+?)-(.+?)-(.+?) (.+?):(.+?):(.+?) (.+?)00");
                    var year = parseInt(match[1]);
                    var month = parseInt(match[2]);
                    var day = parseInt(match[3]);
                    var hours = parseInt(match[4]) - parseInt(match[7]);
                    var minutes = parseInt(match[5]);
                    var seconds = parseInt(match[6]);
                    store_auth.expires = new Date(year, month, day, hours, minutes, seconds).getTime().toString();

                    return data;
                }
            }
            catch (ex) {
                
            }
            return null;
        }

        var stopstrings = [
			"1080",
			"1080P",
			"3D",
			"720",
			"720P",
			"AC3",
			"AE",
			"AHDTV",
			"ANALOG",
			"AUDIO",
			"BDRIP",
			"CAM",
			"CD",
			"CD1",
			"CD2",
			"CD3",
			"CHRONO",
			"COLORIZED",
			"COMPLETE",
			"CONVERT",
			"CUSTOM",
			"DC",
			"DDC",
			"DIRFIX",
			"DISC",
			"DISC1",
			"DISC2",
			"DISC3",
			"DIVX",
			"DOLBY",
			"DSR",
			"DTS",
			"DTV",
			"DUAL",
			"DUBBED",
			"DVBRIP",
			"DVDRIP",
			"DVDSCR",
			"DVDSCREENER",
			"EXTENDED",
			"FINAL",
			"FS",
			"HARDCODED",
			"HARDSUB",
			"HARDSUBBED",
			"HD",
			"HDDVDRIP",
			"HDRIP",
			"HDTV",
			"HR",
			"INT",
			"INTERNAL",
			"LASERDISC",
			"LIMITED",
			"LINE",
			"LIVE.AUDIO",
			"MP3",
			"MULTI",
			"NATIVE",
			"NFOFIX",
			"NTSC",
			"OAR",
			"P2P",
			"PAL",
			"PDTV",
			"PPV",
			"PREAIR",
			"PROOFFIX",
			"PROPER",
			"PT",
			"R1",
			"R2",
			"R3",
			"R4",
			"R5",
			"R6",
			"RATED",
			"RC",
			"READ.NFO",
			"READNFO",
			"REMASTERED",
			"REPACK",
			"RERIP",
			"RETAIL",
			"SAMPLEFIX",
			"SATRIP",
			"SCR",
			"SCREENER",
			"SE",
			"STV",
			"SUBBED",
			"SUBFORCED",
			"SUBS",
			"SVCD",
			"SYNCFIX",
			"TC",
			"TELECINE",
			"TELESYNC",
			"THEATRICAL",
			"TS",
			"TVRIP",
			"UNCUT",
			"UNRATED",
			"UNSUBBED",
			"VCDRIP",
			"VHSRIP",
			"WATERMARKED",
			"WORKPRINT",
			"WP",
			"WS",
			"X264",
			"XVID"
        ];

        this.searchMovie = function (title) {
            var reg1 = new RegExp(/\[(.*?)\]/g);
            var t = title.replace(reg1, '');
            var end = t.indexOf('(');
            if (end != -1) t = t.slice(0, end);

            t = t.toUpperCase();
            for (var i in stopstrings) {
                var index = t.indexOf(stopstrings[i]);
                if (index != -1) {
                    t = t.slice(0, index);
                }
            }

            var args = {
                'api_key': this.key,
                'query': encodeURIComponent(showtime.entityDecode(t)),
                'include_adult': 'true'

            };
            var data = showtime.httpGet("http://api.themoviedb.org/3/search/movie", args);
            data = showtime.JSONDecode(data.toString());

            if (parseInt(data['total_results']) > 0) {
                showtime.trace('TMDB: Found ' + data['total_results'] + ' movie entries.');
                return data.results[0].id;
            }
            else {
                showtime.trace('TMDB: No movie entries found.');
                return null;
            }
        }

        this.getData = function (section, id, subsection, page) {
            try {
                var feature = section;
                if (id) feature += "/" + id;
                if (id && subsection) feature += "/";
                if (!id && subsection) feature += "/";
                if (subsection) feature += subsection;
                var data = showtime.JSONDecode(showtime.httpGet("http://api.themoviedb.org/3/" + feature, {
                    'api_key': this.key,
                    'session_id': api.session,
                    'page': (page) ? page : 1
                }).toString());

                return data;
            }
            catch (ex) {
                showtime.trace(ex, "TMDB");
                return null;
            }
        }
    }

    function KidsInMind() {
        this.searchMovie = function (name) {
            var data = showtime.httpGet("http://www.kids-in-mind.com/cgi-bin/search/search.pl?q=" + encodeURIComponent(name) + "&stpos=0&s=R&I14.x=0&I14.y=0").toString();
            var init = data.indexOf('<p class="t11normal" align="right">Found: ');
            var end = data.indexOf('<center>', init);
            data = data.slice(init, end);
            var split = data.split("<br>");

            var items = [];
            for (var i in split) {
                var it = split[i];
                var match = it.match('HREF="(.+?)"');
                if (match) {
                    items.push(match[1]);
                }
            }

            if (items.length > 0) {
                return items[0];
            }
            return null;
        }

        this.getMovie = function (url) {
            var data = showtime.httpGet(url).toString();
            var nudity = data.match('src="../images/ratings/s&n(.+?).jpg" alt="Sex &amp; Nudity"')[1];
            var violence = data.match('src="../images/ratings/v&g(.+?).jpg" alt="Violence &amp; Gore"')[1];
            var profanity = data.match('src="../images/ratings/prof(.+?).jpg" alt="Profanity"')[1];
            return {
                nudity: parseInt(nudity),
                violence: parseInt(violence),
                profanity: parseInt(profanity)
            };
        }

        this.getParentsGuide = function (url) {
            var data = showtime.httpGet(url).toString().replace(/\n/g, "");
            data = data.replace(/<!-- start ssi squaretopcenter1 -->.*<!-- end ssi squaretopcenter1 -->/g, "");
            var match = data.match('<span style="border-bottom:1px dotted #3C3C3C; color:#3C3C3C; text-decoration:none; font-weight: bold">SEX/NUDITY .+?</span> - (.+?)<span style="border-bottom:1px dotted #3C3C3C;');
            var guide = {};
            if (match) {
                guide.nudity = match[1];
            }

            var match = data.match('<span style="border-bottom:1px dotted #3C3C3C; color:#3C3C3C; text-decoration:none; font-weight: bold">VIOLENCE/GORE .+?</span> - (.+?)<span style="border-bottom:1px dotted #3C3C3C;');
            if (match) {
                guide.violence = match[1];
            }

            var match = data.match('<span style="border-bottom:1px dotted #3C3C3C; color:#3C3C3C; text-decoration:none; font-weight: bold">PROFANITY .+?</span> - (.+?)<span style="border-bottom:1px dotted #3C3C3C;');
            if (match) {
                guide.profanity = match[1];
            }

            return guide;
        }
    }
    
    plugin.addURI(PREFIX + ":movie:(.*):(.*)", function (page, query, mode) {
        page.type = "directory";
        page.metadata.glwview = plugin.path + "views/loading.view";
        page.metadata.backgroundAlpha = 0.5;
        page.loading = false;
        page.metadata.lists = [];

        page.metadata.progress = 0;

        query = unescape(query);
        var id = null;
        if (mode == "0") {
            id = api.searchMovie(query);

            if (!id) {
                page.error("No movies found for the title given.");
                return;
            }
        }
        else if (parseInt(mode) < 3) id = query;
        else {
            page.error("Unknown mode");
            return;
        }

        page.metadata.rating = 2;
        plugin.subscribe("page.model.metadata.rating", function (v) {
            showtime.print(v);
        });
        for (var i = 0; i < 5; i++) {
            page.onEvent("rating" + i, function (v) {
                showtime.print(v);
            });
        }

        var item = api.getData("movie", id);

        page.metadata.progress = 20;

        if (!item) {
            page.error("TMDB couldn't parse information for this movie.");
            return;
        }

        var tmdb_id = item.id;

        page.metadata.title = item.title;

        page.metadata.logo = "tmdb:image:poster:" + item.poster_path;
        if (item.backdrop_path)
            page.metadata.background = "tmdb:image:backdrop:" + item.backdrop_path;

        // General Movie Informations
        var genres = "";
        for (var i in item.genres) {
            var entry = item.genres[i];
            genres += entry.name;
            if (i < item.genres.length - 1)
                genres += ', ';
        }

        var titles = [];
        var title = item.title;

        if (item.original_title != title) {
            page.metadata.original_title = item.original_title;
        }

        var item1 = {};

        if (service.cast || service.crew) {
        // Cast and Crew Informations
        item1 = api.getData("movie", tmdb_id, "casts");
        if (item1) {
            var cast = [];
            var crew = [];
            var director = "";
            var writers = "";

            if (service.crew) {
            for (var i in item1.crew) {
                var person = item1.crew[i];

                if (person.department == "Directing" && director == "")
                    director = person.name;

                if (person.department == "Writing" && writers.indexOf(person.name) == -1)
                    writers += person.name + ", ";

                var image = "tmdb:image:profile:" + person.profile_path;
                if (!person.profile_path || person.profile_path == "null") image = plugin.path + "views/img/nophoto.png";
                crew.push({
                    //title: person.name + "\n" + person.job,
                    title: person.name,
                    subtitle: person.job,
                    image: image,
                    url: PREFIX + ":person:" + person.id,
                    parent: "Crew List"
                });
            }
        }

        page.metadata.progress = 40;

            if (writers != "")
                writers = writers.slice(0, writers.length - 2);

            if (service.cast) {
            item1.cast = util.insertionSort(item1.cast, "order");
            for (var i in item1.cast) {
                var character = item1.cast[i];
                var image = "tmdb:image:profile:" + character.profile_path;
                if (!character.profile_path || character.profile_path == "null") image = plugin.path + "views/img/nophoto.png";
                cast.push({
                    //title: character.name + "\n" + character.character,
                    title: character.name,
                    subtitle: character.character,
                    actor: character.name,
                    character: character.character,
                    image: image,
                    url: PREFIX + ":person:" + character.id,
                    parent: "Cast List"
                });
            }

            if (cast.length > 0)
                page.appendPassiveItem("list", cast, { title: "Actors" });
        }

            if (service.crew && crew.length > 0)
                page.appendPassiveItem("list", crew, { title: "Crew" });
        } 
    }

        page.metadata.progress = 60;

        page.metadata.description = item.overview;

        if (director)
            page.appendPassiveItem("label", new showtime.RichText(director), { title: "Director: " });
        if (writers)
            page.appendPassiveItem("label", new showtime.RichText(writers), { title: "Writers: " });
        if (genres)
            page.appendPassiveItem("label", new showtime.RichText(genres), { title: "Genres: " });
        if (item.budget)
            page.appendPassiveItem("label", new showtime.RichText("$" + item.budget.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")), { title: "Budget: " });

        if (item.release_date) {
            var year = item.release_date.slice(0, item.release_date.indexOf("-"));
            page.metadata.title += " (" + year + ")";
        }

        var rating = parseFloat(item.vote_average) / 10;
        if (rating)
            page.appendPassiveItem("rating", rating, { title: "Rating: " });
        if (item.runtime)
            page.appendPassiveItem("label", new showtime.RichText(item.runtime + " min"), { title: "Runtime: " });

        var item2 = api.getData("movie", tmdb_id, "releases");
        if (item2) {
            for (var i in item2.countries) {
                var it = item2.countries[i];
                if (it.iso_3166_1 == "US" && it.certification != "") {
                    page.appendPassiveItem("label", new showtime.RichText(it.certification), { title: "US Certification: " });
                }
            }
        }

        if (page.metadata.description)
            page.appendPassiveItem("bodytext", new showtime.RichText(page.metadata.description), { title: "Overview" });

        if (service.trailers) {
        // Trailers
        var item1 = api.getData("movie", tmdb_id, "trailers");
        var trailers = [];
        if (item1) {
            showtime.trace("TMDB: Parsing Trailers");
            for (var i in item1.youtube) {
                var trailer = item1.youtube[i];
                var image = "http://i.ytimg.com/vi/" + trailer.source + "/hqdefault.jpg";
                trailers.push({
                    image: image,
                    title: trailer.name + " (" + trailer.size + ")",
                    url: "youtube_test:video:simple:" + escape(page.metadata.title + " - " + trailer.name) + ":" + trailer.source
                });
            }

            page.appendPassiveItem("list", trailers, { title: "Trailers" });
        }
    }

        page.metadata.progress = 70;

        if (service.collection) {
        // Collection
        if (item.belongs_to_collection && item.belongs_to_collection != "null") {
            var item1 = api.getData("collection", item.belongs_to_collection.id);
            var collection = [];
            if (item1) {
                showtime.trace("TMDB: Parsing Collection");
                for (var i in item1.parts) {
                    var movie = item1.parts[i];
                    var image = "tmdb:image:profile:" + movie.poster_path;
                    if (!movie.poster_path || movie.poster_path == "null") image = plugin.path + "views/img/nophoto.png";
                    collection.push({
                        image: image,
                        title: movie.title,
                        url: PREFIX + ":movie:" + movie.id + ":1"
                    });
                }
            }

            page.appendPassiveItem("list", collection, { title: "Collection" });
        }
    }

        page.metadata.progress = 80;

        if (service.similar_movies) {
        // Similar movies
        var item1 = api.getData("movie", tmdb_id, "similar_movies");
        if (item1) {
            var similar_movies = [];
            for (var i in item1.results) {
                try {
                    var movie = item1.results[i];
                    var image = "tmdb:image:profile:" + movie.poster_path;
                    if (!movie.poster_path || movie.poster_path == "null") image = plugin.path + "views/img/nophoto.png";
                    similar_movies.push({
                        image: image,
                        title: movie.title,
                        url: PREFIX + ":movie:" + movie.id + ":1",
                        mode: "navopen"
                    });
                }
                catch (ex) {
                    showtime.trace("Skipped 1 similar movie due to: " + ex);
                }
            }
            page.appendPassiveItem("list", similar_movies, { title: "Similar Movies" });
        }
    }

        page.metadata.progress = 90;

        if (service.extras) {

        var q = title;
        if (year)
            q += " " + year;

        page.appendAction("pageevent", "addToFavorites", true, { title: "Add to Favorites", image: plugin.path + "views/img/add_favorite.png" })

        page.onEvent("addToFavorites", function (v) {
            api.addFavorite(tmdb_id);
        });

        page.appendAction("navopen", "navi-x:playlist:playlist:" + escape(service.searchSource + encodeURIComponent(q)), true, { title: "Search for entries", image: plugin.path + "views/img/search.png" })

        
        if (item.imdb_id && item.imdb_id != "null")
            page.appendAction("navopen", PREFIX + ":imdb:parentsguide:" + item.imdb_id, true, { title: "IMDB - Parents Guide", image: plugin.path + "views/img/rated-r.png" });

        //page.appendAction("navopen", PREFIX + ":kim:parentsguide:" + encodeURIComponent(title), true, { title: "Kids in Mind - Parents Guide", image: plugin.path + "views/img/rated-r.png" })

        /*page.appendAction("pageevent", "addToWatchList", true, { title: "Add to Watch List", icon: plugin.path + "views/img/watch_later.png" });
        page.onEvent('addToWatchlist', function () {
            api.addWatchList(tmdb_id);
        });*/

        }

        page.metadata.progress = 100;
        page.metadata.glwview = plugin.path + "views/tmdb.view";

        page.loading = false;
    });

    plugin.addURI(PREFIX + ":genre:list", function (page) {
        page.type = "directory";
        page.metadata.backgroundAlpha = 0.5;
        page.metadata.glwview = plugin.path + "views/genres.view";
        page.metadata.actions_title = "Genres";

        page.metadata.curPage = PREFIX + ":genre:list";

        pageMenu(page);

        var data = api.getData("genre", null, "list");

        var genres = [];
        var image = plugin.path + "views/img/nophoto.png";
        for (var i in data.genres) {
            var item = data.genres[i];

            genres.push({
                title: item.name,
                image: image,
                url: PREFIX + ":genre:" + item.id
            });

            page.appendAction("pageevent", "getGenre" + item.id + "_" + escape(item.name), true, { title: item.name, image: image })
            page.onEvent("getGenre" + item.id + "_" + escape(item.name), function (v) {
                var match = v.match("getGenre(.+?)_(.*)");
                var j = match[1];
                page.metadata.genre = unescape(match[2]);
                var data = api.getData("genre", j, "movies");
                var movies = [];
                for (var k in data.results) {
                    movies.push({
                        title: data.results[k].name,
                        image: "tmdb:image:poster:" + data.results[k].poster_path,
                        url: PREFIX + ":movie:" + data.results[k].id + ":1"
                    });
                }
                page.metadata.movies = movies;
            });
        }
        
        page.loading = false;
    });


    plugin.addURI(PREFIX + ":person:(.*)", function (page, id) {
        page.type = "directory";
        page.metadata.glwview = plugin.path + "views/loading.view";
        page.loading = false;
        page.metadata.backgroundAlpha = 0.5;

        var item = api.getData("person", id);

        page.metadata.title = item.name;

        page.metadata.logo = "tmdb:image:poster:" + item.profile_path;

        if (item.birthday)
            page.appendPassiveItem("label", item.birthday + "\n" + item.place_of_birth, { title: "Birthday: " });
        if (item.deathday)
            page.appendPassiveItem("label", item.deathday, { title: "Day of death: " });
        if (item.homepage)
            page.appendPassiveItem("label", item.homepage, { title: "Website: " });
        if (item.biography)
            page.appendPassiveItem("bodytext", item.biography, { title: "Biography" });

        var credits = api.getData("person", id, "credits");

        if (service.cast) {
            var cast = [];
            for (var i in credits.cast) {
                var character = credits.cast[i];
                var image = "tmdb:image:profile:" + character.poster_path;
                if (!character.poster_path || character.poster_path == "null") image = plugin.path + "views/img/nophoto.png";
                cast.push({
                   title: character.title + "\n" + character.character,
                    character: character.character,
                    image: image,
                    url: PREFIX + ":movie:" + character.id + ":1",
                    parent: "Cast List"
                });
            }

            if (cast.length > 0)
                page.appendPassiveItem("list", cast, { title: "As Actor/Actress" });
        }

        if (service.crew) {
            var crew = [];
            for (var i in credits.crew) {
                var person = credits.crew[i];

                var image = "tmdb:image:profile:" + person.poster_path;
                if (!person.poster_path || person.poster_path == "null") image = plugin.path + "views/img/nophoto.png";
                crew.push({
                    title: person.title + "\n" + person.job,
                    image: image,
                    url: PREFIX + ":movie:" + person.id + ":1",
                    parent: "Crew List"
                });
            }

            if (crew.length > 0)
                page.appendPassiveItem("list", crew, { title: "As Crew" });
        }

        page.loading = false;
        page.metadata.glwview = plugin.path + "views/tmdb.view";
    });

    plugin.addURI(PREFIX + ":company:(.*)", function (page, id) {
        page.type = "directory";
        page.metadata.glwview = plugin.path + "views/tmdb.view";
        page.metadata.backgroundAlpha = 0.5;

        var item = api.getData("company", id);
        page.metadata.title = item.name;
        var image = "tmdb:image:poster:" + item.logo_path;
        if (!item.poster_path || item.poster_path == "null") image = plugin.path + "views/img/nophoto.png";
        page.metadata.logo = image;

        var item = api.getData("company", id, "movies");
        var movies = [];
        for (var i in item.results) {
            var movie = item.results[i];
            var image = "tmdb:image:poster:" + movie.poster_path;
            if (!movie.poster_path || movie.poster_path == "null") image = plugin.path + "views/img/nophoto.png";
            movies.push({
                title: movie.title,
                image: image,
                url: PREFIX + ":movie:" + movie.id + ":1"
            });
        }

        page.appendPassiveItem("list", movies, { title: "Movies" });


        page.loading = false;
    });

    plugin.addURI(PREFIX + ":user", function (page) {
        if (!api.authenticated()) {
            page.type = "directory";
            page.metadata.glwview = plugin.path + "views/auth_1.view";

            page.loading = false;

            api = new TMDB();
            var request = api.request_token();
            if (request) {
                showtime.trace("Go to: " + request.url);
                var url = shortener.shorten_link(request.url);
                page.metadata.url = url;
            }
            else return;

            var screens = [
                {
                    image: plugin.path + "views/img/auth/login.png",
                    caption: "If you're not authenticated, please enter your credentials to log in."
                },
                {
                    image: plugin.path + "views/img/auth/auth_request.png",
                    caption: "When the website asks if you Deny or Allow, click Allow if you authorize."
                },
                {
                    image: plugin.path + "views/img/auth/auth_confirmation.png",
                    caption: "If everything goes well, you should achieve a page telling you to return to application.",
                    event: "auth_confirm"
                }
            ];

            var screens2 = [
                /*{
                    image: plugin.path + "views/img/auth/movie.png",
                    caption: "In the Movie View you get all information about a movie you want and much more."
                },*/
                {
                    image: plugin.path + "views/img/auth/person.png",
                    caption: "Don't remember the name of a movie but you know one actor of it? Simple, access that actor page."
                }
            ];

            page.onEvent('auth_confirm', function () {
                var session = api.session_id();
                if (api.session) {
                    page.metadata.glwview = plugin.path + "views/auth_2.view";
                }
                else showtime.notify("Authentication failed. Try again.", 2);
            });

            page.metadata.screens = screens;
            page.metadata.screens2 = screens2;
        }
        else {
            page.type = "directory";
            page.metadata.glwview = plugin.path + "views/user.view";
            page.metadata.backgroundAlpha = 0.5;

            page.metadata.curPage = PREFIX + ":user";

            pageMenu(page);

            var item = api.getData("account");

            page.metadata.title = item.username;
            var id = item.id;

            item = api.getData("account", id, "favorite_movies");
            var favorites = [];
            for (var i in item.results) {
                var it = item.results[i];
                var image = "tmdb:image:profile:" + it.poster_path;
                if (!it.poster_path || it.poster_path == "null") image = plugin.path + "views/img/nophoto.png";
                favorites.push({
                    title: it.title,
                    image: image,
                    url: PREFIX + ":movie:" + it.id + ":1"
                });
            }

            page.appendPassiveItem("list", favorites, { title: "Favorites" });


            item = api.getData("account", id, "movie_watchlist");
            var watchList = [];
            for (var i in item.results) {
                var it = item.results[i];
                var image = "tmdb:image:profile:" + it.poster_path;
                if (!it.poster_path || it.poster_path == "null") image = plugin.path + "views/img/nophoto.png";
                watchList.push({
                    title: it.title,
                    image: image,
                    url: PREFIX + ":movie:" + it.id + ":1"
                });
            }

            page.appendPassiveItem("list", watchList, { title: "Watch List" });


            item = api.getData("account", id, "rated_movies");
            var ratedMovies = [];
            for (var i in item.results) {
                var it = item.results[i];
                var image = "tmdb:image:profile:" + it.poster_path;
                if (!it.poster_path || it.poster_path == "null") image = plugin.path + "views/img/nophoto.png";
                ratedMovies.push({
                    title: it.title,
                    image: image,
                    url: PREFIX + ":movie:" + it.id + ":1"
                });
            }

            page.appendPassiveItem("list", ratedMovies, { title: "Rated Movies" });

            page.loading = false;
        }
    });

    plugin.addURI(PREFIX + ":start", startPage);
    plugin.addURI(PREFIX + ":standard:lists", startPage);
})(this);
