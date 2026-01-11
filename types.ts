
export enum MediaQuality {
  AUDIO = 'AUDIO',
  HD_720P = '720p',
  FHD_1080P = '1080p',
  UHD_4K = '4K'
}

export interface MediaOption {
  quality: MediaQuality;
  label: string;
  size: string;
  format: string;
  downloadUrl: string;
}

export interface MediaMetadata {
  title: string;
  platform: string;
  thumbnail: string;
  duration: string;
  author: string;
  summary: string;
  tags: string[];
  options: MediaOption[];
}

export interface DownloadHistoryItem {
  id: string;
  title: string;
  timestamp: number;
  quality: MediaQuality;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
