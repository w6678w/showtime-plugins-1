/**
 * TwitchTV plugin for Media Player Showtime
 *
 *  Copyright (C) 2012 Fábio Ferreira (facanferff)
 *  Adapted and improved from https://github.com/StateOfTheArt89/Twitch.tv-on-XBMC
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

    var httpHeaderUserAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:6.0) Gecko/20100101 Firefox/6.0';

    var settings = plugin.createSettings(plugin_info.title,
                    plugin.path + "logo.png",
                    plugin_info.synopsis);

    settings.createInfo("info",
                 plugin.path + "logo.png",
                 "Plugin developed by facanferff, creator of Youtube, Navi-X and TMDB plugins.");

    settings.createDivider('Browser Settings');

    settings.createInt("itemsPerPage", "Number of items per page", 20, 1, 100, 1, '', function(v) {
        service.itemsPerPage = v;
    });

    var titleFormats = [
        ['0', '<streamer> - <title>', true], ['1', '<viewers> - <streamers> - <title>'], ['2', '<title>'], ['3', '<streamer>']
    ];
    settings.createMultiOpt("titleFormat", "Title format", titleFormats, function (v) {
        service.titleFormat = v;
    });

    settings.createString("username", "Username", "", function (v) {
        service.username = v;
    });

    settings.createDivider("Video Playback");

    var videoQualities = [
        ['0', 'Any', true], ['1', '720p'], ['2', '480p'], ['3', '360p']
    ];
    settings.createMultiOpt("videoQuality", "Video Quality", videoQualities, function (v) {
        service.videoQuality = v;
    });

    plugin.addURI(PREFIX + ":start", function (page) {
        page.type = "directory";
        page.contents = "items";
        page.loading = false;

        page.appendItem(PREFIX + ":list:streams:featured:0", "directory", { title: "Featured Streams" });
        page.appendItem(PREFIX + ":list:games:0", "directory", { title: "Games" });
        page.appendItem(PREFIX + ":list:following", "directory", { title: "Following" });
        page.appendItem(PREFIX + ":list:teams:0", "directory", { title: "Teams" });
        
        page.metadata.logo = plugin.path + "logo.png";
        page.metadata.title = "TwitchTV - Home Page";
    });

    function getTitle(streamer, title, viewers) {
        if (!streamer)
            streamer = '-';
        if (!title)
            title = 'no title';
        if (!viewers)
            viewers = '0';

        var streamTitle = streamer + ' - ' + title;
        if (service.titleFormat == '1') {
            //Viewers - Streamer - Stream Title
            streamTitle = viewers + ' - ' + streamer + ' - ' + title
        }
        else if (service.titleFormat == '2') {
            //Stream Title
            streamTitle = title
        }
        else if (service.titleFormat == '3') {
            //Streamer
            streamTitle = streamer
        }
        return streamTitle;
    }

    plugin.addURI(PREFIX + ":list:streams:featured:(.*)", function (page, index) {
        page.type = "directory";
        page.contents = "items";
        page.loading = false;

        try {
            index = parseInt(index);
            var json = showtime.JSONDecode(showtime.httpGet('https://api.twitch.tv/kraken/streams/featured?limit=' + service.itemsPerPage  + '&offset=' + (index * service.itemsPerPage)).toString());
            
            for each (var it in json.featured) {
                var stream = it.stream;
                var channel = it.stream.channel;
                var loginName = channel.name;
                var title = getTitle(channel.name, channel.status, channel.viewers);
                page.appendItem(PREFIX + ":play:live:" + loginName, "video", { 
                    title: title,
                    icon: channel.logo
                });
            }

            try {
                var json2 = showtime.JSONDecode(showtime.httpGet('https://api.twitch.tv/kraken/streams/featured?limit=' + service.itemsPerPage  + '&offset=' + ((index + 1) * service.itemsPerPage)).toString());
                if (json2._links.next) {
                    page.appendItem(PREFIX + ":list:streams:featured:" + (index + 1), "directory", { 
                        title: "Next Page"
                    });
                }
            }
            catch(ex) {
                e(ex);
            }
        }
        catch (ex) {
            page.error("Failed to process page");
            e(ex);
        }

        page.metadata.logo = plugin.path + "logo.png";
        page.metadata.title = "TwitchTV - Featured Streams";
    });

    plugin.addURI(PREFIX + ":list:following", function (page) {
        page.type = "directory";
        page.contents = "items";
        page.loading = false;

        try {
            var username = service.username.toLowerCase();
            if (!username) {
                page.error("No user specified in settings.");
                return;
            }
            var json = showtime.JSONDecode(showtime.httpGet('http://api.justin.tv/api/user/favorites/' + username + '.json?live=true&limit=' + service.itemsPerPage + '&offset=0').toString());
            if (!json) {
                page.error("Failed to parse JSON.");
                return;
            }
            t(json.length + " items");
            if (json.length == 0) {
                page.appendItem(PREFIX + ":list:following", "directory", { 
                    title: "There are no entries in this page"
                });
            } 

            for each (var it in json) {
                var loginName = it.login;
                var image = it.image_url_huge;
                var title = getTitle(loginName, it.status, it.views_count);
                page.appendItem(PREFIX + ":play:live:" + loginName, "video", { 
                    title: title,
                    icon: image
                });
            }
        }
        catch (ex) {
            page.error("Failed to process page");
            e(ex);
        }

        page.metadata.logo = plugin.path + "logo.png";
        page.metadata.title = "TwitchTV - Featured Streams";
    });

    plugin.addURI(PREFIX + ":list:games:(.*)", function (page, index) {
        page.type = "directory";
        page.contents = "items";
        page.loading = false;

        try {
            index = parseInt(index);
            var json = showtime.JSONDecode(showtime.httpGet('https://api.twitch.tv/kraken/games/top?limit=' + service.itemsPerPage + '&offset=' + (index * service.itemsPerPage)).toString());
            if (!json) {
                throw new Exception("Failed to request page.");
            }
            for each (var it in json.top) {
                if (!it.game || !it.game.name)
                    continue;
                var name = it.game.name;
                var image = "";
                try {
                    image = it.game.images.super;
                }
                catch (ex) {

                }
                page.appendItem(PREFIX + ":list:game:" + escape(name) + ":0", "directory", { 
                    title: name,
                    icon: image
                });
            }
            if (json['top'].length >= service.itemsPerPage) {
                page.appendItem(PREFIX + ":list:games:" + (index + 1), "directory", { 
                    title: "Next Page"
                });
            }
        }
        catch (ex) {
            page.error("Failed to process page");
            e(ex);
        }

        page.metadata.logo = plugin.path + "logo.png";
        page.metadata.title = "TwitchTV - Featured Streams";
    });

    plugin.addURI(PREFIX + ":list:game:(.*):(.*)", function (page, name, index) {
        page.type = "directory";
        page.contents = "items";
        page.loading = false;

        try {
            index = parseInt(index);
            var json = showtime.JSONDecode(showtime.httpGet('https://api.twitch.tv/kraken/streams?game=' + name + '&limit=' + service.itemsPerPage + '&offset=' + index * service.itemsPerPage).toString());
            if (!json) {
                throw new Exception("Failed to request page.");
            }
            for each (var it in json.streams) {
                var channelData = it.channel;
                var image = "";
                try {
                    image = channelData.logo;
                }
                catch (ex) {

                }
                var title = getTitle(channelData.name, channelData.status, channelData.viewers);
                page.appendItem(PREFIX + ":play:live:" + it.channel.name, "video", { 
                    title: title,
                    icon: image
                });
            }

            if (json['streams'].length == 0) {
                page.appendItem(PREFIX + ":list:game:" + name + ":" + index, "directory", { 
                    title: "There are no entries in this page"
                });
            } 

            if (json['streams'].length >= service.itemsPerPage) {
                page.appendItem(PREFIX + ":list:game:" + name + ":" + (index + 1), "directory", { 
                    title: "Next Page"
                });
            }
        }
        catch (ex) {
            page.error("Failed to process page");
            e(ex);
        }

        page.metadata.logo = plugin.path + "logo.png";
        page.metadata.title = "TwitchTV - Featured Streams";
    });

    plugin.addURI(PREFIX + ":list:teams:(.*)", function (page, index) {
        page.type = "directory";
        page.contents = "items";
        page.loading = false;

        try {
            index = parseInt(index);
            var json = showtime.JSONDecode(showtime.httpGet('https://api.twitch.tv/kraken/teams/?limit=' + service.itemsPerPage + '&offset=' + (index * service.itemsPerPage)).toString());
            if (!json) {
                throw new Exception("Failed to request page.");
            }
            for each (var it in json.teams) {
                var image = "";
                try {
                    image = it.logo;
                }
                catch (ex) {

                }
                var name = it.name;
                page.appendItem(PREFIX + ":list:team:streams:" + escape(name), "directory", {
                    title: name,
                    icon: image
                });
            }

            try {
                var json2 = showtime.JSONDecode(showtime.httpGet('https://api.twitch.tv/kraken/teams/?limit=' + service.itemsPerPage + '&offset=' + ((index + 1) * service.itemsPerPage)).toString());
                if (json2._links.next) {
                    page.appendItem(PREFIX + ":list:teams:" + (index + 1), "directory", { 
                        title: "Next Page"
                    });
                }
            }
            catch(ex) {
                e(ex);
            }
        }
        catch (ex) {
            page.error("Failed to process page");
            e(ex);
        }

        page.metadata.logo = plugin.path + "logo.png";
        page.metadata.title = "TwitchTV - Featured Streams";
    });

    plugin.addURI(PREFIX + ":list:team:streams:(.*)", function (page, team) {
        page.type = "directory";
        page.contents = "items";
        page.loading = false;

        try {
            var json = showtime.JSONDecode(showtime.httpGet('http://api.twitch.tv/api/team/' + team + '/live_channels.json').toString());
            if (!json) {
                throw new Exception("Failed to request page.");
            }
            for each (var it in json.channels) {
                var image = "";
                try {
                    image = it.channel.image.size600;
                }
                catch (ex) {

                }
                var channelData = it.channel;
                var title = getTitle(channelData.display_name, channelData.title, channelData.current_viewers);
                var channelName = it.channel.name;
                page.appendItem(PREFIX + ":play:live:" + channelName, "video", {
                    title: title,
                    icon: image
                });
            }

            if (json.channels.length == 0) {
                page.appendItem(PREFIX + ":list:team:streams:" + team, "directory", { 
                    title: "There are no entries in this page"
                });
            } 
        }
        catch (ex) {
            page.error("Failed to process page");
            e(ex);
        }

        page.metadata.logo = plugin.path + "logo.png";
        page.metadata.title = "TwitchTV - Featured Streams";
    });

    function getSwfUrl(channel_name) {
        // Helper method to grab the swf url
        var base_url = 'http://www.justin.tv/widgets/live_embed_player.swf?channel=' + channel_name;
        var headers = {
            'User-agent': httpHeaderUserAgent,
            'Referer': 'http://www.justin.tv/' + channel_name
        };
        var response = showtime.httpGet(base_url, {}, headers, {
            noFollow: true,
            headRequest: true
        });
        return response.headers.Location.replace(/ /g, "%20");
    }

    function getBestJtvTokenPossible(name) {
        // Helper method to find another jtv token
        var swf_url = getSwfUrl(name)
        var headers = {
            'User-agent': httpHeaderUserAgent,
            'Referer': swf_url
        };
        var url = 'http://usher.justin.tv/find/' + name + '.json?type=any&group='
        var data = showtime.JSONDecode(showtime.httpGet(url).toString());
        var bestVideoHeight = -1;
        var bestIndex = -1;
        var index = 0;
        for each (var x in data) {
            var value = x.token;
            if (value == undefined) value = "";
            var videoHeight = parseInt(x['video_height']);
            if (value != '' && videoHeight > bestVideoHeight) {
                bestVideoHeight = x['video_height'];
                bestIndex = index;
            }
            index = index + 1;
        }
        if (bestIndex == -1)
            return null;
        return data[bestIndex];
    }

    plugin.addURI(PREFIX + ":play:live:(.*)", function (page, name) {
        page.type = "directory";
        page.contents = "items";
        page.loading = false;

        var swf_url = getSwfUrl(name)
        var headers = {
            'User-agent': httpHeaderUserAgent,
            'Referer': swf_url
        };
        var videoTypeName = 'any';
        if (service.videoQuality == '0')
            videoTypeName = 'any'
        else if (service.videoQuality == '1')
        videoTypeName = '720p';
        else if (service.videoQuality == '2')
        videoTypeName = '480p';
        else if (service.videoQuality == '3')
            videoTypeName = '360p';
        var url = 'http://usher.justin.tv/find/' + name + '.json?type=' + videoTypeName + '&private_code=null&group=';
        var data = showtime.JSONDecode(showtime.httpGet(url, {}, headers));
        var tokenIndex = 0

        try {
            // trying to get a token in desired quality
            var token = ' jtv=' + data[tokenIndex]['token'].replace(
            /\\/g, '\\5c').replace(/ /g, '\\20').replace(/"/g, '\\22');
            var rtmp = data[tokenIndex]['connect'] + '/' + data[tokenIndex]['play'];
        }
        catch (ex) {
            t("Selected video settings are not available");
            var jtvtoken = getBestJtvTokenPossible(name)
            if (!jtvtoken) {
                //showtime.notify("User Token Error", 2);
                page.error("User Token Error");
                return;
            }
            token = ' jtv=' + jtvtoken['token'].replace(/\\/g, '\\5c').replace(/ /g, '\\20').replace(/"/g, '\\22');
            rtmp = jtvtoken['connect'] + '/' + jtvtoken['play'];
        }

        var swf = ' swfUrl=' + swf_url + ' swfVfy=1 live=1';
        var Pageurl = ' Pageurl=http://www.justin.tv/' + name;
        url = rtmp + token + swf + Pageurl;

        var videoParams = {
            title: name,
            sources: [{
                url: url
            }]
        };

        page.source = "videoparams:" + showtime.JSONEncode(videoParams);
        page.type = "video";

        page.metadata.logo = plugin.path + "logo.png";
    });

    function e(ex) {
        t(ex);
        t("Line #" + ex.lineNumber);
    }
    
    function t(message) {
        showtime.trace(message, plugin.getDescriptor().id);
    }
    
    function p(message) {
        showtime.print(message);
    }

    function listLiveStreamResults(page, url) {
        page.type="directory";
        page.contents="list";

        var j = 0;
        try {
            var json = showtime.httpGet(url).toString()/*.replace(/jQuery1337/g, "")*/;
            json = showtime.JSONDecode(json/*.slice(1, json.length - 1)*/);
            if (!json) {
                throw new Exception("Failed to request page.");
            }
            j = json.streams.length;
            for each (var it in json.streams) {
                var title = getTitle(it.name, it.channel.display_name, it.viewers);
                page.appendItem(PREFIX + ":play:live:" + it.channel.name, "video", {
                    title: title,
                    icon: it.preview
                });
            }
        }
        catch (ex) {
            page.error("Failed to process page");
            e(ex);
        }

        page.entries = j;
    }

    function listGameResults(page, url) {
        page.type="directory";
        page.contents="list";

        var j = 0;
        try {
            var json = showtime.httpGet(url).toString();
            json = showtime.JSONDecode(json);
            if (!json) {
                throw new Exception("Failed to request page.");
            }
            j = json.games.length;
            for each (var it in json.games) {
                page.appendItem(PREFIX + ":list:game:" + escape(it.name) + ":0", "directory", {
                    title: it.name,
                    icon: it.box.large
                });
            }
        }
        catch (ex) {
            page.error("Failed to process page");
            e(ex);
        }

        page.entries = j;
    }

    plugin.addSearcher("TwitchTV - Live Streams", plugin.path + "logo.png",
    function (page, query) {
        try {
            listLiveStreamResults(page, 'https://api.twitch.tv/kraken/search/streams?limit=' + service.itemsPerPage + '&offset=0&q=' + escape(query))
        }
        catch (ex) {
            t('Search TwitchTV - LiveStreams: ');
            e(ex);
        }
    });

    plugin.addSearcher("TwitchTV - Games", plugin.path + "logo.png",
    function (page, query) {
        try {
            listGameResults(page, 'https://api.twitch.tv/kraken/search/games?type=suggest&q=' + escape(query));
        }
        catch (ex) {
            t('Search TwitchTV - Games: ');
            e(ex);
        }
    });

})(this);