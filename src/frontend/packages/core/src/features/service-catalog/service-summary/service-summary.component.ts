import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { IServiceInstance, IServicePlan } from '../../../core/cf-api-svc.types';
import { ServicesService } from '../services.service';
import { map } from 'rxjs/operators';
import { APIResource } from '../../../../../store/src/types/api.types';
import { AppState } from '../../../../../store/src/app-state';
import { RouterNav } from '../../../../../store/src/actions/router.actions';

@Component({
  selector: 'app-service-summary',
  templateUrl: './service-summary.component.html',
  styleUrls: ['./service-summary.component.scss']
})
export class ServiceSummaryComponent {

  isBrokerAvailable$: Observable<boolean>;
  servicePlans$: Observable<APIResource<IServicePlan>[]>;
  instances$: Observable<APIResource<IServiceInstance>[]>;
  constructor(
    private servicesService: ServicesService,
    private store: Store<AppState>,
  ) {

    this.instances$ = servicesService.serviceInstances$;
    this.servicePlans$ = servicesService.servicePlans$;
    this.isBrokerAvailable$ = servicesService.serviceBroker$.pipe(
      map(p => !!p)
    );
  }

  serviceInstancesLink = () => {
    this.store.dispatch(new RouterNav({
      path: ['marketplace', this.servicesService.cfGuid, this.servicesService.serviceGuid, 'instances']
    }));
  }

}
