/**
 * Channel 9 plugin for showtime version 1.3  by facanferff (Fabio Canada / facanferff@hotmail.com)
 *
 *  Copyright (C) 2011 facanferff (Fabio Canada / facanferff@hotmail.com)
 *
 * 	ChangeLog:
 *      1.3:
 *      - Add: Bookmarks
 *      - Enhancement: Allow user to choose format of video/audio
 *      - Add: Search for Shows, Series, Blogs and Events
 *      - Add: Video page
 *      - Enhancement: New logo (thanks GPatel)
 *      - Add: Sort Section
 *      - Add: Current Events
 *      - Fix: Tags feed (broke due to the new layout of channel9 for tags)
 *      - Add: What's New feed
 *
 * 	1.2:
 * 	- Fix entire Channel9
 * 	- Paginator from Showtime
 * 	- Sort by in feeds
 * 	
 *	1.1:
 *	- Adapted to the new API
 *
 * 	1.0:
 * 	- Added all Events
 * 	- Added all Blogs
 * 	- Added all Tags
 * 	- Added all Authors
 * 	- Added check for sections with no videos
 * 	- Minor cleanup
 * 	- Minor fixes
 * 	
 * 	0.4:
 * 	- Events: MIX, PDC and TechEd (all videos)
 * 	- Added check for empty videos (if found remove the item)
 * 	- Remove empty item in page index
 * 	
 * 	0.3:
 * 	- Code Cleanup
 * 	- Fix additional page empty
 * 	- When no image found use a default one
 * 	- If HD video not found get SD video
 * 	- Corrected plugin's description
 * 	- Fix wrong logo obtaining from XML
 * 	- Fix wrong hd videos links obtained
 * 	- Removed Debug information
 * 	
 * 	0.2:
 * 	- All Shows
 * 	- All Series
 * 	- URL fixing
 * 	- Added Pagination
 * 	- Changed logo
 * 	
 * 	0.1:
 * 	- Silverlight TV
 * 	- HD support
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
        var headers = {
            "Accept-Encoding" : "sdch",
            'User-Agent' : 'Mozilla/5.0 (Windows; U; MSIE 9.0; WIndows NT 9.0; en-US))'
        }
    
	//settings 

	var service = plugin.createService("Channel 9", "channel9:start", "tv", true,
		plugin.path + "logo.png");
  
	var settings = plugin.createSettings("Channel 9",
		plugin.path + "logo.png",
		"Channel 9: Videos for programmers from Microsoft.");

	settings.createInfo("info",
		plugin.path + "logo.png",
		"Channel 9.\n\n"+
		"Plugin developed by facanferff \n\n"+
		"(Fabio Canada / facanferff@hotmail.com)\n\n"+
		"GITHUB: http://github.com/facanferff");
            
        //store
        var bookmarks = plugin.createStore('bookmarks', true);
  
	var itunes     = new Namespace("http://www.itunes.com/dtds/podcast-1.0.dtd");
	var media      = new Namespace("http://search.yahoo.com/mrss/");
	var c9         = new Namespace("http://channel9.msdn.com");

function startPage(page) { 
	page.loading = false;

        page.appendItem('channel9:feed:' + 'Feeds' + ':recent',"directory", {title: "What's new"});
	
	page.appendItem('channel9:type:' + 'Browse/Shows' + ':1:recent',"directory", {title: "Shows"});
	
	page.appendItem('channel9:type:' + 'Browse/Series' + ':1:recent',"directory", {title: "Series"});
	
	page.appendItem('channel9:type:' + 'Browse/Blogs' + ':1:recent',"directory", {title: "Blogs"});
	
	page.appendItem('channel9:tags:none:1',"directory", {title: "Tags"});
	
	page.appendItem('channel9:authors',"directory", {title: "Authors"});
	
	page.appendItem('channel9:type:' + 'Browse/Events' + ':1:none',"directory", {title: "Events"});
        
        page.appendItem('channel9:bookmarks',"directory", {title: "Bookmarks"});
	
	page.type = "directory";
	page.contents = "items";
	page.loading = false;

	page.metadata.logo = plugin.path + "logo.png";
	
	page.metadata.title = "Channel 9";
  }
  
  plugin.addURI("channel9:tags:(.*):([0-9]*)", function(page, letter, actual_page) {
      if (letter == "none") {
          for each (var letter_tmp in "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""))
              page.appendItem('channel9:tags:' + letter_tmp + ':1',"directory", {title: letter_tmp});
      }
      else {
          var count = 0;
          var website = showtime.httpGet("http://channel9.msdn.com/Browse/Tags/FirstLetter/" + letter, null, headers).toString();
          var begin = website.indexOf('<ul class="tagList default">');
          var end = website.indexOf('</ul>', begin);
          var nice = website.slice(begin, end);
          var split = nice.split('<li>');
            
          for each (var tag in split) {
              // Getting url for tag
              var url = getValue(tag, '<a href="/', '">');
              if (url && url.slice(0, 4) == "Tags")
	         page.appendItem('channel9:feed:' + url+':recent',"directory", {title: getValue(tag, '">', '</a>')});
              count++;
          }
      }
        
      page.type = "directory";
      page.loading = false;

      page.metadata.logo = plugin.path + "logo.png";
	
      page.metadata.title = 'Tags';
});

plugin.addURI("channel9:authors", function(page) {
	page.loading = true;
	
	var website = showtime.httpGet("http://channel9.msdn.com/Browse/Authors", null, headers).toString();
	var begin = website.indexOf('<ul class="authors">');
	var end = website.indexOf('</ul>', begin);
	var nice = website.slice(begin, end + 5);
	var split = nice.split('</li>');
	
	for each (var author in split) {
		// Getting url for show
		var url = getValue(author, '<a class="button" href="', '">');
		
		var icon_final = escape(getValue(author, 'src="', '" title="'));
		if (!showtime.canHandle(icon_final))
			icon_final = icon_final = 'http://channel9.msdn.com/styles/images/defaults/c9-220x165b.png';
		 
		   if (url.toString().length != 0)
				page.appendItem('channel9:feed:' + url +':recent',"directory", {title: getValue(author, '<span class="name">', '</span>'), icon: icon_final});
		}
		
	page.type = "directory";
	page.contents = "items";
	page.loading = false;

	page.metadata.logo = plugin.path + "logo.png";
	
	page.metadata.title = 'Authors';
});

plugin.addURI("channel9:type:(.*):(.*):(.*)", function(page, type, actual_page, sorting) {
    page.type = "directory";
    page.contents = "items";
    
    if (sorting == 'none') {
        if (type.indexOf("Shows") != -1 || type.indexOf("Series") || type.indexOf("Blogs") || type.indexOf("Events") != -1) {
            page.appendItem('channel9:type:' + type + ':1:atoz',"directory", {title : 'A-Z'});
            page.appendItem('channel9:type:' + type + ':1:recent',"directory", {title : 'Past'});
        }
        if (type.indexOf("Events") != -1)
            page.appendItem('channel9:type:' + type + ':1:current',"directory", {title : 'Current'});
        
        page.loading = false;
        return;
    }
    
    if (type.indexOf("Shows") != -1 || type.indexOf("Series") || type.indexOf("Blogs"))
        page.appendItem('channel9:type:' + type + ':1:none',"directory", {title : 'Sort'});

    var sort = sorting;
    
	var count = 0;
	
	var current_page = actual_page;
	var website = showtime.httpGet("http://channel9.msdn.com/" + type, {
		'page':current_page,
		'sort':sort
	}, headers).toString();
	
	var begin = website.indexOf('<ul class="entries">');
	if (type.indexOf("Events/") != -1)
		begin = website.indexOf('<ul class="entries recentEvents">');
	var end = website.indexOf('</ul>', begin);
	var nice = website.slice(begin, end + 5);
	var split = nice.split('</li>');
	
	for each (var episode in split) {
		// Getting url for show
		var url;
		if (type.indexOf("Events") == -1) {
			url = getValue(episode, '<a href="\/', '">');
		}
		if (type.indexOf("Events") != -1)
			url = getValue(episode, '<a href="\/Events\/', '" class="title">');
		
		var icon_final = getValue(episode, 'src="', '" alt=');
		if (icon_final == "/styles/images/defaults/c9-220x165b.png")
			icon_final = 'http://channel9.msdn.com/styles/images/defaults/c9-220x165b.png';
		 
	   var metadata = {
		title: getValue(episode, '" alt="', '"'),
		description: getValue(episode, '<div class="description"> ', '</div>'),
		icon: icon_final
	   };
		   if (url)
			if (type.toString().indexOf("Events") != -1)
				page.appendItem('channel9:feed:Events/' + url+':recent',"directory", metadata);
			else
				page.appendItem('channel9:feed:' + url+':recent',"directory", metadata);
			count++;
		}
		
	page.loading = false;

	page.metadata.logo = plugin.path + "logo.png";
	
	page.metadata.title = getValue(website, '<title>', '</title>');
	
	if (website.indexOf('<li class="next">') != -1)
	{
		page.appendItem('channel9:type:' + type + ':' + (parseInt(current_page)+1) + ":" + sorting,"directory", {title: "Next page"});
	}

});

function feed_pageController(page, loader, type) {
	page.loading = true;
	var offset = 1;    
	function paginator() { 
		while(1) {	
			var doc = loader(offset);
			page.entries = doc.channel.c9::totalResults;
			var c = 0;
					for each(var video in doc.channel.item)
					{   
						var image = null;
						if (!video.media::thumbnail[1])
							image = "http://channel9.msdn.com/styles/images/defaults/c9-220x165.png";
						else
							image = video.media::thumbnail[1].@url;
		
						var metadata = {
							title: video.title,
							description: video.itunes::summary,
							icon: image
						};
			
					if (showtime.canHandle(video.guid))
						page.appendItem("channel9:video:advanced:"+escape(video.title)+":"+escape(video.guid),"video", metadata);
					}
			page.loading = false;
			if(c == 0 || offset > doc.channel.c9::pageSize)	  
				break;      
		}
		if (offset < doc.channel.c9::pageCount)
			offset += 1;
		showtime.sleep(.1)
		return offset < doc.channel.c9::pageCount;    
	}    
	
	page.type = "directory";
	paginator();    
	page.paginator = paginator;
  }

plugin.addURI("channel9:feed:(.*):(.*)", function(page, url, sort) {
   page.type = "directory";
	page.contents = "contents";
	page.loading = false;

	var url_feed = "http://channel9.msdn.com/" + url + "/RSS/";

	page.appendItem("channel9:sort:"+url, 'directory', {title: 'Sort by...'})
	feed_pageController(page, function(offset) {
		var doc = new XML(showtime.httpGet(url_feed, {
			'page':offset,
			'sort':sort
		}, headers).toString());

		 page.metadata.logo = doc.channel.image.url;
		 page.metadata.title = doc.channel.title;
		 return doc;
	}, url.slice(0, url.indexOf('/')));
});

plugin.addURI("channel9:sort:(.*)", function(page, url) {
   page.type = "directory";
	page.contents = "contents";
	page.loading = false;

	page.appendItem('channel9:feed:'+url+':'+'recent',"directory", {title: "Recent"});
	page.appendItem('channel9:feed:'+url+':'+'viewed',"directory", {title: "Most Viewed"});
	page.appendItem('channel9:feed:'+url+':'+'rating',"directory", {title: "Top Rated"});
});

plugin.addURI("channel9:video:advanced:(.*):(.*)", function(page, title, link) {
    title = unescape(title);
    link = unescape(link);
    
    var data = showtime.httpGet(link, null, headers).toString();
    
    page.metadata.title = title;
    var logo = data.slice(data.indexOf('<link rel="image_src" href="')+28, data.indexOf('"/>', data.indexOf('<link rel="image_src" href="')))
    page.metadata.icon = logo;
    
    var begin = data.indexOf('<ul class="download">');
    var end = data.indexOf('</ul>', begin);
    var nice = data.slice(begin, end);
    var split = nice.split('</li>');
        
    for each (var video in split) {
        var video_url = video.match('<a href="(.*)">(.*)</a>');
        
        if(video_url) {
            page.appendAction("navopen", video_url[1], true, {      
                title: video_url[2]    
            });
        }
    }
    
    //bookmarks		
    if(!bookmarked(link)){
        page.appendAction("pageevent", "bookmark", true,{ title: "Bookmark" });
    }
    else{		
        page.appendAction("pageevent", "bookmark_remove", true,{ title: "Remove Bookmark" });
    }
    
    page.onEvent('bookmark', function(){ 
        if(!bookmarked(link)){
            bookmark(title, logo, link)
            showtime.trace('Bookmarked: '+ title);
        }else
            showtime.trace('Already Bookmarked: '+ title);
    });

    page.onEvent('bookmark_remove', function(){ 
        if(!bookmarked(link)){
            showtime.trace(title +' Not bookmarked ');
        }else{
            showtime.trace(title + ' bookmark removed');
            bookmark_remove(title, logo, link);
        }
    });
    
    var description = data.slice(data.indexOf('<meta name="description" content="')+34, data.indexOf('"/>', data.indexOf('<meta name="description" content="')))
    page.appendPassiveItem("bodytext", new showtime.RichText(description));
    
    page.metadata.logo = plugin.path + "logo.png";
    page.type = "item";
    page.loading = false;
  });

function getValue(url, start_string, end_string)
{
	var begin_temp = url.indexOf(start_string) + start_string.toString().length;
	var end_temp = url.indexOf(end_string, begin_temp);
		
	var string = url.slice(begin_temp, end_temp);
	return unescape(string);
}


//bookmarks

plugin.addURI("channel9:bookmarks", function(page) {
	page.type = "directory";
	page.contents = "video";
	page.metadata.logo = plugin.path + "logo.png";
	page.metadata.title = 'Channel9 - Bookmarks';

	if(bookmarks.videos){	
		var split = bookmarks.videos.split('\n');
		for each (var video in split){
			if(video.indexOf('\t') != -1)
				page.appendItem('channel9:video:advanced:'+ escape(video.slice(0, video.indexOf('\t'))) + ":" + escape(video.slice(video.lastIndexOf('\t')+1)), "video", { 
                                    title: video.slice(0, video.indexOf('\t')),
                                    icon: video.slice(video.indexOf('\t')+1, video.lastIndexOf('\t'))
                                });
			}
		}
		
	page.loading = false;	
});

function bookmark(title, logo, url){
	
	if(bookmarked(title, url))
		return;

	if(!bookmarks.videos)
		bookmarks.videos = '';
		
	bookmarks.videos = bookmarks.videos + title + "\t" + logo + "\t" + url + "\n";
}

function bookmark_remove(title, logo, url){
	
	if(!bookmarked(title, url))
		return;
	
	bookmarks.videos = bookmarks.videos.replace(title + "\t" + logo + "\t" + url + "\n", '');
}
function bookmarked(url){
	if(bookmarks.videos && bookmarks.videos.indexOf(url) !=-1){
		return true;
	}else{ return false; }

}

plugin.addURI("channel9:start", startPage);

function searchController(page, loader) {
    page.loading = true;
    var offset = 1; 
    var c = 0;
    function paginator() { 
        while(1) {	
            var doc = loader(offset).toString();
            showtime.trace("offset: " + offset)
            var begin = doc.indexOf('<div class="results">');
            var end = doc.indexOf('</ul>', begin);
            var nice = doc.slice(begin, end);
            var split = nice.split('</li>');
            
            for each (var video in split) {
                var video_url = video.match('<a href="(.*)">(.*)</a>')
                var logo_url = video.match('<img alt=".*" src="(.*)" title')
                
                if (video_url) {
                    var metadata = {
                        'title' : video_url[2]
                    }
                    if (logo_url)
                        metadata.icon = logo_url[1]
                    
                    page.appendItem("channel9:video:advanced:"+escape(video_url[2])+":"+escape(video_url[1]),"video", metadata);
                    c++;
                }
            }
            showtime.trace('items: ' + c)
            page.entries = c;
            break;
	}  
        if (doc.indexOf('<li class="next">') != -1) {
            offset++;
            return true;
        }
        else
            return false;
    }
    
    page.type = "directory";
    paginator();
    page.paginator = paginator;
}

plugin.addSearcher("Channel9 - Blog Posts", plugin.path + "logo.png",    
    function(page, query) { 
        searchController(page, function(offset) {
            return showtime.httpGet("http://channel9.msdn.com/search", {
                'term' : query,
                'type' : 'Blogs',
                'page' : offset
            }, headers);
        });
});

plugin.addSearcher("Channel9 - Show Episodes", plugin.path + "logo.png",    
    function(page, query) { 
        searchController(page, function(offset) {
            return showtime.httpGet("http://channel9.msdn.com/search", {
                'term' : query,
                'type' : 'Shows',
                'page' : offset
            }, headers);
        });
});

plugin.addSearcher("Channel9 - Series Posts", plugin.path + "logo.png",    
    function(page, query) { 
        searchController(page, function(offset) {
            return showtime.httpGet("http://channel9.msdn.com/search", {
                'term' : query,
                'type' : 'Series',
                'page' : offset
            }, headers);
        });
});

plugin.addSearcher("Channel9 - Event Sessions", plugin.path + "logo.png",    
    function(page, query) { 
        searchController(page, function(offset) {
            return showtime.httpGet("http://channel9.msdn.com/search", {
                'term' : query,
                'type' : 'Events',
                'page' : offset
            }, headers);
        });
});

})(this);
