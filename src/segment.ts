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

    constructor(chunklist: Chunklist, segment: iSegment) {
        this._segment = segment;
        this._segmentInfo = new SegmentInfo(chunklist, segment);
        this._chunklist = chunklist;
    }

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