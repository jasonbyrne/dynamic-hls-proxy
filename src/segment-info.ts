import { iSegment } from "./hls-parser-types";
import { Chunklist } from "./chunklist";

export class SegmentInfo {

    protected segment: iSegment;
    protected chunklist: Chunklist;

    constructor(chunklist: Chunklist, variant: iSegment) {
        this.chunklist = chunklist;
        this.segment = variant;
    }

    protected propertiesToCommaSeparated(properties: any[]): string {
        let out: string = '';
        for (let i: number = 0; i < properties.length; i++) {
            if (i > 0) {
                out += ',';
            }
            out += properties[i].join('=');
        }
        return out;
    }

    public toString(): string {
        let out: string = '';
        let duration: string;

        if (this.segment.programDateTime) {
            out += "#EXT-X-PROGRAM-DATE-TIME:" + this.segment.programDateTime.toISOString() + "\n";
        }
        if (this.segment.discontinuity) {
            out += "#EXT-X-DISCONTINUITY\n";
        }
        if (this.segment.duration % 1 === 0) {
            duration = this.segment.duration.toFixed(1);
        }
        else {
            duration = this.segment.duration.toString();
        }
        out += "#EXTINF:" + duration + ",\n";
        if (this.segment.byterange) {
            out += "#EXT-X-BYTERANGE:" + this.segment.byterange.length + "@" + this.segment.byterange.offset + "\n";
        }

        return out;
    }

}