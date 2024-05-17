// data-displayer.component.ts

import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { InstanceService } from '../services/instance.service';
import { Instance, Tube, City } from '../include/modelClasses';
import { DataService } from '../services/data.service';
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

  /**
   * Permet à la page d'actualiser le texte de toggle.
   */
  get toggleButtonText(): string {
    return this.isInfoBoxOpen ? 'Fermer' : 'Afficher';
  }

  /**
   * Permet une animation plus fluide en ajustant la taille de la boite d'affichage.
   */
  get infoBoxHeight(): number {
    return this.isInfoBoxOpen ? this.infoContent.nativeElement.scrollHeight : 0;
  }

  /**
   * Permet de changer l'état de la boite d'information entre ouverte et fermée.
   */
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

  async ngOnInit(): Promise<void> {
    this.dataService.selectedTubeUpdate.subscribe(this.onSelectedTubeUpdate.bind(this));

    //on attend que le instance service soit initialisé
    while(!this.instanceService.getIsInitialized())
      await new Promise(resolve => setTimeout(resolve, 10));

    this.caculateAlicotagesNb();
  }

  /**
   * Est appelé à chaque fois que le tube selectionné est update.
   * Permet de mettre à jour les donnée et leur affichage.
   */
  private onSelectedTubeUpdate(newTube: Tube){
    this.selectedTube = newTube;
    this.updateTubeCities();
    this.caculateAlicotagesNb();
  }

  /**
   * Met à jour la liste des villes visitées par le tuube selectionnée.
   */
  private updateTubeCities(): void{
    this.selectedTube.cities = [];
    for(let arc of this.selectedTube.arcs){
      if(!this.selectedTube.cities.includes(arc.origin))
        this.selectedTube.cities.push(arc.origin);
      if(!this.selectedTube.cities.includes(arc.destination))
        this.selectedTube.cities.push(arc.destination);
    }
  }

  /**
   * Calcul le nombre d'alicotage de chaque tube ainsi que de la solution pour les mettres à jour.
   */
  private caculateAlicotagesNb(): void{
    //on reinitialise tout les nombres d'alico à 0 pour les recalculer
    this.instance.solution!.nbAlico = 0;
    for(let cohorte of this.instance.cohortes)
      for(let type of cohorte.types)
        for(let tube of type.tubes)
          tube.nbAlico = 0;

    for(let city of this.instance.cities){
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
      for(let [key, value] of arcsByTube){
          this.instance.solution!.nbAlico += value-1;
          key.nbAlico += value-1;
      }
    }
  }

  /**
   * Met en évidence le marker d'une ville.
   * @param city La ville à mettre en évidence.
   * @param emph Vrai par defaut, si faux, la mise en évidence est inversé, c'est à dire que l'on redonne un logo normal pour le marker.
   */
  public toggleCityEmphathize(city: City, emph: boolean = true):void{
    if(city.marker == null) return;
    
    if(emph) city.marker.setIcon(iconEmph);
    else if(city.selected) city.marker.setIcon(iconViolet);
    else city.marker.setIcon(iconDefault);
  }

}
