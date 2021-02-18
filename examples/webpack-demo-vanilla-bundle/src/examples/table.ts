import { 
  Aggregators,
  AutocompleteOption,
  BindingEventService,
  DOMEvent,
  CaseType,
  Column, 
  Editors,
  FieldType, 
  FileType,
  Filters, 
  Formatter,
  Formatters,
  GridOption, 
  GridStateChange,
  Grouping,
  GroupingGetterFunction,
  GroupTotalFormatters,
  Metrics, 
  OperatorType, 
  SlickDraggableGrouping,
  SlickNamespace,
  SortComparers,
  SortDirectionNumber,
  // utilities
  deepCopy,
  formatNumber,
} from '@slickgrid-universal/common';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { 
  GridOdataService, 
  OdataServiceApi, 
  OdataOption
} from '@slickgrid-universal/odata';
import { 
  Slicker, 
  SlickerGridInstance, 
  SlickVanillaGridBundle 
} from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options';
import { TranslateService } from '../translate.service';

import {
  o,
  OHandler
} from 'o.js';

import {
  ODataMetadataParser,
  ODataMetadata,
  ODataTypes
} from '../../../../packages/odata-metadata-parser';

import '../salesforce-styles.scss';
import './table.scss';


// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

/*import { cache, deferred, oData, store, utils, version, xml } from 'ts-odatajs';*/

const defaultPageSize = 1;

export class Table {
  endpoint = 'http://localhost:8000/odata/';
  collection = 'Users';

  private _bindingEventService: BindingEventService;
  columnDefinitions: Column[];
  gridOptions: GridOption;
  metrics: Metrics;
  sgb: SlickVanillaGridBundle;
  oHandler: OHandler;
  draggableGroupingPlugin: SlickDraggableGrouping;
  selectedGroupingFields: Array<string | GroupingGetterFunction> = ['', '', ''];

  isCountEnabled = true;
  odataVersion = 4;
  odataQuery = '';
  processing = false;
  status = '';
  statusClass = 'is-success';

  /**/
  isGridEditable = true;
  editQueue = [];
  editedItems = {};
  /**/

  translateService: TranslateService;
  excelExportService: ExcelExportService;

  metadata: ODataMetadata;

  entitySets: {};

  constructor() {
    let self = this;

    this._bindingEventService = new BindingEventService();
    this.translateService = (<any>window).TranslateService;
    this.excelExportService = new ExcelExportService();

    this.oHandler = o(this.endpoint, {
        headers: {
            'If-Match': '*'
        },
        batch: {
          useChangset: true
        },
        fragment: '',
        onFinish: (inst, res) => {
          let prom = res.json();
          res.json = () => {
            return prom;
          }
          prom
            .then((data) => {
              /* raw preprocessing */
            });
          return true;
        }
    });
  }

  getEndpoint() {
    return this.endpoint + ((this.endpoint.length && this.endpoint.substr(-1) != '/') ? '/' : '');
  }

  async parseMetadata() {
    const oDataMetadataParser: ODataMetadataParser = new ODataMetadataParser();
    const res = await oDataMetadataParser.parseODataMetadata(this.getEndpoint() + '$metadata');
    return res;
  }

