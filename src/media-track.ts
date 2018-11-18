import { iMediaTrack } from "./hls-parser-types";
import { Playlist } from "./playlist";

export class MediaTrack {

    protected rendition: iMediaTrack;
    protected playlist: Playlist;

    constructor(playlist: Playlist, rendition: iMediaTrack) {
        this.rendition = rendition;
        this.playlist = playlist;
    }

    public isAudio(): boolean {
        return this.rendition.type === 'AUDIO';
    }

    public toString(): string {
        let out: string = '';
        let properties: any[] = [];
        this.rendition.groupId && properties.push(['GROUP-ID', this.rendition.groupId]);
        this.rendition.name && properties.push(['NAME', this.rendition.name]);
        this.rendition.language && properties.push(['LANGUAGE', this.rendition.language]);
        this.rendition.isDefault && properties.push(['DEFAULT', this.rendition.isDefault ? 'YES' : 'NO']);
        this.rendition.autoselect && properties.push(['AUTOSELECT', this.rendition.autoselect ? 'YES' : 'NO']);
        this.rendition.uri && properties.push(['URI', this.rendition.uri]);
        out += "#EXT-X-MEDIA:TYPE=" + this.rendition.type + ",";
        for (let i: number = 0; i < properties.length; i++) {
            if (i > 0) {
                out += ',';
            }
            out += properties[i].join('=');
        }
        out += "\n";
        return out;
    }

}