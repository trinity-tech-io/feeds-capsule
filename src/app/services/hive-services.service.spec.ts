import { TestBed } from '@angular/core/testing';

import { HiveServicesService } from './hive-services.service';

describe('HiveServicesService', () => {
  let service: HiveServicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HiveServicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
