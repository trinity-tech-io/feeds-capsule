import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertdialogComponent } from './alertdialog.component';

describe('AlertdialogComponent', () => {
  let component: AlertdialogComponent;
  let fixture: ComponentFixture<AlertdialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AlertdialogComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AlertdialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
