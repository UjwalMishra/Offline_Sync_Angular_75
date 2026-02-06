import { TestBed } from '@angular/core/testing';

import { OfflineSync } from './offline-sync';

describe('OfflineSync', () => {
  let service: OfflineSync;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OfflineSync);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
