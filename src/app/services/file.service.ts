import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';

/**
 * Ce service sert uniquement à gérer les fichiers. Il permet notament d'enregistrer une solution sous forme de fichier txt.
 */
@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor() {}

  /**
   * Permet de télécharger un fichier chez le client.
   * @param content Le contenu du fichier à créer.
   * @parem fileName Le nom du fichier, l'extension est importante.
   */
  downloadFile(content: string, fileName: string): void {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, fileName);
  }
}
