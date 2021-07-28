import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommentlistPage } from './commentlist.page';

describe('CommentlistPage', () => {
  let component: CommentlistPage;
  let fixture: ComponentFixture<CommentlistPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CommentlistPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CommentlistPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
