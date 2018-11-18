import { iVariant } from "./hls-parser-types";

export class StreamInfo {

    protected variant: iVariant;

    constructor(variant: iVariant) {
        this.variant = variant;
    }

    public isIframeOnly(): boolean {
        return this.variant.isIFrameOnly;
    }

    public hasAudio(): boolean {
        let has: boolean = false;
        if (/mp4a/i.test(this.variant.codecs)) {
            has = true;
        }
        return has;
    }

    public hasVideo(): boolean {
        let has: boolean = false;
        if (/avc1/i.test(this.variant.codecs)) {
            has = true;
        }
        return has;
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
        let properties: any[] = [];
        if (this.variant.isIFrameOnly) {
            // #EXT-X-I-FRAME-STREAM-INF:BANDWIDTH=86000,URI="low/iframe.m3u8",PROGRAM-ID=1,CODECS="c1",RESOLUTION="1x1",VIDEO="1"
            this.variant.bandwidth && properties.push(['BANDWIDTH', this.variant.bandwidth]);
            this.variant.uri && properties.push(['URI', this.variant.uri]);
            this.variant.resolution && properties.push(['RESOLUTION', this.variant.resolution.width + 'x' + this.variant.resolution.height]);
            this.variant.codecs && properties.push(['CODECS', '"' + this.variant.codecs + '"']);
            out += "#EXT-X-I-FRAME-STREAM-INF:" + this.propertiesToCommaSeparated(properties) + "\n";
        }
        else {
            // #EXT-X-STREAM-INF:PROGRAM-ID=0,BANDWIDTH=1170400,CODECS="avc1",RESOLUTION=320x240,AUDIO="audio0",CLOSED-CAPTIONS=NONE,SUBTITLES="subtitles0"
            this.variant.bandwidth && properties.push(['BANDWIDTH', this.variant.bandwidth]);
            this.variant.codecs && properties.push(['CODECS', '"' + this.variant.codecs + '"']);
            this.variant.resolution && properties.push(['RESOLUTION', this.variant.resolution.width + 'x' + this.variant.resolution.height]);
            this.variant.audio.length && properties.push(['AUDIO', this.variant.audio[0].groupId]);
            this.variant.closedCaptions.length && properties.push(['CLOSED-CAPTIONS', this.variant.closedCaptions[0].groupId]);
            this.variant.subtitles.length && properties.push(['SUBTITLES', this.variant.subtitles[0].groupId]);
            out += "#EXT-X-STREAM-INF:" + this.propertiesToCommaSeparated(properties) + "\n";
        }
        return out;
    }

}