import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ElastosapiproviderPage } from './elastosapiprovider.page';

describe('ElastosapiproviderPage', () => {
  let component: ElastosapiproviderPage;
  let fixture: ComponentFixture<ElastosapiproviderPage>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [ElastosapiproviderPage],
        imports: [IonicModule.forRoot()],
      }).compileComponents();

      fixture = TestBed.createComponent(ElastosapiproviderPage);
      component = fixture.componentInstance;
      fixture.detectChanges();
    }),
  );

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
