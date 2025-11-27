// MySQL Data Types constants
export const MYSQL_NUMERIC_TYPES = [
  "TINYINT",
  "SMALLINT",
  "MEDIUMINT",
  "INT",
  "BIGINT",
  "DECIMAL",
  "FLOAT",
  "DOUBLE",
] as const;

export const MYSQL_STRING_TYPES = [
  "CHAR",
  "VARCHAR",
  "TINYTEXT",
  "TEXT",
  "MEDIUMTEXT",
  "LONGTEXT",
] as const;

export const MYSQL_DATE_TIME_TYPES = [
  "DATE",
  "TIME",
  "DATETIME",
  "TIMESTAMP",
  "YEAR",
] as const;

export const MYSQL_BINARY_TYPES = [
  "BINARY",
  "VARBINARY",
  "TINYBLOB",
  "BLOB",
  "MEDIUMBLOB",
  "LONGBLOB",
] as const;

export const MYSQL_OTHER_TYPES = [
  "BOOLEAN",
  "ENUM",
  "SET",
  "JSON",
  "UUID",
] as const;

export const MYSQL_DATA_TYPES = [
  ...MYSQL_NUMERIC_TYPES,
  ...MYSQL_STRING_TYPES,
  ...MYSQL_DATE_TIME_TYPES,
  ...MYSQL_BINARY_TYPES,
  ...MYSQL_OTHER_TYPES,
] as const;

export type MySQLDataType = (typeof MYSQL_DATA_TYPES)[number];

// Data type groups for UI categorization
export const DATA_TYPE_GROUPS = {
  Numeric: MYSQL_NUMERIC_TYPES,
  String: MYSQL_STRING_TYPES,
  DateTime: MYSQL_DATE_TIME_TYPES,
  Binary: MYSQL_BINARY_TYPES,
  Other: MYSQL_OTHER_TYPES,
} as const;
