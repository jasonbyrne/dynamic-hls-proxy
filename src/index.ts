import { Playlist, PlaylistTypeFilter } from "./playlist";

const playlistUrl: string = 'http://stream-archive-input-test.s3.amazonaws.com/output/14ajhmZDE6Wi9ct9_qHDCWeukB15ssKO/playlist.m3u8';
const chunklistUrl: string = 'http://stream-archive-input-test.s3.amazonaws.com/output/14ajhmZDE6Wi9ct9_qHDCWeukB15ssKO/480p_1600k_v4.m3u8';

Playlist.loadFromUrl(playlistUrl).then(function (playlist: Playlist) {
    playlist.setTypeFilter(PlaylistTypeFilter.VideoOnly);
    console.log(playlist.toString());
})
