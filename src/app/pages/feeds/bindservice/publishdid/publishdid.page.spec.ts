import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PublishdidPage } from './publishdid.page';

describe('PublishdidPage', () => {
  let component: PublishdidPage;
  let fixture: ComponentFixture<PublishdidPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PublishdidPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PublishdidPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
