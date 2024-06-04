import { EventEmitter, Injectable } from '@angular/core';
import { Tube, City } from '../include/modelClasses';
import { ArcService } from '../services/arc.service';
import { iconDefault, iconViolet, iconEmph } from '../include/leaflet-icons';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private selectedTube: Tube = new Tube();
  selectedTubeUpdate: EventEmitter<Tube> = new EventEmitter();

  constructor(private arcService: ArcService) { }

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

  /**
   * Met en évidence le marker d'une ville.
   * @param city La ville à mettre en évidence.
   * @param emph Vrai par defaut, si faux, la mise en évidence est inversé, c'est à dire que l'on redonne un logo normal pour le marker.
   */
  public toggleCityEmphathize(city: City, emph: boolean = true):void{
    if(city.marker == null) return;
    
    if(emph) city.marker.setIcon(iconEmph);
    else if(city == this.selectedTube.type.cohorte.city) city.marker.setIcon(iconViolet);
    else city.marker.setIcon(iconDefault);

    for(let arc of this.arcService.findPath(this.selectedTube.type.cohorte.city, city, this.selectedTube))
      this.arcService.toggleArcEmphathize(arc, emph);
  }
}
