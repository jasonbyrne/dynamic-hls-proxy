import { iMediaPlaylist, iGenericPlaylist, iSegment } from "./hls-parser-types";
import { Segment } from "./segment";

const request = require('request');
const HLS = require('hls-parser'); 

export enum ChunklistPruneType {
    "noPrune",
    "pruneStart", // removes beginning segments
    "pruneEnd", // removes ending segments
    "pruneStartAndEnd", // removes beginning and ending segments equally, leaving a clip of the middle
    "preview" // stitches together non-continuous segments to create a preview clip
}

export class Chunklist {

    protected m3u8: iMediaPlaylist;
    protected segments: Segment[] = [];
    protected totalDuration: number = 0;
    protected baseUrl: string = '';
    protected pruneType: ChunklistPruneType = ChunklistPruneType.noPrune;
    protected maxDuration: number = -1;

    protected constructor(body: string) {
        let m3u8: iGenericPlaylist = HLS.parse(body);
        let chunklist: Chunklist = this;
        if (m3u8.isMasterPlaylist) {
            throw new Error("This m3u8 is a master playlist.");
        }
        this.m3u8 = <iMediaPlaylist> m3u8;
        this.m3u8.segments.forEach(function (iSegment: iSegment, index: number) {
            let segment: Segment = new Segment(chunklist, iSegment);
            chunklist.segments.push(segment);
            chunklist.totalDuration += segment.getDuration();
        });
    }

    static loadFromString(body: string): Chunklist {
        return new Chunklist(body);
    }

    static loadFromUrl(url: string): Promise<Chunklist> {
        return new Promise(function (resolve, reject) {
            request(url, function (err, response, body) {
                if (err) {
                    reject("Could not load url: " + err);
                }
                if (response.statusCode >= 200 && response.statusCode <= 299 && body) {
                    resolve(new Chunklist(body));
                }
                else {
                    reject("Unexpected http response: " + response.statusCode);
                }
            });
        });
    }

    public setPruneType(pruneType: ChunklistPruneType): Chunklist {
        this.pruneType = pruneType;
        return this;
    }

    public getPruneType(): ChunklistPruneType {
        return this.pruneType;
    }

    public setMaxDuration(maxDuration: number): Chunklist {
        this.maxDuration = maxDuration;
        return this;
    }

    public getMaxDuration(): number {
        return this.maxDuration;
    }

    public setBaseUrl(baseUrl: string): Chunklist {
        this.baseUrl = baseUrl;
        return this;
    }

    public getBaseUrl(): string {
        return this.baseUrl;
    }

    public toString(): string {
        let chunklist: Chunklist = this;
        let meta: string = "#EXTM3U\n";
        meta += "#EXT-X-VERSION: " + this.m3u8.version + "\n";

        let firstMediaSequenceNumber: number = -1;
        let highestDuration = 0;
        let segmentLines: string[] = [];
        this.getPrunedSegments().forEach(function(segment: Segment) {
            if (firstMediaSequenceNumber === -1) {
                firstMediaSequenceNumber = segment.getMediaSequenceNumber();
            }
            if (segment.getDuration() > highestDuration) {
                highestDuration = segment.getDuration();
            }
            segmentLines.push(segment.toString().trim());
        });
        meta += "#EXT-X-TARGETDURATION:" + Math.ceil(highestDuration).toString() + "\n";
        meta += "#EXT-X-MEDIA-SEQUENCE:" + firstMediaSequenceNumber.toString() + "\n";
        if (this.m3u8.playlistType) {
            meta += "#EXT-X-PLAYLIST-TYPE:" + this.m3u8.playlistType + "\n";
        }
        meta += segmentLines.join("\n") + "\n";

        return meta + "#EXT-X-ENDLIST";
    }

    protected getPrunedSegments(): Segment[] {
        const maxDuration: number = this.maxDuration;
        let skipStartLength: number = 0;

        if (this.maxDuration < 1 || this.totalDuration <= this.maxDuration) {
            return this.segments;
        }

        switch (this.pruneType) {
            case ChunklistPruneType.noPrune:
                return this.segments;
            case ChunklistPruneType.preview:
                return this.getPreviewSegments();
            case ChunklistPruneType.pruneStart:
                skipStartLength = this.totalDuration - this.maxDuration;
                break;
            case ChunklistPruneType.pruneStartAndEnd:
                skipStartLength = (this.totalDuration - this.maxDuration) / 2;
                break;
        }

        let segments: Segment[] = [];
        let totalStartSkipped: number = 0;
        let totalDuration: number = 0;
        this.segments.forEach(function(segment: Segment) {
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
        const maxDuration = this.maxDuration;
        const chunkDurationTarget: number = Math.ceil(this.maxDuration / 3);
        const skippedDurationTarget: number = Math.floor(this.totalDuration / 3);

        let segments: Segment[] = [];
        let totalDuration: number = 0;
        let chunkDuration: number = 0;
        let skippedDuration: number = 0;
        this.segments.forEach(function(segment: Segment) {
            if (totalDuration >= maxDuration) {
                return;
            }

            if (chunkDuration + skippedDuration >= skippedDurationTarget) {
                skippedDuration = 0;
                chunkDuration = 0;
            }

            if (chunkDuration < chunkDurationTarget) {
                if (totalDuration === 0 && chunkDuration === 0) {
                    segments.push(segment.cloneWithDiscontinuity(true));
                } else {
                    segments.push(segment);
                }
                chunkDuration += segment.getDuration();
            } else if (skippedDuration < skippedDurationTarget) {
                skippedDuration += segment.getDuration();
            }
        });

        return segments;
    }
}