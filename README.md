# dynamic-hls-proxy

Load a master HLS playlist (m3u8) and dynamically filter or re-sort it, or load an HLS chunklist and dynamically prune the segments

## Install and run it

To manually run a simple demo, clone the repository and then:

```bash
npm install
npm run build
npm run demo
npm run chunklist-demo
```

To include this in your existing project, install the npm module:

```bash
npm i dynamic-hls-proxy
```

## Example Usage

Once you have installed the npm module, here is how to get going:

```javascript
const { Playlist, PlaylistTypeFilter, RenditionSortOrder } = require('dynamic-hls-proxy');

const playlistUrl = 'http://stream-archive-input-test.s3.amazonaws.com/output/14ajhmZDE6Wi9ct9_qHDCWeukB15ssKO/playlist.m3u8';

Playlist.loadFromUrl(playlistUrl).then(function (playlist) {
    playlist
        .setTypeFilter(PlaylistTypeFilter.VideoOnly)
        .sortByBandwidth(RenditionSortOrder.worstFirst)
        .setLimit(1);
    console.log(playlist.toString());
});

```

## Documentation

### Playlist.loadFromString(m3u8: string)

This static constructor method will return a Playlist instance. Pass in a string of a master m3u8 playlist.

### Playlist.loadFromUrl(url: string)

This static constructor method will return a Playlist instance. Pass in a string of the url master m3u8 playlist. It will be called via a GET request and the response body loaded in as a string.

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

### setBaseUrl(baseUrl: string)

This will prepend a domain or path prefix to all URIs.

### Chunklist.loadFromString(m3u8: string)

This static constructor method will return a Chunklist instance. Pass in a string of an m3u8 chunklist.

### Chunklist.loadFromUrl(url: string)

This static constructor method will return a Chunklist instance. Pass in a string of the url for an m3u8 chunklist. It will be called via a GET request and the response body loaded in as a string.

### setMaxDuration(maxDuration?: number)

This sets the max duration of the clipped chunklist, but is only utilized if a prune type other than "noPrune" is set. The argument is optional. The default will be -1 and therefore no pruning will be done.

### setPruneType(pruneType?: ChunklistPruneType)

This sets how the segments will be pruned, if a max duration is set. The argument is optional. The default will not prune.

 - noPrune = Don't prune the segments at all
 - pruneStart = Prune away (remove) the beginning segments
 - pruneEnd = Prune away (remove) the ending segments
 - pruneStartAndEnd = Prune away (remove) the beginning and ending segments equally, leaving only the middle segments
 - preview = Chops the chunklist segments up in to thirds, and takes enough of each third to stitch together a preview clip

 ### setBaseUrl(baseUrl: string)

This will prepend a domain or path prefix to all segment URIs.