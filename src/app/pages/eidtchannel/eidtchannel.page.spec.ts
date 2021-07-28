import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EidtchannelPage } from './eidtchannel.page';

describe('EidtchannelPage', () => {
  let component: EidtchannelPage;
  let fixture: ComponentFixture<EidtchannelPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EidtchannelPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EidtchannelPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
