import { EventEmitter, Injectable } from '@angular/core';
import { Tube } from '../include/modelClasses';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private selectedTube: Tube = new Tube();
  selectedTubeUpdate: EventEmitter<Tube> = new EventEmitter();

  constructor() { }

  public setSelectedTube(tube: Tube): void{
    this.selectedTube = tube;
    this.selectedTubeUpdate.emit(this.selectedTube);
  }

  public getSelectedTube(): Tube{
    return this.selectedTube;
  }

  public tubeUpdated(): void{
    this.selectedTubeUpdate.emit(this.selectedTube);
  }
}
