// data-displayer.component.ts

import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { InstanceService } from '../services/instance.service';
import { Instance, Tube, City } from '../include/modelClasses';
import { DataService } from '../services/data.service';
import { NgIf, NgFor } from '@angular/common';
import L from 'leaflet';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms'; 

/**
 * Ce composant permet l'affichage de donnée utiles pour mieux comprendre l'état actuelle de la solution ou pour faire du débuggage.
 */
@Component({
  selector: 'app-data-displayer',
  standalone: true,
  imports: [NgIf, NgFor, MatCheckboxModule, FormsModule],
  templateUrl: './data-displayer.component.html',
  styleUrls: ['./data-displayer.component.scss']
})
export class DataDisplayerComponent implements AfterViewInit {

  /**
   * Instance provenant de InstanceService (Initialisée en amont depuis le service même)
   */
  instance: Instance = new Instance;

  /**
   * Le tube actuellement selectionné par l'utilisateur.
   * Source des informations à afficher.
   */
  selectedTube: Tube = new Tube();

  /**
   * Si oui ou non la boite d'information est ouverte.
   */
  isInfoBoxOpen: boolean = false;

  /**
   * Permet de connaître le volume totale que demande la solution au tube selectionné. Utilisé par la template d'affichage.
   * NB: Peut également être un string en cas d'erreur (pour afficher "erreur" justement).
   */
  requiredVolume: number|string = 0;

  maxAlCity: City = new City();

  /**
   * Cet élément fait le lien avec la template et permet de récupérer des informations sur la taille de la boite notament.
   */
  @ViewChild('infoContent') infoContent!: ElementRef;

  /**
   * Permet à la page d'actualiser le texte de toggle.
   * Cette méthode est utilisée par la template d'affichage.
   * @returns "Fermer" si la boite est ouverte, "Afficher" sinon.
   */
  get toggleButtonText(): string {
    return this.isInfoBoxOpen ? 'Fermer' : 'Afficher';
  }

  get totalFreeze(): number {
    var totalFreeze: number = 0;
    for(let cohorte of this.instance.cohortes)
      for(let type of cohorte.types)
        for(let tube of type.tubes)
          totalFreeze += tube.arcs.length;
    return totalFreeze;
  }

  /**
   * Permet de récupérer la demande d'une ville pour le type du tube selectionné.
   * Cette méthode est utilisée par la template d'affichage.
   * @param city La ville dont on souhaite connaître la demande.
   * @returns La demande de la ville en entrée pour le type du tube selectionné.
   */
  public cityDemande(city: City): number {
    return city.demandes.get(this.selectedTube.type.name) as number;
  }

  /**
   * Permet de changer l'état de la boite d'information entre ouverte et fermée.
   * Cette méthode est utilisée par la template d'affichage.
   * @param event L'évennement déclanché. Permet de connaître l'état de la checkbox.
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
  /**
   * Est appelé à chaque fois que le tube selectionné est update.
   * Permet de mettre à jour les donnée et leur affichage.
   * @param newTube Le nouveau tube s'il a changé, le même qu'avant sinon (valeur par defaut).
   */
  private onSelectedTubeUpdate(newTube: Tube = this.selectedTube): void{
    this.selectedTube = newTube;
    try{
      this.requiredVolume = this.instanceService.requiredVolumeByTube(this.selectedTube.type.cohorte.city, this.selectedTube);
    } catch(error: any){
      this.requiredVolume = "Erreur";
    }
    this.updateTubeCities();
    this.maxAlCity = this.dataService.caculateAlicotagesNb(this.instance);
  }

  /**
   * Met à jour la liste des villes visitées par le tuube selectionnée.
   */
  public updateTubeCities(): void{
    this.selectedTube.cities = [];
    for(let arc of this.selectedTube.arcs){
      this.addCity(arc.origin);
      this.addCity(arc.destination);
    }
  }

  /**
   * Permet d'ajouter une ville au tube en vérifiant qu'elle n'y est pas déjà et qu'elle prélève bien le tube.
   * @param city Ville à vérifier et ajouter.
   */
  private addCity(city: City): void{
    var t = this.selectedTube;
    if(!t.cities.includes(city) && (city != t.type.cohorte.city || t.usedByCohorte))
        t.cities.push(city);
  }

  /**
   * Met en évidence le marker d'une ville.
   * @param city La ville à mettre en évidence.
   * @param emph Vrai par defaut, si faux, la mise en évidence est inversé, c'est à dire que l'on redonne un logo normal pour le marker.
   */
  public toggleCityEmphathize(city: City, emph: boolean = true):void{
    this.dataService.toggleCityEmphathize(city, emph);
  }

  async ngAfterViewInit(): Promise<void>{
    this.dataService.selectedTubeUpdate.subscribe(this.onSelectedTubeUpdate.bind(this));

    //on attend que l'instance puisse être récupérée
    this.instance = await this.instanceService.getInstance();
    
    this.maxAlCity = this.dataService.caculateAlicotagesNb(this.instance);
  }
}
