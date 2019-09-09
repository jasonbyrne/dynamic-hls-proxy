import { Playlist, PlaylistTypeFilter, RenditionSortOrder, ChunklistPruneType, Chunklist } from ".";
import { URL } from 'url';

const playlistUrl: string = 'http://stream-archive-input-test.s3.amazonaws.com/output/14ajhmZDE6Wi9ct9_qHDCWeukB15ssKO/playlist.m3u8';

/*
Playlist.loadFromUrl(playlistUrl).then(function (playlist: Playlist) {
    playlist
        .setBaseUrl("https://videos.flosports.net/")
        .setTypeFilter(PlaylistTypeFilter.VideoAndAudio)
        .sortByBandwidth(RenditionSortOrder.nonHdFirst)
        .useDynamicChunklists(true)
        .setDynamicChunklistEndpoint('./chunklist')
        .setDynamicChunklistProperties({
            pruneType: ChunklistPruneType.preview,
            maxDuration: 18,
        });
    console.log(playlist.toString());
});
*/

Playlist.loadFromUrl(playlistUrl).then(function (playlist: Playlist) {
    playlist
        .setBaseUrl('https://videos.flosports.tv/')
        .setQueryStringParam('signature', '1234567')
        .setTypeFilter(PlaylistTypeFilter.VideoAndAudio)
        .sortByBandwidth(RenditionSortOrder.worstFirst);
    console.log(playlist.toString());
    console.log(playlist.getVideoRenditionUrl(0));
})
