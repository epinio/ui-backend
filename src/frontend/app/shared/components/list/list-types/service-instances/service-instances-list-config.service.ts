import { Injectable } from '@angular/core';

import { IServiceInstance } from '../../../../../core/cf-api-svc.types';
import { APIResource } from '../../../../../store/types/api.types';
import { ListConfig, IListConfig, ListViewTypes } from '../../list.component.types';
import { ServiceInstancesDataSource } from './service-instances-data-source';
import { ListView } from '../../../../../store/actions/list.actions';
import { ITableColumn } from '../../list-table/table.types';
import { TableCellServiceNameComponent } from '../cf-spaces-service-instances/table-cell-service-name/table-cell-service-name.component';
import { TableCellServicePlanComponent } from '../cf-spaces-service-instances/table-cell-service-plan/table-cell-service-plan.component';
import { TableCellServiceInstanceTagsComponent } from '../cf-spaces-service-instances/table-cell-service-instance-tags/table-cell-service-instance-tags.component';
import { TableCellServiceInstanceAppsAttachedComponent } from '../cf-spaces-service-instances/table-cell-service-instance-apps-attached/table-cell-service-instance-apps-attached.component';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
import {ServicesService} from '../../../../../features/service-catalog/services.service';
import { DatePipe } from '@angular/common';

@Injectable()
export class ServiceInstancesListConfigService
  extends ListConfig<APIResource<IServiceInstance>>
  implements IListConfig<APIResource<IServiceInstance>> {

    viewType = ListViewTypes.TABLE_ONLY;
    dataSource: ServiceInstancesDataSource;
    defaultView = 'table' as ListView;
    text = {
      title: null,
      noEntries: 'There are no service instances'
    };

    static getColumns(datePipe: DatePipe): ITableColumn<APIResource<IServiceInstance>>[]{
        return  [
          {
            columnId: 'name',
            headerCell: () => 'Service Instances',
            cellDefinition: {
              getValue: (row) => `${row.entity.name}`
            },
            cellFlex: '2'
          },
          {
            columnId: 'service',
            headerCell: () => 'Service',
            cellComponent: TableCellServiceNameComponent,
            cellFlex: '1'
          },
          {
            columnId: 'servicePlan',
            headerCell: () => 'Plan',
            cellComponent: TableCellServicePlanComponent,
            cellFlex: '1'
          },
          {
            columnId: 'tags',
            headerCell: () => 'Tags',
            cellComponent: TableCellServiceInstanceTagsComponent,
            cellFlex: '2'
          },
          {
            columnId: 'attachedApps',
            headerCell: () => 'Application Attached',
            cellComponent: TableCellServiceInstanceAppsAttachedComponent,
            cellFlex: '3'
          },
          {
            columnId: 'creation', headerCell: () => 'Creation Date',
            cellDefinition: {
              getValue: (row: APIResource) => `${datePipe.transform(row.metadata.created_at, 'medium')}`
            },
            sort: {
              type: 'sort',
              orderKey: 'creation',
              field: 'metadata.created_at'
            },
            cellFlex: '2'
          },
        ];
    }

  constructor(private store: Store<AppState > , servicesService: ServicesService, private datePipe: DatePipe) {
    super();
    this.dataSource = new ServiceInstancesDataSource(servicesService.cfGuid, servicesService.serviceGuid, store, this);
  }

  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => [];
  getColumns = () => ServiceInstancesListConfigService.getColumns(this.datePipe);
  getDataSource = () => this.dataSource;
}
