import { iVariant, iMediaTrack } from "./hls-parser-types";
import { Playlist } from "./playlist";
import { MediaTrack } from './media-track';

export class StreamInfo {

    protected variant: iVariant;
    protected playlist: Playlist;

    constructor(playlist: Playlist, variant: iVariant) {
        this.playlist = playlist;
        this.variant = variant;
    }

    public getTracks(): MediaTrack[] {
        const me: StreamInfo = this;
        let out: MediaTrack[] = [];
        this.variant.audio.forEach((track: iMediaTrack) => {
            out.push(new MediaTrack(me.playlist, track));
        })
        return out;
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
        if (this.variant.bandwidth) {
            properties.push(['BANDWIDTH', this.variant.bandwidth]);
        }
        if (this.variant.resolution) {
            properties.push(['RESOLUTION', this.variant.resolution.width + 'x' + this.variant.resolution.height]);
        }
        if (this.variant.codecs) {
            properties.push(['CODECS', '"' + this.variant.codecs + '"']);
        }
        if (this.variant.averageBandwidth) {
            properties.push(['AVERAGE-BANDWIDTH', this.variant.averageBandwidth]);
        }
        if (this.variant.frameRate) {
            properties.push(['FRAME-RATE', this.variant.frameRate]);
        }
        if (this.variant.hdcpLevel) {
            properties.push(['HDCP-LEVEL', this.variant.hdcpLevel])
        }
        if (this.variant.isIFrameOnly && this.playlist.includeVideo()) {
            // #EXT-X-I-FRAME-STREAM-INF:BANDWIDTH=86000,URI="low/iframe.m3u8",PROGRAM-ID=1,CODECS="c1",RESOLUTION="1x1",VIDEO="1"
            if (this.variant.uri) {
                properties.push(['URI', '"' + this.playlist.getBaseUrl() + this.variant.uri + '"']);
            }
            out += "#EXT-X-I-FRAME-STREAM-INF:" + this.propertiesToCommaSeparated(properties) + "\n";
        }
        else {
            // #EXT-X-STREAM-INF:PROGRAM-ID=0,BANDWIDTH=1170400,CODECS="avc1",RESOLUTION=320x240,AUDIO="audio0",CLOSED-CAPTIONS=NONE,SUBTITLES="subtitles0"
            if (this.variant.audio.length && this.playlist.includeAudio()) {
                properties.push(['AUDIO', '"' + this.variant.audio[0].groupId + '"']);
            }
            if (this.variant.closedCaptions.length) {
                properties.push(['CLOSED-CAPTIONS', '"' + this.variant.closedCaptions[0].groupId + '"']);
            }
            if (this.variant.subtitles.length) {
                properties.push(['SUBTITLES', '"' + this.variant.subtitles[0].groupId + '"']);
            }
            if (this.variant.video.length && this.playlist.includeVideo()) {
                properties.push(['VIDEO', '"' + this.variant.video[0].groupId + '"']);
            }
            out += "#EXT-X-STREAM-INF:" + this.propertiesToCommaSeparated(properties) + "\n";
        }
        return out;
    }

}