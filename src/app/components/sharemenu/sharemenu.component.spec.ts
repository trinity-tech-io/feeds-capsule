import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SharemenuComponent } from './sharemenu.component';

describe('SharemenuComponent', () => {
  let component: SharemenuComponent;
  let fixture: ComponentFixture<SharemenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SharemenuComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SharemenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
