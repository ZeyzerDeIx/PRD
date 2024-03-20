import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet-arrowheads';
import { Solution, City, Cohorte, Arc } from './include/interfaces';

/**
 * Service gérant la construction de la solution
 */
@Injectable({
  providedIn: 'root'
})
export class SolutionService {
  // TODO: Les données de la carte (villes ect...) sont créées manuellement, peut-être pouvoir choisir la liste des villes ?
  /**
   * URL des données de la carte
   */
  private mapDataUrl:string = "assets/map_data/map.geojson";

  /**
   * URL de l'instance d'entrée du modèle
   */
  private instanceUrl:string = "assets/solution_data/instance.txt";

  /**
   * URL de la solution proposée par le modèle
   */
  private instanceSolutionUrl:string = "assets/solution_data/solution_instance.txt";

  // TODO: Les types de tubes sont créées manuellement, peut-être pouvoir choisir la liste des types ?
  /**
   * Liste des types de tube différents
   */
  private types:string[] = ["LCR","SER","PLA"];

  /**
   * Tableau contenant la position des marqueurs associés à chaque ville
   */
  private citiesPosition: Map<string,number[]>;

  /**
   * Contient la solution proposée par le modèle sous la forme d'un objet Solution
   */
  private solution: Solution;

  /**
   * Constructeur du service
   * @param http Client HTTP permettant de faire les requêtes pour récupérer les données via les fichiers txt
   */
  constructor(protected http:HttpClient) {
    this.citiesPosition = this.parseCitiesPosition();
    this.solution = this.parseSolution();
  }

  /**
   * Renvoie les données de la carte
   * @returns Les données de la carte sous la forme d'un Observable
   */
  private getMapData(){
    return this.http.get(this.mapDataUrl);
  }

  /** 
   * Renvoie l'instance texte en entrée du modèle
   * @returns L'instance texte en entrée du modèle sous la forme d'un Observable
   */
  private getInstance(){
    return this.http.get(this.instanceUrl, { responseType: 'text'});
  }

  /**
   * Renvoie la solution texte proposée par le modèle
   * @returns La solution texte proposée par le modèle sous la forme d'un Observable
   */
  private getInstanceSolution(){
    return this.http.get(this.instanceSolutionUrl, { responseType: 'text'});
  }

  /**
   * Renvoie la position des marqueurs de chaque ville
   * @returns Un tableau contenant la position des marqueurs associés à chaque ville
   */
  public getCitiesPosition(): Map<string, number[]> {
    return this.citiesPosition;
  }

  /**
   * Renvoie la solution proposée par le modèle
   * @returns La solution proposée par le modèle sous la forme d'un objet Solution
   */
  public getSolution(): Solution{
    return this.solution;
  }

  /**
   * Ajoute les marqueurs associés à chaque ville sur la carte Leaflet
   * @param map Carte sur laquelle ajouter les marqueurs
   * @param cities Tableau des villes à ajouter
   * @returns La liste des marqueurs créés
   */
  public drawCities(map: L.Map, cities:City[]): L.Marker[]{ 
    var markersArray: L.Marker[] = [];
    setTimeout(() => {
      for (const city of cities) {
        // Ugly line to work around "LatLngExpression is not assignable to number | any | undefined..."
        let latlngs:LatLngExpression = [this.citiesPosition.get(city.name)![0], this.citiesPosition.get(city.name)![1]];

        const marker = L.marker(latlngs, {alt: city.name});

        // Ajout du marqueur à la cart
        marker.addTo(map);

        markersArray.push(marker);
      }
    }, 500);
    
    return markersArray;
  }

  /**
   * Initialise le tableau des villes grâce aux données de la carte
   * @returns La liste des villes
   */
  private parseCities(): City[]{
    var cities:City[] = [];
    setTimeout(() => {
      this.getMapData().subscribe((data:any) => {
        for (const city of data.features) {
          const name = city.properties.name;
          const id = city.id; 
          var cityToAdd: City = {
            name: name,
            id: id,
            cohorte: false
          }
          cities.push(cityToAdd);
        }
      });
    }, 200);
    
    return cities;
  }

  /**
   * Initialise la position des marqueurs associés à chaque ville depuis les données de la carte
   * @returns La liste des positions des marqueurs associés à chaque ville
   */
  private parseCitiesPosition(): Map<string, number[]>{
    let citiesPosition: Map<string, number[]> = new Map();
    setTimeout((() =>{
      this.getMapData().subscribe((cities:any) => {
        for (const city of cities.features) {
          const lat = city.geometry.coordinates[0];
          const lon = city.geometry.coordinates[1];
          const name = city.properties.name; 
          
          citiesPosition.set(name, [lat,lon]);
        }
      });
    }),100);
    
    return citiesPosition;
  }

