import ExternalPdf from "../assets/drawings/m3north/plans/external/External.pdf";

// MA
import MA0Pdf from "../assets/drawings/m3north/plans/MA/GroundFloor/GroundFloor.pdf";
import MA1Pdf from "../assets/drawings/m3north/plans/MA/FirstFloor/FirstFloor.pdf";
import MA2Pdf from "../assets/drawings/m3north/plans/MA/SecondFloor/SecondFloor.pdf";
import MA3Pdf from "../assets/drawings/m3north/plans/MA/ThirdFloor/ThirdFloor.pdf";
import MA4Pdf from "../assets/drawings/m3north/plans/MA/Roof/Roof.pdf";

// MB
import MB0Pdf from "../assets/drawings/m3north/plans/MB/GroundFloor/MB_GroundFloor.pdf";
import MB1Pdf from "../assets/drawings/m3north/plans/MB/FirstFloor/MB_FirstFloor.pdf";
import MB2Pdf from "../assets/drawings/m3north/plans/MB/SecondFloor/MB_SecondFloor.pdf";
import MB4Pdf from "../assets/drawings/m3north/plans/MB/RoofFloor/MB_Roof.pdf";

// MA Basement
import MABasementPdf from "../assets/drawings/m3north/plans/MABasement/MA_B.pdf";

// MA.II
import MA20Pdf from "../assets/drawings/m3north/plans/MAII/GroundFloor/MA.II_0.pdf";
import MA21Pdf from "../assets/drawings/m3north/plans/MAII/FirstFloor/MA.II_1.pdf";
import MA22Pdf from "../assets/drawings/m3north/plans/MAII/SecondFloor/MA.II_2.pdf";
import MA23Pdf from "../assets/drawings/m3north/plans/MAII/ThirdFloor/MA.II_3.pdf";
import MA24Pdf from "../assets/drawings/m3north/plans/MAII/Roof/MA.II_R.pdf";

// MA.III
import MA30Pdf from "../assets/drawings/m3north/plans/MAIII/GroundFloor/MA.III_0.pdf";
import MA31Pdf from "../assets/drawings/m3north/plans/MAIII/FirstFloor/MA.III_1.pdf";
import MA32Pdf from "../assets/drawings/m3north/plans/MAIII/SecondFloor/MA.III_2.pdf";
import MA33Pdf from "../assets/drawings/m3north/plans/MAIII/ThirdFloor/MA.III_3.pdf";
import MA34Pdf from "../assets/drawings/m3north/plans/MAIII/Roof/MA.III_R.pdf";

// MU90
import MU900Pdf from "../assets/drawings/m3north/plans/MU90/MU90.0/MU90.0.pdf";
import MU901Pdf from "../assets/drawings/m3north/plans/MU90/MU90.1/MU90.1.pdf";
import MU902Pdf from "../assets/drawings/m3north/plans/MU90/MU90.2/MU90.2.pdf";
import MU90RPdf from "../assets/drawings/m3north/plans/MU90/MU90.R/MU90.R.pdf";

// MU91
import MU910Pdf from "../assets/drawings/m3north/plans/MU91/MU91.0/GroundFloor.pdf";
import MU911Pdf from "../assets/drawings/m3north/plans/MU91/MU91.1/FirstFloor.pdf";
import MU912Pdf from "../assets/drawings/m3north/plans/MU91/MU91.2/SecondFloor.pdf";
import MU913Pdf from "../assets/drawings/m3north/plans/MU91/MU91.3/ThirdFloor.pdf";
import MU914Pdf from "../assets/drawings/m3north/plans/MU91/MU91.4/FourthFloor.pdf";
import MU91RPdf from "../assets/drawings/m3north/plans/MU91/MU91.R/Roof.pdf";

export const FLOOR_PDFS = {
  // External Areas (Building 13)
  "13": {
    "External": ExternalPdf,
    "External Areas": ExternalPdf,
  },

  // MA (Building 14)
  "14": {
    "Ground Floor": MA0Pdf,
    "First Floor": MA1Pdf,
    "Second Floor": MA2Pdf,
    "Third Floor": MA3Pdf,
    "Roof Plan": MA4Pdf,
  },

  // MU90 (Building 15)
  "15": {
    "MU90.0": MU900Pdf,
    "MU90.1": MU901Pdf,
    "MU90.2": MU902Pdf,
    "MU90.R": MU90RPdf,
  },

  // MU91 (Building 16)
  "16": {
    "MU91.0": MU910Pdf,
    "MU91.1": MU911Pdf,
    "MU91.2": MU912Pdf,
    "MU91.3": MU913Pdf,
    "MU91.4": MU914Pdf,
    "MU91.R": MU91RPdf,
  },

  // MB (Building 17)
  "17": {
    "MB.0": MB0Pdf,
    "MB.1": MB1Pdf,
    "MB.2": MB2Pdf,
    "MB.R": MB4Pdf,
  },

  // MA Basement (Building 18)
  "18": { "MA Basement": MABasementPdf },

  // MA.II (Building 19)
  "19": {
    "MA.II 0": MA20Pdf,
    "MA.II 1": MA21Pdf,
    "MA.II 2": MA22Pdf,
    "MA.II 3": MA23Pdf,
    "MA.II R": MA24Pdf,
  },

  // MA.III (Building 20)
  "20": {
    "MA.III 0": MA30Pdf,
    "MA.III 1": MA31Pdf,
    "MA.III 2": MA32Pdf,
    "MA.III 3": MA33Pdf,
    "MA.III R": MA34Pdf,
  },
};