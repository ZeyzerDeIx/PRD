import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-arrowheads';

@Injectable({
  providedIn: 'root'
})
export class SolutionService {

  //private solutionUrl = "assets/solution_data/solution.json";
  private mapDataUrl = "assets/map_data/map.geojson";
  private instanceUrl = "assets/solution_data/instance.txt";
  private instanceSolutionUrl = "assets/solution_data/solution_instance.txt";
  private citiesPosition: any[] = [];
  private types = ["LCR","SER","PLA"];

  solution:any = {};

  constructor(protected http:HttpClient) { }

  getSolution(){
    return this.parseSolution();
  }

  getMapData(){
    return this.http.get(this.mapDataUrl);
  }

  getInstance(){
    return this.http.get(this.instanceUrl, { responseType: 'text'});
  }

  getInstanceSolution(){
    return this.http.get(this.instanceSolutionUrl, { responseType: 'text'});
  }

  public getCitiesPosition(): any[] {
    let citiesPosition: any[] = [];
    setTimeout((() =>{
      this.getMapData().subscribe((cities:any) => {
        for (const city of cities.features) {
          const lat = city.geometry.coordinates[0];
          const lon = city.geometry.coordinates[1];
          const name = city.properties.name; 
          
          citiesPosition[name] = [lat,lon];
        }
      });
    }),100);
    
    return citiesPosition;
  }

  drawCities(map: L.Map, cities:any): L.Marker[]{
    var markersArray: L.Marker[] = [];
    this.citiesPosition = this.getCitiesPosition();
    setTimeout(() =>{
      for (const city of cities) {
        const marker = L.marker(this.citiesPosition[city.name], {alt: city.name});

        // Ajout du marqueur à la carte
        marker.addTo(map);

        markersArray.push(marker);
      }
    },500);
    return markersArray;
  }

  private parseCities(): any[]{
    var cities:any[] = [];
    this.getMapData().subscribe((data:any) => {
      for (const city of data.features) {
        const name = city.properties.name;
        const id = city.id; 
        
        cities.push({
          "name": name,
          "id": id,
          "cohorte": false
        });
      }
    });
    return cities;
  }

  private parseSolution(): any{
    var solution:any = {};
    solution.cities = this.parseCities();
    solution.types = this.types.slice(0,2);
    solution.cohortes = [];
    solution.demande = [];
    setTimeout(() =>{
      this.getInstance().subscribe(data => {
        var textLines = data.split('\r\n');
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
                envoi: []
              });

            }
          }
        }

        for(var i = 0; i < nbVilles; i++){
          solution.demande[solution.cities[i].name] = [];
          var demandeLine = textLines[6+nbTypes*nbCohortes + i].split('\t');
          for(var j = 0; j < nbTypes; j++){
            solution.demande[solution.cities[i].name].push(Number(demandeLine[j]));
          }
        }

        var arcs = this.parseArcs();
        setTimeout(() =>{
          for(var i = 0; i < nbCohortes; i++){
            for(var j = 0; j < nbTypes; j++){
              for(var k = 0; k < nbTubes; k++){
                var indice = i*nbTypes*nbTubes + j*nbTubes + k;
                for(var l = 0; l < arcs[indice].length; l++){
                  solution.cohortes[i].types[j].tubes[k].envoi.push([
                    solution.cohortes[i].city,
                    this.findCityNameById(solution.cities, arcs[indice][l]),
                    0
                  ]); 
                }
              }
            }
          }
        },1000);
      });
    },100);
    return solution;
  }

  private parseArcs(): any[] {
    var arcs: any[] = [];
    setTimeout(() =>{
      this.getInstanceSolution().subscribe(data =>{
        var textLines = data.split('\r\n');
        for(var i = 0; i < textLines.length; i++){
          var line = textLines[i].split(' ');
          var arcsTube = [];
          for(var j = 0; j < line.length; j++){
            arcsTube.push(Number(line[j]));
          }
          arcs.push(arcsTube);
        }
      });
    },100);
    //console.log(arcs);
    return arcs;
  }

  private findCityNameById(cities:any[], id:Number) : string | undefined {
    for (const city of cities){
      if (city.id == id){
        return city.name;
      }
    }
    return undefined;
  }
}
