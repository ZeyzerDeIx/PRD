import { ArcService } from '../arc.service';
import { SolutionService } from '../solution.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { NgIf } from '@angular/common';
import { LatLngExpression } from 'leaflet';
import { CustomPolyline } from '../include/interfaces';

@Component({
  selector: 'app-table-arc',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule, MatInputModule, FormsModule, MatTableModule, MatPaginator, NgIf],
  templateUrl: './table-arc.component.html',
  styleUrl: './table-arc.component.scss'
})

export class TableArcComponent implements OnInit{
  displayedColumns: string[] = ['number', 'origin', 'destination'];
  polylineArray: CustomPolyline[] = [];
  dataSource!: MatTableDataSource<CustomPolyline>;
  cities: string[] = [];
  selectedOrigin: string[] = [];
  selectedDestination: string[] = [];

  @ViewChild('paginator') paginator!: MatPaginator;
  totalRecords = 0;
  pageSize = 10;
  pageIndex = 0;

  constructor(private arcService:ArcService, private solutionService:SolutionService){
  }

  mouseOverArc(data: CustomPolyline){
    data.polyline.setStyle({
      weight: 6,
      opacity: 1
    })
  }
  mouseOutArc(data: CustomPolyline){
    data.polyline.setStyle({
      weight: 5,
      opacity: 0.7
    })
  }

  arcChange(index: number){
    var newOrigin:string = this.selectedOrigin[index];
    var newDestination:string = this.selectedDestination[index];
    var citiesPosition = this.solutionService.getCitiesPosition();
    var newOriginCoord: LatLngExpression = [citiesPosition.get(newOrigin)![0], citiesPosition.get(newOrigin)![1]];
    var newDestinationCoord: LatLngExpression = [citiesPosition.get(newDestination)![0], citiesPosition.get(newDestination)![1]];
    this.polylineArray[index].polyline.setLatLngs([newOriginCoord, newDestinationCoord]);
  }

  ngOnInit(){
    this.arcService.polylineUpdated.subscribe(
      (polylineArray) => {
        this.cities = [];
        this.selectedOrigin = [];
        this.selectedDestination = [];
        for (const line of polylineArray){
          this.cities.indexOf(line.origin) === -1 ? this.cities.push(line.origin): null; // Push if not already present, else nothing
          this.cities.indexOf(line.destination) === -1 ? this.cities.push(line.destination): null; // Push if not already present, else nothing

          this.selectedOrigin.push(line.origin);
          this.selectedDestination.push(line.destination); // Fill the arrays to not get an error from the cells in mat-table
        }
        this.polylineArray = polylineArray;
        this.dataSource = new MatTableDataSource<CustomPolyline>(polylineArray);
        this.totalRecords = this.polylineArray.length;
        this.dataSource.paginator = this.paginator;
      }
    );
  }
}