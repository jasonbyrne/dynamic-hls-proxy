import { iSegment, iByteRange } from "./hls-parser-types";
import { Chunklist } from "./chunklist";
import { SegmentInfo } from "./segment-info";
import { URL } from 'url';
import * as fs from 'fs';
import * as http from 'http';

export class Segment {

    protected _segment: iSegment;
    protected _segmentInfo: SegmentInfo;
    protected _chunklist: Chunklist;

    public get segment(): iSegment {
        return this._segment;
    }

    public get sequenceNumber(): number {
        return this.segment.mediaSequenceNumber;
    }

    public get path(): string {
        return new URL(this._segment.uri, this._chunklist.getBaseUrl()).pathname;
    }

    public get uri(): string {
        return new URL(this._segment.uri, this._chunklist.getBaseUrl()).href;
    }

    constructor(chunklist: Chunklist, segment: iSegment) {
        this._segment = segment;
        this._segmentInfo = new SegmentInfo(chunklist, segment);
        this._chunklist = chunklist;
    }

    public download = (localPath: string): Promise<string> => {
        return new Promise(async resolve => {
            const file = fs.createWriteStream(localPath);
            const headers: any = (() => {
                if (this.segment.byterange) {
                    const start: number = this.segment.byterange.offset;
                    const end: number = this.segment.byterange.offset + this.segment.byterange.length;
                    return {
                        Range: `bytes=${start}-${end}`
                    }
                }
                return {};
            })();
            http.get(this.uri, { headers: headers }, function (response) {
                response.pipe(file);
                resolve(localPath);
            });
        });
    };

    public getMediaSequenceNumber(): number {
        return this._segment.mediaSequenceNumber;
    }

    public getDuration(): number {
        return this._segment.duration;
    }

    public cloneWithDiscontinuity(discontinuity: boolean): Segment {
        const segment: iSegment = JSON.parse(JSON.stringify(this._segment));
        segment.discontinuity = discontinuity;
        return new Segment(this._chunklist, segment);
    }

    public toString(): string {
        let out: string = '';
        out += this._segmentInfo.toString();
        out += this._chunklist.getBaseUrl() + this._segment.uri + "\n";
        return out;
    }
}