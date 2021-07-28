import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscoverfeedinfoPage } from './discoverfeedinfo.page';

describe('DiscoverfeedinfoPage', () => {
  let component: DiscoverfeedinfoPage;
  let fixture: ComponentFixture<DiscoverfeedinfoPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DiscoverfeedinfoPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiscoverfeedinfoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
