import { iMediaTrack } from "./hls-parser-types";
import { Playlist } from "./playlist";

export class MediaTrack {

    protected rendition: iMediaTrack;
    protected playlist: Playlist;

    constructor(playlist: Playlist, rendition: iMediaTrack) {
        this.rendition = rendition;
        this.playlist = playlist;
    }

    public getType(): string {
        return this.rendition.type;
    }

    public isAudio(): boolean {
        return this.rendition.type === 'AUDIO';
    }

    public getUniqueKey(): string {
        return this.rendition.groupId + ' ' +
            this.rendition.type + ' ' +
            this.rendition.name;
    }

    public toString(): string {
        let out: string = '';
        let properties: any[] = [];
        if (this.rendition.groupId) {
            properties.push(['GROUP-ID', this.rendition.groupId]);
        }
        if (this.rendition.name) {
            properties.push(['NAME', this.rendition.name]);
        }
        if (this.rendition.language) {
            properties.push(['LANGUAGE', '"' + this.rendition.language + '"']);
        }
        if (this.rendition.assocLanguage) {
            properties.push(['ASSOC-LANGUAGE', '"' + this.rendition.assocLanguage + '"'])
        }
        if (typeof this.rendition.isDefault != 'undefined') {
            properties.push(['DEFAULT', this.rendition.isDefault ? 'YES' : 'NO']);
        }
        if (typeof this.rendition.forced != 'undefined') {
            properties.push(['FORCED', this.rendition.forced ? 'YES' : 'NO']);
        }
        if (typeof this.rendition.autoselect != 'undefined') {
            properties.push(['AUTOSELECT', this.rendition.autoselect ? 'YES' : 'NO']);
        }
        if (this.rendition.characteristics) {
            properties.push(['CHARACTERISTICS', '"' + this.rendition.characteristics + '"']);
        }
        if (this.rendition.channels) {
            properties.push(['CHANNELS', '"' + this.rendition.channels + '"']);
        }
        if (this.rendition.instreamId) {
            properties.push(['INSTREAM-ID', '"' + this.rendition.instreamId + '"']);
        }
        if (this.rendition.uri) {
            properties.push(
                [
                    'URI',
                    Playlist.buildUrl(
                        this.playlist.getBaseUrl() + this.rendition.uri,
                        this.playlist.getQueryStringParams()
                    )
                ]
            );
        }
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