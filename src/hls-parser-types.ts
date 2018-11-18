/**
 * hls-parser Types
 * 
 * This library doesn't have TypeScript definitions that I can find, so this covers us
 * 
 * https://www.npmjs.com/package/hls-parser
 * 
 */

export interface iCurrentRenditions {
    audio: number,
    video: number,
    subtitles: number,
    closedCaptions: number
}

export interface iResolution {
    width: number,
    height: number
}

export interface iSegment {
    type: string,
    url: string,
    mimeType: string,
    duration: number,
    title: string,
    byterange: any,
    discontinuity: string,
    mediaSequenceNumber: number,
    discontinuitySequence: number,
    key: string,
    map: string,
    programDateTime: string,
    dateRange: string
}

export interface iMediaTrack {
    type: string,
    uri: string,
    groupId: string,
    language: string,
    assocLanguage: string,
    name: string,
    isDefault: boolean,
    autoselect: boolean,
    forced: boolean,
    instreamId: string,
    characteristics: string,
    channels: string
}

export interface iVariant {
    uri: string,
    isIFrameOnly: boolean,
    bandwidth: number,
    averageBandwidth: number,
    codecs: string,
    resolution: iResolution,
    frameRate: number,
    hdcpLevel: string,
    audio: iMediaTrack[],
    video: iMediaTrack[],
    subtitles: iMediaTrack[],
    closedCaptions: iMediaTrack[],
    currentRenditions: iCurrentRenditions
}

export interface iMediaPlaylist {
    type: string,
    isMasterPlaylist: boolean,
    uri: string,
    version: number,
    independentSegments: boolean,
    start: string,
    source: string,
    targetDuration: number,
    mediaSequenceBase: number,
    discontinuitySequenceBase: number,
    endlist: boolean,
    playlistType: string,
    isIFrame: boolean,
    segments: iSegment[],
    hash: string
}

export interface iMasterPlaylist {
    type: string,
    isMasterPlaylist: boolean,
    uri: string,
    version: number,
    independentSegments: boolean,
    start: string,
    source: string,
    variants: iVariant[],
    currentVariant: string,
    sessionDataList: any[],
    sessionKeyList: any[]
}

export interface iGenericPlaylist {
    type: string,
    isMasterPlaylist: boolean,
    uri: string,
    version: number,
    independentSegments: boolean,
    start: string,
    source: string
}