  async attached() {
    this.metadata = await this.parseMetadata();
    this.columnDefinitions = await this.generateColumns(this.metadata, this.collection);

    this.initializeGrid();
    const gridContainerElm = document.querySelector<HTMLDivElement>(`.grid19`);

    this._bindingEventService.bind(gridContainerElm, 'ongridstatechanged', this.gridStateChanged.bind(this));
    // this._bindingEventService.bind(gridContainerElm, 'onbeforeexporttoexcel', () => console.log('onBeforeExportToExcel'));
    // this._bindingEventService.bind(gridContainerElm, 'onafterexporttoexcel', () => console.log('onAfterExportToExcel'));
    console.log('creating sgb');
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, []);
    console.log(Slick.GlobalEditorLock);
  }

  addTypeSpecificConfig(column: Column, oDataType: ODataTypes) {
    switch(oDataType) {
      case ODataTypes.Binary:
        break;
  
      case ODataTypes.Boolean:
        column.formatter = Formatters.multiple;
        column.params = {
          formatters: [Formatters.checkmarkMaterial, Formatters.center]
        };
        column.type = FieldType.boolean;
        column.outputType = FieldType.boolean;
        column.editor = {
          model: Editors.checkbox,
          massUpdate: true
        };
        column.filter = {
          model: Filters.singleSelect,
          collection: [
            { value: '', label: '' }, 
            { value: true, label: this.translateService.translate('TRUE') }, 
            { value: false, label: this.translateService.translate('FALSE') }
          ]
        };
        column.exportWithFormatter = false;
        break;
        
      case ODataTypes.Byte:
        break;        
      case ODataTypes.Date:
        column.formatter = Formatters.dateIso;
        column.type = FieldType.date;
        column.outputType = FieldType.dateIso;
        column.filter = { model: Filters.compoundDate };
        column.editor = {
          model: Editors.date,
          massUpdate: true
        };
        column.grouping = {
          getter: `${column.id}`,
          formatter: (g) => `${column.name}: ${g.value} <span style="color:green">(${g.count} ` + (g.count == 1 ? this.translateService.translate('ITEM') : this.translateService.translate('ITEMS')) + `)</span>`,
          /*aggregators: [
            new Aggregators.Sum('')
          ],
          aggregateCollapsed: false,
          */
          collapsed: false
        };
        break;
        
      case ODataTypes.DateTimeOffset:
        break;
        
      case ODataTypes.Decimal:
        break;
        
      case ODataTypes.Double:
        break;

      case ODataTypes.Duration:
        break;
        
      case ODataTypes.Guid:
        break;
        
      case ODataTypes.Int16:
        break;
        
      case ODataTypes.Int32:
        break;
        
      case ODataTypes.Int64:
        break;
        
      case ODataTypes.SByte:
        break;
        
      case ODataTypes.Single:
        break;
        
      case ODataTypes.Stream:
        break;
        
      case ODataTypes.String:
        column.type = FieldType.string;
        column.filter = {
          model: Filters.compoundInput
        };
        column.editor = {
          model: Editors.text,
          massUpdate: true
        };
        column.grouping = {
          getter: `${column.id}`,
          formatter: (g) => `${column.name}: ${g.value} <span style="color:green">(${g.count} ` + (g.count == 1 ? this.translateService.translate('ITEM') : this.translateService.translate('ITEMS')) + `)</span>`,
          /*aggregators: [
            new Aggregators.Sum('')
          ],
          aggregateCollapsed: false,
          */
          collapsed: false
        };
        break;
        
      case ODataTypes.TimeOfDay:
        break;

    }
    return column;
  }

  async generateColumns(metadata: ODataMetadata, collection: string) {
    const columnDefinitions: Column[] = [];
    if (metadata.entitySets.has(collection)) {
      Array.from(this.metadata.entitySets.get(collection).entityType.properties.entries(), entry => {
        let columnDefinition: Column = {
          id: entry[0],
          name: entry[1].label,
          field: entry[0],
          sortable: entry[1].sortable,
          filterable: entry[1].filterable
        };
        columnDefinition = this.addTypeSpecificConfig(columnDefinition, entry[1].type);

        /*
    this.columnDefinitions = [
      {
        id: 'first_name',
        name: 'Vorname',
        field: 'first_name',
        sortable: true,
        type: FieldType.string,
        filterable: true,
        editor: {
          model: Editors.text,
          massUpdate: true,
          required: true,
          alwaysSaveOnEnterKey: true
        }
      },
      {
        id: 'last_name',
        name: 'Nachname',
        field: 'last_name',
        sortable: true,
        filterable: true
      },
      {
        id: 'email',
        name: 'E-Mail',
        field: 'email',
        sortable: true,
        filterable: true
      },
    ];*/
        columnDefinitions.push(columnDefinition);
      });
    }
    return columnDefinitions;
  }

  dispose() {
    if (this.sgb) {
      this.sgb?.dispose();
    }
    this._bindingEventService.unbindAll();
  }

  initializeGrid() {

    this.gridOptions = {
      enableTranslate: true,
      translater: this.translateService,
      /**/
      autoEdit: true, // true single click (false for double-click)
      autoCommitEdit: true,
      editable: true,
      /**/

      enableAutoResize: true,
      autoResize: {
        container: '.demo-container',
        rightPadding: 10
      },

      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 35,

      enableDraggableGrouping: true,
      draggableGrouping: {
        dropPlaceHolderText: this.translateService.translate('DROP_COLUMN_TO_GROUP'),
        // groupIconCssClass: 'fa fa-outdent',
        deleteIconCssClass: 'mdi mdi-close color-danger',
        onGroupChanged: (_e, args) => this.onGroupChanged(args),
        onExtensionRegistered: (extension) => this.draggableGroupingPlugin = extension,
      },

      /**/
      enableExcelCopyBuffer: true,
      enableExcelExport: true,
      excelExportOptions: {
        exportWithFormatter: true
      },
      registerExternalResources: [new ExcelExportService()],
      /**/
      tristateMultiColumnSort: true,
      checkboxSelector: {
        // you can toggle these 2 properties to show the "select all" checkbox in different location
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true
      },
      enableCellNavigation: true,
      enableFiltering: true,
      enableCheckboxSelector: true,
      enableRowSelection: true,
      enablePagination: true, // you could optionally disable the Pagination
      pagination: {
        pageSizes: [1, 10, 20, 50, 100, 500],
        pageSize: defaultPageSize,
      },
      presets: {
        // you can also type operator as string, e.g.: operator: 'EQ'
        /*filters: [
          // { columnId: 'name', searchTerms: ['w'], operator: OperatorType.startsWith },
          { columnId: 'gender', searchTerms: ['male'], operator: OperatorType.equal },
        ],*/
        sorters: [
          // direction can be written as 'asc' (uppercase or lowercase) and/or use the SortDirection type
          { columnId: 'id', direction: 'asc' },
        ],
        pagination: { pageNumber: 1, pageSize: 1 }
      },
      customFooterOptions: {
        metricTexts: {
          itemsKey: 'OF_ITEMS',
        }
      },
      editCommandHandler: (item, column, editCommand) => {
        if (editCommand.prevSerializedValue !== editCommand.serializedValue) {
          this.editQueue.push({ item, column, editCommand });
          this.editedItems[editCommand.row] = item; // keep items by their row indexes, if the row got edited twice then we'll keep only the last change
          console.log(this.editQueue);
          this.sgb.slickGrid.invalidate();
          editCommand.execute();

          const hash = { [editCommand.row]: { [column.id]: 'unsaved-editable-field' } };
          this.sgb.slickGrid.setCellCssStyles(`unsaved_highlight_${[column.id]}${editCommand.row}`, hash);
        }
      },
      backendServiceApi: {
        service: new GridOdataService(),
        options: {
          caseType: CaseType.snakeCase,
          enableCount: this.isCountEnabled, // add the count in the OData query, which will return a property named "odata.count" (v2) or "@odata.count" (v4)
          version: this.odataVersion        // defaults to 2, the query string is slightly different between OData 2 and 4
        },
        preProcess: () => this.displaySpinner(true),
        process: (query) => this.getData(query),
        postProcess: (response) => {
          this.displaySpinner(false);

          let data = Array.isArray(response) ? response[response.length - 1] : response;
          if (data && !data.skipped) {
            this.metrics = data.metrics;
            this.processData(data);
          }
        }
      } as OdataServiceApi
    };
  }

  displaySpinner(isProcessing) {
    this.processing = isProcessing;
    this.status = (isProcessing) ? 'loading...' : 'finished!!';
    this.statusClass = (isProcessing) ? 'notification is-light is-warning' : 'notification is-light is-success';
  }

  processData(data) {
    // totalItems property needs to be filled for pagination to work correctly
    let countPropName = 'totalRecordCount'; // you can use "totalRecordCount" or any name or "odata.count" when "enableCount" is set
    if (this.isCountEnabled) {
      countPropName = (this.odataVersion === 4) ? '@odata.count' : 'odata.count';
    }
    if (this.metrics) {
      this.metrics.totalItemCount = data[countPropName];
    }

    // once pagination totalItems is filled, we can update the dataset
    this.sgb.paginationOptions.totalItems = data[countPropName];
    this.sgb.dataset = data['value'];
  }

  getData(query) {
    if (query != this.odataQuery) {
      this.odataQuery = query;
      return this.oHandler.get(this.collection + '?' + query).query({
        $count: true
      });
    }
    return Promise.resolve({skipped: true});
  }

  clearGroupsAndSelects() {
    this.clearGroupingSelects();
    this.clearGrouping();
  }

  clearGroupingSelects() {
    this.selectedGroupingFields.forEach((_g, i) => this.selectedGroupingFields[i] = '');
    this.selectedGroupingFields = [...this.selectedGroupingFields]; // force dirty checking
  }

  clearGrouping() {
    if (this.draggableGroupingPlugin && this.draggableGroupingPlugin.setDroppedGroups) {
      this.draggableGroupingPlugin.clearDroppedGroups();
    }
    this.sgb?.slickGrid.invalidate(); // invalidate all rows and re-render
  }

  collapseAllGroups() {
    this.sgb?.dataView.collapseAllGroups();
  }

  expandAllGroups() {
    this.sgb?.dataView.expandAllGroups();
  }

  clearAllFiltersAndSorts() {
    if (this.sgb?.gridService) {
      this.sgb.gridService.clearAllFiltersAndSorts();
    }
  }

  groupByFieldName(_fieldName, _index) {
    this.clearGrouping();
    if (this.draggableGroupingPlugin && this.draggableGroupingPlugin.setDroppedGroups) {
      this.showPreHeader();

      // get the field names from Group By select(s) dropdown, but filter out any empty fields
      const groupedFields = this.selectedGroupingFields.filter((g) => g !== '');
      if (groupedFields.length === 0) {
        this.clearGrouping();
      } else {
        this.draggableGroupingPlugin.setDroppedGroups(groupedFields);
      }
      this.sgb?.slickGrid.invalidate(); // invalidate all rows and re-render
    }
  }

  onGroupChanged(change: { caller?: string; groupColumns: Grouping[] }) {
    const caller = change && change.caller || [];
    const groups = change && change.groupColumns || [];

    if (Array.isArray(this.selectedGroupingFields) && Array.isArray(groups) && groups.length > 0) {
      // update all Group By select dropdown
      this.selectedGroupingFields.forEach((_g, i) => this.selectedGroupingFields[i] = groups[i] && groups[i].getter || '');
      this.selectedGroupingFields = [...this.selectedGroupingFields]; // force dirty checking
    } else if (groups.length === 0 && caller === 'remove-group') {
      this.clearGroupingSelects();
    }
  }

  showPreHeader() {
    this.sgb?.slickGrid.setPreHeaderPanelVisibility(true);
  }

  togglePagination() {
    this.sgb?.paginationService?.goToLastPage();
  }

  /** Dispatched event of a Grid State Changed event */
  gridStateChanged(event) {
    if (event?.detail) {
      const gridStateChanges: GridStateChange = event.detail;
      // console.log('Client sample, Grid State changed:: ', gridStateChanges);
      console.log('Client sample, Grid State changed:: ', gridStateChanges.change);
    }
  }

  saveAll() {
    // Edit Queue (array increases every time a cell is changed, regardless of item object)
    console.log(this.editQueue);

    // Edit Items only keeps the merged data (an object with row index as the row properties)
    // if you change 2 different cells on 2 different cells then this editedItems will only contain 1 property
    // example: editedItems = { 0: { title: task 0, duration: 50, ... }}
    // ...means that row index 0 got changed and the final merged object is { title: task 0, duration: 50, ... }
    console.log(this.editedItems);
    // console.log(`We changed ${Object.keys(this.editedItems).length} rows`);

    // since we saved, we can now remove all the unsaved color styling and reset our array/object
    this.removeAllUnsavedStylingFromCell();
    this.editQueue = [];
    this.editedItems = {};
  }

  undoLastEdit(showLastEditor = false) {
    const lastEdit = this.editQueue.pop();
    const lastEditCommand = lastEdit?.editCommand;
    if (lastEdit && lastEditCommand && Slick.GlobalEditorLock.cancelCurrentEdit()) {
      lastEditCommand.undo();

      // remove unsaved css class from that cell
      this.removeUnsavedStylingFromCell(lastEdit.item, lastEdit.column, lastEditCommand.row);
      this.sgb.slickGrid.invalidate();


      // optionally open the last cell editor associated
      if (showLastEditor) {
        this.sgb?.slickGrid.gotoCell(lastEditCommand.row, lastEditCommand.cell, false);
      }
    }
  }

  undoAllEdits() {
    for (const lastEdit of this.editQueue) {
      const lastEditCommand = lastEdit?.editCommand;
      if (lastEditCommand && Slick.GlobalEditorLock.cancelCurrentEdit()) {
        lastEditCommand.undo();

        // remove unsaved css class from that cell
        this.removeUnsavedStylingFromCell(lastEdit.item, lastEdit.column, lastEditCommand.row);
      }
    }
    this.sgb.slickGrid.invalidate(); // re-render the grid only after every cells got rolled back
    this.editQueue = [];
  }

  toggleGridEditReadonly() {
    // first need undo all edits
    this.undoAllEdits();

    // then change a single grid options to make the grid non-editable (readonly)
    this.isGridEditable = !this.isGridEditable;
    this.sgb.gridOptions = { editable: this.isGridEditable };
    this.gridOptions = this.sgb.gridOptions;
  }

  removeUnsavedStylingFromCell(_item: any, column: Column, row: number) {
    // remove unsaved css class from that cell
    this.sgb.slickGrid.removeCellCssStyles(`unsaved_highlight_${[column.field]}${row}`);
  }

  removeAllUnsavedStylingFromCell() {
    for (const lastEdit of this.editQueue) {
      const lastEditCommand = lastEdit?.editCommand;
      if (lastEditCommand) {
        // remove unsaved css class from that cell
        this.removeUnsavedStylingFromCell(lastEdit.item, lastEdit.column, lastEditCommand.row);
      }
    }
  }
}
