import { Segment } from "./segment";
import * as HLS from "hls-parser";
import { Playlist } from "./playlist";

export enum ChunklistPruneType {
  "noPrune",
  "pruneStart", // removes beginning segments
  "pruneEnd", // removes ending segments
  "pruneStartAndEnd", // removes beginning and ending segments equally, leaving a clip of the middle
  "preview", // stitches together non-continuous segments to create a preview clip
}

export class Chunklist {
  protected _url: string | null = null;
  protected _m3u8: HLS.types.MediaPlaylist;
  protected _segments: Segment[] = [];
  protected _totalDuration: number = 0;
  protected _baseUrl: string = "";
  protected _pruneType: ChunklistPruneType = ChunklistPruneType.noPrune;
  protected _maxDuration: number = -1;

  public get m3u8(): HLS.types.MediaPlaylist {
    return this._m3u8;
  }

  public get segments(): Segment[] {
    return this._segments;
  }

  public get url(): string | null {
    return this._url;
  }

  public get pruneType(): ChunklistPruneType {
    return this._pruneType;
  }

  public get maxDuration(): number {
    return this._maxDuration;
  }

  public get baseUrl(): string {
    return this._baseUrl;
  }

  protected constructor(body: string) {
    let m3u8: HLS.types.Playlist = HLS.parse(body);
    if (m3u8.isMasterPlaylist) {
      throw "This m3u8 is a master playlist.";
    }
    this._m3u8 = <HLS.types.MediaPlaylist>m3u8;
    this._m3u8.segments.forEach((segment) => {
      this._segments.push(new Segment(this, segment));
      this._totalDuration += segment.duration;
    });
  }

  static loadFromString(body: string): Chunklist {
    return new Chunklist(body);
  }

  static loadFromUrl(url: string): Promise<Chunklist> {
    return new Promise(function (resolve, reject) {
      Playlist.fetch(url)
        .then((body: string) => {
          const chunklist = new Chunklist(body);
          chunklist._url = url;
          resolve(chunklist);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public setPruneType(pruneType: ChunklistPruneType): Chunklist {
    this._pruneType = pruneType;
    return this;
  }

  public setMaxDuration(maxDuration: number): Chunklist {
    this._maxDuration = maxDuration;
    return this;
  }

  public setBaseUrl(baseUrl: string): Chunklist {
    this._baseUrl = baseUrl;
    return this;
  }

  public toString(): string {
    let meta: string = "#EXTM3U\n";
    if (this._m3u8.version) {
      meta += "#EXT-X-VERSION: " + this._m3u8.version + "\n";
    }

    let firstMediaSequenceNumber: number = -1;
    let highestDuration = 0;
    let segmentLines: string[] = [];
    this.getPrunedSegments().forEach(function (segment: Segment) {
      if (firstMediaSequenceNumber === -1) {
        firstMediaSequenceNumber = segment.getMediaSequenceNumber();
      }
      if (segment.getDuration() > highestDuration) {
        highestDuration = segment.getDuration();
      }
      segmentLines.push(segment.toString().trim());
    });
    meta +=
      "#EXT-X-TARGETDURATION:" + Math.ceil(highestDuration).toString() + "\n";
    meta +=
      "#EXT-X-MEDIA-SEQUENCE:" + firstMediaSequenceNumber.toString() + "\n";
    if (this._m3u8.playlistType) {
      meta += "#EXT-X-PLAYLIST-TYPE:" + this._m3u8.playlistType + "\n";
    }
    meta += segmentLines.join("\n") + "\n";

    return meta + "#EXT-X-ENDLIST";
  }

  public getPrunedSegments(): Segment[] {
    const maxDuration: number = this._maxDuration;
    let skipStartLength: number = 0;

    if (this._maxDuration < 1 || this._totalDuration <= this._maxDuration) {
      return this._segments;
    }

    switch (this._pruneType) {
      case ChunklistPruneType.noPrune:
        return this._segments;
      case ChunklistPruneType.preview:
        return this.getPreviewSegments();
      case ChunklistPruneType.pruneStart:
        skipStartLength = this._totalDuration - this._maxDuration;
        break;
      case ChunklistPruneType.pruneStartAndEnd:
        skipStartLength = (this._totalDuration - this._maxDuration) / 2;
        break;
    }

    let segments: Segment[] = [];
    let totalStartSkipped: number = 0;
    let totalDuration: number = 0;
    this._segments.forEach(function (segment: Segment) {
      if (skipStartLength > totalStartSkipped) {
        totalStartSkipped += segment.getDuration();
        return;
      }
      if (totalDuration >= maxDuration) {
        return;
      }
      totalDuration += segment.getDuration();
      segments.push(segment);
    });

    return segments;
  }

  protected getPreviewSegments(): Segment[] {
    const maxDuration = this._maxDuration;
    const chunkDurationTarget: number = Math.floor(this._maxDuration / 3);
    const skippedDurationTarget: number = Math.floor(this._totalDuration / 3);

    let segments: Segment[] = [];
    let totalDuration: number = 0;
    let chunkDuration: number = 0;
    let skippedDuration: number = 0;
    this._segments.forEach(function (segment: Segment) {
      if (Math.ceil(totalDuration) >= maxDuration) {
        return;
      }

      if (Math.ceil(chunkDuration + skippedDuration) >= skippedDurationTarget) {
        skippedDuration = 0;
        chunkDuration = 0;
      }

      if (Math.ceil(chunkDuration) < chunkDurationTarget) {
        if (totalDuration > 0 && chunkDuration === 0) {
          segments.push(segment.cloneWithDiscontinuity(true));
        } else {
          segments.push(segment);
        }
        chunkDuration += segment.getDuration();
        totalDuration += segment.getDuration();
      } else if (Math.ceil(skippedDuration) < skippedDurationTarget) {
        skippedDuration += segment.getDuration();
      }
    });

    return segments;
  }
}
