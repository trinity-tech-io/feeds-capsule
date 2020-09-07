import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EdittoolComponent } from './edittool.component';

describe('EdittoolComponent', () => {
  let component: EdittoolComponent;
  let fixture: ComponentFixture<EdittoolComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EdittoolComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EdittoolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
