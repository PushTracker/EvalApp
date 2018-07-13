import { Injectable } from '@angular/core';
import * as Kinvey from 'kinvey-nativescript-sdk';
import * as localStorage from 'nativescript-localstorage';
import * as fs from 'tns-core-modules/file-system';
import * as http from 'tns-core-modules/http';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class FileService {
  constructor(private _translateService: TranslateService) {}

  private static fsKeyMetadata = 'Metadata';

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
        const downloadedFile = await http.getFile(file._downloadURL, filePath).catch(err => {
          console.log('error http.getFile', err);
        });

        this._translateService.reloadLang('es');

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
}
