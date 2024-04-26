// data-displayer.component.ts

import { Component, OnInit } from '@angular/core';
import { InstanceService } from '../instance.service';
import { Instance, Tube } from '../include/modelClasses';
import { DataService } from '../data.service';
import { NgIf, NgFor } from '@angular/common';

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

  get toggleButtonText(): string {
    return this.isInfoBoxOpen ? 'Fermer' : 'Afficher';
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

}
