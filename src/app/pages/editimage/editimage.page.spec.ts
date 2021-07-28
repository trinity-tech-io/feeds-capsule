import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditimagePage } from './editimage.page';

describe('EditimagePage', () => {
  let component: EditimagePage;
  let fixture: ComponentFixture<EditimagePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditimagePage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditimagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
