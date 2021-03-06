import { FieldType } from '../enums/fieldType.enum';
import { Column, Formatter, GridOption, SlickGrid } from '../interfaces/index';
import { mapMomentDateFormatWithFieldType } from '../services/utilities';
import * as moment_ from 'moment-mini';
const moment = moment_['default'] || moment_; // patch to fix rollup "moment has no default export" issue, document here https://github.com/rollup/rollup/issues/670

/**
 * Find the option value from the following (in order of execution)
 * 1- Column Definition "params"
 * 2- Grid Options "formatterOptions"
 * 3- nothing found, return default value provided
 */
export function getValueFromParamsOrFormatterOptions(optionName: string, columnDef: Column, grid: SlickGrid, defaultValue?: any) {
  const gridOptions = ((grid && typeof grid.getOptions === 'function') ? grid.getOptions() : {}) as GridOption;
  const params = columnDef && columnDef.params;

  if (params && params.hasOwnProperty(optionName)) {
    return params[optionName];
  } else if (gridOptions.formatterOptions && gridOptions.formatterOptions.hasOwnProperty(optionName)) {
    return gridOptions.formatterOptions[optionName];
  }
  return defaultValue;
}

/** From a FieldType, return the associated date Formatter */
export function getAssociatedDateFormatter(fieldType: typeof FieldType[keyof typeof FieldType], defaultSeparator: string): Formatter {
  const defaultDateFormat = mapMomentDateFormatWithFieldType(fieldType);

  return (_row: number, _cell: number, value: any, columnDef: Column, _dataContext: any, grid: SlickGrid) => {
    const gridOptions = ((grid && typeof grid.getOptions === 'function') ? grid.getOptions() : {}) as GridOption;
    const customSeparator = gridOptions?.formatterOptions?.dateSeparator ?? defaultSeparator;
    const inputType = columnDef?.type ?? 'date';
    const inputDateFormat = mapMomentDateFormatWithFieldType(inputType);
    const isParsingAsUtc = columnDef?.params?.parseDateAsUtc ?? false;

    const isDateValid = moment(value, inputDateFormat, false).isValid();
    let outputDate = value;
    if (value && isDateValid) {
      outputDate = isParsingAsUtc ? moment.utc(value).format(defaultDateFormat) : moment(value).format(defaultDateFormat);
    }

    // user can customize the separator through the "formatterOptions"
    // if that is the case we need to replace the default "/" to the new separator
    if (outputDate && customSeparator !== defaultSeparator) {
      const regex = new RegExp(defaultSeparator, 'ig'); // find separator globally
      outputDate = outputDate.replace(regex, customSeparator);
    }

    return outputDate;
  };
}
