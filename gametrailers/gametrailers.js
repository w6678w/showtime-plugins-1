/**
 * GameTrailers plugin for Showtime
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

    var service = plugin.createService(plugin_info.title, PREFIX + ":start", "video", true,
               plugin.path + "logo.png");
                           
    var settings = plugin.createSettings(plugin_info.title,
                    plugin.path + "logo.png",
                    plugin_info.synopsis);

    settings.createDivider('Browser Settings');

    settings.createInt("maximumNumberPages", "Maximum number of pages to show each time", 7, 1, 15, 1, '', function(v) {
        service.maximumNumberPages = v;
    });

    settings.createDivider('Video Playback');

    settings.createBool("video_hd", "Enable HD Playback", true, function (v) {
        service.video_hd = v;
    });

    function startPage(page) {  
        var data = { section: "general" };
        page.appendItem(PREFIX + ':list:' + escape(showtime.JSONEncode(data)),"directory", {title: "All"});

        data = { section: "general", id: "Preview" };
        page.appendItem(PREFIX + ':list:' + escape(showtime.JSONEncode(data)),"directory", {title: "Previews"});

        data = { section: "general", id: "Review" };
        page.appendItem(PREFIX + ':list:' + escape(showtime.JSONEncode(data)),"directory", {title: "Reviews"});

        data = { section: "general", id: "Gameplay" };
        page.appendItem(PREFIX + ':list:' + escape(showtime.JSONEncode(data)),"directory", {title: "Gameplay"});

        page.appendItem(PREFIX + ':main:channels',"directory", {title: "Channels"});
        
        page.type = "directory";
        page.contents = "items";
        page.loading = false;

        page.metadata.logo = plugin.path + "logo.png";
    
        page.metadata.title = "GameTrailers";
    }

    function retrospectiveController(page, loader) {
        var offset = 1;

        function paginator() {
            var num = 0;

            while(true) {
                var data = loader(offset);
                var c = 0;
                page.entries = 1 + num;

                var match = data.match(/<a href="\?currentPage=.*">(.*)<\/a><\/li><li class="next"><a class="override_nav_background_color override_nav_text_color"/);
                var has_nextpage = false;
                if (match) has_nextpage = true;

                var split = data.split('</li>');
                for each (var item in split) {
                    var match = item.match(/<h4><a href=".*">(.*)<\/a><\/h4>/);
                    if (!match) continue;
                    var title = match[1];

                    match = item.match(/<img src="(.+?)"/);
                    var thumb = match[1];

                    match = item.match(/<a href="(.*)" class="thumbnail">/);
                    var href = match[1];

                    match = item.match(/<p>(.*)<\/p>/);
                    var description = null;
                    if (match) description = match[1];

                    match = item.match(/Views: <span>([^ ]*)/);
                    var views = match[1];

                    page.appendItem(PREFIX + ':play:' + escape(href),"video", {
                        title: title,
                        icon: thumb,
                        description: description,
                        views: views
                    });
                    c++;
                }

                page.loading = false;
                num += c;
                offset++;
                if(c == 0 || !has_nextpage || offset > service.maximumNumberPages)
                    break;
            }
            offset += num;
            return offset < page.entries;
        }

        page.type = "directory";
        paginator();
        page.paginator = paginator;
    }

    function pageController(page, loader) {
        var offset = 1;

        function paginator() {
            var num = 0;

            while(true) {
                var data = loader(offset);
                var c = 0;
                page.entries = 1 + num;

                var match = data.match(/<a href="\?currentPage=.*">(.*)<\/a><\/li><li class="next"><a class="override_nav_background_color override_nav_text_color"/);
                var has_nextpage = false;
                if (match) has_nextpage = true;

                var split = data.split('<div class="video_information"');
                for each (var item in split) {
                    var match = item.match(/<h3><a href=".*">(.*)<\/a><\/h3>/);
                    if (!match) continue;
                    var title = match[1];
                    match = item.match(/<h4><a href=".*" class=".*">(.*)<\/a><\/h4>/);
                    title += " - " + match[1];

                    match = item.match(/<img src="(.+?)"/);
                    var thumb = match[1];

                    match = item.match(/<a href="(.*)" class="thumbnail">/);
                    var href = match[1];

                    match = item.match(/<p>(.*)<\/p>/);
                    var description = null;
                    if (match) description = match[1];

                    match = item.match(/Views: <span>([^ ]*)/);
                    var views = match[1];

                    page.appendItem(PREFIX + ':play:' + escape(href),"video", {
                        title: title,
                        icon: thumb,
                        description: description,
                        views: views
                    });
                    c++;
                }

                page.loading = false;
                num += c;
                offset++;
                if(c == 0 || !has_nextpage || offset > service.maximumNumberPages)
                    break;
            }
            offset += num;
            return offset < page.entries;
        }

        page.type = "directory";
        paginator();
        page.paginator = paginator;
    }

    plugin.addURI(PREFIX + ":main:channels", function(page) {
        page.type = "directory";

        var content = new XML(showtime.httpGet("http://lite.dextr.mtvi.com/ale/sync/feed/gametrailers-series-solr-feed/?dextr_feed_env=live&size=999999&start=0").toString());
        var items = [];
        for each (var item in content.doc) {
            var id = "";
            var title = "";
            var description = "";
            for each (var field in item.field) {
                if (field.@name == "pk_id")
                    id = field;
                if (field.@name == "title_t")
                    title = field;
                if (field.@name == "long_desc_t")
                    description = field;
            }

            var data = {
                section: "series",
                id: id,
                title: title
            }

            var it = page.appendItem(PREFIX + ":list:" + escape(showtime.JSONEncode(data)), "directory", {
                title: title,
                description: description
            });
            it.title = title;
            items.push(it);
        }

        var its = sort(items, "title", true);
        for (var i in its) {
            items[its[i].orig_index].moveBefore(i);
        }

        page.loading = false;
    });

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
  
    plugin.addURI(PREFIX + ":list:(.*)", function(page, data) {
        var url = "";

        data = showtime.JSONDecode(unescape(data));
        if (data.section == "series") {
            pageController(page, function(offset) {
                url = "http://www.gametrailers.com/feeds/line_listing_results/video_hub/6bc9c4b7-0147-4861-9dac-7bfe8db9a141/?sortBy=most_recent";
                url += "&show=" + data.id;
                url += "&currentPage=" + offset;

                return showtime.httpGet(url).toString();
            });
        }
        else if (data.section == "general") {
            pageController(page, function(offset) {
                url = "http://www.gametrailers.com/feeds/line_listing_results/video_hub/6bc9c4b7-0147-4861-9dac-7bfe8db9a141/?sortBy=most_recent";
                if (data.id) url += "&category=" + data.id;
                url += "&currentPage=" + offset;

                return showtime.httpGet(url).toString();
            });
        }

        page.type = "directory";
        page.contents = "items";
        page.loading = false;

        page.metadata.logo = plugin.path + "logo.png";
    
        page.metadata.title = "GameTrailers";
    });

    plugin.addURI(PREFIX + ":play:(.*)", function (page, url) {
        url = unescape(url);

        var PLAYER_URL_RE             = new RegExp( ".*/player/(\d+).html" )
        var EPISODE_BONUSROUND_URL_RE = new RegExp( ".*/episode/bonusround/.*" )
        var BONUSROUND_PHP_URL_RE     = new RegExp( ".*/bonusround.php\?ep=(\d+)" )
        var VIDEO_URL_RE              = new RegExp( ".*/video/(.+)?/(\d+)" )
        var GAMETRAILERS_TV_PLAYER_RE = new RegExp( ".*/gametrailerstv_player.php?.*" )
        var EPISODE_GAMETRAILER_TV_RE = new RegExp( ".*/episode/gametrailers-tv/.*" )
        var USER_MOVIES_URL_RE        = new RegExp( ".*/usermovies/(\d+).html" )
        var MOSES_MOVIES_THUMBS       = new RegExp( ".*/moses/moviesthumbs/(\d+)-.*" )
        var VIDEOS_URL_RE             = new RegExp( ".*/videos/.*" )
        var REVIEWS_URL_RE            = new RegExp( ".*/reviews/.*")
        var FULL_EPISODES_URL_RE      = new RegExp( ".*/full-episodes/.*")

        var res = { error: "No known method of extracting video link." };

        if (url.match(VIDEOS_URL_RE) || 
            url.match(REVIEWS_URL_RE) || 
            url.match(FULL_EPISODES_URL_RE))
                res = _getVideoUrl7( url )

        if (res.error) {
            page.err(res.error);
            return;
        }

        var videoParams = {
            title: res.title,
            sources: [{
                url: res.video_urls[0]
            }]
        };

        page.source = "videoparams:" + showtime.JSONEncode(videoParams);
        page.type = "video";

        page.loading = false;
    });

    // Video page URL = /videos/1tx4bz/planetside-2-gc-2012--exclusive-beta-walkthrough--cam-
    function _getVideoUrl7(url) {
        var res = {
            video_urls: []
        };
        // Video format (SD or HD)...
        var rendition_size = "sd"
        if (service.video_hd)
            rendition_size = "hd";

        var media = new Namespace("http://search.yahoo.com/mrss/");

        var data = showtime.httpGet(url).toString(); 
        var match = data.match(/data-contentId='(.*)'/);
        if (match) {
            var data_content_id = match[1];
                       
            // Parse RSS feed (one or more video parts)...
            var url_rss  = "http://www.gametrailers.com/feeds/mrss/?uri=" + data_content_id;
            var data_rss = showtime.httpGet( url_rss ).toString();
            var doc_rss  = new XML( data_rss );

            res.title = doc_rss.channel.title;

            for each (item_node in doc_rss.channel.item) {
                // Get video parts...
                var media_group_node = item_node.media::group;
                var media_category_nodes = media_group_node.media::category;
                for each (media_category_node in media_category_nodes) {
                    if (media_category_node.@scheme == "urn:mtvn:id") {
                        var media_id = media_category_node;
                                               
                        // Get video URL for part...
                        var url_xml  = "http://www.gametrailers.com/feeds/mediagen/?uri=" + media_id + "&forceProgressive=true&renditionSize=" + rendition_size;
                        var data_xml = showtime.httpGet(url_xml).toString();
                        var doc_xml  = new XML(data_xml);

                        // Parse XML...
                        var video_url = doc_xml.video.item.rendition.src;
                        res.video_urls.push( video_url )
                                               
                        break;
                    }
                }
            }
        }
                                       
        // Return value
        return res;
    }

    plugin.addSearcher("GameTrailers", plugin.path + "logo.png",
    function (page, query) {
        try {
            pageController(page, function(offset) {
                var url = "http://www.gametrailers.com/feeds/search/child/c9c01382-1f7c-4a3a-b68f-2e5ecc67fdd3/?keywords=" + encodeURIComponent(query) + "&tabName=videos&platforms=&currentPage=" + offset;
                return showtime.httpGet(url).toString();
            });
        }
        catch (err) {
            showtime.trace('Search: ' + err, "GameTrailers")
        }

        page.entries = 0;
    });

plugin.addURI("gametrailers:start", startPage);
})(this);
