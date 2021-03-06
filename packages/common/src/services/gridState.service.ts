import { dequal } from 'dequal';

import {
  ExtensionName,
  GridStateType,
} from '../enums/index';
import {
  Column,
  CurrentColumn,
  CurrentFilter,
  CurrentPagination,
  CurrentRowSelection,
  CurrentSorter,
  SlickDataView,
  GridOption,
  GridState,
  SlickGrid,
  Subscription,
  SlickNamespace,
  GetSlickEventType,
  SlickEventHandler,
} from '../interfaces/index';
import { ExtensionService } from './extension.service';
import { FilterService } from './filter.service';
import { SharedService } from './shared.service';
import { SortService } from './sort.service';
import { PubSubService } from './pubSub.service';

// using external non-typed js libraries
declare const Slick: SlickNamespace;

export class GridStateService {
  private _eventHandler = new Slick.EventHandler();
  private _columns: Column[] = [];
  private _currentColumns: CurrentColumn[] = [];
  private _grid: SlickGrid;
  private _subscriptions: Subscription[] = [];
  private _selectedRowDataContextIds: Array<number | string> | undefined = []; // used with row selection
  private _selectedFilteredRowDataContextIds: Array<number | string> | undefined = []; // used with row selection
  private _wasRecheckedAfterPageChange = true; // used with row selection & pagination

  constructor(
    private extensionService: ExtensionService,
    private filterService: FilterService,
    private pubSubService: PubSubService,
    private sharedService: SharedService,
    private sortService: SortService
  ) { }

