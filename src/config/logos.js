/**
 * Centralised logo imports.
 * Vite processes these as module imports — it will bundle, hash, and correctly
 * resolve the URLs even when the app is served under a sub-path like
 * /m3infrastructure_frontend/.
 *
 * Use these named exports wherever a logo image is needed, instead of
 * hardcoded "/src/assets/..." strings which break in production.
 */

import HotWorks from '../assets/images/logos/HotWorks.png';
import ConfinedSpace from '../assets/images/logos/ConfinedSpace.png';
import Craneslifting from '../assets/images/logos/Craneslifting.png';
import ElectricalSystems from '../assets/images/logos/ElectricalSystems.png';
import ExcavationWorks from '../assets/images/logos/ExcavationWorks.png';
import WorkingAtHight from '../assets/images/logos/WorkingAtHight.png';
import substanceChemical from '../assets/images/logos/substanceChemical.png';
import electrical_works from '../assets/images/logos/electrical_works.png';
import mechanical1 from '../assets/images/logos/mechanical1.png';
import testingequipment from '../assets/images/logos/testingequipment.png';

/** Map from filename (as stored in the DB / HRA_LIST) to the bundled URL. */
export const LOGO_MAP = {
  'HotWorks.png': HotWorks,
  'ConfinedSpace.png': ConfinedSpace,
  'Craneslifting.png': Craneslifting,
  'ElectricalSystems.png': ElectricalSystems,
  'ExcavationWorks.png': ExcavationWorks,
  'WorkingAtHight.png': WorkingAtHight,
  'substanceChemical.png': substanceChemical,
  'electrical_works.png': electrical_works,
  'mechanical1.png': mechanical1,
  'testingequipment.png': testingequipment,
};

export {
  HotWorks,
  ConfinedSpace,
  Craneslifting,
  ElectricalSystems,
  ExcavationWorks,
  WorkingAtHight,
  substanceChemical,
  electrical_works,
  mechanical1,
  testingequipment,
};
