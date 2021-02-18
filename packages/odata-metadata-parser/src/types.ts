export enum ODataTypes {
  Binary,
  Boolean,
  Byte,
  Date,
  DateTimeOffset,
  Decimal,
  Double,
  Duration,
  Guid,
  Int16,
  Int32,
  Int64,
  SByte,
  Single,
  Stream,
  String,
  TimeOfDay
}

export class ODataTypeMap {
  // Binary data
  public static 'Edm.Binary' = ODataTypes.Binary;

  // Binary-valued logic
  public static 'Edm.Boolean' = ODataTypes.Boolean;

  // Unsigned 8-bit integer
  public static 'Edm.Byte' = ODataTypes.Byte;

  // Date without a time-zone offset
  public static 'Edm.Date' = ODataTypes.Date;

  // Date and time with a time-zone offset, no leap seconds
  public static 'Edm.DateTimeOffset' = ODataTypes.DateTimeOffset;

  // Numeric values with fixed precision and scale
  public static 'Edm.Decimal' = ODataTypes.Decimal;

  // IEEE 754 binary64 floating-point number (15-17 decimal digits)
  public static 'Edm.Double' = ODataTypes.Double;

  // Signed duration in days, hours, minutes, and (sub)seconds
  public static 'Edm.Duration' = ODataTypes.Duration;

  // 16-byte (128-bit) unique identifier
  public static 'Edm.Guid' = ODataTypes.Guid;

  // Signed 16-bit integer
  public static 'Edm.Int16' = ODataTypes.Int16;

  // Signed 32-bit integer
  public static 'Edm.Int32' = ODataTypes.Int32;

  // Signed 64-bit integer
  public static 'Edm.Int64' = ODataTypes.Int64;

  // Signed 8-bit integer
  public static 'Edm.SByte' = ODataTypes.SByte;

  // IEEE 754 binary32 floating-point number (6-9 decimal digits)
  public static 'Edm.Single' = ODataTypes.Single;

  // Binary data stream
  public static 'Edm.Stream' = ODataTypes.Stream;

  // Sequence of UTF-8 characters
  public static 'Edm.String' = ODataTypes.String;

  // Clock time 00:00-23:59:59.999999999999
  public static 'Edm.TimeOfDay' = ODataTypes.TimeOfDay;
}

export class ODataAttribute {
  constructor(public name: string, public namespace: string = '') {
  }
}

export class ODataProperty {
  public static labelAttributes: ODataAttribute[] = [
    new ODataAttribute('label'),
    new ODataAttribute('label', 'http://www.sap.com/Protocols/SAPData'),
    new ODataAttribute('heading', 'http://www.sap.com/Protocols/SAPData'),
    new ODataAttribute('Name')
  ];
  public isKey: boolean;
  public type: ODataTypes;
  public label: string;
  public description: string;
  public isNullable: boolean;
  public filterable = true;
  public sortable = true;
  public searchable: boolean;

  constructor(public name: string) {
  }
}

export class ODataEntityType {
  public properties: Map<string, ODataProperty> = new Map<string, ODataProperty>();

  constructor(public name: string, public namespace?: string) {
  }
}

export class ODataEntitySet {
  constructor(public name: string, public entityType: ODataEntityType, public namespace?: string) {
  }
}

export class ODataMetadata {
  public entitySets: Map<string, ODataEntitySet> = new Map<string, ODataEntitySet>();
  public entityTypes: Map<string, ODataEntityType> = new Map<string, ODataEntityType>();
}