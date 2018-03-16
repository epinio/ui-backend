import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  BaseTestModules,
  generateTestCfEndpointServiceProvider
} from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundryOrganisationServiceMock } from '../../../../../test-framework/cloud-foundry-organisation.service.mock';
import { CloudFoundryOrganisationService } from '../../../services/cloud-foundry-organisation.service';
import { CloudFoundryOrganizationSpacesComponent } from './cloud-foundry-organization-spaces.component';
import { SharedModule } from '../../../../../shared/shared.module';
import { CoreModule } from '../../../../../core/core.module';
import { getBaseProviders } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { createBasicStoreModule } from '../../../../../test-framework/store-test-helper';
import { MDAppModule } from '../../../../../core/md.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('CloudFoundryOrganizationSpacesComponent', () => {
  let component: CloudFoundryOrganizationSpacesComponent;
  let fixture: ComponentFixture<CloudFoundryOrganizationSpacesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryOrganizationSpacesComponent],
      imports: [
        SharedModule,
        CoreModule,
        createBasicStoreModule(),
        MDAppModule,
        BrowserAnimationsModule
      ],
      providers: [
        ...generateTestCfEndpointServiceProvider(),
        { provide: CloudFoundryOrganisationService, useClass: CloudFoundryOrganisationServiceMock },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryOrganizationSpacesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
