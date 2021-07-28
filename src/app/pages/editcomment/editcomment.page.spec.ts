import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditcommentPage } from './editcomment.page';

describe('EditcommentPage', () => {
  let component: EditcommentPage;
  let fixture: ComponentFixture<EditcommentPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditcommentPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditcommentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
