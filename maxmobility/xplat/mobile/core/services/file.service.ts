import { Injectable } from '@angular/core';
import * as Kinvey from 'kinvey-nativescript-sdk';
import * as localStorage from 'nativescript-localstorage';
import * as fs from 'tns-core-modules/file-system';
import * as http from 'tns-core-modules/http';

@Injectable()
export class FileService {
  private static fsKeyMetadata = 'Metadata';
  private static TranslationKey = 'TranslationFile';

  /**
   * Downloads the i18n json translation files from the Kinvey account and saves to the `assets/i18n/` directory that the ngx TranslateService will use to load files.
   */
  async downloadTranslationFiles() {
    console.log('===== userService.downloadTranslationFiles ====');
    // query Kinvey Files for all translation files
    const query = new Kinvey.Query();
    query.equalTo('translation_file', true);
    const files = await Kinvey.Files.find(query);

    if (files.length >= 1) {
      files.forEach(async file => {
        // check if we have the latest version of the translation files
        // if so then just return and move to the next file in the loop

        const data = localStorage.getItem(`${file._filename}-${FileService.fsKeyMetadata}`);
        console.log(`file ${file._filename} stored metadata`, JSON.stringify(data));
        if (data && data.file_version === file._version) {
          return;
        }

        const filePath = fs.path.join(fs.knownFolders.currentApp().path, `assets/i18n/${file._filename}`);
        http.getFile(file._downloadURL, filePath).catch(err => {
          console.log('error http.getFile', err);
        });

        console.log(`Downloaded ${file._filename} successfully!`);

        // save the file metadata since we just downloaded the file and stored it
        this._saveFileMetaData(file);
      });
    }
  }

  private _saveFileMetaData(file: Kinvey.File) {
    console.log(JSON.stringify(file));
    const metadata = {
      file_version: file._version
    };

    localStorage.setItem(`${file._filename}-${FileService.fsKeyMetadata}`, metadata);
  }

  // /**
  //  * Checks the file version against the last downloaded version.
  //  * If we do not have the latest version we will download.
  //  * @param file
  //  * @returns {boolean}
  //  */
  // private _shouldDownloadFile(file): boolean {
  //   const data = localStorage.getItem(`${file.name}-${FileService.fsKeyMetadata}`);
  //   console.log('storage data', JSON.stringify(data));
  //   if (!data) {
  //     console.log('no data for the file so we need to download it', file);
  //     return true;
  //   }

  //   const result = data.file_version === file._version ? false : true;
  //   return result;
  // }
}
