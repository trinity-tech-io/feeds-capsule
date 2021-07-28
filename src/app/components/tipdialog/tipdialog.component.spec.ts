import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TipdialogComponent } from './tipdialog.component';

describe('TipdialogComponent', () => {
  let component: TipdialogComponent;
  let fixture: ComponentFixture<TipdialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TipdialogComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TipdialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
