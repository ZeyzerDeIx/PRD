import { EventEmitter, Injectable } from '@angular/core';
import { Arc, City, Instance, Type, Tube } from '../include/modelClasses';
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
  public polylineUpdated:EventEmitter<Arc[]> = new EventEmitter();

  /**
   * Liste des couleures possibles pour les arcs.
   */
  public colors: string[] = this.generateRandomColors(4);
  generateRandomColors(numColors: number): string[] {
    const colors: string[] = [];
    const step = 360 / numColors; // Répartir uniformément les teintes

    for (let i = 0; i < numColors; i++) {
        const hue = i * step;
        const saturation = 100; // Saturation maximale pour des couleurs vives
        const lightness = 50; // Luminosité moyenne pour des couleurs équilibrées
        colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }

    // Convertir les couleurs HSL en RGB
    const rgbColors = colors.map(this.hslToRgb);
    return rgbColors;
  }

  hslToRgb(hsl: string): string {
    const [h, s, l] = hsl.match(/\d+/g)!.map(Number);
    const a = s * Math.min(l, 100 - l) / 100;
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color);
    };
    return `rgb(${f(0)/100},${f(8)/100},${f(4)/100})`;
  }

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

    this.polylineUpdated.emit(this.polylineArray);
  }

  public setArcOrigin(arc: Arc, newOrig: City): void{
    this.remArcIfIn(arc, arc.origin.outgoing_arcs);
    newOrig.outgoing_arcs.push(arc);
    arc.origin = newOrig;
  }

  public setArcDestination(arc: Arc, newDest: City): void{
    this.remArcIfIn(arc, arc.destination.incomming_arcs);
    newDest.incomming_arcs.push(arc);
    arc.destination = newDest;
  }

  public modifyArc(arc: Arc, newCoords: LatLngExpression[]): void{
    arc.polyline.setLatLngs(newCoords);

    this.polylineUpdated.emit(this.polylineArray);
  }

  public deleteArc(arc: Arc){
    if(this.map != undefined)
      this.map.removeLayer(arc.polyline);

    this.remArcIfIn(arc, arc.origin.outgoing_arcs);
    this.remArcIfIn(arc, arc.destination.incomming_arcs);
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
  public createPolyline(origin: City, destination: City, color: string): L.Polyline{

    var latlngs:LatLngExpression[] = [origin.position, destination.position];

    var polylineOptions = {color: color, weight: 3, opacity: 0.75};

    return L.polyline(latlngs, polylineOptions)
    .arrowheads({
      size: "16px",
      opacity: 0.75,
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


  /**
   * Vérifie qu'il existe bien un chemin entre la ville a et la ville b.
   * @param a Départ du chemin.
   * @param b Arrivé du chemin.
   * @returns true si le chemin existe, false sinon.
   */
  public pathExists(a: City, b: City, tube: Tube): boolean{
    if(a === b) return true;
    for(let arc of a.outgoing_arcs)
      if(arc.tube === tube && (arc.destination === b || this.pathExists(arc.destination, b, tube)))
        return true;
    return false;
  }

  /**
   * Retourne le chemin, s'il y en a un, entre la ville a et la ville b.
   * @param a Départ du chemin.
   * @param b Arrivé du chemin.
   * @returns La chaine d'arcs reliant les deux villes sous forme de tableau d'arcs. La liste est vide s'il n'y a pas de chemin.
   */
  public findPath(a: City, b: City, tube: Tube): Arc[]{
    if(a === b) return [];

    for(const arc of a.outgoing_arcs)
      if(arc.tube === tube){
        if(arc.destination === b)
          return [arc];
        
        const path: Arc[] = this.findPath(arc.destination, b, tube);
        if(path.length) return [arc, ...path]; //concaténation
      }

    return [];
  }
}
