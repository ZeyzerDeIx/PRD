import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor() {}

  downloadFile(content: string, fileName: string): void {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, fileName);
  }
}
