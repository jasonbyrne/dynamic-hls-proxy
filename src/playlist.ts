import { iMasterPlaylist, iGenericPlaylist, iVariant, iRendition } from "./hls-parser-types";

const request = require('request');
const HLS = require('hls-parser'); 

class AudioTrack {

    protected rendition: iRendition;

    constructor(rendition: iRendition) {
        this.rendition = rendition;
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
        out += "#EXT-X-MEDIA:TYPE=AUDIO,";
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

class StreamInfo {

    protected variant: iVariant;

    constructor(variant: iVariant) {
        this.variant = variant;
    }

    public toString(): string {
        let out: string = '';
        if (!this.variant.isIFrameOnly) {
            // #EXT-X-STREAM-INF:PROGRAM-ID=0,BANDWIDTH=1170400,CODECS="avc1",RESOLUTION=320x240,AUDIO="audio0",CLOSED-CAPTIONS=NONE,SUBTITLES="subtitles0"
            let properties: any[] = [];
            this.variant.bandwidth && properties.push(['BANDWIDTH', this.variant.bandwidth]);
            this.variant.codecs && properties.push(['CODECS', '"' + this.variant.codecs + '"']);
            this.variant.resolution && properties.push(['RESOLUTION', this.variant.resolution.width + 'x' + this.variant.resolution.height]);
            this.variant.audio.length && properties.push(['AUDIO', this.variant.audio[0].groupId]);
            this.variant.closedCaptions.length && properties.push(['CLOSED-CAPTIONS', this.variant.closedCaptions[0].groupId]);
            this.variant.subtitles.length && properties.push(['SUBTITLES', this.variant.subtitles[0].groupId]);
            out += "#EXT-X-STREAM-INF:";
            for (let i: number = 0; i < properties.length; i++) {
                if (i > 0) {
                    out += ',';
                }
                out += properties[i].join('=');
            }
            out += "\n";
        }
        return out;
    }

}

export enum PlaylistTypeFilter {
    "VideoAndAudio",
    "AudioOnly",
    "VideoOnly"
}

export class Playlist {

    protected masterPlaylist: iMasterPlaylist;
    protected typeFilter: PlaylistTypeFilter = PlaylistTypeFilter.VideoAndAudio;

    protected constructor(body: string) {
        let playlist: iGenericPlaylist = HLS.parse(body);
        if (!playlist.isMasterPlaylist) {
            new Error("This m3u8 is not a master playlist.");
        }
        this.masterPlaylist = <iMasterPlaylist>playlist;
    }

    static loadFromString(body: string): Playlist {
        return new Playlist(body);
    }

    static loadFromUrl(url: string): Promise<Playlist> {
        return new Promise(function (resolve, reject) {
            request(url, function (err, response, body) {
                if (err) {
                    reject("Could not load url: " + err);
                }
                if (response.statusCode >= 200 && response.statusCode <= 299 && body) {
                    resolve(new Playlist(body));
                }
                else {
                    reject("Unexpected http response: " + response.statusCode);
                }
            });
        });
    }

    public setTypeFilter(filter: PlaylistTypeFilter) {
        this.typeFilter = filter;
    }

    public toString(): string {
        let out: string = "#EXTM3U\n";
        out += "#EXT-X-VERSION: " + this.masterPlaylist.version + "\n";
        // Write out the audio tracks 
        let audioTracksAlreadyPrinted: string[] = [];
        let playlist: Playlist = this;
        this.masterPlaylist.variants.forEach(function (variant: iVariant) {
            // #EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio1",NAME="eng",DEFAULT=NO,AUTOSELECT=YES,LANGUAGE="eng",URI="audio_128_eng_rendition.m3u8"
            if (
                !variant.isIFrameOnly && variant.audio.length &&
                playlist.typeFilter !== PlaylistTypeFilter.VideoOnly
            ) {
                variant.audio.forEach(function (rendition: iRendition) {
                    if (audioTracksAlreadyPrinted.indexOf(rendition.groupId) < 0) {
                        audioTracksAlreadyPrinted.push(rendition.groupId);
                        let audioTrack: AudioTrack = new AudioTrack(rendition);
                        out += audioTrack.toString();
                    }
                });
            }
        });
        // Write out the variants
        this.masterPlaylist.variants.forEach(function(variant: iVariant) {
            if (!variant.isIFrameOnly) {
                let streamInfo: StreamInfo = new StreamInfo(variant);

                out += streamInfo.toString();
                out += variant.uri + "\n";
            }
        });
        return out;
    }

}
