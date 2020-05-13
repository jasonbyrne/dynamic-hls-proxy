import { Rendition, RenditionType } from "./rendition";
import { AudioTrack } from "./audio-track";
import { ChunklistPruneType } from "./chunklist";
import { parse, UrlWithStringQuery } from "url";
import * as http from "https";
import * as https from "https";
import * as HLS from "hls-parser";

const HD_MIN_HEIGHT: number = 720;

export enum PlaylistTypeFilter {
  "VideoWithAudio",
  "VideoAndAudio",
  "AudioOnly",
  "VideoOnly",
}

export enum RenditionSortOrder {
  "bestFirst",
  "worstFirst",
  "middleFirst",
  "secondFirst",
  "nonHdFirst",
}

export interface DynamicChunklistProperties {
  pruneType: ChunklistPruneType;
  maxDuration: number;
}

export class Playlist {
  private _url: string | null = null;
  private _m3u8: HLS.types.MasterPlaylist;
  private _renditions: Rendition[] = [];
  private _typeFilter: PlaylistTypeFilter = PlaylistTypeFilter.VideoAndAudio;
  private _limit: number = -1;
  private _frameRateRange: [number, number] = [0, 120];
  private _bandwidthRange: [number, number] = [0, 99999999];
  private _resolutionRange: [number, number] = [0, 4320];
  private _baseUrl: string = "";
  private _queryString: { [key: string]: string } = {};
  private _dynamicChunklists: boolean = false;
  private _dynamicChunklistEndpoint: string = "";
  private _dynamicChunklistProperties: DynamicChunklistProperties = {
    pruneType: ChunklistPruneType.noPrune,
    maxDuration: -1,
  };

  public get includeAudio(): boolean {
    return (
      this._typeFilter == PlaylistTypeFilter.VideoAndAudio ||
      this._typeFilter == PlaylistTypeFilter.AudioOnly
    );
  }

  public get includeAudioWithVideo(): boolean {
    return (
      this._typeFilter == PlaylistTypeFilter.VideoAndAudio ||
      this._typeFilter == PlaylistTypeFilter.VideoWithAudio
    );
  }

  public get includeVideo(): boolean {
    return (
      this._typeFilter == PlaylistTypeFilter.VideoWithAudio ||
      this._typeFilter == PlaylistTypeFilter.VideoAndAudio ||
      this._typeFilter == PlaylistTypeFilter.VideoOnly
    );
  }

  public get url(): string | null {
    return this._url;
  }

  public get videoRenditions(): Rendition[] {
    return this._renditions.filter((rendition) => {
      return rendition.type == RenditionType.video;
    });
  }

  protected constructor(body: string) {
    const m3u8: HLS.types.Playlist = HLS.parse(body);
    if (!m3u8.isMasterPlaylist) {
      throw "This m3u8 is not a master playlist.";
    }
    this._m3u8 = <HLS.types.MasterPlaylist>m3u8;
    this._m3u8.variants.forEach((variant) => {
      this._renditions.push(new Rendition(this, variant));
    });
  }

  static loadFromString(body: string): Playlist {
    return new Playlist(body);
  }

