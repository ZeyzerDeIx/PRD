import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormCohorteComponent } from './form-cohorte.component';

describe('FormCohorteComponent', () => {
  let component: FormCohorteComponent;
  let fixture: ComponentFixture<FormCohorteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormCohorteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormCohorteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
