/**
 * Khan Academy plugin for showtime version 1.0  by facanferff (Fábio Canada / facanferff@hotmail.com)
 *
 *  Copyright (C) 2011 facanferff (Fábio Canada / facanferff@hotmail.com)
 *
 * 	ChangeLog:
 *	1.0:
 *	- Playlist browser
 *	- Subtitles support
 * 
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

    var PREFIX = 'khanacademy';
    
    plugin.createService("Khan Academy", PREFIX + ":start", "video", true,
	plugin.path + "logo.png");
    

function startPage(page) { 
    var data = showtime.JSONDecode(showtime.httpGet('http://www.khanacademy.org/api/v1/playlists').toString());
    
    for each (var item in data) {
        page.appendItem(PREFIX + ':browse:' + escape(item.title), 'directory', {
            title: item.title,
            description: item.description
        })
    }
      
    page.metadata.title = 'Khan Academy - Browse';
    
    page.type = "directory";
    page.contents = "items";
    page.loading = false;

    page.metadata.logo = plugin.path + "logo.png";
    page.metadata.title = "Khan Academy - Home Page";
  }
  
  plugin.addURI(PREFIX + ":video:(.*):(.*)", function(page, section, id) {
    var video = showtime.JSONDecode(showtime.httpGet('http://www.khanacademy.org/api/v1/playlists/' + section + '/videos').toString())[id];
    page.source = "videoparams:" + showtime.JSONEncode({      
        title: unescape(video.title),     
        subtitles: getSubtitles(video.youtube_id),
        sources: [{	
            url: video.download_urls.mp4   
        }]    
    });
    
    page.loading = false;
    page.type = "video";
  });
  
  plugin.addURI(PREFIX + ":browse:(.*)", function(page, section) {
    page.type = "directory";
    page.contents = "list";
    var data = showtime.JSONDecode(showtime.httpGet('http://www.khanacademy.org/api/v1/playlists/' + section + '/videos').toString());
        
    var i = 0;
    for each (var item in data) {
        var params = {
            title: item.title,
            description: item.description
        }
        if (item.download_urls) {
            params.icon = item.download_urls.png
            page.appendItem(PREFIX + ':video:' + section + ':' + i, 'directory', params);
        }
        i++;
    }
      
    page.metadata.title = 'Khan Academy - Browse';
    page.loading = false;
  });
  
  function getSubtitles(video_id) {
    var args = 'video_url=' + escape('http://youtube.com/watch?v=' + video_id);
    var data = showtime.httpPost('http://www.universalsubtitles.org/en/videos/create/', args).toString();
    
    var begin = data.indexOf('<ul class="left_nav" id="subtitles-menu">');
    var end = data.indexOf('</ul>', begin);
    var nice = data.slice(begin, end);
    var split = nice.split('</li>');
    
    var subtitles = [];
        
    for each (var item in split) {
        var language = item.match('<a href="/en/videos/(.*)/(.*)/(.*)/">');
        if (!language) {
            language = item.match('<a href="/en/videos/(.*)/">');
            if (!language || item.indexOf('<span class="done_percentage">(0 Lines)</span>') != -1)
                continue;
            subtitles.push({
                url: 'http://www.universalsubtitles.org/widget/download_srt/?video_id=' + language[1],
                language: getValue(item, '<span class="done_indicator"></span>', '<span class="done_percentage">').replace(/\n/g, '').replace(/ /g, '')
            });
        }
        else {
            if (item.indexOf('<span class="done_percentage">(0 Lines)</span>') != -1)
                continue;
            subtitles.push({
                url: 'http://www.universalsubtitles.org/widget/download_srt/?video_id=' + language[1] + '&lang_pk=' + language[3],
                language: language[2]
            });
        }
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
  
plugin.addURI(PREFIX+":start", startPage);
})(this);
