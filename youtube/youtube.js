/**
 * Youtube plugin for Media Player Showtime
 *
 *  Copyright (C) 2011-2012 Fábio Ferreira (facanferff)
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
    var country = '';
    var ui = {
        background : null
    };

    var service = plugin.createService(plugin_info.title, PREFIX + ":start", "video", true,
	plugin.path + "logo.png");
        
    var settings = plugin.createSettings(plugin_info.title, plugin.path + "logo.png", 
        plugin_info.synopsis);

    // stores
    var oauth_information = plugin.createStore('oauth2', true);
    var store_lists = plugin.createStore('lists', true);
    var user_preferences = plugin.createStore('user_preferences', true);

    var main_menu_order = plugin.createStore('main_menu_order', true);

    if (!main_menu_order.ready) {
        main_menu_order.ready = "1";
    }

    if (!user_preferences.ready) {
        user_preferences.ready = "1";
    }

    if (!store_lists.categories) {
        var categories = getCatList('http://gdata.youtube.com/schemas/2007/categories.cat');
        store_lists.categories = categories;

        categories = eval(categories);
    }
    else var categories = eval(store_lists.categories);

    if (!store_lists.channel_types) {
        var channelTypes = getCatList('http://gdata.youtube.com/schemas/2007/channeltypes.cat');
        store_lists.channel_types = channelTypes;

        channelTypes = eval(channelTypes);
    }
    else var channelTypes = eval(store_lists.channel_types);

    if (!store_lists.show_genres) {
        var showGenres = getCatList('http://gdata.youtube.com/schemas/2007/showgenres.cat');
        store_lists.show_genres = showGenres;

        showGenres = eval(showGenres);
    }
    else var showGenres = eval(store_lists.show_genres);

    if (!store_lists.movie_genres) {
        var movieGenres = getCatList('http://gdata.youtube.com/schemas/2007/moviegenres.cat');
        store_lists.movie_genres = movieGenres;

        movieGenres = eval(movieGenres);
    }
    else var movieGenres = eval(store_lists.movie_genres);

    settings.createDivider('Browser Settings');

    settings.createInt("entries", "Maximum number of entries per request (default: 150)", 150, 5, 1000, 5, '', function(v) {
        service.entries = v;
    });

    var resolutionFilter = [
        ['both', 'Both (SD & HD)', true], ['hd', 'HD'], ['sd', 'SD']
    ];
    settings.createMultiOpt("resolutionFilter", "Filter by resolution", resolutionFilter, function(v){
        service.resolutionFilter = v;
    });

    var safeSearch = [
        ['strict', 'Strict'], ['moderate', 'Moderate', true], ['none', 'None']
    ];
    settings.createMultiOpt("safeSearch", "Safe Search", safeSearch, function(v){
        service.safeSearch = v;
    });

    settings.createDivider('General Feed Settings');

    settings.createMultiOpt("category", "Category", categories, function(v){
        service.category = v;
    });
    
    var regions = [
        ['all', 'All', true],
        ['AR', 'Argentina'], ['AU', 'Australia'], ['BR', 'Brazil'],
        ['CA', 'Canada'], ['CZ', 'Czech Republic'], ['FR', 'France'],
        ['DE', 'Germany'], ['GB', 'Great Britain'], ['HK', 'Hong Kong'],
        ['HU', 'Hungary'],
        ['IN', 'India'], ['IE', 'Ireland'], ['IL', 'Israel'],
        ['IT', 'Italy'], ['JP', 'Japan'], ['MX', 'Mexico'],
        ['NL', 'Netherlands'], ['NZ', 'New Zealand'], ['PL', 'Poland'],
        ['RU', 'Russia'], ['ZA', 'South Africa'], ['KR', 'South Korea'],
        ['ES', 'Spain'], ['SE', 'Sweden'], ['TW', 'Taiwan'],
        ['US', 'United States']
    ];
    settings.createMultiOpt("region", "Region", regions, function(v){
        service.region = v;
    });


    settings.createDivider('Channel Feed Settings');

    settings.createMultiOpt("channelType", "Channel Type", channelTypes, function(v){
        service.channelType = v;
    });


    settings.createDivider('Movie Feed Settings');
    
    settings.createMultiOpt("movieGenre", "Genre", movieGenres, function(v){
        service.movieGenre = v;
    });

    var languages = [
        ['all', 'All', true], ['en', 'English'], ['es', 'Spanish'], ['fr', 'French'], ['ja', 'Japanese'], ['pt', 'Portuguese']
    ];
    settings.createMultiOpt("movieLanguage", "Language", languages, function(v){
        service.movieLanguage = v;
    });


    settings.createDivider('Shows Feed Settings');
    
    settings.createMultiOpt("showGenre", "Genre", showGenres, function(v){
        service.showGenre = v;
    });
    
    
    settings.createDivider('Video Settings');
    
    settings.createBool("mode", "Advanced Youtube (Extra video features)", false, function(v) {
        if (v == '1')
            service.mode = 'advanced';
        else
            service.mode = 'simple';
    });
    
    var maximumResolution = [
        ['4', '1080p', true], ['3', '720p'], ['2', '480p'], ['1', '360p'], ['0', '240p']
    ];
    settings.createMultiOpt("maximumResolution", "Highest resolution", maximumResolution, function(v){
        service.maximumResolution = v;
    });

    var minimumResolution = [
        ['4', '1080p'], ['3', '720p'], ['2', '480p'], ['1', '360p'], ['0', '240p', true]
    ];
    settings.createMultiOpt("minimumResolution", "Lowest resolution", minimumResolution, function(v){
        service.minimumResolution = v;
    });
    
    var formats = [
        ['default', 'Default', true], ['mp4', 'MP4'], ['x-flv', 'FLV']
    ];
    settings.createMultiOpt("format", "Video Format", formats, function(v){
        service.format = v;
    });

    var video_sources = [
        ['default', 'Default', true], ['fallback', 'Fallback']
    ];
    settings.createMultiOpt("video_source", "Video Source", video_sources, function(v){
        service.video_source = v;
    });
    
    settings.createBool("universalSubtitles", "Enable Universal Subtitles", false, function(v) {
        service.universalSubtitles = v;
    });

    settings.createBool("transcribedCaptions", "Enable Transcribed Captions", false, function(v) {
        service.transcribedCaptions = v;
    });

    settings.createBool("automaticSpeechCaptions", "Enable Automatic Speech", false, function(v) {
        service.automaticSpeechCaptions = v;
    });


    settings.createDivider("User Profile");

    settings.createBool("showUploads", "Show User Uploads", true, function(v) { service.showUploads = v; });
    settings.createBool("showFavorites", "Show User Favorites", true, function(v) { service.showFavorites = v; });
    settings.createBool("showPlaylists", "Show User Playlists", true, function(v) { service.showPlaylists = v; });
    settings.createBool("showSubscriptions", "Show User Subscriptions", true, function(v) { service.showSubscriptions = v; });
    settings.createBool("showNewSubscriptionVideos", "Show User New Subscription Videos", true, function(v) { service.showNewSubscriptionVideos = v; });
    settings.createBool("showWatchHistory", "Show User Watch History", true, function(v) { service.showWatchHistory = v; });
    settings.createBool("showWatchLater", "Show User Watch Later", false, function(v) { service.showWatchLater = v; });
    settings.createBool("showVideoRecommendations", "Show User Video Recommendations", false, function(v) { service.showVideoRecommendations = v; });

    
    settings.createDivider('User Settings');

    var api = new Youtube_API();
    api.init();

    settings.createAction("login", "API Log In", function () {
        if (api.login())
            showtime.notify('Authenticated succesfully', 2);
    });

    var website = new websiteApi();
    var downloader = new Downloader();
    var items = [];
    var items_tmp = [];

    function startPage(page) {
        ui.background = user_preferences.background;
        pageMenu(page);

        page.metadata.glwview = plugin.path + "views/array2.view";

        var standard_feeds = [];
        for (var i in api["standard_feeds"]) {
            var entry = api["standard_feeds"][i];
            standard_feeds.push({
                url: PREFIX + ':feed:' + escape(entry[1]),
                title: entry[0],
                icon: entry[2]
            });
        }

        var channel_feeds = [];
        for (var i in api["channel_feeds"]) {
            var entry = api["channel_feeds"][i];
            channel_feeds.push({
                url: PREFIX + ':feed:' + escape(entry[1]),
                title: entry[0],
                icon: entry[2]
            });
        }

        var items = [];
        items.push(page.appendItem(PREFIX + ':browse', 'directory', {title: 'Browse Videos', icon: plugin.path + "views/img/logos/explore.png" }));
        items.push(page.appendItem(PREFIX + ':mixfeeds:'+ 'standard_feeds', 'directory', {title: 'Standard Feeds', icon: plugin.path + "views/img/logos/feeds.png" }));
        items.push(page.appendItem(PREFIX + ':mixfeeds:'+ 'channel_feeds', 'directory', {title: 'Channel Feeds', icon: plugin.path + "views/img/logos/channels.png" }));
        items.push(page.appendItem(PREFIX + ':edu', 'directory', { title: 'Youtube EDU', icon: plugin.path + "views/img/logos/edu.png" }));
        items.push(page.appendItem(PREFIX + ':mixfeeds:'+ 'live_feeds', 'directory', {title: 'Youtube Live', icon: plugin.path + "views/img/logos/live.png" }));
        items.push(page.appendItem(PREFIX + ':mixfeeds:'+ 'movie_feeds', 'directory', {title: 'Youtube Movies', icon: plugin.path + "views/img/logos/movies.png" }));
        items.push(page.appendItem(PREFIX + ':mixfeeds:'+ 'show_feeds', 'directory', {title: 'Youtube Shows', icon: plugin.path + "views/img/logos/shows.png" }));
        items.push(page.appendItem(PREFIX + ':disco:null', 'directory', {title: 'Youtube Disco', icon: plugin.path + "views/img/logos/disco.png" }));
        
        if (api.apiAuthenticated)
            items.push(page.appendItem(PREFIX + ':user:default', 'directory', {title: 'User Profile', icon: plugin.path + "views/img/logos/user.png" }));
    
        for (var i in items) {
            items[i].id = i;
        }

        if (!main_menu_order.order) {
            var items_tmp = page.getItems();
            for(var i = 0; i < items_tmp.length; i++) {
                if (!items_tmp[i].id) delete items_tmp[i];
            }
            main_menu_order.order = showtime.JSONEncode(items_tmp);
        }

        main_menu_order.order;

        var order = showtime.JSONDecode(main_menu_order.order);
        for (var i in order) {
            items[order[i].id].moveBefore(i);
        }

        page.reorderer = function(item, before) {
            item.moveBefore(before);
            var items = page.getItems();
            for(var i = 0; i < items.length; i++) {
                if (!items[i].id) delete items[i];
            }

            main_menu_order.order = showtime.JSONEncode(items);
        };

        page.type = "directory";
        page.contents = "items";
        page.loading = false;

        page.metadata.logo = plugin.path + "logo.png";
        page.metadata.title = "Youtube - Home Page";
    }

    plugin.addURI(PREFIX + ":oauth:confirm:(.*)", function (page, code) {
        page.type = "directory";
        page.metadata.glwview = plugin.path + "views/auth_2.view";

        page.loading = false;

        if (api.pollRequest(unescape(code))) {
            var screens = [
                {
                    image: "http://i.imgur.com/OaW6K.jpg",
                    caption: "You have been successfully authenticated."
                }
            ];
        }
        else {
            var screens = [
                {
                    image: "http://i.imgur.com/OaW6K.jpg",
                    caption: "There was one error while trying to authenticate you. Try again later."
                }
            ];
        }

        page.metadata.screens = screens;

        page.type = "directory";
        page.contents = "items"
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":search", function(page) {
        page.metadata.title = 'Youtube Search';
        page.metadata.logo = plugin.path + "views/img/logos/music.png";

        pageMenu(page, null, null);

        page.metadata.search = "";
        page.subscribe("page.model.metadata.search", function(v) {
            page.metadata.search = v;
        });
        page.appendAction("navopen", PREFIX + ":feed:" + escape("https://gdata.youtube.com/feeds/api/videos?q=" + page.metadata.search), true, { title: "Search for Videos", icon: plugin.path + "views/img/search_videos.png", hidden: true, search: true });
        page.appendAction("navopen", PREFIX + ":feed:" + escape("https://gdata.youtube.com/feeds/api/playlists/snippets?q=" + page.metadata.search), true, { title: "Search for Playlists", icon: plugin.path + "views/img/search_playlists.png", hidden: true, search: true });
        page.appendAction("navopen", PREFIX + ":feed:" + escape("https://gdata.youtube.com/feeds/api/channels?q=" + page.metadata.search), true, { title: "Search for Channels", icon: plugin.path + "views/img/search_channels.png", hidden: true, search: true });
        page.appendAction("navopen", PREFIX + ":disco:" + escape(page.metadata.search), true, { title: "Disco", icon: plugin.path + "views/img/logos/music.png", hidden: true, search: true });

        page.metadata.glwview = plugin.path + "views/search.view";

        page.type = "directory";
        page.contents = "items";
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":list:(.*)", function(page, list) {
        page.metadata.title = 'Youtube Music';
        page.metadata.logo = plugin.path + "views/img/logos/music.png";

        pageMenu(page, null, null);

        var entries = website.getPlaylist(list);

        for (var i in entries) {
            var item = entries[i];
            page.appendItem(PREFIX + ":video:" + service.mode + ":" + escape(item.title) + ":" + item.id, "video", item);
        }
    
        page.type = "directory";
        page.contents = "items";
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":edu", function(page) {
        page.metadata.title = 'Youtube EDU';
        page.metadata.logo = plugin.path + "views/img/logos/edu.png";

        pageMenu(page, null, null);

        var edu_categories = eval(getCatList("http://gdata.youtube.com/schemas/2007/educategories.cat"));
        for (var i in edu_categories) {
            var entry = edu_categories[i];
            if (entry[1] == "All") continue;
            page.appendItem(PREFIX + ':edu:category:' + entry[0], 'directory', {
                title: entry[1]
            })
        }
    
        page.type = "directory";
        page.contents = "items"
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":edu:category:(.*?)", function(page, categoryId) {
        page.metadata.title = 'Youtube EDU';
        page.metadata.logo = plugin.path + "views/img/logos/edu.png";

        pageMenu(page, null, null);

        page.appendItem(PREFIX + ':feed:' + escape("http://gdata.youtube.com/feeds/api/edu/courses?category=" + categoryId), 'directory', {
            title: "Courses"
        })

        page.appendItem(PREFIX + ':feed:' + escape("http://gdata.youtube.com/feeds/api/edu/lectures?category=" + categoryId), 'directory', {
            title: "Lectures"
        })
        
        page.type = "directory";
        page.contents = "items"
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":disco:(.*)", function(page, query) {
        page.metadata.title = 'Youtube Disco';
        page.metadata.logo = plugin.path + "logo.png";

        pageMenu(page);
    
        var artist = unescape(query);
        if (query == "null") {
            var titleInput = showtime.textDialog('Artist: ', true, true);

            if (search.rejected) {
                page.error('Cancelled by user request.');
                return;
            }
            artist = titleInput.input;
            if (artist.length == 0) {
                page.error('Empty string is not valid');
                return;
            }
        }

        var q = escape(artist);
        var data = showtime.httpGet('http://www.youtube.com/disco?action_search=1&query=' + q);
        try {
            data = showtime.JSONDecode(data.toString());
            if (data.url == '\/disco?search_query=' + q) {
                page.error("Youtube can't find any artist with that name. Sorry about that.");
                return;
            }

            var entries = website.getPlaylist(data.url.match('list=([^&]*)')[1]);
            
            for (var i in entries) {
                var item = entries[i];
                page.appendItem(PREFIX + ":video:" + service.mode + ":" + escape(item.title) + ":" + item.id, "video", { title: showtime.entityDecode(item.title), icon: item.logo });
            }
        }
        catch (ex) {
            page.error('There was one error while requesting for the specified artist: \n' + ex);
            showtime.trace(ex, "YOUTUBE-ERROR");
            showtime.trace(ex.stack, "YOUTUBE-ERROR");
            return;
        }
    
        page.type = "directory";
        page.contents = "items";
        page.loading = false;
    });
  
    plugin.addURI(PREFIX + ":browse", function(page) {
        page.metadata.title = 'Youtube';
        page.metadata.logo = plugin.path + "logo.png";

        pageMenu(page);
		
		//page.metadata.glwview = plugin.path + "views/array2.view";
    
        for (var i in categories) {
            var entry = categories[i];
            page.appendItem(PREFIX + ':feed:' + escape('https://gdata.youtube.com/feeds/api/videos?category=' + entry[0]), 'directory', {
                title: entry[1]
            })
        }
    
        page.type = "directory";
        page.contents = "items";
        page.loading = false;
    });
  
    plugin.addURI(PREFIX + ":mixfeeds:(.*)", function(page, type) {
        page.metadata.title = 'Youtube';
        page.metadata.logo = plugin.path + "logo.png";

        pageMenu(page);
		
		//page.metadata.glwview = plugin.path + "views/array2.view";
    
        for (var i in api[type]) {
            var entry = api[type][i];
            page.appendItem(PREFIX + ':feed:' + escape(entry[1]),"directory", {
                title: entry[0],
                icon: entry[2]
            });
        }
    
        page.type = "directory";
        page.contents = "items";
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":feed:sort:(.*):(.*)", function(page, category, url) {
        page.type = "directory";
        page.contents = "contents";
        page.loading = false;

        var link = unescape(url);
        var cat = unescape(category);

        var res = getUrlArgs(link);
        link = res.url;

        for (var i in api.orderby_values) {
            var value = api.orderby_values[i];
            
            if (cat == "http://gdata.youtube.com/schemas/2007#video" && value[2].indexOf('video') == -1)
                continue;
            if (cat == "http://gdata.youtube.com/schemas/2007#playlist" && value[2].indexOf('playlist') == -1)
                continue;

            res.args['orderby'] = value[1];
            var link_tmp = putUrlArgs(link, res.args);

            page.appendItem(PREFIX + ':feed:' + escape(link_tmp),"directory", {title: value[0]});
        }
    });

    plugin.addURI(PREFIX + ":feed:duration:(.*)", function(page, url) {
        page.type = "directory";
        page.contents = "contents";
        page.loading = false;

        var link = unescape(url);

        var res = getUrlArgs(link);
        link = res.url;

        res.args['duration'] = 'short';
        var link_tmp1 = putUrlArgs(link, res.args);

        res.args['duration'] = 'medium';
        var link_tmp2 = putUrlArgs(link, res.args);

        res.args['duration'] = 'long';
        var link_tmp3 = putUrlArgs(link, res.args);

        page.appendItem(PREFIX + ':feed:' + escape(link_tmp1),"directory", {title: 'Short: Less than 4 minutes'});
        page.appendItem(PREFIX + ':feed:' + escape(link_tmp2),"directory", {title: 'Medium: Between 4 minutes and 20 minutes (inclusive)'});
        page.appendItem(PREFIX + ':feed:' + escape(link_tmp3),"directory", {title: 'Long: Longer than 20 minutes'});
    });
  
    function pageController(page, loader) {
        items = [];
        items_tmp = [];
		if (page.metadata) {
		    page.metadata.apiAuthenticated = api.apiAuthenticated;
		    pageMenu(page, page.items);
		}

        page.contents = 'list';
        var offset = 1;
        var total_items = 0;
        var max_items = service.entries;

        //var items = [];

        function paginator() {      
            var num = 0;
            while(total_items < max_items) {	
                var doc = loader(offset + num).feed;
                page.entries = doc.openSearch$totalResults.$t;
                total_items += doc.openSearch$itemsPerPage.$t;

                if (page.entries < max_items)
                    max_items = page.entries;

                if (page.entries > service.entries)
                    page.entries = service.entries;
                var c = 0;

                if (!doc.entry) {
                    page.appendItem(PREFIX + ':start', 'directory', { title: 'This feed does not contain any item. Sorry about that.' });
                }

                for (var i in doc.entry) {
                    var entry = doc.entry[i];

                    // Override entry.category, needed for Watch History playlist
                    for (var j in entry.link) {
                        if (entry.link[j].rel == 'http://gdata.youtube.com/schemas/2007#video')
                            entry.category[0].term = 'http://gdata.youtube.com/schemas/2007#video';
                    }
                
                    try {
                        c++;
                        var id, url;

                        var metadata = {};

                        if (entry.published) {
                            metadata.published = getDistanceTime(getTime(entry.published.$t));
                        }

                        if (entry.updated) {
                            metadata.updated = getDistanceTime(getTime(entry.updated.$t));
                        }

                        if (entry.author && entry.author[0].name) {
                            metadata.author = entry.author[0].name.$t;
                        }

                        if (entry.yt$rating && entry.yt$rating.numDislikes && entry.yt$rating.numLikes) {
                            metadata.likes = parseInt(entry.yt$rating.numLikes);
                            metadata.dislikes = parseInt(entry.yt$rating.numDislikes);
                            metadata.likesPercentage = ( metadata.likes / ( metadata.likes + metadata.dislikes ) );
                            metadata.likesBarValue = metadata.likesPercentage;
                            metadata.likesPercentage = Math.round(  metadata.likesPercentage * 100 );
                            metadata.likesPercentageStr = metadata.likesPercentage.toString();
                            metadata.rating = metadata.likesPercentage;
                        }

                        if (entry.app$control && entry.app$control.yt$state) {
                            if (entry.app$control.yt$state.name == "restricted" && entry.app$control.yt$state.reasonCode == "requesterRegion") metadata.restricted = true;
                        }

                        if (entry.yt$hd) {
                            metadata.hd = true;
                        }
                    
                        if (entry.media$group && entry.media$group.media$rating) {
                            metadata.certification = entry.media$group.media$rating[0].$t.toString().toUpperCase();
                        }

                        if (entry.media$group && entry.media$group.media$content) {
                            metadata.duration = showtime.durationToString(entry.media$group.media$content[0].duration);
                            metadata.runtime = metadata.duration;
                        }

                        if (entry.yt$statistics) {
                            metadata.views = entry.yt$statistics.viewCount;
                            metadata.favorites = entry.yt$statistics.favoriteCount;
                            metadata.views_str = metadata.views.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
                        }

                        if (entry.media$group && entry.media$group.media$thumbnail) {
                            metadata.icon = "imageset:" + entry.media$group.media$thumbnail[0].url;

                            if (metadata.icon && metadata.icon.slice(0, 2) == '//') {
                                metadata.icon = 'http:' + metadata.icon;
                            }
                        }

                        var color = 'FFFFFF';
                        if (country != "" && entry.media$group && entry.media$group.media$restriction) {
                            var restriction = entry.media$group.media$restriction[0];
                            if (restriction.type == 'country') {
                                var countries = restriction.$t.split(' ');
                                if (restriction.$t.indexOf(country) != -1 && restriction.relationship == 'deny') {
                                    color = 'ffa500';
                                }
                                else if (restriction.relationship == 'allow' && entry.media$group.media$restriction.length == 1 && restriction.$t.indexOf(country) == -1) {
                                    color = 'ffa500';
                                }
                            }
                        }
                        var title = '<font size="3" color="' + color + '">' + entry.title.$t + '</font>';
                        if (metadata.duration)
                            title += '<font size="3" color="6699CC"> ( ' + metadata.duration + ' )</font>';
                        if (metadata.likesPercentage)
                            metadata.likesPercentage_str = new showtime.RichText('<font size="3" color="99CC66"> ( ' + metadata.likesPercentage + '% )</font>');

                        metadata.title = new showtime.RichText(title);

                        var subtitle1 = '<font size="2" color="66CCFF">';
                        if (metadata.views_str)
                            subtitle1 += 'Views: ' + metadata.views_str;
                        if (metadata.views_str && metadata.favorites)
                            subtitle1 += ' | ';
                        if (metadata.favorites)
                            subtitle1 += 'Favorites: ' + metadata.favorites;
                        if (metadata.likes_str && (metadata.views || metadata.favorites))
                            subtitle1 += ' | ';
                        if (metadata.likes_str)
                            subtitle1 += 'Likes Percentage: ' + metadata.likes_str;
                        subtitle1 += '</font>';
                        //metadata.subtitle1 = new showtime.RichText(subtitle1);

                        var dateInfo = "";
                        if (metadata.published) {
                            dateInfo = 'Published ';

                            if (entry.author && entry.author[0].name) {
                                dateInfo += 'by <font color="FFFF00">' + entry.author[0].name.$t + '</font><font size="2" color="99CC33"> ';
                            }

                            dateInfo += metadata.published;
                        }
                    
                        if (metadata.updated) {
                            if (metadata.published)
                                dateInfo += ' | ';
                            
                            dateInfo += 'Updated ' + metadata.updated;
                        }

                        var desc = "";
                        if (entry.media$group && entry.media$group.media$description) {
                            desc = entry.media$group.media$description.$t;
                        }

                        var lines = "";
                        var desc_split = desc.split("\n");
                        for (var i = 0; i < desc_split.length && i < 2; i++) {
                            lines += desc_split[i] + "\n";
                        }  

                        metadata.description = new showtime.RichText(subtitle1 + "\n" + '<font size="2" color="99CC33">' + dateInfo + '</font>\n' +
                            '<font size="2" color="EEEEEE">' + lines + '...' + '</font>');

                        var images = [];
                        if (entry.media$group && entry.media$group.media$thumbnail) {
                            images = entry.media$group.media$thumbnail;
                        }
                        else if (entry.media$thumbnail && entry.media$thumbnail.url) {
                            images.push({
                                url: entry.media$thumbnail.url,
                                width: 400,
                                height: 400
                            });
                        }
                        images.push({
                            width: 20,
                            height: 20,
                            url: plugin.path + "views/img/nophoto.bmp"});
                        images = "imageset:" + showtime.JSONEncode(images);
                        metadata.icon = images;

                        if (entry.media$group && entry.media$group.yt$videoid) {
                            var id = entry.media$group.yt$videoid.$t;
                            metadata.hqPicture = "http://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
                            //metadata.icon = metadata.hqPicture;
                            metadata.album_art = metadata.hqPicture;
                            metadata.picture1 = "http://i.ytimg.com/vi/" + id + "/1.jpg";
                            metadata.picture2 = "http://i.ytimg.com/vi/" + id + "/3.jpg";

                            var item = page.appendItem(PREFIX + ':video:' + service.mode + ':' + escape(entry.title.$t) + ':' + id, "video", metadata);

                            item.id = id;
                            if (entry.media$group && entry.media$group.media$credit) {
                                item.author = entry.media$group.media$credit[0].$t;
                            }
                            itemOptions(item, entry);
                        }
                        else if (entry.category[0].term == "http://gdata.youtube.com/schemas/2007#course") {
                            var match = entry.id.$t.match(":course:([^:]*)")[1];
                            var item = page.appendItem(PREFIX + ':feed:' + escape("http://gdata.youtube.com/feeds/api/edu/lectures?course=" + match), "directory", metadata);
                        }
                        else if (doc.id.$t.toString().indexOf('charts:movies') != -1) {
                            
                            if (entry.yt$firstReleased) {
                                metadata.released = date_string(entry.yt$firstReleased.$t);
                            }

                            for (var i in entry.media$group.media$category) {
                                var el = entry.media$group.media$category[i];
                                if (el.scheme == 'http://gdata.youtube.com/schemas/2007/mediatypes.cat') {
                                    metadata.mediatype = api.mediatypes[parseInt(el.$t) - 1];
                                }
                                if (el.scheme == 'http://gdata.youtube.com/schemas/2007/moviegenres.cat') {
                                    metadata.moviegenre = api.moviegenres[parseInt(el.$t) - 1];
                                }
                            }
                        }
                        else if (entry.category[0].term == 'http://gdata.youtube.com/schemas/2007#season') {
                            for (var i in entry.gd$feedLink) {
                                var link = entry.gd$feedLink[i];

                                var title = link.rel.valueOf().slice(link.rel.valueOf().indexOf('#')+1).replace(/\./g,' ');

                                title = title.slice(title.indexOf(' ')+1)
                                title = title.charAt(0).toUpperCase() + title.slice(1);

                                metadata.title = "Season " + entry.yt$season.season + ' - ' + title;

                                var item = page.appendItem(PREFIX + ':feed:' + escape(link.href), "directory", metadata);

                                item.appendItem = "page.appendItem(PREFIX + ':feed:' + escape(link.href), \"directory\", metadata);";
                            }
                        }
                        else if (entry.category[0].term == 'http://gdata.youtube.com/schemas/2007#video' ||
                        entry.category[0].term == 'http://gdata.youtube.com/schemas/2007#playlist' ||
                        entry.category[0].term == 'http://gdata.youtube.com/schemas/2007#userEvent' ||
                        entry.category[0].term == 'http://gdata.youtube.com/schemas/2007#liveEvent') {
                            id = entry.id.$t.toString().slice(entry.id.$t.toString().lastIndexOf(':')+1)
                            if (id.length > 11) {
                                if (entry.yt$videoid)
                                    id = entry.yt$videoid.$t;
                                else if (entry.content) {
                                    id = entry.content.src.toString().slice(entry.content.src.toString().lastIndexOf('/')+1, 
                                    (entry.content.src.toString().lastIndexOf('?')!=-1)?entry.content.src.toString().lastIndexOf('?'):entry.content.src.toString().length)
                                }
                                else {
                                    id = entry.link[0].href;
                                    id = id.slice(id.indexOf('v=') + 2, id.indexOf('&'));
                                }
                            }

                            metadata.hqPicture = "http://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
                            metadata.icon = metadata.hqPicture;
                            metadata.picture1 = "http://i.ytimg.com/vi/" + id + "/1.jpg";
                            metadata.picture2 = "http://i.ytimg.com/vi/" + id + "/2.jpg";
                        
                            var item = page.appendItem(PREFIX + ':video:' + service.mode + ':' + escape(entry.title.$t) + ':' + id, "video", metadata);

                            item.id = id;
                            if (entry.media$group && entry.media$group.media$credit) {
                                item.author = entry.media$group.media$credit[0].$t;
                            }
                            itemOptions(item, entry);
                        }
                        else if (entry.category[0].term == 'http://gdata.youtube.com/schemas/2007#friend' ||
                        entry.category[0].term == 'http://gdata.youtube.com/schemas/2007#subscription') {
                            var item = page.appendItem(PREFIX + ':user:' + entry.yt$username.$t, "directory", metadata);
                        }
                        else if (entry.category[0].term == 'http://gdata.youtube.com/schemas/2007#playlistLink' ||
                        entry.category[0].term == 'http://gdata.youtube.com/schemas/2007#show' ||
                        entry.category[0].term == 'http://gdata.youtube.com/schemas/2007#season') {
                            url = entry.content.src;
                            var item = page.appendItem(PREFIX + ':feed:' + escape(url), "directory", metadata);
                        }
                        else if (entry.category[0].term == 'http://gdata.youtube.com/schemas/2007#channel') {
                            var item = page.appendItem(PREFIX + ':feed:' + escape(entry.gd$feedLink[0].href), "directory", metadata);
                        }
                        else if (entry.category[0].term == 'http://gdata.youtube.com/schemas/2007#channelstandard') {
                            var icon = eval('(entry.media$group)?entry.media$group.media$thumbnail[0].url:null');
                            if (icon && icon.slice(0, 2) == '//') {
                                icon = 'http:' + icon;
                            }

                            var item = page.appendItem(PREFIX + ':user:' + entry.id.$t.toString().slice(entry.id.$t.toString().lastIndexOf(':')+1), "directory", metadata);
                        }

                        if (metadata.published) {
                            // 2012-08-10T19:34:51.000Z
                            var match = entry.published.$t.match("(.*)-(.*)-(.*)T(.*):(.*):([^.]*)");
                            item.published = new Date(match[1], match[2], match[3], match[4], match[5], match[6]).getTime();
                        }

                        item.index = c;
                        item.title = entry.title.$t;
                        if (metadata.views)
                            item.views = parseInt(metadata.views);
                        if (entry.published)
                            item.date = getTime(entry.published.$t).getTime();
                        items.push(item);
                        items_tmp.push(item);
                    }
                    catch(err) {
                        showtime.trace(err)
                    }
                }
                page.loading = false;	
                num += c;

                if(c == 0 || offset > api.args_common['max-results'] || num > parseInt(service.entries) || c == parseInt(doc.openSearch$totalResults.$t) || total_items >= max_items)	  
                    break;
            }
            // Reset arguments for HTTP requests
            api.reset_args();
            offset += num;

            return offset < page.entries;    
        }
    
        page.type = "directory";
        paginator();    
        page.paginator = paginator;
    }
  
    plugin.addURI(PREFIX + ":feed:(.*)", function(page, url) {
        page.type = "directory";
        page.contents = "items";

        var sort_included = false;
        var duration_included = false;

        try {
            page.metadata.logo = plugin.path + "logo.png";
            api.reset_args();

            pageController(page, function(offset) { 
                api.args_common['start-index']=offset;
            
                url=unescape(url)
            
                if (url.indexOf('?')!=-1) {
                    var args = url.slice(url.indexOf('?')+1);            
                    args=args.split('&')

                    for (var i in args) {
                        var arg = args[i];
                        var arg_tmp = arg.split('=')
                        api.args_common[arg_tmp[0]]=arg_tmp[1]
                    }
                    url=url.slice(0, url.indexOf('?'))
                }

                var link = putUrlArgs(url, api.args_common);
            
                if (url.indexOf('/standardfeeds/') != -1) {
                    if (service.region && service.region != 'all' && (url.indexOf('/' + service.region + '/') == -1)) {
                        var type_init = url.indexOf('/standardfeeds/');
                        url = url.slice(0, type_init + 15) + service.region + url.slice(type_init + 14);
                    }
                    if (service.category && url.indexOf('_' + service.category) == -1 && service.category != 'all')
                        url += '_' + service.category;
                }
                else if (url.indexOf('api/charts/shows/') != -1) {
                    if (service.showGenre != 'all')
                        api.args_common['genre'] = service.showGenre;
                    if (service.region != 'all')
                        api.args_common['region'] = service.region;
                }
                else if (url.indexOf('api/charts/movies/') != -1) {
                    if (service.movieGenre != 'all')
                        api.args_common['movie-genre'] = service.movieGenre;
                    if (service.region != 'all')
                        api.args_common['region'] = service.region;
                    if (service.movieLanguage != 'all')
                        api.args_common['hl'] = service.movieLanguage;
                    //api.args_common['paid-content'] = 'false';
                }
                else if (url.indexOf('api/channelstandardfeeds/') != -1) {
                    if (service.channelType && service.channelType != 'all' && url.indexOf('_' + service.channelType) == -1 && service.channelType != 'all')
                        url += '_' + service.channelType;
                }
                
                var doc = downloader.load(page, url, api.args_common);

                country = doc.headers['X-GData-User-Country'];

                doc = doc.response;
                if (doc.feed.title) {
                    page.metadata.title = doc.feed.title.$t;
                }

                if (!duration_included) {
                    page.appendItem(PREFIX + ':feed:duration:' + escape(link),"directory", {title: "Filter by duration"});
                    duration_included = true;
                }

                return doc;
            });
        }
        catch (err) {
            if (err == 'Error: HTTP error: 400') {
                var args = '';
                for (var arg in api.args_common)
                    args += '\n' + arg + ': ' + api.args_common[arg]
            
                page.error('The request for the feed contains incompatible args. Please contact facanferff with the following information:\n'+
                err + args);
            }
            else if (err == 'Error: HTTP error: 404')
                page.error('This feed was deleted or is not available at the moment');
            else
                page.error('There was one unknown error: ' + err);
        }
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":search:(.*)", function(page, query) {
        var sort_included = false;
        var duration_included = false;

        try {
            page.metadata.logo = plugin.path + "logo.png";
            api.reset_args();

            pageController(page, function(offset) { 
                api.args_common['start-index']=offset;
                api.args_common['q'] = query;
            
                var url = "https://gdata.youtube.com/feeds/api/videos";
            
                var link = putUrlArgs(url, api.args_common);

                var doc = downloader.load(page, url, api.args_common);
                
                country = doc.headers['X-GData-User-Country'];

                doc = doc.response;
                if (doc.feed.title) {
                    page.metadata.title = doc.feed.title.$t;
                }

                if (!duration_included) {
                    page.appendItem(PREFIX + ':feed:duration:' + escape(link),"directory", {title: "Filter by duration"});
                    duration_included = true;
                }

                return doc;
            });
            //page.type = "array";
        }
        catch (err) {
            showtime.print(err);

            if (err == 'Error: HTTP error: 400') {
                var args = '';
                for (var arg in api.args_common)
                    args += '\n' + arg + ': ' + api.args_common[arg]
            
                page.error('The request for the feed contains incompatible args. Please contact facanferff with the following information:\n'+
                err + args);
            }
            else if (err == 'Error: HTTP error: 404')
                page.error('This feed was deleted or is not available at the moment');
            else
                page.error('There was one unknown error...\n' + err);
        }
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":user:(.*)", function(page, user) {
        if (!api.apiAuthenticated && user == 'default') {
            showtime.trace('YOUTUBE: User must be authenticated to see this profile');
            page.error('User must be authenticated to see this profile');
            return;
        }

        pageMenu(page);

        page.metadata.glwview = plugin.path + "views/user2.view";

        page.type = "directory";

        var data = downloader.load(page, 'https://gdata.youtube.com/feeds/api/users/'+user);
        if (typeof(data) == "string") {
            page.error(data);
            return;
        }

        data = data.response.entry;

        page.metadata.title = data.title.$t;    
        page.metadata.logo = data.media$thumbnail.url;   
            
        page.metadata.username = data.yt$username.$t;
    
        if (api.apiAuthenticated && user != 'default') {
            /*page.options.createAction("addContact", "Add Contact", function() {
                api.addContact(page.metadata.username);
            });

            page.options.createAction("subscribeUser", "Subscribe User", function() {
                api.subscribe(page.metadata.username, "user");
            });

            page.options.createAction("subscribeChannel", "Subscribe Channel", function() {
                api.subscribe(page.metadata.username, "channel");
            });*/
        }

        var lists_tmp = {};

        if (user == "default") {
            if (service.showNewSubscriptionVideos) {
                var data = showtime.JSONDecode(showtime.httpGet('https://gdata.youtube.com/feeds/api/users/' + user + '/newsubscriptionvideos', 
                    {alt:'json'}, api.headers_common).toString()).feed;
                var newSubscriptionVideos = [];
                for (var i in data.entry) {
                    try {
                        var it = data.entry[i];
                        var id = it.media$group.yt$videoid.$t;

                        var images = [];
                        if (it.media$group && it.media$group.media$thumbnail) {
                            var images = it.media$group.media$thumbnail;
                        }
                        images.push({
                            width: 400,
                            height: 400,
                            url: plugin.path + "views/img/nophoto.bmp"
                        });
                        images = "imageset:" + showtime.JSONEncode(images);
                        
                        newSubscriptionVideos.push({
                            title: it.title.$t,
                            subtitle: it.author[0].name.$t,
                            image: images,
                            url: PREFIX + ":video:" + service.mode + ":" + escape(it.title.$t) + ":" + id
                        });
                    }
                    catch(ex) {
                        showtime.trace(ex, "YOUTUBE-ERROR");
                        showtime.trace(ex.stack, "YOUTUBE-ERROR");
                    }
                }

                if (newSubscriptionVideos.length > 0) {
                    newSubscriptionVideos.push({
                        title: "See More",
                        image: plugin.path + "views/img/add.png",
                        url: PREFIX + ":feed:" + escape('https://gdata.youtube.com/feeds/api/users/' + user + '/newsubscriptionvideos')
                    });

                    if (user == "default") page.appendPassiveItem("list", newSubscriptionVideos, { title: "New Subscription Videos" });
                    lists_tmp.newSubscriptionVideos = {
                        array: newSubscriptionVideos,
                        title: "New Subscription Videos"
                    };
                }
            }
        }


        if (service.showFavorites) {
            try {
                var data = showtime.JSONDecode(showtime.httpGet('https://gdata.youtube.com/feeds/api/users/' + user + '/favorites', 
                {alt:'json'}, api.headers_common).toString()).feed;
                var favorites = [];
                for (var i in data.entry) {
                    try {
                        var it = data.entry[i];
                        var id = it.media$group.yt$videoid.$t;

                        var image = "http://i.ytimg.com/vi/" + id + "/hqdefault.jpg";

                        var images = [];
                        if (it.media$group && it.media$group.media$thumbnail) {
                            var images = it.media$group.media$thumbnail;
                        }
                        images.push({
                            width: 400,
                            height: 400,
                            url: plugin.path + "views/img/nophoto.bmp"});
                        images = "imageset:" + showtime.JSONEncode(images);

                        favorites.push({
                            title: it.title.$t,
                            image: images,
                            url: PREFIX + ":video:" + service.mode + ":" + escape(it.title.$t) + ":" + id
                        });
                    }
                    catch(ex) {
                        showtime.trace(ex, "YOUTUBE-ERROR");
                        showtime.trace(ex.stack, "YOUTUBE-ERROR");
                    }
                }

                if (favorites.length > 0) {
                    favorites.push({
                        title: "See More",
                        image: plugin.path + "views/img/add.png",
                        url: PREFIX + ":feed:" + escape('https://gdata.youtube.com/feeds/api/users/' + user + '/favorites')
                    });

                    if (user == "default") page.appendPassiveItem("list", favorites, { title: "Favorites" });
                    lists_tmp.favorites = {
                        array: favorites,
                        title: "Favorites"
                    };
                }
            }
            catch(ex) {
                showtime.trace("Couldn't get Favorites", "YOUTUBE-ERROR");
                showtime.trace(ex, "YOUTUBE-ERROR");
                showtime.trace(ex.stack, "YOUTUBE-ERROR");
            }
        }


        if (user == "default") {
            if (service.showWatchLater) {
                var data = showtime.JSONDecode(showtime.httpGet('https://gdata.youtube.com/feeds/api/users/' + user + '/watch_later', 
                    {alt:'json'}, api.headers_common).toString()).feed;
                var watchLater = [];
                for (var i in data.entry) {
                    try {
                        var it = data.entry[i];
                        var id = it.media$group.yt$videoid.$t;
                        var image = "http://i.ytimg.com/vi/" + id + "/hqdefault.jpg";

                        var images = [];
                        if (it.media$group && it.media$group.media$thumbnail) {
                            var images = it.media$group.media$thumbnail;
                        }
                        images.push({
                            width: 400,
                            height: 400,
                            url: plugin.path + "views/img/nophoto.bmp"});
                        images = "imageset:" + showtime.JSONEncode(images);

                        watchLater.push({
                            title: it.title.$t,
                            image: images,
                            url: PREFIX + ":video:" + service.mode + ":" + escape(it.title.$t) + ":" + id
                        });
                    }
                    catch(ex) {
                        showtime.trace(ex, "YOUTUBE-ERROR");
                        showtime.trace(ex.stack, "YOUTUBE-ERROR");
                    }
                }

                if (watchLater.length > 0) {
                    watchLater.push({
                        title: "See More",
                        image: plugin.path + "views/img/add.png",
                        url: PREFIX + ":feed:" + escape('https://gdata.youtube.com/feeds/api/users/' + user + '/watch_later')
                    });

                    if (user == "default") page.appendPassiveItem("list", watchLater, { title: "Watch Later" });
                    lists_tmp.watchLater = {
                        array: watchLater,
                        title: "Watch Later"
                    };
                }
            }

            if (service.showWatchHistory) {
                var data = showtime.JSONDecode(showtime.httpGet('https://gdata.youtube.com/feeds/api/users/' + user + '/watch_history', 
                    {alt:'json'}, api.headers_common).toString()).feed;
                var watchHistory = [];
                for (var i in data.entry) {
                    try {
                        var it = data.entry[i];
                        var id = it.media$group.yt$videoid.$t;
                        //var image = "http://i.ytimg.com/vi/" + id + "/hqdefault.jpg";

                        var images = [];
                        if (it.media$group && it.media$group.media$thumbnail) {
                            var images = it.media$group.media$thumbnail;
                        }
                        images.push({
                            width: 400,
                            height: 400,
                            url: plugin.path + "views/img/nophoto.bmp"});
                        images = "imageset:" + showtime.JSONEncode(images);

                        watchHistory.push({
                            title: it.title.$t,
                            image: images,
                            url: PREFIX + ":video:" + service.mode + ":" + escape(it.title.$t) + ":" + id
                        });
                    }
                    catch(ex) {
                        showtime.trace(ex, "YOUTUBE-ERROR");
                        showtime.trace(ex.stack, "YOUTUBE-ERROR");
                    }
                }

                if (watchHistory.length > 0) {
                    watchHistory.push({
                        title: "See More",
                        image: plugin.path + "views/img/add.png",
                        url: PREFIX + ":feed:" + escape('https://gdata.youtube.com/feeds/api/users/' + user + '/watch_history')
                    });

                    if (user == "default") page.appendPassiveItem("list", watchHistory, { title: "Watch History" });
                    lists_tmp.watchHistory = {
                        array: watchHistory,
                        title: "Watch History"
                    };
                }
            }


            if (service.showSubscriptions) {
                var data = showtime.JSONDecode(showtime.httpGet('https://gdata.youtube.com/feeds/api/users/' + user + '/subscriptions', 
                    {alt:'json'}, api.headers_common).toString()).feed;
                var subscriptions = [];
                for (var i in data.entry) {
                    try {
                        var it = data.entry[i];
                        var id = it.yt$username.$t;

                        var images = [];
                        if (it.media$thumbnail) {
                            images.push({
                                url: it.media$thumbnail.url,
                                width: 200,
                                height: 200
                            });
                        }
                        images.push({
                            width: 400,
                            height: 400,
                            url: plugin.path + "views/img/nophoto.bmp"});
                        images = "imageset:" + showtime.JSONEncode(images);

                        subscriptions.push({
                            title: it.yt$username.display,
                            image: images,
                            url: PREFIX + ":user:" + id
                        });
                    }
                    catch(ex) {
                        showtime.trace(ex, "YOUTUBE-ERROR");
                        showtime.trace(ex.stack, "YOUTUBE-ERROR");
                    }
                }

                if (subscriptions.length > 0) {
                    subscriptions.push({
                        title: "See More",
                        image: plugin.path + "views/img/add.png",
                        url: PREFIX + ":feed:" + escape('https://gdata.youtube.com/feeds/api/users/' + user + '/subscriptions')
                    });

                    if (user == "default") page.appendPassiveItem("list", subscriptions, { title: "Subscriptions" });
                    lists_tmp.subscriptions = {
                        array: subscriptions,
                        title: "Subscriptions"
                    };
                }
            }
        }


        if (service.showPlaylists) {
            var data = showtime.JSONDecode(showtime.httpGet('https://gdata.youtube.com/feeds/api/users/' + user + '/playlists', 
                {alt:'json'}, api.headers_common).toString()).feed;

            var playlists = [];
            for (var i in data.entry) {
                try {
                    var it = data.entry[i];
                    var id = it.yt$playlistId.$t;
                    var image = plugin.path + "views/img/nophoto.bmp";

                    var images = [];
                    if (it.media$group && it.media$group.media$thumbnail) {
                        var images = it.media$group.media$thumbnail;
                    }
                    images.push({
                        width: 400,
                        height: 400,
                        url: plugin.path + "views/img/nophoto.bmp"});
                    images = "imageset:" + showtime.JSONEncode(images);
                    
                    playlists.push({
                        title: it.title.$t,
                        image: images,
                        url: PREFIX + ":feed:" + escape("https://gdata.youtube.com/feeds/api/playlists/" + id)
                    });
                }
                catch(ex) {
                    showtime.trace(ex, "YOUTUBE-ERROR");
                    showtime.trace(ex.stack, "YOUTUBE-ERROR");
                }
            }

            if (playlists.length > 0) {
                playlists.push({
                    title: "See More",
                    image: plugin.path + "views/img/add.png",
                    url: PREFIX + ":feed:" + escape('https://gdata.youtube.com/feeds/api/users/' + user + '/playlists')
                });

                if (user == "default") page.appendPassiveItem("list", playlists, { title: "Playlists" });
                lists_tmp.playlists = {
                    array: playlists,
                    title: "Playlists"
                };
            }
        }
             
        if (user == "default") {
            if (service.showVideoRecommendations) {
                var data = showtime.JSONDecode(showtime.httpGet('https://gdata.youtube.com/feeds/api/users/' + user + '/recommendations', 
                    {alt:'json'}, api.headers_common).toString()).feed;
                var videoRecommendations = [];
                for (var i in data.entry) {
                    try {
                        var it = data.entry[i];
                        var id = it.media$group.yt$videoid.$t;
                        var image = "http://i.ytimg.com/vi/" + id + "/hqdefault.jpg";

                        var images = [];
                        if (it.media$group && it.media$group.media$thumbnail) {
                            var images = it.media$group.media$thumbnail;
                        }
                        images.push({
                            width: 400,
                            height: 400,
                            url: plugin.path + "views/img/nophoto.bmp"});
                        images = "imageset:" + showtime.JSONEncode(images);

                        videoRecommendations.push({
                            title: it.title.$t,
                            subtitle: it.author[0].name.$t,
                            image: images,
                            url: PREFIX + ":video:" + service.mode + ":" + escape(it.title.$t) + ":" + id
                        });
                    }
                    catch(ex) {
                        showtime.trace(ex, "YOUTUBE-ERROR");
                        showtime.trace(ex.stack, "YOUTUBE-ERROR");
                    }
                }

                if (videoRecommendations.length > 0) {
                    videoRecommendations.push({
                        title: "See More",
                        image: plugin.path + "views/img/add.png",
                        url: PREFIX + ":feed:" + escape('https://gdata.youtube.com/feeds/api/users/' + user + '/recommendations')
                    });

                    if (user == "default") page.appendPassiveItem("list", videoRecommendations, { title: "Video Recommendations" });
                    lists_tmp.videoRecommendations = {
                        array: videoRecommendations,
                        title: "Video Recommendations"
                    };
                }
            }
        }

            
        if (service.showUploads) {
            var data = showtime.JSONDecode(showtime.httpGet('https://gdata.youtube.com/feeds/api/users/' + user + '/uploads', 
            {alt:'json'}, api.headers_common).toString()).feed;
            var uploads = [];
            for (var i in data.entry) {
                try {
                    var it = data.entry[i];
                    var id = it.media$group.yt$videoid.$t;

                    var images = [];
                    if (it.media$group && it.media$group.media$thumbnail) {
                        var images = it.media$group.media$thumbnail;
                    }
                    images.push({
                        width: 400,
                        height: 400,
                        url: plugin.path + "views/img/nophoto.bmp"});
                    images = "imageset:" + showtime.JSONEncode(images);

                    uploads.push({
                        title: it.title.$t,
                        image: images,
                        url: PREFIX + ":video:" + service.mode + ":" + escape(it.title.$t) + ":" + id
                    });
                }
                catch(ex) {
                    showtime.trace(ex, "YOUTUBE-ERROR");
                    showtime.trace(ex.stack, "YOUTUBE-ERROR");
                }
            }

            if (uploads.length > 0) {
                uploads.push({
                    title: "See More",
                    image: plugin.path + "views/img/add.png",
                    url: PREFIX + ":feed:" + escape('https://gdata.youtube.com/feeds/api/users/' + user + '/uploads')
                });

                if (user == "default") page.appendPassiveItem("list", uploads, { title: "Uploads" });
                lists_tmp.uploads = {
                    array: uploads,
                    title: "Uploads"
                };
            }
        }

        if (user != "default") {
            var lists = {
                uploads: lists_tmp.uploads,
                playlists: lists_tmp.playlists,
                favorites: lists_tmp.favorites
            };

            for (var i in lists) {
                var it = lists[i];
                if (it) {
                    page.appendPassiveItem("list", it.array, { title: it.title });
                }
            }
        }

        page.loading = false;
    });

    function getVideoUrlMap(pl_obj, video) {
                var links = [];
                if (!video) video = {};
                video["url_map"] = "true";
               
                var html = "";
                if (pl_obj["args"] && pl_obj["args"]["fmt_stream_map"])
                        html = pl_obj["args"]["fmt_stream_map"];
               
                if (html.length == 0 && pl_obj["args"] && pl_obj["args"]["url_encoded_fmt_stream_map"])
                        html = unescape(pl_obj["args"]["url_encoded_fmt_stream_map"]);
               
                if (html.length == 0 && pl_obj["args"] && pl_obj["args"]["fmt_url_map"])
                        html = pl_obj["args"]["fmt_url_map"];
               
                html = unescape(html);
               
                if (pl_obj["args"] && pl_obj["args"]["liveplayback_module"])
                        video["live_play"] = "true";

                var fmt_url_map = [];
                var init = "";

                html = html.replace(/sig=/g, "signature=");

                if (html.indexOf("url=") > -1) {
                    html = html.replace(/\?/g, "&");

                    init = html.slice(0, html.indexOf("=")) + "=";
                    var regex = new RegExp("," + init, "g");
                    html = html.replace(regex, "?" + init);
                    fmt_url_map = html.split("?");
                }
                else {
                    debug("Unsupported method of getting video... Contact the developer.");
                    return "Unsupported method of getting video... Contact the developer.";
                }
               
                if (fmt_url_map.length > 0) {
                    for (var index in fmt_url_map) {
                        var fmt_url = fmt_url_map[index];

                        var object = argsToObject(fmt_url);
                        var url = object["url"];
                        delete object["url"];

                        fmt_url = url + "?" + objectToArgs(object);

                        if (service.video_source == "fallback") {
                            var host = url.slice(url.indexOf("://") + 3, url.indexOf("/", url.indexOf("://") + 3));
                            var fmt_fallback = object["fallback_host"];
                            fmt_url = fmt_url.replace(host, fmt_fallback);
                            fmt_url = fmt_url.replace("fallback_host=" + fmt_fallback, "fallback_host=" + host);
                        }

                        var quality = "5";
                        fmt_url = fmt_url.replace(" ", "%20").replace("url=", "");
                                        
                        quality = object["quality"];
                        if (quality == "highres") quality = "hd720";

                        if (fmt_url.indexOf("rtmp") > -1 && index > 0) {
                            if (pl_obj["url"] || true)
                                fmt_url += " swfurl=" + pl_obj["url"] + " swfvfy=1";

                            var playpath = false;
                            if (fmt_url.indexOf("stream=") > -1) {
                                playpath = fmt_url.slice(fmt_url.indexOf("stream=")+7);
                                if (playpath.indexOf("&") > -1)
                                    playpath = playpath.slice(0, playpath.indexOf("&"));
                            }
                            else
                                playpath = fmt_url_map[index - 1];

                            if (playpath) {
                                if (pl_obj["args"] && pl_obj["args"]["ptk"] && pl_obj["args"] && pl_obj["args"]["ptchn"])
                                    fmt_url += " playpath=" + playpath + "?ptchn=" + pl_obj["args"]["ptchn"] + "&ptk=" + pl_obj["args"]["ptk"];
                            }
                        }

                        var format = fmt_url.match('type=video/([^&|;|\\u0026]+)');
                        if (format)
                            format = format[1];
                        else
                            format = "Unknown";

                        // Bypass any video in webm format, not supportable by Showtime
                        if (format == "webm")
                            continue;

                        var video_item = {
                            video_url: escape(fmt_url),
                            quality: quality,
                            format: format
                        };
                        links.push(video_item);
                    }
                }
               
                return links;
    }

    function argsToObject(data) {
        var object = {};
        var split = data.split("&");
        for (var i in split) {
            var item = split[i];
            var split2 = item.split("=");
            var key = split2[0];
            var value = split2[1];
            if (object[key]) continue;
            if (key != "fexp" && key != "sparams" && value.indexOf(",") != -1) value = value.slice(0, value.indexOf(","));
            object[key] = value;
        }
        return object;
    }

    function objectToArgs(object) {
        var data = "";
        for (var i in object) {
            data += i + "=" + object[i] + "&";
        }
        if (data.length > 0) data = data.slice(0, data.length - 1);
        return data;
    }

    function getVideosList(page, id, number_items) {
        var data = showtime.httpGet('http://www.youtube.com/watch?v='+id, {}, {
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:15.0) Gecko/20100101 Firefox/15.0.1'   
        }).toString();

        if (data.indexOf('player" class="unavailable-player">') != -1) {
            data = data.slice(data.indexOf('player" class="unavailable-player">'));
            data = data.replace(/\n/g, '');
            var error = data.match(/<h1 class="message">(.+?)<\/h1>/);
            return error[1];
        }
        
        if (data.indexOf('<div id="verify-actions">') != -1) {
            data = data.slice(data.indexOf('<div id="verify-actions">'));
            var error = data.match('<p>(.+?)</p>');
            var error_msg = error[1] + "\nIn order to login, check if you have the setting activated in plugin's settings and reopen the plugin (not Showtime).";
               
            return error_msg;
        }

        var quality_added = [];
        var videos_list_tmp = [];
        var videos_list = [];

        var resolutions = [
            'small', 'medium', 'large', 'hd720', 'hd1080'
        ]
        var resolution_strings = [
            '240p', '360p', '480p', '720p', '1080p'
        ];

        var start = data.indexOf("yt.playerConfig = ");

        if (start > -1) {
            start = start + "yt.playerConfig = ".length;
            var end = data.indexOf("};", start) + 1;
            var data2 = data.slice(start, end);
            if (data2.length > 0) {
                data2 = data2.replace("\\/", "/");
                var player_object = showtime.JSONDecode('{ "PLAYER_CONFIG" : ' + data2 + "}" );
            }
        }

        // Find playback URI
        if (player_object["PLAYER_CONFIG"]) {
            if (player_object["PLAYER_CONFIG"] && player_object["PLAYER_CONFIG"]["args"]) {
                var video = {};
                if (player_object["PLAYER_CONFIG"]["args"]["ttsurl"])
                    video["ttsurl"] = player_object["PLAYER_CONFIG"]["args"]["ttsurl"];

                var links = getVideoUrlMap(player_object["PLAYER_CONFIG"], video);

                if (links.length == 0)
                    debug("getVideoLinks Couldn't find url map or stream map.");

                videos_list_tmp = links;
            }
        }
        
        var items = 0;
        for (var i in videos_list_tmp) {
            var item = videos_list_tmp[i];

            var j = resolutions.indexOf(item.quality);
            if (service.maximumResolution && j > parseInt(service.maximumResolution) || quality_added.indexOf(item.quality)!=-1)
                continue;

            if (service.minimumResolution && j < parseInt(service.minimumResolution))
                break;

            var video_item_tmp = {};
        
            var formatVar = 'default';
            if (service.format)
                formatVar = service.format;
        
            if ((formatVar != 'default' && formatVar == item.format) || formatVar == 'default') {
                video_item_tmp = {
                    video_url: escape(item.video_url),
                    quality: resolution_strings[j],
                    format: item.format
                }
                videos_list.push(video_item_tmp);
                quality_added.push(item.quality);
                items++;
            }
        }

        return videos_list;
    }

    function convertFlashVars(html) {
        var obj = { "PLAYER_CONFIG": { "args": {} } };
        var temp = html.replace(/\\u0026amp;/g, "&").split("&");
        for (var i in temp) {
            var it = temp[i].split("=");
            obj["PLAYER_CONFIG"]["args"][it[0]] = unescape(it[1]);
        }
        return obj;
    }
  
    function playVideo(page, title, id, video_url) {
        var url = unescape(unescape(video_url));
        var videoParams = {      
            title: unescape(unescape(title)),
            canonicalUrl: PREFIX + ':video:simple:' + title + ':' + id,
            sources: [{	
                url: url  
            }]    
        }
        if (service.universalSubtitles == '1')
            videoParams.subtitles = getUniversalSubtitles(id);
        if (service.transcribedCaptions == '1' || service.automaticSpeechCaptions == '1') {
            var caption = getDefaultCaptionLink(id);
            if (caption) {
                var data = new XML(showtime.httpGet(caption + '&type=list&tlangs=1&asrs=1').toString());
            
                if (service.transcribedCaptions == '1') {
                    var subtitles = getTranscribedCaptions(caption, data);

                    for (var i in subtitles) {
                        var track = subtitles[i];
                        videoParams.subtitles.push(track);
                    }
                }
                if (service.automaticSpeechCaptions == '1') {
                    var subtitles = getAutomaticSpeechCaptions(caption, data);

                    for (var i in subtitles) {
                        var track = subtitles[i];
                        videoParams.subtitles.push(track);
                    }
                }
            }
        }
    
        page.source = "videoparams:" + showtime.JSONEncode(videoParams);
        page.type = "video";
    }

    plugin.addURI(PREFIX + ":video:simple:(.*):(.*)", function(page, title, id) {
        try {
            var video_url = getVideosList(page, id, 1);

            if (typeof(video_url) == "string") {
                page.error(video_url);
                return;
            }

            if (video_url.length == 0) {
                page.error("No video links found. Try to adjust the minimum/maximum resolutions or Video Format in Settings.");
                return;
            }

            video_url = video_url[0].video_url;
            playVideo(page, title, id, video_url);
        }
        catch (err) {
            if (err == "Error: HTTP error: 404")
                err = "The video is unavailable at this moment.";

            page.error(err);
            showtime.trace(err);
            return;
        }
    
        page.loading = false;
    });
  
    plugin.addURI(PREFIX + ":video:advanced:(.*):(.*)", function(page, title, id) {
        var data = downloader.load(page, 'https://gdata.youtube.com/feeds/api/videos/' + id);
        if (typeof(data) == "string") {
            page.error(data);
            return;
        }

        pageMenu(page);

        var video = data.response.entry;

        var events = false;
    
        page.metadata.title = unescape(title);
        page.metadata.icon = "http://i.ytimg.com/vi/" + id + "/hqdefault.jpg";

        page.type = "directory";
        page.metadata.glwview = plugin.path + "views/video.view";

        for (var i in api.video_settings) {
            var element = api.video_settings[i];
            try {
                if (element[0] == 'Rating') {
                    page.metadata.rating;
                    page.appendPassiveItem("rating", eval(element[1]));
                }
                else {
                    page.appendPassiveItem("label", eval(element[1]), {title: element[0] + ": "}); 
                }
            }
            catch(err) {
                showtime.trace('Video '+id+' doesn\'t have a '+element[0]+' tag!');
            }
        }
    
        page.appendPassiveItem("divider");  
    
        page.appendPassiveItem("bodytext", new showtime.RichText(video.media$group.media$description.$t));
    
        var author = video.author[0].name.$t;
        page.appendAction("navopen", PREFIX + ':user:'+author, true, {                  
            title: author     
        });

        var videos_list = getVideosList(page, id, 'any');

        if (typeof(videos_list) == "string") {
            page.error(videos_list);
        }
        else {
            var quality_icon = {
                "240p": plugin.path + "views/img/defaultscreen.bmp",
                "360p": plugin.path + "views/img/defaultscreen.bmp",
                "480p": plugin.path + "views/img/480.bmp",
                "720p": plugin.path + "views/img/720.bmp",
                "1080p": plugin.path + "views/img/1080.bmp"
            };

            var videos = [];
            for (var i in videos_list) {
                var item = videos_list[i];
                page.appendAction("navopen", PREFIX + ':video:stream:'+escape(title)+':'+escape(id) + ':' + item.video_url, true, {      
                    title: item.quality
                });

                var image = quality_icon[item.quality];
                if (!image || image == "") image = plugin.path + "views/img/nophoto.bmp";
                videos.push({
                    title: item.quality,
                    image: image,
                    url: PREFIX + ':video:stream:'+escape(title)+':'+escape(id) + ':' + item.video_url
                });
            }
            page.appendPassiveItem("list", videos, { title: "Video Playback" });


            var extras = [];
            extras.push({
                title: 'User Profile',
                image: plugin.path + "views/img/logos/user.png",
                url: PREFIX + ':user:' + video.author[0].name.$t
            });

            for (var i in video.link) {
                var feed = video.link[i];
                if (feed.rel == "http://gdata.youtube.com/schemas/2007#video.trailer-for") {
                    var match = feed.href.match('videos/([^?]*)');
                    if (match) {
                        page.appendAction("navopen", PREFIX + ':video:' + service.mode + ':' + escape(title) + ':' + escape(match[1]), true, {      
                            title: 'Movie'
                        });
                        extras.push({
                            title: 'Movie',
                            image: plugin.path + "views/img/logos/movies.png",
                            url: PREFIX + ':video:' + service.mode + ':' + escape(title) + ':' + escape(match[1])
                        });
                    }
                }

                if (feed.rel == "http://gdata.youtube.com/schemas/2007#video.trailers") {
                    page.appendAction("navopen", PREFIX + ':feed:' + escape(feed.href), true, {      
                        title: 'Trailers'
                    });
                    extras.push({
                        title: 'Trailers',
                        image: plugin.path + "views/img/logos/trailers.png",
                        url: PREFIX + ':feed:' + escape(feed.href)
                    });
                }
            }
    
            for (var i in video.link) {
                var link = video.link[i];
                if (link.rel == 'http://gdata.youtube.com/schemas/2007#video.related') {
                    page.appendAction("navopen", PREFIX + ':feed:'+escape('https://gdata.youtube.com/feeds/api/videos/'+id+'/related'), true, {                  
                        title: 'Related videos'          
                    });
                    extras.push({
                        title: 'Related',
                        image: plugin.path + "views/img/nophoto.bmp",
                        url: PREFIX + ':feed:'+escape('https://gdata.youtube.com/feeds/api/videos/'+id+'/related')
                    });
                }
                else if (link.rel == 'http://gdata.youtube.com/schemas/2007#video.responses') {
                    page.appendAction("navopen", PREFIX + ':feed:'+escape('https://gdata.youtube.com/feeds/api/videos/'+id+'/responses'), true, {                  
                        title: 'Response videos'          
                    });
                    extras.push({
                        title: 'Responses',
                        image: plugin.path + "views/img/nophoto.bmp",
                        url: PREFIX + ':feed:'+escape('https://gdata.youtube.com/feeds/api/videos/'+id+'/responses')
                    });
                }
            }
            if (extras.length > 0)
                page.appendPassiveItem("list", extras, { title: "Extras" });

            /*if (api.apiAuthenticated) {
                var limitations = '';
                for (var i in video.yt$accessControl) {
                    if (video.yt$accessControl[i].permission == 'denied')
                        limitations += video.yt$accessControl[i].action;
                }

                var interactions = [];
                page.appendAction("pageevent", "like", true, {title:'Like'});
                page.options.createAction("like", "Like", function() {
                    if (events)
                        api.like(id, 'like');
                });

                page.appendAction("pageevent", "dislike", true, {title:'Dislike'});
                page.options.createAction("dislike", "Dislike", function() {
                    if (events)
                        api.like(id, 'dislike')
                });

                if (limitations.indexOf('comment') == -1) {
                    page.appendAction("pageevent", "comment", true, {title:'Comment'});
                    page.options.createAction("comment", "Comment", function() {
                        if (events)
                            api.comment(id);
                    });
                }
                page.appendAction("pageevent", "addFavorite", true, {title:'Add favorite'});
                page.options.createAction("addFavorite", "Add favorite", function() {
                    if (events)
                        api.addFavorite(id);
                });

                page.appendAction("pageevent", "watchLater", true, {title:'Watch Later'});
                page.options.createAction("watchLater", "Watch Later", function() {
                    if (events)
                        api.watchLater(id);
                });

                page.appendPassiveItem("list", interactions, { title: "Interactions" });
            }*/
    
            page.metadata.logo = plugin.path + "logo.png";
        }

        events = true;
    
        page.loading = false;
    });
  
    // We need to use this function so we can pass the correct title of video
    plugin.addURI(PREFIX + ":video:stream:(.*):(.*):(.*)", function(page, title, id, video_url) {
        playVideo(page, title, id, video_url);
    });
  

    function getCatList(link) {
        var atom = new Namespace("http://www.w3.org/2005/Atom");

        showtime.print(link);
      
        var data = new XML(valid_xml(showtime.httpGet(link).toString()));
        var list = [];
        list.push(['all', 'All', true]);
      
        for (var i in data.atom::category) {
            var entry = data.atom::category[i];
            var item = [entry.@term, entry.@label];
            list.push(item);
        }

        var categories_str = '';
        for (var i in list) {
            var els = '';
            for (var j in list[i]) {
                els += "'" + list[i][j] + "',";
            }
            els = els.slice(0, els.length - 1);
            categories_str += '[' + els + '],';
        }

        var res = "[" + categories_str.slice(0, categories_str.length - 1) + "]";
      
        return res;
    }
  
    //workaround for "Syntax Error: xml is a reserved identifier" - From Andreus Sebes's WebMedia
    function valid_xml(xmltext)
    {
        xmltext=xmltext.replace(/^[\s\S]*?(<[^\?!])/, "$1");

        return xmltext;
    }
  
    function getTime(date) {
        var time = date.match('(.*)-(.*)-(.*)T(.*):(.*):(.*)..*Z');
        if (time) {
            var dateVar = new Date(time[1], time[2], time[3], time[4], time[5], time[6]);
            return dateVar;
        }
        return -1;
    }
  
    function getDistanceTime(date) {
        if (date == -1)
            return null;

        var today = new Date();
        var years_past = today.getFullYear() - date.getFullYear();
        var months_past = (today.getMonth() + 1) - date.getMonth();
        var days_past = today.getDate() - date.getDate();
        var hours_past = today.getHours() - date.getHours();
        var minutes_past = today.getMinutes() - date.getMinutes();
        var seconds_past = today.getSeconds() - date.getSeconds();
      
        if (years_past >= 1) {
            if (months_past < 0)
                return (12 + months_past) + " months ago";
            else
                return years_past + " years ago";
        }
        else if ( years_past < 1 && months_past > 0) {
            if (months_past == 1)
                return "last month";
            return months_past + " months ago";
        }
        else if (days_past > 0 && months_past == 0) {
            if (days_past == 1)
                return "Yesterday";
            return days_past + " days ago";
        }
        else if (hours_past > 0 && days_past == 0) {
            if (hours_past == 1)
                return hours_past + " hour ago";
            return hours_past + " hours ago";
        }
        else if (hours_past == 0 && days_past == 0) {
            if (minutes_past == 1)
                return minutes_past + " minute ago";
            return minutes_past + " minutes ago";
        }
        else if (seconds_past > 0 && minutes_past < 0)
            return seconds_past + " seconds ago";
            
        return date;
    }
  
  
