This is a plugin supporting Youtube for Showtime. The idea of the plugin is to allow users to do anything they can do with Youtube official website.

### TODO:
- Add: User actions (Remove favorite, Update video information)
- Add: News section
- Add: Charts for category
- Add: Charts for date
- Add: Bypass age limit for authenticated users
- Enhancement: Use id tag to identify content

## Changelog:
### 2.2:
- Add: Support for Live Streaming videos using HLS
- Add: Show videos that authenticated user liked
- Add: Authentication for API v3
- Enhancement: Improved User Profile (WIP)
- Enhancement: Started work to upgrade plugin from API v2 to v3

### 2.0.4:
- Fix: After an upgrade, the plugin would fail sometimes to boot up

### 2.0.3:
- Fix: Error messages would not be parsed correctly

### 2.0.2:
- Fix: Video playback became broken (thanks alexandrezia)

### 2.0.1:
- Fix: The plugin didn't work under MAC OS X

### 2.0:
- Add: Support for Continuous Playback (needs to activate setting in Showtime's Video Playback Settings)
- Add: Main Page now supports order customization (like Showtime Main Page)
- Add: Youtube Disco
- Add: Native Sorting (by Publish Date, by Views, by Title (incrementing/decrementing) and as Default)
- Add: Youtube EDU
- Add: Featured feed in Youtube Movies
- Add: New User Profile Interface/Experience
- Add: New Advanced Mode for videos
- Add: Choose what feeds to show in User Profile
- Add: Header buttons in Oceanus skin plugin
- Add: Item Menu:
-- Like/Dislike video
-- Comment video
-- Add to Favorites
-- Add to Watch Later
-- Related Videos
-- Response Videos
-- Redirect to Movie (if video is a known trailer)
-- Trailers (if video is a movie)
-- Redirect to a Show (if video belongs to a Show)
-- Redirect to the Show Season (if video belongs to a Show Season)
- Fix: Video Playback
- Fix: Some videos would fail due to some RegEx differences
- Fix: Videos that are no available don't show friendly error message
- Fix: The plugin would load additional pages of a feed that didn't contain entries
- Fix: User Favorites didn't work
- Improvement: Updated video metadata for support in Oceanus skin plugin
- Improvement: More flexibe Youtube Search
- Improvement: Don't show login popup in search

### 1.5:
- Add: Support for OAuth2 instead of ClientLogin (see Note 1)
- Add: Videos not available in user country are displayed in Orange
- Add: Videos that are available in HD (720p and up) are identified like that in video listing
- Add: Setting to list only videos that are HD
- Add: Filter videos by duration (see Note 2)
- Add: Show nickname of author of a video in video listing
- Add: Show Likes percentage in video listing
- Add: Youtube Transcribed Captions
- Add: Youtube Automatic Speech Captions
- Fix: Videos in HD/Full HD would give an error stating "CPU is too slow"
- Fix: The plugin would try to get empty subtitles from Universal Subtitles
- Fix: In some situations user actions would not appear despite being authenticated
- Fix: Search was broken when background support was enabled
- Fix: Playlist search would not show results
- Fix: Browse Videos would give error
- Fix: Force Reload Plugin (Shift+F5) would give several errors
- Enhancement: Don't download some Cat files from Youtube for returning visitors
- Enhancement: Logo improved (thanks opium2k)

Note 1:
- In April of 2012, Youtube deprecated the ClientLogin way to authenticate way, due to that this version includes the newest authentication method, 
it totally different but works really well. A tutorial showing how to authenticate will be released next to the plugin release, it will feature 
screenshots that will help you understand the process.
- This method uses a computer with Internet connection to authorize the plugin, because of that, you don't need a keyboard to type anything in Showtime to login.
- Additionaly, OAuth2 provides extra security since it doesn't save the actual credentials in HDD, only an access_token (temporary) and a refresh_token 
(to get a new access_token), no passwords involved.

Note 2:
- This feature is only support in search feeds, including Standard Feeds and Search Videos, in other feeds will not filter

### 1.4:
- Add: Show Feeds
- Add: Sort feeds (published, relevance, views, rating, position, comments, duration and title)
- Add: Filter Channel Feeds by Type
- Add: Filter Show Feeds by Genre
- Add: Filter Show Feeds by Region
- Add: Filter Movie Feeds by Genre
- Add: Filter Movie Feeds by Region
- Add: Filter Standard Feeds by Hungary region
- Add: Live Feeds (see Note 3)
- Add: Background support (can be enabled via Settings page)
- Add: Set minimum resolution to play
- Add: Filter Movie Feeds by Language
- Enhancement: Only show free content in Movie Feeds
- Enhancement: If it is not possible to get the original video link(s), try to get an error message
- Enhancement: Use API version 2.1, it allows Google users that don't have a Youtube channel to use some features of Youtube
- Enhancement: Upon Youtube entrance show Login popup if setting enabled, if user does not authenticate there he will not have access to features exclusive for Youtube users

### 1.3:
- Add: Filter Standard Feed by category (in Settings page)
- Add: Filter Standard Feed by region (in Settings page)
- Add: Support for Watch History playlist in Advanced Mode
- Add: Filter for Video format (All formats, MP4, WebM or FLV) in Advanced Mode
- Add: Set maximum resolution to play
- Enhancement: Use default Showtime's error page instead of messages
- Enhancement: Item listing show more information now (title, duration, views count, favorites count and when it was published / updated)
- Enhancement: Full support for Safe Search
- Enhancement: Use images on internet for folders
- Fix: Universal Subtitles support was not working since a minor layout change of the website



## Features currently supported:
- Login to Youtube
- Standard feeds (complete)
- Channel feeds (complete)
- Movie Feeds (not supporting yet paid content)
- Trailer Feeds (complete)
- User Feeds (Favorites, New subscriptions, Contacts, Watch History, etc.)
- Getting Video Information
- Every resolution supported (240p, 360p, 480p, 720p, 1080p)
- Search videos (see Note 1)
- Pagination (Powerful and fast!)
- Recommendations
- Get information about user
- Search for User Profile (see Note 2)
- Related videos (if Advanced Youtube is enabled)
- Response videos (if Advanced Youtube is enabled)
- Flexible Safe Search
- Limit entries per request (to avoid for a bigger time memory fullness)
- Filter videos (format and resolution)
- User Actions (Like/Dislike video, Comment video, add Favorite, add Contact, add subscription (User and Channel))
- Subtitles (powered by Universal Subtitles)
- Others... (see Changelog)

##Notes
### Note:
To search for content (videos, playlists or channels), use the Search available in Showtime's homepage.

### Note 2:
To search for a specific user to see its profile, use the Search available in Showtime writing
youtube:user:<username>, where <username> is the nickname used by that user to be identified by others.

### Note 3:
At the moment, Showtime can't play HTTP Live Streams like the ones that Youtube uses, but you can view the videos that were live streams and were processed. 
Currently Live Streams despite being shown there, they will give you error 400 while Showtime can't support these links.