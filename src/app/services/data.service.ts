import { EventEmitter, Injectable } from '@angular/core';
import { Tube, City, Instance } from '../include/modelClasses';
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

  /**
   * Calcul le nombre d'alicotage de chaque tube ainsi que de la solution pour les mettres à jour.
   * 
   * @returns La ville ayant le plus d'alicotages.
   */
  public caculateAlicotagesNb(instance: Instance): City{
    if(instance.solution == null) return new City();

    var maxAlCity: City = new City();

    //on reinitialise tout les nombres d'alico à 0 pour les recalculer
    instance.solution.nbAlico = 0;
    for(let cohorte of instance.cohortes)
      for(let type of cohorte.types)
        for(let tube of type.tubes)
          tube.nbAlico = 0;

    for(let city of instance.cities){
      //le nombre d'arc sortant de la ville courrante par tube sous forme de map
      var arcsByTube: Map<Tube, number> = new Map();

      //on compte le nombre d'arcs sortants par tube
      for(let arc of city.outgoing_arcs){
        if(!arcsByTube.has(arc.tube))
          arcsByTube.set(arc.tube, 0);
        var curVal: number = arcsByTube.get(arc.tube) as number;
        arcsByTube.set(arc.tube, curVal+1);
      }

      //pour tous tube ayant + d'un arc sortant, les arcs supplémentaires sont compté comme +1 alicotage
      for(let [tube, arcCount] of arcsByTube){
        const nbAlico = tube.type.cohorte.patientCount!*(arcCount-1);
        instance.solution!.nbAlico += nbAlico;
        city.nbAlico += nbAlico;
        tube.nbAlico += nbAlico;
      }
      if(city.nbAlico > maxAlCity.nbAlico)
        maxAlCity = city;
    }
    return maxAlCity;
  }
}
