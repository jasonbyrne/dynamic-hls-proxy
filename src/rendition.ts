import { iVariant } from "./hls-parser-types";
import { Playlist, PlaylistTypeFilter } from "./playlist";
import { StreamInfo } from "./stream-info";

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
        this.streamInfo = new StreamInfo(variant);
        this.playlist = playlist;
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

    public getBandwidth(): number {
        return this.variant.bandwidth;
    }

    public toString(): string {
        let out: string = '';
        out += this.streamInfo.toString();
        if (!this.variant.isIFrameOnly) {
            out += this.variant.uri + "\n";
        }
        return out;
    }


}