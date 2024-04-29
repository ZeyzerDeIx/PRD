import { ArcService } from '../arc.service';
import { InstanceService } from '../instance.service';
import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { NgIf } from '@angular/common';
import { LatLngExpression } from 'leaflet';
import { Arc, Instance } from '../include/modelClasses';

/**
 * TableArcComponent gère la modification des arcs pour chaque tube
 */
@Component({
  selector: 'app-table-arc',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule, MatInputModule, FormsModule, MatTableModule, MatPaginator, NgIf,  MatButtonModule],
  templateUrl: './table-arc.component.html',
  styleUrl: './table-arc.component.scss'
})
export class TableArcComponent implements AfterViewInit{
  /**
   * Variable pour les titres des colonnes de l'objet MatTable
   */
  displayedColumns: string[] = ['origin', 'destination', 'quantity'];

  /**
   * Variable contenant les données des arcs pour remplir l'objet MatTable
   */
  dataSource!: MatTableDataSource<Arc>;

  /**
   * Instance provenant de InstanceService (Initialisée en amont depuis le service même)
   */
  instance: Instance = this.instanceService.getInstance();

  /**
   * Tableau d'Arc contenant la liste des arcs 
   */
  polylineArray: Arc[] = [];

  /**
   * Tableau contenant le nom des villes attribuées à un tube
   */
  cities: string[] = [];

  /**
   * Tableau contenant les villes de départ des arcs d'un tube
   */
  selectedOrigin: string[] = [];

  /**
   * Tableau contenant les villes d'arrivée des arcs d'un tube
   */
  selectedDestination: string[] = [];

  /**
   * Le paginateur du composant
   */
  @ViewChild('paginator') paginator!: MatPaginator;

  /**
   * Taille du tableau d'arcs
   */
  totalRecords = 0;

  /**
   * Nombre d'arcs par page du tableau d'arcs
   */
  pageSize = 4;

  /**
   * Numéro de la page du tableau d'arcs
   */
  pageIndex = 0;

  /**
   * Booléen pour contrôler l'affichage des boutons Sauvegarder et +
   */
  tableIsActive = false;

  // MatPaginator event
  pageEvent: PageEvent = new PageEvent();

  /**
   * Constructeur du composant
   * @param instanceService Service permettant de créer l'objet Instance
   * @param arcService Service permettant de créér les arcs
   */
  constructor(private arcService:ArcService, private instanceService:InstanceService){
  }

  /**
   * Modifie le style d'un arc quand on passe la souris sur la ligne associée dans le tableau d'arcs
   * @param data Arc à modifier
   */
  mouseOverArc(data: Arc){
    data.polyline.setStyle({
      weight: 6,
      opacity: 1
    })
  }

  /**
   * Réinitialise le style d'un arc quand on enlève la souris de la ligne associée dans le tableau d'arcs
   * @param data Arc à réinitialiser
   */
  mouseOutArc(data: Arc){
    data.polyline.setStyle({
      weight: 4,
      opacity: 0.5
    })
  }

  /**
   * Modifie l'arc dessiné sur la carte avec les valeurs sélectionnées dans le tableau d'arcs
   * @param index: Indice de l'arc à modifier
   */
  arcChange(index: number){
    var newOrigin:string = this.selectedOrigin[index];
    var newDestination:string = this.selectedDestination[index];
    var citiesPosition = this.instanceService.getCitiesPosition();
    var newOriginCoord: LatLngExpression = [citiesPosition.get(newOrigin)![0], citiesPosition.get(newOrigin)![1]];
    var newDestinationCoord: LatLngExpression = [citiesPosition.get(newDestination)![0], citiesPosition.get(newDestination)![1]];
    this.polylineArray[index].polyline.setLatLngs([newOriginCoord, newDestinationCoord]);
  }

  // TODO : La fonction marche mais elle ne fait que afficher le résultat dans la console
  /**
   * Vérifie si la solution modifiée par l'utilisateur reste faisable (i.e. chaque ville est bien desservie par une seule autre ville)
   */
  checkSolution(){
    var cohorteCity = this.arcService.getCohorteCity();
    var error = "Ok !"
    if (this.selectedDestination.includes(cohorteCity.name)){
      error = "La ville cohorte ne peut pas être dans les villes d'arrivée";
      this.handleSaveErrors(error);
    }
    var nbOccurences = new Map<string, number>();
    this.cities.forEach(city => {
      nbOccurences.set(city, 0);
    });
    this.selectedDestination.forEach(city => {
      nbOccurences.set(city, nbOccurences.get(city)! + 1);
    });
    for (const city of this.cities){
      if(city != cohorteCity.name && nbOccurences.get(city) != 1){
        error = city + " ne doit apparaître qu'une seule et unique fois !"
        this.handleSaveErrors(error);
      }
    }
    for (var id = 0; id < this.selectedDestination.length; id++){
      if (this.selectedOrigin.at(id) == this.selectedDestination.at(id)){
        error = "Veuillez sélectionner une ville de départ et d'arivée différente pour chaque arc !"
        this.handleSaveErrors(error);
      }
    }
    
    if(error == "Ok !"){
      this.handleSaveErrors(error);
    }
  }

  /**
   * Affiche un message d'erreur quand l'utilisateur essaie de sauvegarder une solution infaisable
   * @param error Message d'erreur à afficher
   */
  handleSaveErrors(error: string){
    alert(error);
    console.log(error);
  }

  /**
   * Initialise toutes les valeurs du composant
   */
  ngAfterViewInit(){
    this.arcService.polylineUpdated.subscribe(
      (polylineArray) => {
        this.cities = [];
        this.selectedOrigin = [];
        this.selectedDestination = [];
        var cityCohorte = this.arcService.getCohorteCity();
        var indexToRemove = -1;
        for (const line of polylineArray){
          if (line.destination == cityCohorte){
            /* TODO : Je sais pas trop quoi faire de la ligne Cohorte à Cohorte, 
            pour l'instant je l'enlève mais c'est pas forcément le meilleur */
            indexToRemove = line.index; // remove the line cohorte -> cohorte  
          }
          else{
            this.cities.indexOf(line.origin.name) === -1 ? this.cities.push(line.origin.name): null; // Push if not already present, else nothing
            this.cities.indexOf(line.destination.name) === -1 ? this.cities.push(line.destination.name): null; // Push if not already present, else nothing

            this.selectedOrigin.push(line.origin.name);
            this.selectedDestination.push(line.destination.name); // Fill the arrays to not get an error from the cells in mat-table
          }
        }
        if (indexToRemove != -1){
          // TODO : Il faudrait aussi update les line.index après une suppression
          polylineArray.splice(indexToRemove,1);

        }
        this.polylineArray = polylineArray;
        this.dataSource = new MatTableDataSource<Arc>(polylineArray);
        this.totalRecords = this.polylineArray.length;
        this.dataSource.paginator = this.paginator;

        this.tableIsActive = (this.polylineArray.length > 0);

      }
    );
  }
}