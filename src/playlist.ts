import { iMasterPlaylist, iGenericPlaylist, iVariant, iMediaTrack } from "./hls-parser-types";
import { Rendition, RenditionType } from "./rendition";
import { MediaTrack } from "./media-track";

const request = require('request');
const HLS = require('hls-parser'); 

export enum PlaylistTypeFilter {
    "VideoAndAudio",
    "AudioOnly",
    "VideoOnly"
}

export enum RenditionSortOrder {
    "bestFirst",
    "worstFirst",
    "middleFirst",
    "secondFirst",
    "nonHdFirst"
}

export class Playlist {

    protected m3u8: iMasterPlaylist;
    protected renditions: Rendition[] = [];
    protected typeFilter: PlaylistTypeFilter = PlaylistTypeFilter.VideoAndAudio;
    protected limit: number = -1;

    protected constructor(body: string) {
        let m3u8: iGenericPlaylist = HLS.parse(body);
        let playlist: Playlist = this;
        if (!m3u8.isMasterPlaylist) {
            new Error("This m3u8 is not a master playlist.");
        }
        this.m3u8 = <iMasterPlaylist> m3u8;
        this.m3u8.variants.forEach(function (variant: iVariant, index: number) {
            let rendition: Rendition = new Rendition(playlist, variant);
            playlist.renditions.push(rendition);
        })
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

    protected includeAudio(): boolean {
        return (
            this.typeFilter == PlaylistTypeFilter.VideoAndAudio ||
            this.typeFilter == PlaylistTypeFilter.AudioOnly
        );
    }

    protected includeVideo(): boolean {
        return (
            this.typeFilter == PlaylistTypeFilter.VideoAndAudio ||
            this.typeFilter == PlaylistTypeFilter.VideoOnly
        );
    }

    public sortByBandwidth(order: RenditionSortOrder = RenditionSortOrder.bestFirst): Playlist {
        let middleBandwidth: number | null = null;
        if (
            order == RenditionSortOrder.middleFirst ||
            order == RenditionSortOrder.secondFirst ||
            order == RenditionSortOrder.nonHdFirst 
        ) {
            let videoBandwidths: number[] = [];
            this.renditions.forEach(function (rendition: Rendition) {
                // Get only the video renditions and sort them by bandwidth
                if (
                    rendition.getType() == RenditionType.video &&
                    (order != RenditionSortOrder.nonHdFirst || rendition.getHeight() < 720)
                ) {
                    videoBandwidths.push(rendition.getBandwidth());
                }
                videoBandwidths.sort((a, b) => b - a);
                if (order == RenditionSortOrder.middleFirst) {
                    middleBandwidth = videoBandwidths[Math.floor(videoBandwidths.length / 2)];
                }
                if (order == RenditionSortOrder.nonHdFirst) {
                    middleBandwidth = videoBandwidths[0];
                }
                else {
                    middleBandwidth = videoBandwidths[1];
                }
            });
        }
        this.renditions = this.renditions.sort(function (a: Rendition, b: Rendition) {
            if (a.getBandwidth() == middleBandwidth) {
                return -1000000000;
            }
            else if (b.getBandwidth() == middleBandwidth) {
                return 1000000000;
            }
            else {
                return (order == RenditionSortOrder.worstFirst) ?
                    a.getBandwidth() - b.getBandwidth() :
                    b.getBandwidth() - a.getBandwidth();
            }
        });
        return this;
    }

    public getTypeFilter(): PlaylistTypeFilter {
        return this.typeFilter;
    }

    public setTypeFilter(filter: PlaylistTypeFilter): Playlist {
        this.typeFilter = filter;
        return this;
    }

    public setLimit(n: number): Playlist {
        this.limit = n;
        return this;
    }

    public toString(): string {
        let playlist: Playlist = this;
        let meta: string = "#EXTM3U\n";
        meta += "#EXT-X-VERSION: " + this.m3u8.version + "\n";
        // Loop through the variants and write out the unique media tracks
        let mediaTracksAlreadyPrinted: string[] = [];
        this.m3u8.variants.forEach(function (variant: iVariant) {
            // #EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio1",NAME="eng",DEFAULT=NO,AUTOSELECT=YES,LANGUAGE="eng",URI="audio_128_eng_rendition.m3u8"
            variant.audio.concat(variant.closedCaptions).concat(variant.subtitles)
                .forEach(function (data: iMediaTrack) {
                    // If we haven't included this group id yet
                    if (mediaTracksAlreadyPrinted.indexOf(data.groupId) < 0) {
                        mediaTracksAlreadyPrinted.push(data.groupId);
                        let mediaTrack = new MediaTrack(playlist, data);
                        if (
                            !mediaTrack.isAudio ||
                            playlist.includeAudio()
                        ) {
                            meta += mediaTrack.toString();
                        }
                    }
                });
        });
        // Write out the variants
        let iframeRenditions: string[] = [];
        let videoRenditions: string[] = [];
        let audioRenditions: string[] = [];
        this.renditions.forEach(function(rendition: Rendition) {
            if (rendition.getType() == RenditionType.iframe) {
                if (playlist.limit < 1 || iframeRenditions.length < playlist.limit) {
                    iframeRenditions.push(rendition.toString().trim());
                }
            }
            else if (rendition.getType() == RenditionType.video) {
                if (playlist.limit < 1 || videoRenditions.length < playlist.limit) {
                    videoRenditions.push(rendition.toString().trim());
                }
            }
            else if (rendition.getType() == RenditionType.audio) {
                if (playlist.limit < 1 || audioRenditions.length < playlist.limit) {
                    audioRenditions.push(rendition.toString().trim());
                }
            }
        });
        return meta +
            (this.includeVideo() ? iframeRenditions.join("\n") + "\n" : "") +
            (this.includeVideo() ? videoRenditions.join("\n") + "\n" : "") +
            (this.includeAudio() ? audioRenditions.join("\n") : "");
    }

}
