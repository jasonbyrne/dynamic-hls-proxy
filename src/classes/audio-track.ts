import { Playlist } from "./playlist";
import * as HLS from "hls-parser";

export class AudioTrack {
  protected _rendition: HLS.types.Rendition<"AUDIO">;
  protected _playlist: Playlist;

  constructor(playlist: Playlist, rendition: HLS.types.Rendition<"AUDIO">) {
    this._rendition = rendition;
    this._playlist = playlist;
  }

  public getType(): string {
    return this._rendition.type;
  }

  public isAudio(): boolean {
    return this._rendition.type === "AUDIO";
  }

  public getUniqueKey(): string {
    return (
      this._rendition.groupId +
      " " +
      this._rendition.type +
      " " +
      this._rendition.name
    );
  }

  public getUri(absolute: boolean = false): string | null {
    if (!this._rendition.uri) {
      return null;
    }
    if (absolute) {
      return Playlist.buildUrl(
        this._playlist.getBaseUrl() + this._rendition.uri,
        this._playlist.getQueryStringParams()
      );
    }
    return this._rendition.uri;
  }

  public toString(): string {
    let out: string = "";
    let properties: any[] = [];
    if (this._rendition.groupId) {
      properties.push(["GROUP-ID", this._rendition.groupId]);
    }
    if (this._rendition.name) {
      properties.push(["NAME", this._rendition.name]);
    }
    if (this._rendition.language) {
      properties.push(["LANGUAGE", '"' + this._rendition.language + '"']);
    }
    if (this._rendition.assocLanguage) {
      properties.push([
        "ASSOC-LANGUAGE",
        '"' + this._rendition.assocLanguage + '"',
      ]);
    }
    if (typeof this._rendition.isDefault != "undefined") {
      properties.push(["DEFAULT", this._rendition.isDefault ? "YES" : "NO"]);
    }
    if (typeof this._rendition.forced != "undefined") {
      properties.push(["FORCED", this._rendition.forced ? "YES" : "NO"]);
    }
    if (typeof this._rendition.autoselect != "undefined") {
      properties.push([
        "AUTOSELECT",
        this._rendition.autoselect ? "YES" : "NO",
      ]);
    }
    if (this._rendition.characteristics) {
      properties.push([
        "CHARACTERISTICS",
        '"' + this._rendition.characteristics + '"',
      ]);
    }
    if (this._rendition.channels) {
      properties.push(["CHANNELS", '"' + this._rendition.channels + '"']);
    }
    if (this._rendition.instreamId) {
      properties.push(["INSTREAM-ID", '"' + this._rendition.instreamId + '"']);
    }
    if (this._rendition.uri) {
      properties.push(["URI", this.getUri(true)]);
    }
    out += "#EXT-X-MEDIA:TYPE=" + this._rendition.type + ",";
    for (let i: number = 0; i < properties.length; i++) {
      if (i > 0) {
        out += ",";
      }
      out += properties[i].join("=");
    }
    out += "\n";
    return out;
  }
}