/*------------------------------------------------------------------------------
 * Functions for Youtube API
 -----------------------------------------------------------------------------*/
    function Youtube_API() {
        this.apiAuthenticated = false;

        this.storeLoginInformation = function() {
            var data = "access_token: " + this.access_token + "\nexpires_in: " + this.expires_in +
                "\ntoken_type: " + this.token_type + "\nrefresh_token: " + this.refresh_token +
                "\nexpires: " + new Date(new Date().valueOf() + this.expires_in * 100).toString();

            oauth_information['oauth2'] = data;
            showtime.trace('Saved OAuth2 details succesfully.');
        }

        this.readLoginInformation = function() {
            var data = oauth_information['oauth2'];

            if (!data)
                return;

            var split = data.split('\n');
            for (var i in split) {
                var el = split[i];
                var split2 = el.split(': ');

                this[split2[0]] = split2[1];
            }

            showtime.trace('Loaded stored OAuth2 details succesfully.');
        }

        this.init = function() {
            this.readLoginInformation();
            if (this['access_token'] && this['expires']) {
                showtime.trace('Found some details on OAuth2');
                this.apiAuthenticated = true;
                if (this['access_token'] && this['acess_token'] != '' && new Date(this['expires']).valueOf() > new Date().valueOf()) {
                    showtime.trace('OAuth2 saved information is valid.');
                    this.headers_common.Authorization = this['token_type'] + ' ' + this['access_token'];
                    return true;
                }
                else {
                    showtime.trace('OAuth2 saved information is outdated, will update it.');
                    this.refreshToken();
                    return true;
                }
            }
            else {
                showtime.trace('No OAuth2 information has been found.');
                return false;
            }
        }

        this.login = function() {
            if (this.apiAuthenticated) return true;

            try {
                var data = showtime.httpPost("https://accounts.google.com/o/oauth2/device/code", '', {
                    'client_id': '674074648448.apps.googleusercontent.com',
                    'scope': 'https://gdata.youtube.com'
                }, {
                    'Content-Length': '0'   
                }).toString();

                data = showtime.JSONDecode(data);
            }
            catch(ex) {
                showtime.trace('Failed to initialize device: ' + ex);
                showtime.message('Failed to initialize device: ' + ex, true, false);
                showtime.trace(ex, "YOUTUBE-ERROR");
                showtime.trace(ex.stack, "YOUTUBE-ERROR");
                return false; 
            }

            showtime.trace('User code: ' + data.user_code);

            var msg = 'Time limit: ' + parseInt(data.expires_in) / 60 + ' minutes.\nWebsite: ' + data.verification_url + '\nUser Code: ' + data.user_code + 
                '\n\n1. In a computer with Internet access, navigate to ' + data.verification_url +
                '\n2. It should show the Google logo and a box requesting a code from the device, \nin that box type the user code specified above' + 
                '\n3. If everything goes well, you should get to a page stating that Showtime Plugin Youtube \nrequests permission to access to the account.\n'+
                'If you want to use your account in Youtube, you have to authorize that access.' +
                '\n4. In case you accept, you should see a page stating that you authorized Showtime Plugin Youtube. \nCongratulations, now you can use the plugin fully, enjoy it.';

            showtime.trace(msg);
            showtime.message(msg, true, false);
                
            this.device_code = data.device_code;
            return this.pollRequest();
        }

        this.pollRequest = function() {
            try {
                var post = 'client_id=674074648448.apps.googleusercontent.com&client_secret=005XVL13iyAmIFX14X0BYCvo&code=' + this.device_code + '&grant_type=http://oauth.net/grant_type/device/1.0';
                var data = showtime.httpPost("https://accounts.google.com/o/oauth2/token", 
                    post, {}, {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': post.length
                    }).toString();

                data = showtime.JSONDecode(data);
            }
            catch(ex) {
                showtime.trace('Failed to poll request: ' + ex);
                showtime.message('Failed to poll request: ' + ex, true, false);
                showtime.trace(ex, "YOUTUBE-ERROR");
                showtime.trace(ex.stack, "YOUTUBE-ERROR");
                return false; 
            }

            if (data.error == 'authorization_pending') {
                showtime.trace('Access not yet granted to plugin.');
                showtime.message('Access not yet granted to plugin.', true, false);
                return false;
            }

            this.access_token = data.access_token;
            this.expires_in = data.expires_in;
            this.token_type = data.token_type;
            this.refresh_token = data.refresh_token;
            showtime.trace('User authorized plugin succesfully.');

            this.apiAuthenticated = true;

            this.storeLoginInformation();

            this.headers_common.Authorization = this.token_type + ' ' + this.access_token;

            return true;
        }

        this.refreshToken = function(){
            try {
                var post = 'client_id=674074648448.apps.googleusercontent.com&client_secret=005XVL13iyAmIFX14X0BYCvo&refresh_token=' + this['refresh_token'] + '&grant_type=refresh_token';
                var data = showtime.JSONDecode(showtime.httpPost("https://accounts.google.com/o/oauth2/token", 
                    post, {}, {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': post.length
                    }).toString());
            }
            catch(ex) {
                showtime.trace('Failed to refresh token: ' + ex);
                showtime.message('Failed to refresh token: ' + ex, true, false);
                showtime.trace(ex, "YOUTUBE-ERROR");
                showtime.trace(ex.stack, "YOUTUBE-ERROR");
                return -1; 
            }

            this.access_token = data.access_token;
            this.expires_in = data.expires_in;
            this.token_type = data.token_type;

            this.storeLoginInformation();
            showtime.trace('Saved the new token successfully.');

            this.headers_common.Authorization = this.token_type + ' ' + this.access_token;
            showtime.trace('Refreshed token succesfully.');

            return 0;
        }

        // Standard feeds
        this.standard_feeds = [
        ['Top Rated', 'https://gdata.youtube.com/feeds/api/standardfeeds/top_rated', 'http://i1163.photobucket.com/albums/q552/facanferff/top_rated.png'],
        ['Top Favorites', 'https://gdata.youtube.com/feeds/api/standardfeeds/top_favorites', 'http://i1163.photobucket.com/albums/q552/facanferff/favorites.png'],
        ['Most Shared', 'https://gdata.youtube.com/feeds/api/standardfeeds/most_shared', 'http://i1163.photobucket.com/albums/q552/facanferff/most_shared.png'], // Experimental feature
        ['Most Popular', 'https://gdata.youtube.com/feeds/api/standardfeeds/most_popular', 'http://i1163.photobucket.com/albums/q552/facanferff/most_popular.png'],
        ['Most Recent', 'https://gdata.youtube.com/feeds/api/standardfeeds/most_recent', 'http://i1163.photobucket.com/albums/q552/facanferff/recent.png'],
        ['Most Discussed', 'https://gdata.youtube.com/feeds/api/standardfeeds/most_discussed', 'http://i1163.photobucket.com/albums/q552/facanferff/most_discussed.png'],
        ['Most Responded', 'https://gdata.youtube.com/feeds/api/standardfeeds/most_responded', 'http://i1163.photobucket.com/albums/q552/facanferff/most_responded.png'],
        ['Recently Featured', 'https://gdata.youtube.com/feeds/api/standardfeeds/recently_featured', 'http://i1163.photobucket.com/albums/q552/facanferff/featured.png'],
        ['Trending videos', 'https://gdata.youtube.com/feeds/api/standardfeeds/on_the_web', 'http://i1163.photobucket.com/albums/q552/facanferff/trending.png'] // Experimental feature
        ];
    
        // Channel feeds
        this.channel_feeds = [
        ['Most viewed', 'https://gdata.youtube.com/feeds/api/channelstandardfeeds/most_viewed', 'http://i1163.photobucket.com/albums/q552/facanferff/most_viewed.jpg'],
        ['Most subscribed', 'https://gdata.youtube.com/feeds/api/channelstandardfeeds/most_subscribed', 'http://i1163.photobucket.com/albums/q552/facanferff/favorites.png']
        ];

        // Live feeds
        this.live_feeds = [
        ['Featured', 'https://gdata.youtube.com/feeds/api/charts/live/events/featured', 'http://i1163.photobucket.com/albums/q552/facanferff/featured.png'],
        ['Live Now', 'https://gdata.youtube.com/feeds/api/charts/live/events/live_now', 'http://i1163.photobucket.com/albums/q552/facanferff/favorites.png'],
        ['Upcoming', 'https://gdata.youtube.com/feeds/api/charts/live/events/upcoming', 'http://i1163.photobucket.com/albums/q552/facanferff/trending.png'],
        ['Recently Broadcasted', 'https://gdata.youtube.com/feeds/api/charts/live/events/recently_broadcasted', 'http://i1163.photobucket.com/albums/q552/facanferff/recent.png']
        ];
    
        // Movie feeds
        this.movie_feeds = [
        ['Featured', 'https://gdata.youtube.com/feeds/api/charts/movies/featured', 'http://i1163.photobucket.com/albums/q552/facanferff/featured.png'],
        ['Most Popular', 'https://gdata.youtube.com/feeds/api/charts/movies/most_popular', 'http://i1163.photobucket.com/albums/q552/facanferff/most_popular.png'],
        ['Most Recent', 'https://gdata.youtube.com/feeds/api/charts/movies/most_recent', 'http://i1163.photobucket.com/albums/q552/facanferff/recent.png'],
        ['Trending', 'https://gdata.youtube.com/feeds/api/charts/movies/trending', 'http://i1163.photobucket.com/albums/q552/facanferff/trending.png']
        ];

        // Show feeds
        this.show_feeds = [
        ['Most Popular', 'https://gdata.youtube.com/feeds/api/charts/shows/most_popular', 'http://i1163.photobucket.com/albums/q552/facanferff/most_popular.png'],
        ['Latest', 'https://gdata.youtube.com/feeds/api/charts/shows/latest', 'http://i1163.photobucket.com/albums/q552/facanferff/recent.png']
        ];
    
        // Trailer feeds
        this.trailer_feeds = [
        ['Most Popular', 'https://gdata.youtube.com/feeds/api/charts/trailers/most_popular', 'http://i1163.photobucket.com/albums/q552/facanferff/most_popular.png'],
        ['Most Recent', 'https://gdata.youtube.com/feeds/api/charts/trailers/most_recent', 'http://i1163.photobucket.com/albums/q552/facanferff/recent.png']
        ];

        this.mediatypes = [
            'Feature-length film',
            'Short film',
            'Full episode',
            'Show clip',
            'Trailer'
        ];

        this.moviegenres = [
            'Action & Adventure',
            'Animation & Cartoons',
            'Classics',
            'Comedy',
            'Crime',
            'Drama',
            'Documentary & Biography',
            'Family',
            'Foreign',
            'Horror',
            'Mystery & Suspense',
            'Romance',
            'Science Fiction',
            'null',
            'Sports',
            'null',
            'null',
            'Indian Cinema',
            'Nigerian Cinema'
        ];
    
        this.user_profile_settings = {
            'Username':'data.yt$username.$t',
            'First name':'data.yt$firstName.$t',
            'Last name':'data.yt$lastName.$t',
            'Age':'data.yt$age.$t',
            'Gender':'data.yt$gender.$t',
            'Location':'data.yt$location.$t',
            'Hometown':'data.yt$hometown.$t',
            'Company':'data.yt$company.$t',
            'Occupation':'data.yt$occupation.$t',
            'School':'data.yt$school.$t',
            'About me':'data.yt$aboutMe.$t',
            'Hobbies':'data.yt$hobbies.$t',
            'Movies':'data.yt$movies.$t',
            'Music':'data.yt$music.$t',
            'Books':'data.yt$books.$t',
            'Videos uploaded':'data.yt$channelStatistics.videoCount.$t',
            'Channel viewed':'data.yt$channelStatistics.viewCount.$t',
            'Subscribers':'data.yt$statistics.subscriberCount.$t'
        };
    
        this.video_settings = [
            ['Uploader', 'video.author[0].name.$t'],
            ['Category', 'video.media$group.media$category[0].$t'],
            ['Rating', 'parseFloat(video.gd$rating.average/5)'],
            ['Views', 'data.yt$statistics.viewCount'],
            ['Duration', 'showtime.durationToString(data.media$group.yt$duration.seconds)']
        ];

        this.orderby_values = [
            ['Published', 'published', 'video/playlist'],
            ['Relevance', 'relevance', 'video'],
            ['Views', 'viewCount', 'video/playlist'],
            ['Rating', 'rating', 'rating'],
            ['Position', 'position', 'playlist'],
            ['Comments', 'commentCount', 'playlist'],
            ['Duration', 'duration', 'playlist'],
            ['Title', 'title', 'video/playlist']
        ];
    
        this.reset_args = function() {
            this.args_common = {
                'alt' : 'json',
                'max-results' : 25,
                'safeSearch' : (service.safeSearch)?service.safeSearch: 'moderate'
            }

            if (service.resolutionFilter == 'hd')
                this.args_common['hd'] = true;
        };
        this.reset_args();
    
        // Headers for HTTP requests
        this.headers_common = {
            'GData-Version' : '2.1',
            'X-GData-Key' : 'key=AI39si7gfa8PEGC6qMb5Kk04aPInFlZVRIPZio6fNE9-0uwS4Qvo9dbhGxzeWIEQ8J4hMHGMtw2xOHuDGn3ped2EktTAVqCU9w',
            'Host': 'gdata.youtube.com'
        }
    
        // Like a video given its id
        this.like = function(id, type) {
            var request = '<?xml version="1.0" encoding="UTF-8"?>'+
            '<entry xmlns="http://www.w3.org/2005/Atom" '+
            'xmlns:yt="http://gdata.youtube.com/schemas/2007">'+
            '<yt:rating value="'+type+'"/></entry>';
        
            this.headers_common["Content-type"] = "application/atom+xml";
        
            try {
                var data = showtime.httpPost("http://gdata.youtube.com/feeds/api/videos/"+id+"/ratings", request, null, this.headers_common);
                showtime.notify(type.charAt(0).toUpperCase() + type.slice(1) + 'd video succesfully', 2);
            }
            catch(ex) {
                showtime.notify('Error while trying to ' + type + ' video: ' + ex, 2);
                showtime.trace(ex, "YOUTUBE-ERROR");
                showtime.trace(ex.stack, "YOUTUBE-ERROR");
            }
        }
    
        // Comment a video given its id
        this.comment = function(id) {
            var search = showtime.textDialog('Your comment to the video: ', true, true);
            if (search.rejected)
                return -1 //canceled

            if (search.input > "") {
                var request = '<?xml version="1.0" encoding="UTF-8"?>'+
                '<entry xmlns="http://www.w3.org/2005/Atom" '+
                'xmlns:yt="http://gdata.youtube.com/schemas/2007">'+
                '<content>'+search.input+'</content>'+
                '</entry>';
        
                this.headers_common["Content-type"] = "application/atom+xml";
        
                try {
                    var data = showtime.httpPost("http://gdata.youtube.com/feeds/api/videos/"+id+"/comments", request, null, this.headers_common);
                    showtime.notify('Commented video succesfully', 2);
                }
                catch(ex) {
                    showtime.notify('Error while trying to comment video: ' + ex, 2);
                    showtime.trace(ex, "YOUTUBE-ERROR");
                    showtime.trace(ex.stack, "YOUTUBE-ERROR");
                }
            }

            return 0;
        }
    
        this.addFavorite = function(id) {
            var request = '<?xml version="1.0" encoding="UTF-8"?>'+
            '<entry xmlns="http://www.w3.org/2005/Atom">'+
            '<id>'+id+'</id>'+
            '</entry>';
        
            this.headers_common["Content-type"] = "application/atom+xml";
        
            try {
                var data = showtime.httpPost("http://gdata.youtube.com/feeds/api/users/default/favorites", request, null, this.headers_common);
                showtime.notify('Added video to Favorites succesfully', 2);
            }
            catch(ex) {
                showtime.notify('Error while trying to add video to Favorites: ' + ex, 2);
                showtime.trace(ex, "YOUTUBE-ERROR");
                showtime.trace(ex.stack, "YOUTUBE-ERROR");
            }
        }
    
        this.watchLater = function(id) {
            var request = '<?xml version="1.0" encoding="UTF-8"?>'+
            '<entry xmlns="http://www.w3.org/2005/Atom" '+
            'xmlns:yt="http://gdata.youtube.com/schemas/2007">'+
            '<id>'+id+'</id>'+
            '<yt:position>1</yt:position>'+
            '</entry>';
        
            this.headers_common["Content-type"] = "application/atom+xml";
        
            try {
                var data = showtime.httpPost("http://gdata.youtube.com/feeds/api/users/default/watch_later", request, null, this.headers_common);
                showtime.notify('Added video to Watch Later succesfully', 2);
            }
            catch(ex) {
                showtime.notify('Error while trying to add video to Watch Later: ' + ex, 2);
                showtime.trace(ex, "YOUTUBE-ERROR");
                showtime.trace(ex.stack, "YOUTUBE-ERROR");
            }
        }
    
        this.addContact = function(id) {
            var request = '<?xml version="1.0" encoding="UTF-8"?>'+
            '<entry xmlns="http://www.w3.org/2005/Atom" '+
            'xmlns:yt="http://gdata.youtube.com/schemas/2007">'+
            '<yt:username>'+id+'</yt:username>'+
            '</entry>';
        
            this.headers_common["Content-type"] = "application/atom+xml";
        
            try {
                var data = showtime.httpPost("http://gdata.youtube.com/feeds/api/users/default/contacts", request, null, this.headers_common);
                showtime.notify('Added contact succesfully', 2);
            }
            catch(ex) {
                showtime.notify('Error while trying to add contact: ' + ex, 2);
                showtime.trace(ex, "YOUTUBE-ERROR");
                showtime.trace(ex.stack, "YOUTUBE-ERROR");
            }
        }
    
        this.subscribe = function(id, term) {
            var request = '<?xml version="1.0" encoding="UTF-8"?>'+
            '<entry xmlns="http://www.w3.org/2005/Atom" '+
            'xmlns:yt="http://gdata.youtube.com/schemas/2007">'+
            '<category scheme="http://gdata.youtube.com/schemas/2007/subscriptiontypes.cat" '+
            'term="'+term+'"/>'+
            '<yt:username>'+id+'</yt:username>'+
            '</entry>';
        
            this.headers_common["Content-type"] = "application/atom+xml";
        
            try {
                var data = showtime.httpPost("http://gdata.youtube.com/feeds/api/users/default/subscriptions", request, null, this.headers_common);
                showtime.notify('Subscribed to ' + term + ' succesfully', 2);
            }
            catch(ex) {
                showtime.notify('Error while trying to subscribe to ' + term + ': ' + ex, 2);
                showtime.trace(ex, "YOUTUBE-ERROR");
                showtime.trace(ex.stack, "YOUTUBE-ERROR");
            }
        }
    }

    function getUniversalSubtitles(video_id) {
        var args = 'video_url=' + escape('http://youtube.com/watch?v=' + video_id);
        var data = showtime.httpPost('http://www.universalsubtitles.org/en/videos/create/', args).toString();

        if (data.indexOf("This video doesn't have any subtitles yet :(") != -1)
            return [];
    
        var begin = data.indexOf('<ul id="subtitles-menu" >');
        var end = data.indexOf('</ul>', begin);
        var nice = data.slice(begin, end);
        var split = nice.split('</li>');
    
        var subtitles = [];
        
        for (var i in split) {
            var item = split[i];
            var language = item.match('<a href="/en/videos/(.*)/(.*)/(.*)/">');
            if (!language) {
                language = item.match('<a href="/en/videos/(.*)/">');

                if (!language || (item.indexOf('<span class="done_percentage">(0 Lines)</span>') != -1 || 
                    item.indexOf('<span class="done_percentage">(in progress)</span>') != -1))
                    continue;

                subtitles.push({
                    url: 'http://www.universalsubtitles.org/widget/download_srt/?video_id=' + language[1],
                    language: getValue(item, '<span class="done_indicator"></span>', '<span class="done_percentage">').replace(/\n/g, '').replace(/ /g, '') + ' - Universal Subtitles'
                });
            }
            else {
                if (item.indexOf('<span class="done_percentage">(0 Lines)</span>') != -1 || 
                    item.indexOf('<span class="done_percentage">(in progress)</span>') != -1)
                    continue;

                subtitles.push({
                    url: 'http://www.universalsubtitles.org/widget/download_srt/?video_id=' + language[1] + '&lang_pk=' + language[3],
                    language: language[2] + ' - Universal Subtitles'
                });
            }
        }
        return subtitles;
    }

    function getDefaultCaptionLink(id) {
        var data = showtime.httpGet('http://www.youtube.com/watch?v='+id).toString();

        var cc_init = data.indexOf('ttsurl='); 
        if (cc_init == -1)
            return null;

        var cc_end = data.indexOf('\\u0026amp;', cc_init);
        if (cc_end == -1)
            return null;

        var caption = unescape(data.slice(cc_init + 7, cc_end));
        return caption;
    }

    function getTranscribedCaptions(caption, xml) {
        var subtitles = [];
        var langs = [];

        var data = xml;
        for (var i in data.track) {
            var track = data.track[i];
            var kind = track.@kind;
            var lg = track.@lang_code;
            var title = track.@lang_translated;

            if (kind == 'asr')
                continue;
            
            var t = [lg, title];

            langs.push(t);
        }
        
        for (var i in langs) {
            var lg = langs[i];
            var cc = caption + '&lang=' + lg[0] + '&format=srt';

            subtitles.push({
                'url': cc,
                'language': lg[1] + ' - Transcribed caption'
            });
        }
        return subtitles;
    }

    function getAutomaticSpeechCaptions(caption, xml) {
        var subtitles = [];
        var langs = [];

        var data = xml;
        for (var i in data.track) {
            var track = data.track[i];
            var lg = track.@lang_code;
            var title = track.@lang_translated;
            var kind = track.@kind.toString();

            if ((kind && kind != "") != true)
                continue;

            var t = [lg, title, kind];

            langs.push(t);
        }
        
        for (var i in langs) {
            var lg = langs[i];
            
            var cc = caption + '&lang=' + lg[0] + '&format=srt&kind=' + lg[2];

            subtitles.push({
                'url': cc,
                'language': lg[1] + ' - Automatic Speech'
            });
        }
        return subtitles;
    }

    function getValue(url, start_string, end_string)
    {
        var begin_temp = url.indexOf(start_string) + start_string.toString().length;
        var end_temp = url.indexOf(end_string, begin_temp);
		
        var string = url.slice(begin_temp, end_temp);
        return unescape(string);
    }

    function getUrlArgs(url) {
        var link = url;

        var result = {
            url: link,
            args: {}
        };

        var args = {};

        if (link.indexOf('?') != -1) {
            var args_tmp = url.slice(url.indexOf('?') + 1);            
            args_tmp = args_tmp.split('&');

            for (var i in args_tmp) {
                var arg = args_tmp[i];
                var arg_tmp = arg.split('=');
                args[arg_tmp[0]] = arg_tmp[1];
            }

            link = link.slice(0, link.indexOf('?'));
        }

        result.url = link;
        result.args = args;
        return result;
    }

    function putUrlArgs(url, args) {
        var link = url + '?';
        var args_end = false;
        
        for (var i in args) {
            link += i + '=' + args[i] + '&';
            args_end = true;
        }

        if (args_end)
            link = link.slice(0, link.length - 1);

        return link;
    }

    function date_string(date_str) {
        var date1 = date_str;
        var split = date1.split('-');
        var day = split[2].slice(0, 2);
        var month = split[1];
        var year = split[0];

        var date = day;
        if (day.slice(1, 2) == '1' && day != '11') {
            date += 'st';
        }
        else if (day.slice(1, 2) == '2' && day != '12') {
            date += 'nd';
        }
        else if (day.slice(1, 2) == '3' && day != '13') {
            date += 'rd';
        }
        else date += 'th';

        switch (month) {
            case '01':
                date += ' January';
                break;
            case '02':
                date += ' February';
                break;
            case '03':
                date += ' March';
                break;
            case '04':
                date += ' April';
                break;
            case '05':
                date += ' May';
                break;
            case '06':
                date += ' June';
                break;
            case '07':
                date += ' July';
                break;
            case '08':
                date += ' August';
                break;
            case '09':
                date += ' September';
                break;
            case '10':
                date += ' October';
                break;
            case '11':
                date += ' November';
                break;
            case '12':
                date += ' December';
                break;
        }
        date += ', ' + year;
        return date;
    }

    function insertionSort(array, field) {
        for (var i = 0, j, tmp; i < array.length; ++i) {
            tmp = array[i];

            for (j = i - 1; j >= 0 && array[j][field] > tmp[field]; --j)
                array[j + 1] = array[j];
            array[j + 1] = tmp;
        }

        return array;
    }

    function itemOptions(item, entry) {
        // TODO: Maximum resolution to be played

        item.addOptURL("More from this user", PREFIX + ':user:' + item.author);

        item.addOptAction("Like video", "like");
        item.onEvent('like', function (item) {
            api.like(this.id, "like");
        });

        item.addOptAction("Dislike video", "dislike");
        item.onEvent('dislike', function(item) {
            api.like(this.id, 'dislike') 
        });

        item.addOptAction("Comment video", "comment");
        item.onEvent('comment', function(item) {
            api.comment(this.id) 
        });
        
        item.addOptAction("Add to Favorites", "addFavorite");
        item.onEvent('addFavorite', function(item) {
            api.addFavorite(this.id) 
        });
        
        item.addOptAction("Add to Watch Later", "watchLater");
        item.onEvent('watchLater', function(item) {
            api.watchLater(this.id) 
        });

        for (var i in entry.link) {
            var link = entry.link[i];

            if (link.rel == "http://gdata.youtube.com/schemas/2007#video.related") {
                item.addOptURL("Related", PREFIX + ':feed:' + escape(link.href));
            }

            if (link.rel == "http://gdata.youtube.com/schemas/2007#video.responses") {
                item.addOptURL("Responses", PREFIX + ':feed:' + escape(link.href));
            }

            if (link.rel == "http://gdata.youtube.com/schemas/2007#video.trailer-for") {
                var match = link.href.match('videos/([^?]*)');
                if (match) {
                    item.addOptURL("Redirect to Movie", PREFIX + ':video:' + service.mode + ':' + escape(entry.title.$t) + ':' + escape(match[1]));
                }
            }

            if (link.rel == "http://gdata.youtube.com/schemas/2007#video.trailers") {
                item.addOptURL("Trailers", PREFIX + ':feed:' + escape(link.href));
            }

            if (link.rel == "http://gdata.youtube.com/schemas/2007#video.show") {
                item.addOptURL("Redirect to Show", PREFIX + ':feed:' + escape(link.href + "/content"));
            }

            if (link.rel == "http://gdata.youtube.com/schemas/2007#video.season") {
                item.addOptURL("Redirect to Season", PREFIX + ':feed:' + escape(link.href + "/episodes"));
            }
        }
    }

    function sort(items, field, reverse) {
        if (items.length == 0) return null;

        var its = [];
        for (var i in items) {
            items[i].orig_index = i;
            its.push(items[i]);
        }

        its.sort(function(a,b){return b[field] > a[field]});
        if (reverse) its.reverse();

        return its;
    }

    function pageUpdateItemsPositions(its) {
        for (var i in its) {
            items[its[i].orig_index].moveBefore(i);
        }
    }

    function pageMenu(page) {
        //page.metadata.background = ui.background;
        page.metadata.background = plugin.path + "views/img/background.png";
        page.metadata.backgroundAlpha = 0.5;

        //page.metadata.font = "default";

        page.appendAction("navopen", PREFIX + ":search", true, { title: "Search", icon: plugin.path + "views/img/search.png" });
        page.appendAction("pageevent", "sortDateDec", true, { title: "Sort by Date (Decrementing)", icon: plugin.path + "views/img/sort_date_dec.png" });
        page.appendAction("pageevent", "sortViewsDec", true, { title: "Sort by Views (Decrementing)", icon: plugin.path + "views/img/sort_views_dec.png" });
        page.appendAction("pageevent", "sortAlphabeticallyInc", true, { title: "Sort Alphabetically (Incrementing)", icon: plugin.path + "views/img/sort_alpha_inc.png" });
        page.appendAction("pageevent", "sortAlphabeticallyDec", true, { title: "Sort Alphabetically (Decrementing)", icon: plugin.path + "views/img/sort_alpha_dec.png" });
        page.appendAction("pageevent", "sortDefault", true, { title: "Sort as Default", icon: plugin.path + "views/img/sort_default.png" });
        
        var sorts = [
            ["sortAlphabeticallyInc", "Alphabetically (A->Z)"],
            ["sortAlphabeticallyDec", "Alphabetically (Z->A)"],
            ["sortViewsDec", "Views (decrementing)"],
            ["sortDateDec", "Published (decrementing)"],
            ["sortDefault", "Default", true]
        ];

        page.options.createMultiOpt("sort", "Sort by...", sorts, function(v) {
            eval(v + "()");
        });

        function sortAlphabeticallyInc() {
            var its = sort(items, "title", true);
            pageUpdateItemsPositions(its);
        }

        function sortAlphabeticallyDec() {
            var its = sort(items, "title", false);
            pageUpdateItemsPositions(its);
        }

        function sortViewsDec() {
            var its = sort(items, "views", false);
            pageUpdateItemsPositions(its);
        }

        function sortDateDec() {
            var its = sort(items, "date", false);
            pageUpdateItemsPositions(its);
        }

        function sortDefault() {
            for (var i in items_tmp) {
                items[i].moveBefore(items_tmp[i].orig_index);
            }
        }

        page.onEvent('sortAlphabeticallyInc', function() {
            sortAlphabeticallyInc();
        });

        page.onEvent('sortAlphabeticallyDec', function() {
            sortAlphabeticallyDec();
        });

        page.onEvent('sortViewsDec', function() {
            sortViewsDec();
        });

        page.onEvent('sortDateDec', function() {
            sortDateDec();
        });

        page.onEvent('sortDefault', function() {
            sortDefault();
        });
    }

    function websiteApi() {
        this.getPlaylist = function(list) {
            var link = "http://www.youtube.com/playlist?list=" + list;
            var entries = [];

            var data = showtime.httpGet(link).toString();
            var init = data.indexOf('<ol>');
            var end = data.indexOf('</ol>');
            data = data.slice(init, end).replace(/\r?\n/g, "").replace(/\s+/g, " ");
            var split = data.split('<li class="playlist-video-item');
            for (var i in split) {
                var item = split[i];
                var match = item.match('dir="ltr">(.+?)<\/span>');
                var match2 = item.match('data-thumb="(.+?)"');
                var match3 = item.match('vi/(.+?)/default.jpg');
                if (match && match3) {
                    var title = match[1];
                    var thumbnail = "";
                    if (!match2) match2 = item.match("<span class=\"yt-thumb-clip-inner\"><img src=\"(.+?)\"");
                    if (match2) thumbnail = match2[1];
                    if (thumbnail.slice(0, 5) != "http:") thumbnail = "http:" + thumbnail;
                    var id = match3[1];

                    var desc = '<font size="2" color="66CCFF">';
                    match3 = item.match(/<span class="video-view-count">(.+?) views.*<\/span>/);
                    desc += 'Views: ' + match3[1];
                    desc += '</font>';

                    entries.push({
                        title: title,
                        logo: thumbnail,
                        id: id,
                        description: new showtime.RichText(desc)
                    });
                }
            }

            return entries;
        }
    }

    function Downloader() {
        this.load = function(page, path, args) {
            if (!args) args = {};
            args.alt = "json";
            args.v = 2;

            try {
                var data = showtime.httpGet(path, args, api.headers_common);
                return {
                    response: showtime.JSONDecode(data.toString()),
                    headers: data.headers
                };
            }
            catch(ex) {
                debug(ex);
                if (ex == "Error: Authentication without realm" && api.apiAuthenticated) {
                    debug("Authentication failed. Trying refreshing token.");
                    api.refreshToken();
                    try {
                        var data = showtime.httpGet(path, args, api.headers_common);
                        return {
                            response: showtime.JSONDecode(data.toString()),
                            headers: data.headers
                        };
                    }
                    catch(ex) {
                        debug(ex);
                        showtime.trace(ex, "YOUTUBE-ERROR");
                        showtime.trace(ex.stack, "YOUTUBE-ERROR");
                    }
                }

                return "Failed to parse request.";
            }
        }
    }

    function debug(message, id) {
        if (!id) id = "YOUTUBE";
        showtime.trace(message, id);
    }

    plugin.addURI(PREFIX+":start", startPage);

    plugin.addSearcher("Youtube - Videos", plugin.path + "logo.png",    
    function(page, query) { 
        try {
            pageController(page, function(offset) {	
                api.args_common['start-index'] = offset;
                api.args_common.q = query;

                page.appendItem(PREFIX + ':feed:sort:' + escape("http://gdata.youtube.com/schemas/2007#video") + ':' + escape("https://gdata.youtube.com/feeds/api/videos/?q=" + query),"directory", {title: "Sort by..."});
                page.appendItem(PREFIX + ':feed:duration:' + escape("https://gdata.youtube.com/feeds/api/videos/?q=" + query),"directory", {title: "Filter by duration"});

                return showtime.JSONDecode(showtime.httpGet("https://gdata.youtube.com/feeds/api/videos", 
                    api.args_common, api.headers_common).toString());
            });
        }
        catch(err){
            showtime.trace('Search Youtube - Videos: '+err)
        }
    });

    plugin.addSearcher("Youtube - Playlists", plugin.path + "logo.png",    
    function(page, query) { 
        try {
            pageController(page, function(offset) {	
                api.args_common['start-index'] = offset;
                api.args_common.q = query;

                var doc = showtime.JSONDecode(showtime.httpGet("https://gdata.youtube.com/feeds/api/playlists/snippets",
                    api.args_common, api.headers_common).toString());

                return doc;
            });
        }
        catch(err){
            showtime.trace('Search Youtube - Playlists: '+err)
        }
    });

    plugin.addSearcher("Youtube - Channels", plugin.path + "logo.png",    
    function(page, query) {
        try {
            pageController(page, function(offset) {	
                api.args_common['start-index'] = offset;
                api.args_common.q = query;
                return showtime.JSONDecode(showtime.httpGet("https://gdata.youtube.com/feeds/api/channels",
                    api.args_common, api.headers_common).toString());
            });
        }
        catch(err){
            showtime.trace('Search Youtube - Channels: '+err)
        }
    });

})(this);