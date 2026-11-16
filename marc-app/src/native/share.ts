import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { isNative } from './capacitor';

/** Save text on Android through the share sheet, or download it on the web. */
export async function exportText(fileName: string, text: string, mime = 'application/json'): Promise<string> {
  if (isNative()) {
    const path = `MARC Exports/${fileName}`;
    await Filesystem.writeFile({ path, data: text, directory: Directory.Cache, recursive: true, encoding: 'utf8' as never });
    const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache });
    await Share.share({ title: fileName, url: uri, dialogTitle: 'Save or share your backup' });
    return `Android save/share sheet opened for ${fileName}.`;
  }
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fileName; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return `Downloaded ${fileName}.`;
}

export function pickFile(accept = 'application/json'): Promise<string | null> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = accept;
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return resolve(null);
      f.text().then(resolve, () => resolve(null));
    };
    input.click();
  });
}
