import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExplorefeedsPage } from './explorefeeds.page';

describe('ExplorefeedsPage', () => {
  let component: ExplorefeedsPage;
  let fixture: ComponentFixture<ExplorefeedsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ExplorefeedsPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExplorefeedsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
