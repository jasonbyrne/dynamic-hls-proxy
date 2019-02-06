import { iMasterPlaylist, iGenericPlaylist, iVariant } from "./hls-parser-types";
import { Rendition, RenditionType } from "./rendition";
import { MediaTrack } from "./media-track";
import { ChunklistPruneType } from "./chunklist";
import { parse, UrlWithStringQuery } from "url"

const request = require('request');
const HLS = require('hls-parser'); 

const HD_MIN_HEIGHT: number = 720;

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

export interface DynamicChunklistProperties {
    pruneType: ChunklistPruneType;
    maxDuration: number;
}

export class Playlist {

    protected m3u8: iMasterPlaylist;
    protected renditions: Rendition[] = [];
    protected typeFilter: PlaylistTypeFilter = PlaylistTypeFilter.VideoAndAudio;
    protected limit: number = -1;
    protected frameRateRange: [number, number] = [0, 120];
    protected bandwidthRange: [number, number] = [0, 99999999];
    protected resolutionRange: [number, number] = [0, 4320];
    protected baseUrl: string = '';
    protected queryString: { [key: string]: string } = {};
    protected dynamicChunklists: boolean = false;
    protected dynamicChunklistEndpoint: string = '';
    protected dynamicChunklistProperties: DynamicChunklistProperties = {
        pruneType: ChunklistPruneType.noPrune,
        maxDuration: -1,
    };

    protected constructor(body: string) {
        let m3u8: iGenericPlaylist = HLS.parse(body);
        let playlist: Playlist = this;
        if (!m3u8.isMasterPlaylist) {
            throw new Error("This m3u8 is not a master playlist.");
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

    public includeAudio(): boolean {
        return (
            this.typeFilter == PlaylistTypeFilter.VideoAndAudio ||
            this.typeFilter == PlaylistTypeFilter.AudioOnly
        );
    }

    public includeVideo(): boolean {
        return (
            this.typeFilter == PlaylistTypeFilter.VideoAndAudio ||
            this.typeFilter == PlaylistTypeFilter.VideoOnly
        );
    }

    public setFrameRateRange(min: number, max: number) {
        if (min > max) {
            throw new Error('Minimum frame rate can not be greater than maximum frame rate');
        }
        this.frameRateRange = [min, max];
    }

    public setBandwidthRange(min: number, max: number) {
        if (min > max) {
            throw new Error('Minimum bandwidth can not be greater than maximum bandwidth');
        }
        this.bandwidthRange = [min, max];
    }

    public setResolutionRange(min: number, max: number) {
        if (min > max) {
            throw new Error('Minimum resolution can not be greater than maximum resolution');
        }
        this.resolutionRange = [min, max];
    }

    public sortByBandwidth(order: RenditionSortOrder = RenditionSortOrder.bestFirst): Playlist {
        const playlist: Playlist = this;
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
                    rendition.isBandwidthBetween(playlist.bandwidthRange) &&
                    rendition.isFrameRateBetween(playlist.frameRateRange) &&
                    rendition.isResolutionBetween(playlist.resolutionRange) &&
                    (order != RenditionSortOrder.nonHdFirst || rendition.getHeight() < HD_MIN_HEIGHT)
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

    public setQueryStringParam(key: string, value: string): Playlist {
        this.queryString[key] = value;
        return this;
    }

    public deleteQueryStringParam(key: string): Playlist {
        delete this.queryString[key];
        return this;
    }

    public hasQueryStringParams(): boolean {
        return Object.keys(this.queryString).length > 0;
    }

    public getQueryStringParams(): { [key: string]: string } {
        return this.queryString;
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

    public setBaseUrl(baseUrl: string): Playlist {
        this.baseUrl = baseUrl;
        return this;
    }

    public getBaseUrl(): string {
        return this.baseUrl;
    }

    public useDynamicChunklists(dynamicChunklists: boolean): Playlist {
        this.dynamicChunklists = dynamicChunklists;
        return this;
    }

    public hasDynamicChunklists(): boolean {
        return this.dynamicChunklists;
    }

    public setDynamicChunklistProperties(properties: DynamicChunklistProperties): Playlist {
        this.dynamicChunklistProperties = properties;
        return this;
    }

    public getDynamicChunklistProperties(): DynamicChunklistProperties {
        return this.dynamicChunklistProperties;
    }

    public setDynamicChunklistEndpoint(endpoint: string): Playlist {
        this.dynamicChunklistEndpoint = endpoint;
        return this;
    }

    public getDynamicChunklistEndpoint(): string {
        return this.dynamicChunklistEndpoint;
    }

    public toString(): string {
        const playlist: Playlist = this;
        let meta: string = "#EXTM3U\n";
        let iframeRenditions: string[] = [];
        let videoRenditions: string[] = [];
        let audioRenditions: string[] = [];
        let tracks: { [key: string]: string } = {};
        if (this.m3u8.version) {
            meta += "#EXT-X-VERSION: " + this.m3u8.version + "\n";
        }
        //console.log(this.renditions);
        // Write out the variants
        this.renditions.forEach(function (rendition: Rendition) {
            if (rendition.getType() == RenditionType.video) {
                if (
                    (playlist.limit < 1 || videoRenditions.length < playlist.limit) &&
                    rendition.isBandwidthBetween(playlist.bandwidthRange) && 
                    rendition.isFrameRateBetween(playlist.frameRateRange) &&
                    rendition.isResolutionBetween(playlist.resolutionRange)
                ) {
                    videoRenditions.push(
                        rendition.toString().trim()
                    );
                    rendition.getTracks().forEach((track: MediaTrack) => {
                        if (!track.isAudio() || playlist.includeAudio()) {
                            tracks[track.getUniqueKey()] = track.toString();
                        }
                    });
                }
            }
            else if (rendition.getType() == RenditionType.iframe) {
                if (playlist.limit < 1 || iframeRenditions.length < playlist.limit) {
                    iframeRenditions.push(rendition.toString().trim());
                }
            }
            else if (rendition.getType() == RenditionType.audio) {
                if (playlist.limit < 1 || audioRenditions.length < playlist.limit) {
                    audioRenditions.push(rendition.toString().trim());
                }
            }
        });
        // Return formatted M3U8
        return meta +
            Object.keys(tracks).map(key => tracks[key]).join("\n") +
            (this.includeVideo() ? iframeRenditions.join("\n") + "\n" : "") +
            (this.includeVideo() ? videoRenditions.join("\n") + "\n" : "") +
            (this.includeAudio() ? audioRenditions.join("\n") : "");
    }

    static buildUrl(inputUrl: string, qsParams: { [key: string]: string }): string {
        const url: UrlWithStringQuery = parse(inputUrl, false);
        const qs: URLSearchParams = new URLSearchParams(url.search);
        for (let key in qsParams) {
            qs.set(key, qsParams[key]);
        }
        return (url.protocol !== null ? url.protocol + '//' : '') +
            (url.host !== null ? url.host : '') +
            (url.pathname !== null ? url.pathname : '') +
            ((url.search || Object.keys(qsParams).length > 0) ? '?' + qs.toString() : '');
    }

}
