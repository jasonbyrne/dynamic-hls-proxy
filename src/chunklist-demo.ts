import { Chunklist } from ".";

const chunklistUrl: string = 'http://stream-archive-input-test.s3.amazonaws.com/output/14ajhmZDE6Wi9ct9_qHDCWeukB15ssKO/720p_2034k_v4.m3u8';

Chunklist.loadFromUrl(chunklistUrl).then(function (chunklist: Chunklist) {
    chunklist
        .setBaseUrl("https://videos.flosports.net/")
        // .setTypeFilter(PlaylistTypeFilter.VideoAndAudio)
        // .sortByBandwidth(RenditionSortOrder.nonHdFirst);
    console.log(chunklist.toString());
})
