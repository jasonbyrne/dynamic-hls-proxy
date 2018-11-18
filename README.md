# dynamic-hls-proxy

Load a master HLS playlist (m3u8) and dynamically filter or re-sort it

## Install and run it

To run it:

```bash
npm install
tsc
node dist/index.js
```

## Documentation

Example usage:

```javascript
import { Playlist, PlaylistTypeFilter } from "./playlist";

const playlistUrl: string = 'http://stream-archive-input-test.s3.amazonaws.com/output/14ajhmZDE6Wi9ct9_qHDCWeukB15ssKO/playlist.m3u8';

Playlist.loadFromUrl(playlistUrl).then(function (playlist: Playlist) {
    playlist
        .setTypeFilter(PlaylistTypeFilter.VideoOnly)
        .sortByBandwidth(RenditionSortOrder.worstFirst)
        .setLimit(1);
    console.log(playlist.toString());
})
```

### setFilterType(type: PlaylistTypeFilter)

Use this to filter the playlist for what types of content you want it to include.

 - VideoOnly
 - AudioOnly
 - VideoAndAudio

### sortByBandwidth(order?: RenditionSortOrder)

This sorts the output by bandwidth. The argument is optional. The default will sort best first.

 - bestFirst = Order the highest bitrate renditions first
 - worstFirst = Order the lowest bitrate renditions first
 - middleFirst = Put the middle rendition first and then order highest-to-lowest
 - secondFirst = Put the second rendition first and then order highest-to-lowest
 - nonHdFirst = Put the first non-HD (< 720p) rendition first and then order highest-to-lowest

### setLimit(n: number)

This allows you to only return a certain number of renditions on the list.

For example, if you only wanted to return the lowest bitrate, sort worstFirst and set this to 1.

