/**
 * Parsers Index
 * Re-exports all parser modules for convenient importing
 */

export { parse as parseCSV } from './csv.js';
export { parse as parseJSON } from './json.js';

import CSVParser from './csv.js';
import JSONParser from './json.js';

export { CSVParser, JSONParser };
