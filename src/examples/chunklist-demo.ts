import { Chunklist, ChunklistPruneType } from "../index";

const chunklistUrl: string =
  "http://stream-archive-input-test.s3.amazonaws.com/output/14ajhmZDE6Wi9ct9_qHDCWeukB15ssKO/720p_2034k_v4.m3u8";

Chunklist.loadFromUrl(chunklistUrl).then(function (chunklist: Chunklist) {
  chunklist
    .setBaseUrl("https://videos.flosports.net/")
    .setPruneType(ChunklistPruneType.preview)
    .setMaxDuration(18);
  console.log(chunklist.toString());
});
