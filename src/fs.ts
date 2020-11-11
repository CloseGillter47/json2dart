/* eslint-disable @typescript-eslint/naming-convention */

import { workspace } from 'vscode';

import * as FS from 'fs';
import * as Path from 'path';

type WorkspaceType = string | null;

export interface Sfile {
  ext: string;
  name: string;
  path: string;
  isFile: boolean;

  [key: string]: any;
}

export class FileOS {

  public static get workspace (): WorkspaceType {
    const { workspaceFolders: folders } = workspace;
    if (!folders) return null;

    const [folder,] = folders;

    return folder?.uri?.fsPath ?? null;
  }

  /**
   * combinePath
   */
  public static combinePath (...paths: string[]): string {
    return paths ? Path.resolve(...paths) : '';
  }

  /**
   * existsFileAsync
   */
  public static existFileAsync (file: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!file) resolve(false);
      FS.access(file, FS.constants.F_OK | FS.constants.W_OK | FS.constants.R_OK, (err) => {
        if (err) return resolve(false);

        return resolve(true);
      });
    });
  }

  /**
   * readFileAsync
   */
  public static async readFileAsync (file: string, encoding: string = 'utf-8'): Promise<string> {
    if (await FileOS.existFileAsync(file)) {
      return new Promise((resolve, reject) => {
        FS.readFile(file, (err, buffer) => {
          if (err || !buffer) return resolve('');

          resolve(buffer.toString(encoding));
        });
      });
    }

    return '';
  }

  /**
   * writeFileAsync
   */
  public static async writeFileAsync (file: string, data: string): Promise<boolean> {
    if (!file) return false;
    // 文件已存在
    if (await FileOS.existFileAsync(file)) {
      // 文件无法删除
      if (!await FileOS.deleteFileAsync(file)) return false;
    }

    return new Promise<boolean>((resolve, reject) => {
      FS.writeFile(file, data, (err) => {
        resolve(!err);
      });
    });
  }

  /**
   * deleteFileAsync
   */
  public static async deleteFileAsync (file: string): Promise<boolean> {
    if (await FileOS.existFileAsync(file)) {
      return new Promise((resolve, reject) => {
        FS.unlink(file, (err) => {
          resolve(!err);
        });
      });
    }

    return true;
  }

  /**
   * createFolderAsync
   */
  public static async createFolderAsync (folder: string, exits?: string) {
    if (!folder) return;
    let target: string = folder;
    if (exits && folder.startsWith(exits)) {
      target = folder.replace(exits, '');
    }
    let output = exits || '';
    const folders = target.split('/');
    for await (const folder of folders) {
      output = Path.resolve(output, folder);
      if (!await FileOS.existFileAsync(output)) FS.mkdirSync(output);
    }
  }

  /**
   * listFileAsync
   */
  public static async listFileAsync (folder: string): Promise<Sfile[]> {
    if (!folder) return [];
    if (!await FileOS.existFileAsync(folder)) return [];

    return new Promise<Sfile[]>((resolve, reject) => {
      FS.readdir(folder, (err, files) => {
        if (err) return resolve([]);

        const list = files.map<Sfile>((file) => ({
          ext: Path.extname(file),
          name: Path.basename(file).replace(Path.extname(file), ''),
          path: Path.join(folder, file),
          isFile: FS.statSync(Path.join(folder, file)).isFile(),
        }));

        resolve(list);
      });
    });
  }

}