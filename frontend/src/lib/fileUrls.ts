import { getServerUrl } from './serverUrl';

export function fileViewUrl(roomId: string, fileId: string): string {
  return `${getServerUrl()}/api/rooms/${roomId}/files/${fileId}/view`;
}

export function fileDownloadUrl(roomId: string, fileId: string): string {
  return `${getServerUrl()}/api/rooms/${roomId}/files/${fileId}/download`;
}
