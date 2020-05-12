import { Playlist } from "./playlist";
import { StreamInfo } from "./stream-info";
import { AudioTrack } from "./audio-track";
import * as HLS from "hls-parser";

export enum RenditionType {
  "video",
  "audio",
  "iframe",
}

export class Rendition {
  protected _variant: HLS.types.Variant;
  protected _streamInfo: StreamInfo;
  protected _playlist: Playlist;

  public get variant(): HLS.types.Variant {
    return this._variant;
  }

  constructor(playlist: Playlist, variant: HLS.types.Variant) {
    this._variant = variant;
    this._streamInfo = new StreamInfo(playlist, variant);
    this._playlist = playlist;
  }

  public getTracks(): AudioTrack[] {
    return this._streamInfo.getTracks();
  }

  public getType(): RenditionType {
    if (this.variant.isIFrameOnly) {
      return RenditionType.iframe;
    } else if (this._streamInfo.hasAudio() && !this._streamInfo.hasVideo()) {
      return RenditionType.audio;
    } else {
      return RenditionType.video;
    }
  }

  public getHeight(): number {
    return this.variant.resolution?.height || 0;
  }

  public getFrameRate(): number {
    return this.variant?.frameRate || 0;
  }

  public getBandwidth(): number {
    return this.variant.bandwidth;
  }

  public getAverageBandwidth(): number {
    return this.variant?.averageBandwidth || 0;
  }

  public getDefaultAudioTrack(): AudioTrack | null {
    if (this._variant.audio?.length === 0) {
      return null;
    }
    const defaultRendition = this._variant.audio.filter((rendition) => {
      return rendition.isDefault;
    });
    return new AudioTrack(
      this._playlist,
      defaultRendition.length > 0 ? defaultRendition[0] : this._variant.audio[0]
    );
  }

  public getUri(absolute: boolean = false): string {
    if (absolute) {
      return Playlist.buildUrl(
        this._playlist.getBaseUrl() + this.variant.uri,
        this._playlist.getQueryStringParams()
      );
    }
    return this.variant.uri;
  }

  public isResolutionBetween(range: [number, number]): boolean {
    const height: number = this.getHeight();
    return (
      typeof height == "undefined" || (height >= range[0] && height <= range[1])
    );
  }

  public isFrameRateBetween(range: [number, number]): boolean {
    const frameRate: number = this.getFrameRate();
    return (
      typeof frameRate == "undefined" ||
      (frameRate >= range[0] && frameRate <= range[1])
    );
  }

  public isBandwidthBetween(range: [number, number]): boolean {
    const bandwidth: number = this.getBandwidth() || this.getAverageBandwidth();
    return (
      typeof bandwidth == "undefined" ||
      (bandwidth >= range[0] && bandwidth <= range[1])
    );
  }

  public toString(): string {
    let out: string = "";
    out += this._streamInfo.toString();
    if (this.variant.isIFrameOnly) {
      return out;
    }
    if (this._playlist.hasDynamicChunklists()) {
      const props = JSON.parse(
        JSON.stringify(this._playlist.getDynamicChunklistProperties())
      );
      props.uri = this.variant.uri;
      props.baseUrl = this._playlist.getBaseUrl();
      out +=
        Playlist.buildUrl(this._playlist.getDynamicChunklistEndpoint(), props) +
        "\n";
    } else {
      out += this.getUri(true) + "\n";
    }

    return out;
  }
}
