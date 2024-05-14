// data-displayer.component.ts

import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { InstanceService } from '../instance.service';
import { Instance, Tube, City } from '../include/modelClasses';
import { DataService } from '../data.service';
import { NgIf, NgFor } from '@angular/common';
import L from 'leaflet';
import { iconDefault, iconViolet, iconEmph } from '../include/leaflet-icons';

@Component({
  selector: 'app-data-displayer',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './data-displayer.component.html',
  styleUrls: ['./data-displayer.component.scss']
})
export class DataDisplayerComponent implements OnInit {

  /**
   * Instance provenant de InstanceService (Initialisée en amont depuis le service même)
   */
  instance: Instance = this.instanceService.getInstance();
  selectedTube: Tube = new Tube();
  isInfoBoxOpen: boolean = false;
  @ViewChild('infoContent') infoContent!: ElementRef;

  get toggleButtonText(): string {
    return this.isInfoBoxOpen ? 'Fermer' : 'Afficher';
  }
  get infoBoxHeight(): number {
    return this.isInfoBoxOpen ? this.infoContent.nativeElement.scrollHeight : 0;
  }

  toggleInfoBox(event: any) {
    this.isInfoBoxOpen = event.target.checked;
  }

  /**
   * Constructeur du composant
   * @param instanceService Service permettant de créer l'objet Instance
   * @param dataService Service permettant de communiquer les données importantes à afficher
   */
  constructor(private instanceService:InstanceService, private dataService: DataService){
  }

  ngOnInit(): void {
    this.dataService.selectedTubeUpdate.subscribe(this.onSelectedTubeUpdate.bind(this));
  }

  private onSelectedTubeUpdate(newTube: Tube){
    this.selectedTube = newTube;
    this.updateTubeCities();
    this.caculateAlicotagesNb();
  }

  private updateTubeCities(): void{
    this.selectedTube.cities = [];
    for(let arc of this.selectedTube.arcs){
      if(!this.selectedTube.cities.includes(arc.origin)){
        this.selectedTube.cities.push(arc.origin);
      }
      if(!this.selectedTube.cities.includes(arc.destination)){
        this.selectedTube.cities.push(arc.destination);
      }
    }
  }

  private caculateAlicotagesNb(): void{
    if(this.instance.solution != null)
      this.instance.solution.nbAlico = 0;
    for(let cohorte of this.instance.cohortes)
      for(let type of cohorte.types)
        for(let tube of type.tubes)
          tube.nbAlico = 0;

    for(let city of this.instance.cities){
      var nbOfArcsbyTube: Map<Tube, number> = new Map();
      for(let arc of city.outgoing_arcs){
        if(!nbOfArcsbyTube.has(arc.tube))
          nbOfArcsbyTube.set(arc.tube, 0);
        var curVal: number = nbOfArcsbyTube.get(arc.tube) as number;
        nbOfArcsbyTube.set(arc.tube, curVal+1);
      }
      for(let [key, value] of nbOfArcsbyTube){
        if(value > 1 && this.instance.solution != null){
          this.instance.solution.nbAlico += value-1;
          key.nbAlico += value-1;
        }
      }
    }
  }

  public toggleCityEmphathize(city: City, emph: boolean = true):void{
    if(city.marker == null) return;
    
    if(emph) city.marker.setIcon(iconEmph);
    else if(city.selected) city.marker.setIcon(iconViolet);
    else city.marker.setIcon(iconDefault);
  }

}