  /** Getter of SlickGrid DataView object */
  get _dataView(): SlickDataView {
    return (this._grid?.getData && this._grid.getData()) as SlickDataView;
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  private get _gridOptions(): GridOption {
    return (this._grid?.getOptions) ? this._grid.getOptions() : {};
  }

  private get datasetIdPropName(): string {
    return this._gridOptions.datasetIdPropertyName || 'id';
  }

  /** Getter of the selected data context object IDs */
  get selectedRowDataContextIds(): Array<number | string> | undefined {
    return this._selectedRowDataContextIds;
  }

  /** Setter of the selected data context object IDs */
  set selectedRowDataContextIds(dataContextIds: Array<number | string> | undefined) {
    this._selectedRowDataContextIds = dataContextIds;

    // since this is coming from a preset, we also need to update the filtered IDs
    this._selectedFilteredRowDataContextIds = dataContextIds;
  }

  /**
   * Initialize the Service
   * @param grid
   */
  init(grid: SlickGrid): void {
    this._grid = grid;
    this.subscribeToAllGridChanges(grid);
  }

  /** Dispose of all the SlickGrid & PubSub subscriptions */
  dispose() {
    this._currentColumns = [];
    this._columns = [];

    // unsubscribe all SlickGrid events
    this._eventHandler.unsubscribeAll();

    // also dispose of all Subscriptions
    this.pubSubService.unsubscribeAll(this._subscriptions);
  }

  /**
   * Dynamically change the arrangement/distribution of the columns Positions/Visibilities and optionally Widths.
   * For a column to have its visibly as hidden, it has to be part of the original list but excluded from the list provided as argument to be considered a hidden field.
   * If you are passing columns Width, then you probably don't want to trigger the autosizeColumns (2nd argument to False).
   * @param {Array<Column>} definedColumns - defined columns
   * @param {Boolean} triggerAutoSizeColumns - True by default, do we also want to call the "autosizeColumns()" method to make the columns fit in the grid?
   */
  changeColumnsArrangement(definedColumns: CurrentColumn[], triggerAutoSizeColumns = true) {
    if (Array.isArray(definedColumns) && definedColumns.length > 0) {
      const gridColumns: Column[] = this.getAssociatedGridColumns(this._grid, definedColumns);

      if (gridColumns && Array.isArray(gridColumns) && gridColumns.length > 0) {
        // make sure that the checkbox selector is still visible in the list when it is enabled
        if (this._gridOptions.enableCheckboxSelector) {
          const checkboxColumn = (Array.isArray(this.sharedService.allColumns) && this.sharedService.allColumns.length > 0) ? this.sharedService.allColumns[0] : null;
          if (checkboxColumn?.id === '_checkbox_selector' && gridColumns[0].id !== '_checkbox_selector') {
            gridColumns.unshift(checkboxColumn);
          }
        }

        // finally set the new presets columns (including checkbox selector if need be)
        this._grid.setColumns(gridColumns);

        // resize the columns to fit the grid canvas
        if (triggerAutoSizeColumns) {
          this._grid.autosizeColumns();
        }
      }
    }
  }

  /**
   * Get the current grid state (filters/sorters/pagination)
   * @return grid state
   */
  getCurrentGridState(args?: { requestRefreshRowFilteredRow?: boolean }): GridState {
    const gridState: GridState = {
      columns: this.getCurrentColumns(),
      filters: this.getCurrentFilters(),
      sorters: this.getCurrentSorters(),
    };

    const currentPagination = this.getCurrentPagination();
    if (currentPagination) {
      gridState.pagination = currentPagination;
    }

    if (this.hasRowSelectionEnabled()) {
      const currentRowSelection = this.getCurrentRowSelections(args && args.requestRefreshRowFilteredRow);
      if (currentRowSelection) {
        gridState.rowSelection = currentRowSelection;
      }
    }

    return gridState;
  }

  /**
   * Get the Columns (and their state: visibility/position) that are currently applied in the grid
   * @return current columns
   */
  getColumns(): Column[] {
    return this._columns;
  }

  /**
   * From an array of Grid Column Definitions, get the associated Current Columns
   * @param gridColumns
   */
  getAssociatedCurrentColumns(gridColumns: Column[]): CurrentColumn[] {
    const currentColumns: CurrentColumn[] = [];

    if (gridColumns && Array.isArray(gridColumns)) {
      gridColumns.forEach((column: Column) => {
        if (column && column.id) {
          currentColumns.push({
            columnId: column.id as string,
            cssClass: column.cssClass || '',
            headerCssClass: column.headerCssClass || '',
            width: column.width || 0
          });
        }
      });
    }
    this._currentColumns = currentColumns;
    return currentColumns;
  }

  /**
   * From an array of Current Columns, get the associated Grid Column Definitions
   * @param grid
   * @param currentColumns
   */
  getAssociatedGridColumns(grid: SlickGrid, currentColumns: CurrentColumn[]): Column[] {
    const columns: Column[] = [];
    const gridColumns: Column[] = this.sharedService.allColumns || grid.getColumns();

    if (currentColumns && Array.isArray(currentColumns)) {
      currentColumns.forEach((currentColumn: CurrentColumn) => {
        const gridColumn: Column | undefined = gridColumns.find((c: Column) => c.id === currentColumn.columnId);
        if (gridColumn && gridColumn.id) {
          columns.push({
            ...gridColumn,
            cssClass: currentColumn.cssClass,
            headerCssClass: currentColumn.headerCssClass,
            width: currentColumn.width
          });
        }
      });
    }
    this._columns = columns;
    return columns;
  }

  /**
   * Get the Columns (and their states: visibility/position/width) that are currently applied in the grid
   * @return current columns
   */
  getCurrentColumns(): CurrentColumn[] {
    let currentColumns: CurrentColumn[] = [];
    if (this._currentColumns && Array.isArray(this._currentColumns) && this._currentColumns.length > 0) {
      currentColumns = this._currentColumns;
    } else {
      currentColumns = this.getAssociatedCurrentColumns(this._grid.getColumns());
    }

    return currentColumns;
  }

  /**
   * Get the Filters (and their state, columnId, searchTerm(s)) that are currently applied in the grid
   * @return current filters
   */
  getCurrentFilters(): CurrentFilter[] | null {
    if (this._gridOptions && this._gridOptions.backendServiceApi) {
      const backendService = this._gridOptions.backendServiceApi.service;
      if (backendService && backendService.getCurrentFilters) {
        return backendService.getCurrentFilters() as CurrentFilter[];
      }
    } else if (this.filterService && this.filterService.getCurrentLocalFilters) {
      return this.filterService.getCurrentLocalFilters();
    }
    return null;
  }

  /**
   * Get current Pagination (and its state, pageNumber, pageSize) that are currently applied in the grid
   * @return current pagination state
   */
  getCurrentPagination(): CurrentPagination | null {
    if (this._gridOptions.enablePagination) {
      if (this._gridOptions && this._gridOptions.backendServiceApi) {
        const backendService = this._gridOptions.backendServiceApi.service;
        if (backendService && backendService.getCurrentPagination) {
          return backendService.getCurrentPagination();
        }
      } else {
        return this.sharedService.currentPagination;
      }
    }
    return null;
  }

  /**
   * Get the current Row Selections (and its state, gridRowIndexes, dataContextIds, filteredDataContextIds) that are currently applied in the grid
   * @param boolean are we requesting a refresh of the Section FilteredRow
   * @return current row selection
   */
  getCurrentRowSelections(requestRefreshFilteredRow = true): CurrentRowSelection | null {
    if (this._grid && this._gridOptions && this._dataView && this.hasRowSelectionEnabled()) {
      if (this._grid.getSelectedRows && this._dataView.mapRowsToIds) {
        let filteredDataContextIds: Array<number | string> | undefined = [];
        const gridRowIndexes: number[] = this._dataView.mapIdsToRows(this._selectedRowDataContextIds || []); // note that this will return only what is visible in current page
        const dataContextIds: Array<number | string> | undefined = this._selectedRowDataContextIds;

        // user might request to refresh the filtered selection dataset
        // typically always True, except when "reEvaluateRowSelectionAfterFilterChange" is called and we don't need to refresh the filtered dataset twice
        if (requestRefreshFilteredRow === true) {
          filteredDataContextIds = this.refreshFilteredRowSelections();
        }
        filteredDataContextIds = this._selectedFilteredRowDataContextIds;

        return { gridRowIndexes, dataContextIds, filteredDataContextIds };
      }
    }
    return null;
  }

  /**
   * Get the current Sorters (and their state, columnId, direction) that are currently applied in the grid
   * @return current sorters
   */
  getCurrentSorters(): CurrentSorter[] | null {
    if (this._gridOptions && this._gridOptions.backendServiceApi) {
      const backendService = this._gridOptions.backendServiceApi.service;
      if (backendService && backendService.getCurrentSorters) {
        return backendService.getCurrentSorters() as CurrentSorter[];
      }
    } else if (this.sortService && this.sortService.getCurrentLocalSorters) {
      return this.sortService.getCurrentLocalSorters();
    }
    return null;
  }

  /** Check whether the row selection needs to be preserved */
  needToPreserveRowSelection(): boolean {
    let preservedRowSelection = false;
    if (this._gridOptions && this._gridOptions.dataView && this._gridOptions.dataView.hasOwnProperty('syncGridSelection')) {
      const syncGridSelection = this._gridOptions.dataView.syncGridSelection;
      if (typeof syncGridSelection === 'boolean') {
        preservedRowSelection = this._gridOptions.dataView.syncGridSelection as boolean;
      } else if (typeof syncGridSelection === 'object') {
        preservedRowSelection = syncGridSelection.preserveHidden;
      }

      // if the result is True but the grid is using a Backend Service, we will do an extra flag check the reason is because it might have some unintended behaviors
      // with the BackendServiceApi because technically the data in the page changes the DataView on every page.
      if (preservedRowSelection && this._gridOptions.backendServiceApi && this._gridOptions.dataView.hasOwnProperty('syncGridSelectionWithBackendService')) {
        preservedRowSelection = this._gridOptions.dataView.syncGridSelectionWithBackendService as boolean;
      }
    }
    return preservedRowSelection;
  }

  resetColumns(columnDefinitions?: Column[]) {
    const columns: Column[] = columnDefinitions || this._columns;
    const currentColumns: CurrentColumn[] = this.getAssociatedCurrentColumns(columns);
    this.pubSubService.publish('onGridStateChanged', { change: { newValues: currentColumns, type: GridStateType.columns }, gridState: this.getCurrentGridState() });
  }

  /**
   * Reset the grid to its original (all) columns, that is to display the entire set of columns with their original positions & visibilities
   * @param {Boolean} triggerAutoSizeColumns - True by default, do we also want to call the "autosizeColumns()" method to make the columns fit in the grid?
   */
  resetToOriginalColumns(triggerAutoSizeColumns = true) {
    this._grid.setColumns(this.sharedService.allColumns);

    // resize the columns to fit the grid canvas
    if (triggerAutoSizeColumns) {
      this._grid.autosizeColumns();
    }
  }

  /** if we use Row Selection or the Checkbox Selector, we need to reset any selection */
  resetRowSelectionWhenRequired() {
    if (!this.needToPreserveRowSelection() && (this._gridOptions.enableRowSelection || this._gridOptions.enableCheckboxSelector)) {
      // this also requires the Row Selection Model to be registered as well
      const rowSelectionExtension = this.extensionService && this.extensionService.getExtensionByName && this.extensionService.getExtensionByName(ExtensionName.rowSelection);
      if (rowSelectionExtension && rowSelectionExtension.instance) {
        this._grid.setSelectedRows([]);
      }
    }
  }

  /**
   * Subscribe to all necessary SlickGrid or Service Events that deals with a Grid change,
   * when triggered, we will publish a Grid State Event with current Grid State
   */
  subscribeToAllGridChanges(grid: SlickGrid) {
    // Subscribe to Event Emitter of Filter changed
    this._subscriptions.push(
      this.pubSubService.subscribe('onFilterChanged', (currentFilters: CurrentFilter[]) => {
        this.resetRowSelectionWhenRequired();
        this.pubSubService.publish('onGridStateChanged', { change: { newValues: currentFilters, type: GridStateType.filter }, gridState: this.getCurrentGridState({ requestRefreshRowFilteredRow: !this.hasRowSelectionEnabled() }) });

        // when Row Selection is enabled, we also need to re-evaluate the row selection with the leftover filtered dataset
        if (this.hasRowSelectionEnabled()) {
          this.reEvaluateRowSelectionAfterFilterChange();
        }
      })
    );
    // Subscribe to Event Emitter of Filter cleared
    this._subscriptions.push(
      this.pubSubService.subscribe('onFilterCleared', () => {
        this.resetRowSelectionWhenRequired();
        this.pubSubService.publish('onGridStateChanged', { change: { newValues: [], type: GridStateType.filter }, gridState: this.getCurrentGridState() });
      })
    );

    // Subscribe to Event Emitter of Sort changed
    this._subscriptions.push(
      this.pubSubService.subscribe('onSortChanged', (currentSorters: CurrentSorter[]) => {
        this.resetRowSelectionWhenRequired();
        this.pubSubService.publish('onGridStateChanged', { change: { newValues: currentSorters, type: GridStateType.sorter }, gridState: this.getCurrentGridState() });
      })
    );
    // Subscribe to Event Emitter of Sort cleared
    this._subscriptions.push(
      this.pubSubService.subscribe('onSortCleared', () => {
        this.resetRowSelectionWhenRequired();
        this.pubSubService.publish('onGridStateChanged', { change: { newValues: [], type: GridStateType.sorter }, gridState: this.getCurrentGridState() });
      })
    );

    // Subscribe to ColumnPicker and/or GridMenu for show/hide Columns visibility changes
    this.bindExtensionAddonEventToGridStateChange(ExtensionName.columnPicker, 'onColumnsChanged');
    this.bindExtensionAddonEventToGridStateChange(ExtensionName.gridMenu, 'onColumnsChanged');

    // subscribe to Column Resize & Reordering
    this.bindSlickGridColumnChangeEventToGridStateChange('onColumnsReordered', grid);
    this.bindSlickGridColumnChangeEventToGridStateChange('onColumnsResized', grid);

    // subscribe to Row Selection changes (when enabled)
    if (this._gridOptions.enableRowSelection || this._gridOptions.enableCheckboxSelector) {
      this.bindSlickGridRowSelectionToGridStateChange();
    }

    // subscribe to HeaderMenu (hide column)
    this._subscriptions.push(
      this.pubSubService.subscribe('onHeaderMenuHideColumns', (visibleColumns: Column[]) => {
        const currentColumns: CurrentColumn[] = this.getAssociatedCurrentColumns(visibleColumns);
        this.pubSubService.publish('onGridStateChanged', { change: { newValues: currentColumns, type: GridStateType.columns }, gridState: this.getCurrentGridState() });
      })
    );
  }

  // --
  // private methods
  // ------------------

  /**
   * Bind a SlickGrid Extension Event to a Grid State change event
   * @param extension name
   * @param event name
   */
  bindExtensionAddonEventToGridStateChange(extensionName: ExtensionName, eventName: string) {
    const extension = this.extensionService && this.extensionService.getExtensionByName && this.extensionService.getExtensionByName(extensionName);
    const slickEvent = extension && extension.instance && extension.instance[eventName];

    if (slickEvent && typeof slickEvent.subscribe === 'function') {
      (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof slickEvent>>).subscribe(slickEvent, (_e, args) => {
        const columns: Column[] = args && args.columns;
        const currentColumns: CurrentColumn[] = this.getAssociatedCurrentColumns(columns);
        this.pubSubService.publish('onGridStateChanged', { change: { newValues: currentColumns, type: GridStateType.columns }, gridState: this.getCurrentGridState() });
      });
    }
  }

  /**
   * Bind a Grid Event (of Column changes) to a Grid State change event
   * @param event name
   * @param grid
   */
  bindSlickGridColumnChangeEventToGridStateChange(eventName: string, grid: SlickGrid) {
    const slickGridEvent = grid && grid[eventName];

    if (slickGridEvent && typeof slickGridEvent.subscribe === 'function') {
      (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof slickGridEvent>>).subscribe(slickGridEvent, () => {
        const columns: Column[] = grid.getColumns();
        const currentColumns: CurrentColumn[] = this.getAssociatedCurrentColumns(columns);
        this.pubSubService.publish('onGridStateChanged', { change: { newValues: currentColumns, type: GridStateType.columns }, gridState: this.getCurrentGridState() });
      });
    }
  }

  /**
   * Bind a Grid Event of Row Selection change to a Grid State change event
   * For the row selection, we can't just use the getSelectedRows() since this will only return the visible rows shown in the UI which is not enough.
   * The process is much more complex, what we have to do instead is the following
   * 1. when changing a row selection, we'll add the new selection if it's not yet in the global array of selected IDs
   * 2. when deleting a row selection, we'll remove the selection from our global array of selected IDs (unless it came from a page change)
   * 3. if we use Pagination and we change page, we'll keep track with a flag (this flag will be used to skip any deletion when we're changing page)
   * 4. after the Page or DataView is changed or updated, we'll do an extra (and delayed) check to make sure that what we have in our global array of selected IDs is displayed on screen
   */
  private bindSlickGridRowSelectionToGridStateChange() {
    if (this._grid && this._gridOptions && this._dataView) {
      const onBeforePagingInfoChangedHandler = this._dataView.onBeforePagingInfoChanged;
      (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onBeforePagingInfoChangedHandler>>).subscribe(onBeforePagingInfoChangedHandler, () => {
        this._wasRecheckedAfterPageChange = false; // reset the page check flag, to skip deletions on page change (used in code below)
      });

      const onPagingInfoChangedHandler = this._dataView.onPagingInfoChanged;
      (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onPagingInfoChangedHandler>>).subscribe(onPagingInfoChangedHandler, () => {
        // when user changes page, the selected row indexes might not show up
        // we can check to make sure it is but it has to be in a delay so it happens after the first "onSelectedRowsChanged" is triggered
        setTimeout(() => {
          const shouldBeSelectedRowIndexes = this._dataView.mapIdsToRows(this._selectedRowDataContextIds || []);
          const currentSelectedRowIndexes = this._grid.getSelectedRows();
          if (!dequal(shouldBeSelectedRowIndexes, currentSelectedRowIndexes)) {
            this._grid.setSelectedRows(shouldBeSelectedRowIndexes);
          }
        });
      });

      const onSelectedRowsChangedHandler = this._grid.onSelectedRowsChanged;
      (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onSelectedRowsChangedHandler>>).subscribe(onSelectedRowsChangedHandler, (_e, args) => {
        if (Array.isArray(args.rows) && Array.isArray(args.previousSelectedRows)) {
          const newSelectedRows = args.rows as number[];
          const prevSelectedRows = args.previousSelectedRows as number[];

          const newSelectedAdditions = newSelectedRows.filter((i) => prevSelectedRows.indexOf(i) < 0);
          const newSelectedDeletions = prevSelectedRows.filter((i) => newSelectedRows.indexOf(i) < 0);

          // deletion might happen when user is changing page, if that is the case then skip the deletion since it's only a visual deletion (current page)
          // if it's not a page change (when the flag is true), then proceed with the deletion in our global array of selected IDs
          if (this._wasRecheckedAfterPageChange && newSelectedDeletions.length > 0) {
            const toDeleteDataIds: Array<number | string> = this._dataView.mapRowsToIds(newSelectedDeletions) || [];
            toDeleteDataIds.forEach((removeId: number | string) => {
              if (Array.isArray(this._selectedRowDataContextIds)) {
                this._selectedRowDataContextIds.splice((this._selectedRowDataContextIds as Array<number | string>).indexOf(removeId), 1);
              }
            });
          }

          // if we have newly added selected row(s), let's update our global array of selected IDs
          if (newSelectedAdditions.length > 0) {
            const toAddDataIds: Array<number | string> = this._dataView.mapRowsToIds(newSelectedAdditions) || [];
            toAddDataIds.forEach((dataId: number | string) => {
              if ((this._selectedRowDataContextIds as Array<number | string>).indexOf(dataId) === -1) {
                (this._selectedRowDataContextIds as Array<number | string>).push(dataId);
              }
            });
          }

          // we set this flag which will be used on the 2nd time the "onSelectedRowsChanged" event is called
          // when it's the first time, we skip deletion and this is what this flag is for
          this._wasRecheckedAfterPageChange = true;

          // form our full selected row IDs, let's make sure these indexes are selected in the grid, if not then let's call a reselect
          // this could happen if the previous step was a page change
          const shouldBeSelectedRowIndexes = this._dataView.mapIdsToRows(this._selectedRowDataContextIds || []);
          const currentSelectedRowIndexes = this._grid.getSelectedRows();
          if (!dequal(shouldBeSelectedRowIndexes, currentSelectedRowIndexes)) {
            this._grid.setSelectedRows(shouldBeSelectedRowIndexes);
          }

          const filteredDataContextIds = this.refreshFilteredRowSelections();
          const newValues = { gridRowIndexes: this._grid.getSelectedRows(), dataContextIds: this._selectedRowDataContextIds, filteredDataContextIds } as CurrentRowSelection;
          this.pubSubService.publish('onGridStateChanged', { change: { newValues, type: GridStateType.rowSelection }, gridState: this.getCurrentGridState() });
        }
      });
    }
  }

  /** Check wether the grid has the Row Selection enabled */
  private hasRowSelectionEnabled() {
    const selectionModel = this._grid.getSelectionModel();
    const isRowSelectionEnabled = this._gridOptions.enableRowSelection || this._gridOptions.enableCheckboxSelector;
    return (isRowSelectionEnabled && selectionModel);
  }

  private reEvaluateRowSelectionAfterFilterChange() {
    const currentSelectedRowIndexes = this._grid.getSelectedRows();
    const previousSelectedFilteredRowDataContextIds = (this._selectedFilteredRowDataContextIds || []).slice();
    const filteredDataContextIds = this.refreshFilteredRowSelections();

    // when selection changed, we'll send a Grid State event with the selection changes
    if (!dequal(this._selectedFilteredRowDataContextIds, previousSelectedFilteredRowDataContextIds)) {
      const newValues = { gridRowIndexes: currentSelectedRowIndexes, dataContextIds: this._selectedRowDataContextIds, filteredDataContextIds } as CurrentRowSelection;
      this.pubSubService.publish('onGridStateChanged', { change: { newValues, type: GridStateType.rowSelection }, gridState: this.getCurrentGridState({ requestRefreshRowFilteredRow: false }) });
    }
  }

  /** When a Filter is triggered or when user request it, we will refresh the filtered selection array and return it */
  private refreshFilteredRowSelections(): Array<number | string> {
    let tmpFilteredArray: Array<number | string> = [];
    const filteredDataset = this._dataView.getFilteredItems() || [];
    if (Array.isArray(this._selectedRowDataContextIds)) {
      const selectedFilteredRowDataContextIds = [...this._selectedRowDataContextIds]; // take a fresh copy of all selections before filtering the row ids
      tmpFilteredArray = selectedFilteredRowDataContextIds.filter((selectedRowId: number | string) => {
        return filteredDataset.findIndex((item: any) => item[this.datasetIdPropName] === selectedRowId) > -1;
      });
      this._selectedFilteredRowDataContextIds = tmpFilteredArray;
    }
    return tmpFilteredArray;
  }
}
