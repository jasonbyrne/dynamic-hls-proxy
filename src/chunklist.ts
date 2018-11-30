import { iMediaPlaylist, iGenericPlaylist, iSegment } from "./hls-parser-types";
import { Segment } from "./segment";

const request = require('request');
const HLS = require('hls-parser'); 

export class Chunklist {

    protected m3u8: iMediaPlaylist;
    protected segments: Segment[] = [];
    protected baseUrl: string = '';

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
        let maxDuration = 0;
        let segmentLines: string[] = [];
        this.segments.forEach(function(segment: Segment) {
            if (firstMediaSequenceNumber === -1) {
                firstMediaSequenceNumber = segment.getMediaSequenceNumber();
            }
            if (segment.getDuration() > maxDuration) {
                maxDuration = segment.getDuration();
            }
            segmentLines.push(segment.toString().trim());
        });
        meta += "#EXT-X-TARGETDURATION:" + Math.ceil(maxDuration).toString() + "\n";
        meta += "#EXT-X-MEDIA-SEQUENCE:" + firstMediaSequenceNumber.toString() + "\n";
        if (this.m3u8.playlistType) {
            meta += "#EXT-X-PLAYLIST-TYPE:" + this.m3u8.playlistType + "\n";
        }
        meta += segmentLines.join("\n") + "\n";

        return meta + "#EXT-X-ENDLIST";
    }
}