import { EventEmitter, Injectable } from '@angular/core';
import { Arc } from './include/interfaces';

/**
 * Service pour gérer les arcs de la carte
 */
@Injectable({
  providedIn: 'root'
})
export class ArcService {

  /**
   * Ville de départ de la cohorte
   */
  private cohorteCity: string = "";

  /**
   * Liste des arcs
   */
  private polylineArray: Arc[] = [];

  /**
   * Permet de transmettre la liste des arcs à chaque modification de celle-ci
   */
  polylineUpdated:EventEmitter<Arc[]> = new EventEmitter();

  /**
   * Constructeur du service
   */
  constructor() { }

  /**
   * Renvoie la ville de départ de la cohorte
   * @returns La ville de départ de la cohorte
   */
  getCohorteCity(): string{
    return this.cohorteCity;
  }

  /**
   * Modifie la ville de départ de la cohorte
   * @param newCity La nouvelle ville de départ 
   */
  setCohorteCity(newCity: string){
    this.cohorteCity = newCity
  }

  /**
   * Renvoie la liste des arcs
   * @returns La liste des arcs
   */
  getPolylineArray(): Arc[]{
    return this.polylineArray;
  }

  /**
   * Modifie la liste des arcs et la transmet à tous les composants qui le demandent  
   * @param data La nouvelle liste d'arcs
   */
  setPolylineArray(data:Arc[]){
    //console.log(data);
    this.polylineArray = data;
    this.polylineUpdated.emit(this.polylineArray);
  }

  
}
