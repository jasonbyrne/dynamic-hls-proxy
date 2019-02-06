import { iVariant } from "./hls-parser-types";
import { Playlist } from "./playlist";
import { StreamInfo } from "./stream-info";
import { MediaTrack } from './media-track';
import * as querystring from 'querystring';

export enum RenditionType {
    "video",
    "audio",
    "iframe"
}

export class Rendition {

    protected variant: iVariant;
    protected streamInfo: StreamInfo;
    protected playlist: Playlist;

    constructor(playlist: Playlist, variant: iVariant) {
        this.variant = variant;
        this.streamInfo = new StreamInfo(playlist, variant);
        this.playlist = playlist;
    }

    public getTracks(): MediaTrack[] {
        return this.streamInfo.getTracks();
    }

    public getType(): RenditionType {
        if (this.variant.isIFrameOnly) {
            return RenditionType.iframe;
        }
        else if (this.streamInfo.hasAudio() && !this.streamInfo.hasVideo()) {
            return RenditionType.audio;
        }
        else {
            return RenditionType.video;
        }
    }

    public getHeight(): number {
        return this.variant.resolution.height;
    }

    public getFrameRate(): number {
        return this.variant.frameRate;
    }

    public getBandwidth(): number {
        return this.variant.bandwidth;
    }

    public getAverageBandwidth(): number {
        return this.variant.averageBandwidth;
    }

    public isResolutionBetween(range: [number, number]): boolean {
        const height: number = this.getHeight();
        return typeof height == 'undefined' || (
            height >= range[0] &&
            height <= range[1]
        );
    }

    public isFrameRateBetween(range: [number, number]): boolean {
        const frameRate: number = this.getFrameRate();
        return typeof frameRate == 'undefined' || (
            frameRate >= range[0] &&
            frameRate <= range[1]
        );
    }

    public isBandwidthBetween(range: [number, number]): boolean {
        const bandwidth: number = this.getBandwidth() || this.getAverageBandwidth();
        return typeof bandwidth == 'undefined' || (
            bandwidth >= range[0] &&
            bandwidth <= range[1]
        );
    }

    public toString(): string {
        let out: string = '';
        out += this.streamInfo.toString();
        if (this.variant.isIFrameOnly) {
            return out;
        }
        if (this.playlist.hasDynamicChunklists()) {
            const props = JSON.parse(JSON.stringify(this.playlist.getDynamicChunklistProperties()));
            props.uri = this.variant.uri;
            props.baseUrl = this.playlist.getBaseUrl();

            out += this.playlist.getDynamicChunklistEndpoint() + '?' + querystring.stringify(props) + "\n";
        }
        else {
            out += Playlist.buildUrl(
                this.playlist.getBaseUrl() + this.variant.uri,
                this.playlist.getQueryStringParams()
            ) + "\n";
        }

        return out;
    }


}