import { EventEmitter, Injectable } from '@angular/core';
import { Arc, City, Instance } from './include/modelClasses';
import L, { LatLngExpression } from 'leaflet';

/**
 * Service pour gérer les arcs de la carte
 */
@Injectable({
  providedIn: 'root'
})
export class ArcService {
  map: L.Map | undefined = undefined;

  /**
   * Ville de départ de la cohorte
   */
  private cohorteCity: City = new City();

  /**
   * Liste des arcs du tube courrant
   * NB: Il s'agit d'une référence, toute modification entrainerat une modification de la liste arcs du tube.
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
  getCohorteCity(): City{
    return this.cohorteCity;
  }

  /**
   * Modifie la ville de départ de la cohorte
   * @param newCity La nouvelle ville de départ 
   */
  setCohorteCity(newCity: City){
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
    this.polylineArray = data;
    this.polylineUpdated.emit(this.polylineArray);
  }

  addArc(arc: Arc){
    this.polylineArray.push(arc);
    if(this.map != undefined)
      arc.polyline.addTo(this.map);
    arc.origin.arcs.push(arc);

    this.polylineUpdated.emit(this.polylineArray);
  }

  public setArcOrigin(arc: Arc, newOrig: City): void{
    this.remArcIfIn(arc, arc.origin.arcs);
    newOrig.arcs.push(arc);
    arc.origin = newOrig;
  }

  public setArcDestination(arc: Arc, newDest: City): void{
    arc.destination = newDest;
  }

  public modifyArc(arc: Arc, newCoords: LatLngExpression[]): void{
    arc.polyline.setLatLngs(newCoords);

    this.polylineUpdated.emit(this.polylineArray);
  }

  public deleteArc(arc: Arc){
    if(this.map != undefined)
      this.map.removeLayer(arc.polyline);

    this.remArcIfIn(arc, arc.origin.arcs);
    this.remArcIfIn(arc, this.polylineArray);
    this.remArcIfIn(arc, arc.tube.arcs);
    
    this.polylineUpdated.emit(this.polylineArray);
  }

  private remArcIfIn(arc: Arc, arcs: Arc[]): void{
    const index: number = arcs.indexOf(arc);
    if(index != -1) arcs.splice(index, 1);
  }

  /**
   * Créer une Polyline
   * @param origin La ville d'origine de l'arc/la polyline
   * @param destination La ville de destination de l'arc/la polyline
   * @param color La couleur d'affichage de la polyline
   */
  public createPolyline(origin: City, destination: City, color: string, pos: Map<string,number[]>): L.Polyline{
    
    var originPoint: LatLngExpression = 
    [pos.get(origin.name)![0], pos.get(origin.name)![1]];

    var destinationPoint: LatLngExpression = 
    [pos.get(destination.name)![0], pos.get(destination.name)![1]];

    var latlngs:LatLngExpression[] = [originPoint, destinationPoint];

    var polylineOptions = {color: color, weight: 4, opacity: 0.5};

    return L.polyline(latlngs, polylineOptions)
    .arrowheads({
      size: "25px",
      opacity: 0.5,
      fill: false,
      yawn: 75,
      offsets: {end: '75px'}
    });
  }

  /**
   * Dessine les arcs en entrée sur la carte
   * @param arcs les arcs déssiner
   */
  public drawPolylines(arcs: Arc[]){
    if(this.map == undefined) return;

    for (const arc of arcs)
      arc.polyline.addTo(this.map);
    this.updatePolylineQuantities(arcs);
  }

  /**
   * Update les quantité affiché sur les arcs de la carte
   * @param arcs les arcs dont la quantité est à update
   */
  public updatePolylineQuantities(arcs: Arc[]){
    for (const arc of arcs)
      arc.polyline.bindTooltip(`<div>Flux : ${ arc.quantity }</div>`);
  }
}
