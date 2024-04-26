import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataDisplayerComponent } from './data-displayer.component';

describe('DataDisplayerComponent', () => {
  let component: DataDisplayerComponent;
  let fixture: ComponentFixture<DataDisplayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DataDisplayerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataDisplayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
});