  static loadFromUrl(url: string): Promise<Playlist> {
    return new Promise(function (resolve, reject) {
      Playlist.fetch(url)
        .then((body: string) => {
          const playlist = new Playlist(body);
          playlist._url = url;
          resolve(playlist);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  public getVideoRenditionUrl(atIndex: number, absolute: boolean = true) {
    if (atIndex >= this.videoRenditions.length) {
      throw `Video Rendition not found at index ${atIndex}`;
    }
    return this.videoRenditions[atIndex].absoluteUri;
  }

  public setFrameRateRange(min: number, max: number) {
    if (min > max) {
      throw "Minimum frame rate can not be greater than maximum frame rate";
    }
    this._frameRateRange = [min, max];
  }

  public setBandwidthRange(min: number, max: number) {
    if (min > max) {
      throw "Minimum bandwidth can not be greater than maximum bandwidth";
    }
    this._bandwidthRange = [min, max];
  }

  public setResolutionRange(min: number, max: number) {
    if (min > max) {
      throw "Minimum resolution can not be greater than maximum resolution";
    }
    this._resolutionRange = [min, max];
  }

  public sortByBandwidth(
    order: RenditionSortOrder = RenditionSortOrder.bestFirst
  ): Playlist {
    const playlist: Playlist = this;
    let middleBandwidth: number | null = null;
    if (
      order == RenditionSortOrder.middleFirst ||
      order == RenditionSortOrder.secondFirst ||
      order == RenditionSortOrder.nonHdFirst
    ) {
      let videoBandwidths: number[] = [];
      this._renditions.forEach(function (rendition: Rendition) {
        // Get only the video renditions and sort them by bandwidth
        if (
          rendition.type == RenditionType.video &&
          rendition.isBandwidthBetween(playlist._bandwidthRange) &&
          rendition.isFrameRateBetween(playlist._frameRateRange) &&
          rendition.isResolutionBetween(playlist._resolutionRange) &&
          (order != RenditionSortOrder.nonHdFirst ||
            rendition.height < HD_MIN_HEIGHT)
        ) {
          videoBandwidths.push(rendition.bandwidth);
        }
        videoBandwidths.sort((a, b) => b - a);
        if (order == RenditionSortOrder.middleFirst) {
          middleBandwidth =
            videoBandwidths[Math.floor(videoBandwidths.length / 2)];
        }
        if (order == RenditionSortOrder.nonHdFirst) {
          middleBandwidth = videoBandwidths[0];
        } else {
          middleBandwidth = videoBandwidths[1];
        }
      });
    }
    this._renditions = this._renditions.sort(function (
      a: Rendition,
      b: Rendition
    ) {
      if (a.bandwidth == middleBandwidth) {
        return -1000000000;
      } else if (b.bandwidth == middleBandwidth) {
        return 1000000000;
      } else {
        return order == RenditionSortOrder.worstFirst
          ? a.bandwidth - b.bandwidth
          : b.bandwidth - a.bandwidth;
      }
    });
    return this;
  }

  public setQueryStringParam(key: string, value: string): Playlist {
    this._queryString[key] = value;
    return this;
  }

  public deleteQueryStringParam(key: string): Playlist {
    delete this._queryString[key];
    return this;
  }

  public hasQueryStringParams(): boolean {
    return Object.keys(this._queryString).length > 0;
  }

  public getQueryStringParams(): { [key: string]: string } {
    return this._queryString;
  }

  public getTypeFilter(): PlaylistTypeFilter {
    return this._typeFilter;
  }

  public setTypeFilter(filter: PlaylistTypeFilter): Playlist {
    this._typeFilter = filter;
    return this;
  }

  public setLimit(n: number): Playlist {
    this._limit = n;
    return this;
  }

  public setBaseUrl(baseUrl: string): Playlist {
    this._baseUrl = baseUrl;
    return this;
  }

  public getBaseUrl(): string {
    return this._baseUrl;
  }

  public useDynamicChunklists(dynamicChunklists: boolean): Playlist {
    this._dynamicChunklists = dynamicChunklists;
    return this;
  }

  public hasDynamicChunklists(): boolean {
    return this._dynamicChunklists;
  }

  public setDynamicChunklistProperties(
    properties: DynamicChunklistProperties
  ): Playlist {
    this._dynamicChunklistProperties = properties;
    return this;
  }

  public getDynamicChunklistProperties(): DynamicChunklistProperties {
    return this._dynamicChunklistProperties;
  }

  public setDynamicChunklistEndpoint(endpoint: string): Playlist {
    this._dynamicChunklistEndpoint = endpoint;
    return this;
  }

  public getDynamicChunklistEndpoint(): string {
    return this._dynamicChunklistEndpoint;
  }

  public getRenditions(): {
    videoRenditions: Rendition[];
    audioRenditions: Rendition[];
    iframeRenditions: Rendition[];
    audioTracks: { [key: string]: AudioTrack };
  } {
    const iframeRenditions: Rendition[] = [];
    const videoRenditions: Rendition[] = [];
    const audioRenditions: Rendition[] = [];
    const audioTracks: { [key: string]: AudioTrack } = {};
    // Write out the variants
    this._renditions.forEach((rendition) => {
      if (rendition.type == RenditionType.video) {
        if (
          (this._limit < 1 || videoRenditions.length < this._limit) &&
          rendition.isBandwidthBetween(this._bandwidthRange) &&
          rendition.isFrameRateBetween(this._frameRateRange) &&
          rendition.isResolutionBetween(this._resolutionRange)
        ) {
          videoRenditions.push(rendition);
          rendition.audioTracks.forEach((track: AudioTrack) => {
            if (!track.isAudio || this.includeAudioWithVideo) {
              audioTracks[track.uniqueKey] = track;
            }
          });
        }
      } else if (rendition.type == RenditionType.iframe) {
        if (this._limit < 1 || iframeRenditions.length < this._limit) {
          iframeRenditions.push(rendition);
        }
      } else if (rendition.type == RenditionType.audio) {
        if (this._limit < 1 || audioRenditions.length < this._limit) {
          audioRenditions.push(rendition);
        }
      }
    });
    return {
      audioRenditions: audioRenditions,
      videoRenditions: videoRenditions,
      iframeRenditions: iframeRenditions,
      audioTracks: audioTracks,
    };
  }

  public getRenditionStrings(): {
    videoRenditions: string[];
    audioRenditions: string[];
    iframeRenditions: string[];
    audioTracks: string[];
  } {
    const {
      videoRenditions,
      iframeRenditions,
      audioRenditions,
      audioTracks,
    } = this.getRenditions();
    return {
      audioRenditions: audioRenditions.map((rendition) =>
        rendition.toString().trim()
      ),
      videoRenditions: videoRenditions.map((rendition) =>
        rendition.toString().trim()
      ),
      iframeRenditions: iframeRenditions.map((rendition) =>
        rendition.toString().trim()
      ),
      audioTracks: Object.keys(audioTracks).map((key) =>
        audioTracks[key].toString()
      ),
    };
  }

  public toString(): string {
    const meta: string[] = ["#EXTM3U"];
    if (this._m3u8.version) {
      meta.push("#EXT-X-VERSION: " + this._m3u8.version);
    }
    // Renditions
    const {
      videoRenditions,
      iframeRenditions,
      audioRenditions,
      audioTracks,
    } = this.getRenditionStrings();
    // Return formatted M3U8
    return (
      meta.join("\n") +
      "\n" +
      (this.includeAudioWithVideo ? audioTracks.join("\n") + "\n" : "") +
      (this.includeVideo ? iframeRenditions.join("\n") + "\n" : "") +
      (this.includeVideo ? videoRenditions.join("\n") + "\n" : "") +
      (this.includeAudio ? audioRenditions.join("\n") : "")
    );
  }

  static buildUrl(
    inputUrl: string,
    qsParams: { [key: string]: string }
  ): string {
    const url: UrlWithStringQuery = parse(inputUrl, false);
    const qs: URLSearchParams = new URLSearchParams(url.search);
    for (let key in qsParams) {
      qs.set(key, qsParams[key]);
    }
    return (
      (url.protocol !== null ? url.protocol + "//" : "") +
      (url.host !== null ? url.host : "") +
      (url.pathname !== null ? url.pathname : "") +
      (url.search || Object.keys(qsParams).length > 0
        ? "?" + qs.toString()
        : "")
    );
  }

  static fetch(url: string): Promise<string> {
    return new Promise(function (resolve, reject) {
      try {
        const parsedUrl: URL = new URL(url);
        const options = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          path: parsedUrl.pathname,
          method: "GET",
        };
        const req = (parsedUrl.protocol == "https:" ? https : http).request(
          options,
          (res) => {
            let body: string = "";
            res.on("data", (d) => {
              body += d;
            });
            res.on("end", () => {
              if (
                typeof res == "undefined" ||
                typeof res.statusCode == "undefined"
              ) {
                return reject("Invalid http response");
              }
              if (res.statusCode >= 200 && res.statusCode <= 299 && body) {
                resolve(body);
              } else {
                reject("Unexpected http response: " + res.statusCode);
              }
            });
          }
        );
        req.on("error", (err) => {
          reject("Could not load url: " + err);
        });
        req.end();
      } catch (ex) {
        reject(ex);
      }
    });
  }
}
