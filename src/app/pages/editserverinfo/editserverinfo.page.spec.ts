import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditserverinfoPage } from './editserverinfo.page';

describe('EditserverinfoPage', () => {
  let component: EditserverinfoPage;
  let fixture: ComponentFixture<EditserverinfoPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditserverinfoPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditserverinfoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
