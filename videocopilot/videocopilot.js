/**
 * Video Copilot plugin for Showtime by facanferff (Fábio Ferreira / facanferff.showtime@hotmail.com)
 *
 *  Copyright (C) 2011 facanferff (Fábio Ferreira / facanferff.showtime@hotmail.com)
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
    var PREFIX = 'videocopilot';
    var login = false;
    var country = '';

    var service = plugin.createService("Video Copilot", PREFIX + ":start", "video", true,
	plugin.path + "logo.png");

    function startPage(page) {
        var v = 3 * 10000000 +  5 * 100000 + 212;
        if (showtime.currentVersionInt < v) {
            page.error('Your version of Showtime is outdated for this plugin. Look at https://www.lonelycoder.com/showtime/download for a new build of it.');
            return;
        }

        page.appendItem(PREFIX + ':browse:' + escape('http://www.videocopilot.net/tutorials/') + ':undefined', 'directory', { title: 'All Tutorials' });
        page.appendItem(PREFIX + ':browse:' + escape('http://www.videocopilot.net/presets/') + ':undefined', 'directory', { title: 'Free Presets' });
        page.appendItem(PREFIX + ':browse:' + escape('http://www.videocopilot.net/basic/') + ':undefined', 'directory', { title: 'Basic Training' });
    
        page.type = "directory";
        page.contents = "items";
        page.loading = false;

        page.metadata.logo = plugin.path + "logo.png";
        page.metadata.title = "Video Copilot - Home Page";
    }

    plugin.addURI(PREFIX + ":feed:sort:(.*):(.*)", function (page, link, sorts) {
        var split = sorts.split(',');
        for (var i in split) {
            var type = split[i];
            if (type > '') {
                page.appendItem(PREFIX + ':browse:' + link + ':' + type, 'directory', { title: 'Sort by ' + type.slice(0, type.indexOf('_')) });
            }
        }

        page.type = "directory";
        page.contents = "contents";
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":browse:(.*):(.*)", function (page, link, sort) {
        var entries = [];
        var url = unescape(link);
        if (url == 'http://www.videocopilot.net/tutorials/')
            entries = getTutorials(url);
        else if (url == 'http://www.videocopilot.net/basic/')
            entries = getBasicTraining(url);
        else if (url == 'http://www.videocopilot.net/presets/')
            entries = getPresets(url);
        else {
            page.loading = false;
            return;
        }

        var sorts = '';

        for (var el in entries[0]) {
            if (el.indexOf('_count') != -1) {
                sorts += el + ',';
            }
        }

        page.appendItem(PREFIX + ':feed:sort:' + link + ':' + sorts, 'directory', { title: 'Sort by ...' });

        if (sort != 'undefined')
            entries = insertionSort(entries, sort);

        displayEntries(page, entries);

        page.type = "directory";
        page.contents = "contents";
        page.loading = false;
    });

    function insertionSort(array, field) {
        for (var i = 0, j, tmp; i < array.length; ++i) {
            tmp = array[i];

            for (j = i - 1; j >= 0 && array[j][field] < tmp[field]; --j)
                array[j + 1] = array[j];
            array[j + 1] = tmp;
        }

        return array;
    }

    function displayEntries(page, entries) {
        for (var i in entries) {
            var item = entries[i];

            var titleText = '<font size="3" color="008000">';

            if (item.recent == '1') {
                titleText += '[NEW] ';
            }

            titleText += '</font><font size="3" color="FFFFFF">' + item.title + '</font>';

            if (item.duration)
                titleText += '<font size="3" color="6699CC"> ( ' + item.duration + ' )</font>';

            titleText += '\n<font size="2" color="66CCFF">';

            if (item.views)
                titleText += 'Views: ' + item.views;

            if (item.views && item.comments)
                titleText += ' | ';

            if (item.comments)
                titleText += 'Comments: ' + item.comments;

            titleText += '</font>\n';

            if (item.description)
                titleText += '<font size="2" color="C0C0C0">' + item.description + '</font>';

            page.appendItem(PREFIX + ':video:simple:' + escape(item.url), 'video', {
                title: new showtime.RichText(titleText),
                icon: item.icon
            });
        }
    }

    function trimNumber(s) {
        while (s.substr(0, 1) == '0' && s.length > 1) { s = s.substr(1, 9999); }
        return s;
    }

    function getDuration(duration) {
        var split = duration.split(':');
        if (split.length >= 2) {
            var seconds = parseInt(trimNumber(split[split.length - 1]));
            var minutes = parseInt(trimNumber(split[split.length - 2]));

            var total = seconds;
            total += minutes * 60;
            return total;
        }

        return -1;
    }

    function getTutorials(link) {
        var data = showtime.httpGet(link).toString();
        var init = data.indexOf('<div class="tutorials-all-header">Tutorials By Date</div>');
        var end = data.indexOf('<div class="tutorials-all-right"></div><div class="clear">', init);
        data = data.slice(init, end);
        data = data.replace(/\n/g, " ");
        var split = data.split('<div class="tutorials-all-item">');

        var entries = [];

        for (var i in split) {
            var entry = split[i];

            var match = entry.match('<div class="tutorials-all-item-title"><a href="(.*)">(.*)</a></div>');
            if (match) {
                var title = match[2];
                var url = match[1];

                match = entry.match('<div class="tutorials-all-item-time">(.*?)</div>');
                var duration = match[1];

                match = entry.match('<div class="tutorials-all-item-views" align="center">(.*?)<br />Views</span></div>');
                var views = match[1];
                views = views.replace(/,/g, ' ');

                match = entry.match('class="tutorials-all-item-comments">(.*?)</a></div>');
                var comments = match[1];

                match = entry.match('style="background:url((.*?))">');
                var thumbnail = match[1];
                thumbnail = thumbnail.slice(1, thumbnail.length - 1);

                var item = {
                    url: url,
                    title: title,
                    duration: duration,
                    views: views,
                    comments: comments,
                    icon: thumbnail,
                    views_count: parseInt(views.replace(/ /g, '')),
                    duration_count: getDuration(duration),
                    comments_count: parseInt(comments.replace(/,/g, ''))
                };

                entries.push(item);
            }
        }

        return entries;
    }

    function getPresets(link) {
        var data = showtime.httpGet(link).toString();
        var init = data.indexOf('<div class="main-content-container"><div style="padding:10px">');
        var end = data.indexOf('<div class="site-footer">', init);
        data = data.slice(init, end);
        var split = data.split('<div class="tutorials-new-item-container"');

        var entries = [];

        for (var i in split) {
            var entry = split[i];

            var match = entry.match('<a href="(.*?)" class="newbluebutton"');
            if (match) {
                var url = match[1];

                match = entry.match('<div class="tutorials-new-item-title"><a href=".*">(.*?)</a></div>');
                var title = match[1];

                match = entry.match('class="tutorials-new-item-comments">(.*?)</a>');
                var comments = match[1];

                match = entry.match('style="background:url((.*?));">');
                var thumbnail = match[1];
                thumbnail = thumbnail.slice(1, thumbnail.length - 1);

                match = entry.match('<div class="tutorials-new-item-subtitle">(.*?)</div>');
                var description = match[1];

                match = entry.match('<div class="home-featured-new-icon">NEW!</div>');

                var item = {
                    url: url,
                    title: title,
                    comments: comments,
                    icon: thumbnail,
                    recent: (match) ? '1' : '0',
                    description: description,
                    comments_count: parseInt(comments)
                };

                entries.push(item);
            }
        }

        return entries;
    }

    function getBasicTraining(link) {
        var data = showtime.httpGet(link).toString();
        var init = data.indexOf('<div style="width:440px;border-bottom:solid 1px #666">&nbsp;</div>');
        var end = data.indexOf('<div style="clear:both;background:#232623;">', init);
        data = data.slice(init, end);
        data = data.replace(/\n/g, " ");
        var split = data.split('<div style="margin-bottom:15px">');

        var entries = [];

        for (var i in split) {
            var entry = split[i];

            var match = entry.match('<a href="(.*?)" target="_blank"><img src="(.*?)"');
            if (match) {
                var url = match[1];
                var thumbnail = match[2];

                match = entry.match('<div style="float:right;padding:35px 50px 0px 0px">(.*?)</div>');
                var duration = match[1];
                duration = duration.replace(/\s/g, "");

                match = url.match('tutorials/(.*?)/');
                var title = match[1];
                title = title.slice(0, title.indexOf('.') + 1) + ' ' + title.slice(title.indexOf('.') + 1);

                var item = {
                    url: url,
                    title: title,
                    icon: thumbnail,
                    duration: duration,
                    duration_count: getDuration(duration)
                };

                entries.push(item);
            }
        }

        return entries;
    }
  
    function getVideoList(link) {
        var videos_list = [];
        var url = unescape(link);
        if (url.indexOf('/basic/') == -1)
            url = url.replace('s/', '/');
        var data = showtime.httpGet(url).toString();

        if (url.indexOf('/basic/') != -1) {
            var match = data.match('<div class="tutorial_title">(.*?)</div>');
            var title = match[1];
        }
        else {
            var match = data.match('<div class="tutorial_title">(.*?)<b style=\'color:.*\'>(.*?)</b></div>');
            var title = match[1] + match[2];
        }

        var match = data.match("'file','(.*?)'");
        url = match[1];

        videos_list[0] = {
            url: url,
            title: title
        }
        return videos_list;
    }
  
    plugin.addURI(PREFIX + ":video:simple:(.*)", function(page, link) {
        try {
            var video_list = getVideoList(link);
            var video = video_list[0];
        }
        catch (err) {
            page.error(err);
            return;
        }
    
        page.loading = false;

        var videoParams = {
            title: video.title,
            sources: [{
                url: video.url
            }]
        }

        page.source = "videoparams:" + showtime.JSONEncode(videoParams);
        page.type = "video";
    });

    function parseSearch(data, type) {
        if (type == 'tutorials') {
            var init = data.indexOf('<div id="tutorials" class="search-section" style="margin-bottom:2px;">');
            var end = data.indexOf('<div id="presets" class="search-section" style="margin-bottom:2px;display:none">', init);
        }
        else /*(type == 'presets')*/ {
            var init = data.indexOf('<div id="presets" class="search-section" style="margin-bottom:2px;">');
            var end = data.indexOf('<style type="text/css">', init);
        }

        data = data.slice(init, end);
        var split = data.split('<div class="search-item-container"');

        var entries = [];

        for (var i in split) {
            var entry = split[i];

            var match = entry.match('<div class="search-item-title">(.*?)</div>');
            if (match) {
                var title = match[1];

                match = entry.match('url="(.*?)">');
                var url = match[1];

                match = entry.match('<div class="search-item-description">(.*?)</div>');
                var description = description;

                match = entry.match('style="background:url((.*?));');
                var thumbnail = match[1];
                thumbnail = thumbnail.slice(1, thumbnail.length - 1);

                var item = {
                    url: url,
                    title: title,
                    icon: thumbnail,
                    description: description
                };

                entries.push(item);
            }
        }

        return entries;
    }

    function pageController(page, loader) {
        page.contents = 'list';
        var offset = 1;
        function paginator() {
            var num = 0;
            while (1) {
                var doc = loader(offset + num);

                var entries = parseSearch(doc.data, doc.type);
                page.entries = entries.length;
                displayEntries(page, entries);

                page.loading = false;
                break;
            }
            offset += num;

            return false;
        }

        page.type = "directory";
        paginator();
        page.paginator = paginator;
    }

    plugin.addURI(PREFIX + ":start", startPage);

    plugin.addSearcher("Video Copilot - Tutorials", plugin.path + "logo.png",
    function (page, query) {
        try {
            pageController(page, function (offset) {
                return {
                    data: showtime.httpGet('http://www.videocopilot.net/search/?s=tutorials&q=' + query).toString(),
                    type: 'tutorials'
                }
            });
        }
        catch (err) {
            showtime.trace('Search Video Copilot - Tutorials: ' + err)
        }
    });

    plugin.addSearcher("Video Copilot - Presets", plugin.path + "logo.png",
    function (page, query) {
        try {
            pageController(page, function (offset) {
                return {
                    data: showtime.httpGet('http://www.videocopilot.net/search/?s=presets&q=' + query).toString(),
                    type: 'presets'
                }
            });
        }
        catch (err) {
            showtime.trace('Search Video Copilot - Tutorials: ' + err)
        }
    });

})(this);