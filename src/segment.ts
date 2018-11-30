import { iSegment } from "./hls-parser-types";
import { Chunklist } from "./chunklist";
import { SegmentInfo } from "./segment-info";

export class Segment {

    protected segment: iSegment;
    protected segmentInfo: SegmentInfo;
    protected chunklist: Chunklist;

    constructor(chunklist: Chunklist, segment: iSegment) {
        this.segment = segment;
        this.segmentInfo = new SegmentInfo(chunklist, segment);
        this.chunklist = chunklist;
    }

    public getMediaSequenceNumber(): number {
        return this.segment.mediaSequenceNumber;
    }

    public getDuration(): number {
        return this.segment.duration;
    }

    public toString(): string {
        let out: string = '';
        out += this.segmentInfo.toString();
        out += this.chunklist.getBaseUrl() + this.segment.uri + "\n";

        return out;
    }
}