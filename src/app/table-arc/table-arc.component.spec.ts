import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableArcComponent } from './table-arc.component';

describe('TableArcComponent', () => {
  let component: TableArcComponent;
  let fixture: ComponentFixture<TableArcComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableArcComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TableArcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
