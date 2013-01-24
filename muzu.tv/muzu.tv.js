/**
 * Muzu.tv plugin for showtime version 0.5  by facanferff (Fábio Canada / facanferff@hotmail.com)
 *
 *  Copyright (C) 2011 facanferff (Fábio Canada / facanferff@hotmail.com)
 *
 * 	ChangeLog:
 *	0.5:
 *	- Start work
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

    var PREFIX = 'muzu.tv';
    
    var muzu = new MuzuTv();

    var service = plugin.createService("Muzu.tv", PREFIX + ":start", "video", true,
	plugin.path + "logo.png");

    var settings = plugin.createSettings("Muzu.tv",
					  plugin.path + "logo.png",
					 "Muzu.TV: Music videos service.");

    settings.createBool("hq", "Enable HQ", true, function(v) {
      service.hq = v;
    });
    
    settings.createInt("entries", "Maximum number of entries per request (default: 150)", 150, 10, 1000, 10, '', function(v) {
        service.entries = v;
    }); 
    
    var media      = new Namespace("http://search.yahoo.com/mrss/");
    

function startPage(page) {
    page.appendItem(PREFIX + ':mode:'+ 'browse:none', 'directory', {title: 'Browse'})
    page.appendItem(PREFIX + ':mode:'+ 'chart:none:none', 'directory', {title: 'Chart'})
    page.appendItem(PREFIX + ':mode:'+ 'playlists:none', 'directory', {title: 'List Playlists'})
    
    page.type = "directory";
    page.contents = "items";
    page.loading = false;

    page.metadata.logo = plugin.path + "logo.png";
    page.metadata.title = "Muzu.TV - Home Page";
  }
  
  plugin.addURI(PREFIX + ":mode:browse:(.*)", function(page, genre) {
     page.contents = "items"; 
     page.metadata.logo = plugin.path + "logo.png";
     page.metadata.title = "Muzu.TV - Browse";
     if (genre != 'none')
         page.metadata.title = "Muzu.TV - Browse - " + genre;
      
     if (genre == 'none') {
         page.appendItem(PREFIX + ':mode:'+ 'browse:' + 'all', 'directory', {title: 'All'})
         for each(var g in muzu.__GENRES) {
            page.appendItem(PREFIX + ':mode:'+ 'browse:' + g[0], 'directory', {title: g[1]})
         }
     }
     else {
         video_pageController(page, function(offset) {	
                muzu.args_common['vd']= 0
                muzu.args_common['ob']= 'views'
                muzu.args_common['of']= offset
                if (genre != 'all')
                    muzu.args_common['g'] = genre
                return new XML(showtime.httpGet(muzu.__BASE_URL+"/api/browse", 
                    muzu.args_common).toString());
         }, 'browse');
     }
     
     page.type = "directory";
     page.loading = false;
  })
  
  plugin.addURI(PREFIX + ":mode:chart:(.*):(.*)", function(page, title, chart) {
     page.contents = "items";
     page.metadata.title = "Muzu.TV - Charts";
     if (chart == 'none') {
         for each(var g in muzu.__CHARTS) {
            page.appendItem(PREFIX + ':mode:'+ 'chart:' + escape(g[1]) + ':' + g[0], 'directory', {title: g[1]})
         }
     }
     else {
         video_pageController(page, function(offset) {
             muzu.args_common['l']= parseInt(page.entries)
             muzu.args_common['of']=offset
             return showtime.httpGet(muzu.__BASE_URL+"/browse/charts/chart/"+chart, 
                    muzu.args_common).toString();
         }, 'chart');
         page.metadata.title = "Muzu.TV - " + unescape(title);
     }
     
     page.type = "directory";
     page.loading = false;

     page.metadata.logo = plugin.path + "logo.png";
  })
  
  plugin.addURI(PREFIX + ":mode:playlists:(.*)", function(page, playlist) {
     page.contents = "items";
     video_pageController(page, function(offset) {
         muzu.args_common['l']= parseInt(page.entries)
         muzu.args_common['of']=offset
         muzu.args_common['ob']=playlist
         return showtime.httpGet(muzu.__BASE_URL+"/browse/loadPlaylistsByCategory", 
             muzu.args_common).toString();
     }, 'playlists');
     
     page.type = "directory";
     page.loading = false;

     page.metadata.logo = plugin.path + "logo.png";
     page.metadata.title = "Muzu.TV - Playlists";
  })
  
  plugin.addURI(PREFIX + ":mode:play:(.*):(.*):([0-9]*):([0-9]*)", function(page, type, title, id, network) {
     page.contents = "items";
     page.metadata.logo = plugin.path + "logo.png";
     page.metadata.title = "Muzu.TV - " + unescape(title);
     
     if (type == 'playlist') {
        showtime.trace('playlist: ' + id)
        video_pageController(page, function(offset) {	
                muzu.args_common['l']= parseInt(page.entries)
                muzu.args_common['vd']= 0
                muzu.args_common['of']= offset
                return new XML(showtime.httpGet(muzu.__BASE_URL+"/player/networkVideos/"+network, 
                    muzu.args_common).toString()).channels.channel;
         }, 'playlist');
     }
     
     page.type = "directory";
     page.loading = false;
  })
  
  
  
  
  plugin.addURI(PREFIX + ":video:stream:(.*):(.*)", function(page, title, play) {
    showtime.trace('play: ' + play)
    var hq = false;
    if (service.hq == '1') 
        hq = true
    else
        hq = false
    
    var stream_url = muzu.resolve_stream(play, hq)
      
    page.loading = false;    
    page.source = "videoparams:" + showtime.JSONEncode({      
        title: unescape(title), 
        sources: [{	
            url: unescape(stream_url)      
        }]    
    });    
    page.type = "video";
  });
  
  
  function video_pageController(page, loader, type) {
    var offset = 1;  
    page.entries = service.entries;
    function paginator() {      
        var num = 0;   
        while(1) {	
            var doc = loader(offset + num);
            var c = 0;
            if (type == 'browse') {
                if (doc.channel.title == 'Error') {
                    showtime.trace(doc.channel.item.description+'\nContact facanferff.', true, false)
                    page.appendItem('page:home',"directory", {
                        title: new showtime.RichText(doc.channel.item.description)
                    });
                    break;
                }
                
                for each (var v in doc.channel.item) {	
                    try {
                        page.appendItem(PREFIX + ':video:stream:' + escape(v.title) + ':' + v.guid.toString().replace('MUZU:',''),"video", {
                            title: new showtime.RichText(v.title),
                            icon: v.media::thumbnail[0].@url
                        });
                    
                        c++;
                    }
                    catch(err) {
                        showtime.print(err)
                    }
                }
            }
            else if (type == 'chart') {
                var website = doc;
                var begin = website.indexOf('<div id="chartContainer">');
                var end = website.indexOf('<div id="chartsRightCol">', begin);
                var nice = website.slice(begin, end);
                var split = nice.split('<div class="chartItemContent">');
                
                for each (v in split) {
                    var id = v.match('<a href=".+?/([0-9]+?)/">')
                    
                    if (id) {
                        var title = v.match('alt="(.+?)"')[1]
                        page.appendItem(PREFIX + ':video:stream:' + escape(title) + ':' + id[1],"video", {
                            title: new showtime.RichText(title),
                            icon: v.match('src="(.+?)"')[1]
                        });
                    }
                    c++
                }
            }
            else if (type == 'playlists') {
                var regex = new RegExp('data-id="([0-9]+?)" data-network-id="([0-9]+?)".+?title="(.+?)">\n.+?src="(.+?)"')
                split = doc.split('</li>')
                
                for each (v in split) {
                    var match = v.match(regex)
                    if (match) {
                        page.appendItem(PREFIX + ':mode:play:playlist:' + escape(match[3]) + ':' + match[1] + ':' + match[2],"video", {
                            title: new showtime.RichText(match[3]),
                            icon: match[4]
                        });
                        c++;
                    }
                }
            }
            else if (type == 'playlist') {
                for each (var video in doc.asset) {
                    page.appendItem(PREFIX + ':video:stream:' + escape(video.@title) + ':' + video.@id,"video", {
                            title: new showtime.RichText(video.@title),
                            icon: video.@thumbnailurl,
                            description: video.@description
                    });
                    c++;
                }
            }
            page.entries = c
            showtime.sleep(.1)
            page.loading = false;	
            num += c;
            if(c == 0 || num >= parseInt(page.entries))	  
                break;      
        }  
        // Reset arguments for HTTP requests
        muzu.reset_args();
        offset += num;
        return (offset <= parseInt(page.entries));
    }    
    
    page.type = "directory";
    paginator();  
    
    //page.paginator = paginator;
  }
  
  
function MuzuTv() {
    this.__BASE_URL = 'http://www.muzu.tv'
    this.__API_KEY = 'KyDzMJ9WZS'
    this.__GENRES = [['alternative', 'Alternative'],
                ['blues', 'Blues'],
                ['celtic', 'Celtic'],
                ['country', 'Country'],
                ['dance', 'Dance'],
                ['electronic', 'Electronic'],
                ['emo', 'Emo'],
                ['folk', 'Folk'],
                ['gospel', 'Gospel'],
                ['hardcore', 'Hardcore'],
                ['hiphop', 'Hiphop'],
                ['indie', 'Indie'],
                ['jazz', 'Jazz'],
                ['latin', 'Latin'],
                ['metal', 'Metal'],
                ['pop', 'Pop'],
                ['poppunk', 'Poppunk'],
                ['punk', 'Punk'],
                ['reggae', 'Reggae'],
                ['rock', 'Rock'],
                ['soul', 'Soul'],
                ['world', 'World'],
                ['other', 'Other']]
            
    this.__CHARTS = [[1, 'Official UK Singles Top 40'],
                [2, 'Official UK Rock Top 40'],
                [3, 'Official UK Independent Top 40'],
                [4, 'Official UK Dance Top 40'],
                [5, 'Official UK RnB Top 40']]
    
    this.resolve_stream = MuzuTv_resolve_stream;
    this.reset_args = MuzuTv_reset_args;
    this.reset_args();
                
    function MuzuTv_resolve_stream(asset_id, hq) {
        var resolved = false
        var vt = 1
        if (hq)
            vt = 2
        var xml = new XML(showtime.httpGet(this.__BASE_URL+'/player/playAsset', {'assetId': asset_id,
                                                   'videoType': vt}).toString());
        
        var s = xml.body.video.@src;
        if (s)
            resolved = unescape(s)
        return resolved
    }
    
    function MuzuTv_reset_args() {
        this.args_common = {
            'muzuid': this.__API_KEY
        }
    }
             
}


plugin.addSearcher("Muzu.TV - Videos", plugin.path + "logo.png",    
    function(page, query) { 
        try {
            video_pageController(page, function(offset) {	
                muzu.args_common['l']= parseInt(service.entries)
                muzu.args_common['vd']= 0
                muzu.args_common['of']= offset
                muzu.args_common['mySearch']=query
                return new XML(showtime.httpGet(muzu.__BASE_URL+"/api/search", 
                    muzu.args_common).toString());
            }, 'browse');
        }
        catch(err){
            showtime.trace('Search Muzu.TV - Videos: '+err)
        }
});
var artist = "Muzu.TV - Artist"
plugin.addSearcher(artist, plugin.path + "logo.png",    
    function(page, query) { 
        try {
            video_pageController(page, function() {
                muzu.args_common['l']= parseInt(page.entries)
                var doc = new XML(showtime.httpGet(muzu.__BASE_URL+"/api/artist/details/"+escape(query), 
                    muzu.args_common).toString());
                return doc;
            }, 'browse');
        }
        catch(err){
            showtime.trace('Search Muzu.TV - Jukebox: '+err)
        }
});
  
plugin.addURI(PREFIX+":start", startPage);
})(this);
