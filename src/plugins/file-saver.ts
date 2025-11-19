import { registerPlugin } from '@capacitor/core';

interface FileSaverPlugin {
  saveBase64ToDownloads(options: {
    dataUrl: string;
  }): Promise<{ filepath: string }>;
}

const FileSaver = registerPlugin<FileSaverPlugin>('FileSaver');

export default FileSaver;
