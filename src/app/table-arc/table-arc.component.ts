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
import { Arc, Instance, City, Tube, Type, Cohorte } from '../include/modelClasses';
import { ArcService } from '../services/arc.service';
import { InstanceService } from '../services/instance.service';
import { DataService } from '../services/data.service';
import { SolutionService } from '../services/solution.service';

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
  displayedColumns: string[] = ['origin', 'destination', 'quantity', 'delete'];

  /**
   * Variable contenant les données des arcs pour remplir l'objet MatTable
   */
  dataSource!: MatTableDataSource<Arc>;

  /**
   * Instance provenant de InstanceService (Initialisée en amont depuis le service même)
   */
  instance: Instance = new Instance();

  /**
   * Tableau d'Arc contenant la liste des arcs 
   */
  polylineArray: Arc[] = [];

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
  pageSize = 5;

  /**
   * Numéro de la page du tableau d'arcs
   */
  pageIndex = 0;

  /**
   * Booléen pour contrôler l'affichage des boutons Sauvegarder et +
   */
  tableIsActive = false;

  /**
   * Constructeur du composant
   * @param instanceService Service permettant de créer l'objet Instance
   * @param arcService Service permettant de créér les arcs
   */
  constructor(private arcService:ArcService, private instanceService:InstanceService, private dataService: DataService, private solutionService: SolutionService){
  }

  /**
   * Modifie le style d'un arc quand on passe la souris sur la ligne associée dans le tableau d'arcs
   * @param data Arc à modifier
   */
  mouseOverArc(data: Arc){
    data.polyline.setStyle({
      weight: 5,
      opacity: 1
    })
  }

  /**
   * Réinitialise le style d'un arc quand on enlève la souris de la ligne associée dans le tableau d'arcs
   * @param data Arc à réinitialiser
   */
  mouseOutArc(data: Arc){
    data.polyline.setStyle({
      weight: 2.7,
      opacity: 0.5
    })
  }

  /**
   * Met à jour la destination de l'arc.
   * @param arc L'arc dont on veut changer la destination.
   * @param newDestName Le nom de la nouvelle ville de destination.
   */
  public arcDestChange(arc: Arc, newDestName: string): void{
    var newDest: City = this.instanceService.findCityByName(newDestName);
    this.arcService.setArcDestination(arc, newDest);
    this.arcChange(arc);
  }

  /**
   * Met à jour l'origine de l'arc.
   * @param arc L'arc dont on veut changer l'origine.
   * @param newOrigName Le nom de la nouvelle ville d'origine.
   */
  public arcOrigChange(arc: Arc, newOrigName: string): void{
    var newOrig: City = this.instanceService.findCityByName(newOrigName);
    this.arcService.setArcOrigin(arc, newOrig);
    this.arcChange(arc);
  }

  /**
   * Modifie l'arc dessiné sur la carte avec les valeurs sélectionnées dans le tableau d'arcs
   * @param index: Indice de l'arc à modifier
   */
  private arcChange(arc: Arc){
    const newCoords: LatLngExpression[] = [arc.origin.position, arc.destination.position];

    this.arcService.modifyArc(arc, newCoords);

    this.dataService.tubeUpdated();
  }

  /**
   * Supprime un arc de la liste et de tous les endroits où il est référencé.
   * @param arc L'arc à supprimer. 
   */
  public deleteArc(arc: Arc){
    this.arcService.deleteArc(arc);
    this.dataService.tubeUpdated();
  }

  /**
   * Fait le minimum entre les deux entrées.
   * @param a Premier nombre
   * @param b Second nombre
   * @returns Le minimum des deux nombres en entrée.
   */
  min(a:number, b:number): number{
    return a>b? b: a;
  }

  /**
   * Créer un nouvel arc reliant la cohorte du tube à elle même.
   */
  addArc(){
    const co: City = this.arcService.getCohorteCity();
    const tube: Tube = this.dataService.getSelectedTube();
    const color = this.instanceService.colors[tube.number-1];
    const polyline = this.arcService.createPolyline(co, co, color);
    
    var arc = new Arc(polyline,co,co,tube);
    arc.polyline.setLatLngs([co.position, co.position]);
    this.arcService.addArc(arc);

    this.dataService.tubeUpdated();
  }

  public save(): void{
    if(this.solutionService.checkSolution(this.instance))
      this.instanceService.saveSolution();
  }

  /**
   * Initialise toutes les valeurs du composant
   */
  async ngAfterViewInit(): Promise<void>{
    //on attend que l'instance puisse être récupérée
    this.instance = await this.instanceService.getInstance();

    this.arcService.polylineUpdated.subscribe(
      (polylineArray) => {
        this.polylineArray = polylineArray;

        //TODO à remplacer par un ErrorService et un composant d'affichage
        try{
          this.instanceService.caculateArcsQuantities();
        } catch(error: any){
          console.error("Impossible de calculer les flux des arcs!");
        }

        this.arcService.drawPolylines(polylineArray);

        this.dataSource = new MatTableDataSource<Arc>(polylineArray);
        this.totalRecords = this.polylineArray.length;
        this.dataSource.paginator = this.paginator;

        this.tableIsActive = (this.dataService.getSelectedTube().number != -1);
      }
    );
  }
}