  /**
   * Initialise la solution
   * @returns La solution proposée par le mèdle sous la forme d'un objet Solution
   */
  private parseSolution(): Solution{
    var solution:Solution = {
      cities: this.parseCities(),
      // TODO: Adapter en fonction du nombre de types donné par l'instance du modèle
      types: this.types.slice(0,2),
      cohortes: [],
      demande: new Map<string, Map<string, number>>()
    }

    setTimeout(() =>{
      this.getInstance().subscribe(data => {
        var textLines = data.split('\n');
        var nbVilles = Number(textLines[0]);
        var nbCohortes = Number(textLines[1]);
        var cohorteVilleline = textLines[2].split('\t');
        var cohorteNbPatientsline = textLines[3].split('\t');
        for (var i = 0; i < nbCohortes; i++){
          var villeId = Number(cohorteVilleline[i]) - 1;
          solution.cities[villeId].cohorte = true;
          solution.cohortes.push({
            nbPatients: Number(cohorteNbPatientsline[i]),
            city: solution.cities[villeId].name,
            types: []
          });
        }

        var nbTypes = Number(textLines[4]);
        var nbTubes = Number(textLines[5]);
        for(var i = 0; i < nbCohortes; i++){
          for(var j = 0; j < nbTypes; j++){
            solution.cohortes[i].types.push({
              name: this.types[j],
              tubes: []
            });
            var volumeTubesLine = textLines[6+i*nbCohortes+j].split('\t');
            for(var k = 0; k < nbTubes; k++){
              solution.cohortes[i].types[j].tubes.push({
                number: k+1,
                volume: Number(volumeTubesLine[k]),
                arcs: []
              });

            }
          }
        }

        for(var i = 0; i < nbVilles; i++){
          solution.demande.set(solution.cities[i].name, new Map<string, number>());
          var demandeLine = textLines[6+nbTypes*nbCohortes + i].split('\t');
          for(var j = 0; j < nbTypes; j++){
            solution.demande.get(solution.cities[i].name)!.set(solution.types[j],Number(demandeLine[j]));
          }
        }

        var indiceVilles = this.parseRepartitionTube();
        var colors = ['red', 'blue', 'green'];

        setTimeout(() =>{
          for(var i = 0; i < nbCohortes; i++){
            var villeCohorte = solution.cohortes[i].city;
            for(var j = 0; j < nbTypes; j++){
              for(var k = 0; k < nbTubes; k++){
                var indice = i*nbTypes*nbTubes + j*nbTubes + k;
                for(var l = 0; l < indiceVilles[indice].length; l++){
                  var destination = this.findCityNameById(solution.cities, indiceVilles[indice][l]);
                  var originPoint: LatLngExpression = [this.citiesPosition.get(villeCohorte)![0], this.citiesPosition.get(villeCohorte)![1]];
                  var destinationPoint: LatLngExpression = [this.citiesPosition.get(destination)![0], this.citiesPosition.get(destination)![1]];
                  var latlngs:LatLngExpression[] = [originPoint, destinationPoint];
                  solution.cohortes[i].types[j].tubes[k].arcs.push({
                    polyline: L.polyline(latlngs,{color: colors[solution.cohortes[i].types[j].tubes[k].number!-1], weight: 5, opacity: 0.7}).arrowheads({size: "15px", opacity: 0.7, fill: false, yawn: 75,offsets: {end: '75px'}}),
                    origin: villeCohorte,
                    destination: destination,
                    index: l,
                    // TODO: Remplir automatiquement avec les demandes de chaque ville et pas 0
                    quantity: 0
                  }); 
                }
              }
            }
          }
        },1000);
      });
    },300);
    return solution;
  }

  /**
   * Retourne l'indice des villes associée à chaque tube proposée par le modèle (répartition par tubes)
   * @returns La liste des arcs
   */
  private parseRepartitionTube(): number[][] {
    var indiceVilles: number[][] = [];
    setTimeout(() =>{
      this.getInstanceSolution().subscribe(data =>{
        var textLines = data.split('\n');
        for(var i = 0; i < textLines.length; i++){
          var line = textLines[i].split(' ');
          var indiceVilleTube: number[] = [];
          for(var j = 0; j < line.length; j++){
              indiceVilleTube.push(Number(line[j]));
          }
          indiceVilles.push(indiceVilleTube);
        }
      });
    },100);
    return indiceVilles;
  }

  /**
   * Renvoie la ville associée à l'id donné en paramètre
   * @param cities Le tableau des villes à chercher
   * @param id Le numéro de la ville à trouver
   * @returns Le nom de la ville correspondant à l'id donné en paramètre, sinon une chaîne vide si aucune ville ne correspond
   */
  private findCityNameById(cities:City[], id:Number) : string {
    for (const city of cities){
      if (city.id == id){
        return city.name;
      }
    }
    return "";
  }
}
