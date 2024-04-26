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
    this.dataService.selectedTubeUpdate.subscribe(this.onSelectedTubeUpdate);
  }

  private onSelectedTubeUpdate(newTube: Tube){
    this.selectedTube = newTube;
  }

  public toggleCityEmphathize(city: City, emph: boolean = true):void{
    if(city.marker == null) return;
    
    if(emph) city.marker.setIcon(iconEmph);
    else if(city.selected) city.marker.setIcon(iconViolet);
    else city.marker.setIcon(iconDefault);
  }

}
