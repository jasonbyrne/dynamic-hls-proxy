import { Playlist, PlaylistTypeFilter, RenditionSortOrder } from ".";

const playlistUrl: string = 'http://stream-archive-input-test.s3.amazonaws.com/output/14ajhmZDE6Wi9ct9_qHDCWeukB15ssKO/playlist.m3u8';

Playlist.loadFromUrl(playlistUrl).then(function (playlist: Playlist) {
    playlist
        .setBaseUrl("https://videos.flosports.net/")
        .setTypeFilter(PlaylistTypeFilter.VideoAndAudio)
        .sortByBandwidth(RenditionSortOrder.nonHdFirst);
    console.log(playlist.toString());
})
