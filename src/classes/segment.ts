import { Chunklist } from "./chunklist";
import { SegmentInfo } from "./segment-info";
import * as HLS from "hls-parser";

export class Segment {
  protected _segment: HLS.types.Segment;
  protected _segmentInfo: SegmentInfo;
  protected _chunklist: Chunklist;

  public get segment(): HLS.types.Segment {
    return this._segment;
  }

  constructor(chunklist: Chunklist, segment: HLS.types.Segment) {
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
    const segment: HLS.types.Segment = JSON.parse(
      JSON.stringify(this._segment)
    );
    segment.discontinuity = discontinuity;
    return new Segment(this._chunklist, segment);
  }

  public toString(): string {
    let out: string = "";
    out += this._segmentInfo.toString();
    out += this._chunklist.baseUrl + this._segment.uri + "\n";
    return out;
  }
}
