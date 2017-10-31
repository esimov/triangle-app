/* eslint-disable flowtype/require-valid-file-annotation */

import { create, SheetsRegistry } from 'jss';
import preset from 'jss-preset-default';

// Configure JSS
const jss = create(preset());

export const sheetsManager = new Map();

export default function createContext() {
  return {
    jss,    
    // This is needed in order to deduplicate the injection of CSS in the page.
    sheetsManager,
    // This is needed in order to inject the critical CSS.
    sheetsRegistry: new SheetsRegistry(),
  };
}
