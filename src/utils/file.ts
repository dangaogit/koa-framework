import fs from 'fs';
import PathUtil from 'path';

/**
 * 文件操作尽量使用异步操作，通过新特性`async await`来达到代码简洁的效果，避免不必要的阻塞
 */
export namespace FileUtils {

  export type PathInfo = FileInfo | DirInfo;
  export interface FileInfo {
    path: string;
    name: string;
    isDir: false;
  }
  export interface DirInfo {
    path: string;
    isDir: true;
    name: string;
    children: PathInfo[];
  }

  export async function readDir(path: string) {
    const result: PathInfo[] = [];
    if (!await isDir(path)) {
      throw '该路径不是一个目录';
    }

    const list = await new Promise<string[]>((resolve, reject) => {
      fs.readdir(path, (err, stats) => {
        err ? reject(err) : resolve(stats);
      })
    })

    for (let li of list) {
      const li_path = PathUtil.resolve(path, li);
      const is_dir = await isDir(li_path);
      if (is_dir) {
        result.push({
          path: li_path,
          isDir: is_dir,
          name: li,
          children: await readDir(li_path)
        })
      }
      else {
        result.push({
          path: li_path,
          name: li,
          isDir: is_dir
        })
      }
    }
    return result;
  }

  export function isDir(path: string) {
    return new Promise<boolean>((resolve, reject) => {
      fs.lstat(path, (err, stats) => {
        err ? reject(err) : resolve(stats.isDirectory());
      })
    })
  }
}