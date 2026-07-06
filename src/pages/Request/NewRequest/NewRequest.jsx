import React, { useMemo, useState, useRef, useEffect } from "react";
import "../../styles/pages.css";
import "../../../forms/styles/forms.css";
import "./NewRequest.css";

import FloorDrawing from "../FloorDrawing/FloorDrawing";

import { FLOOR_PDFS } from "../../../data/pdfMapping";
import { ZONE_MAPPING } from "../../../data/zones";
import { BUILDINGS } from "../../../data/buildings";
import { getContractors, getActivities, getElectricalWorks, getMechanicalWorks, getBuildings, getFloors, getZones, getRooms, getUser } from "../../../services/authService";
import { createRequest, updateRequest, addRamsFiles, deleteRamsFile, addListReqstNote } from "../../../services/requestService";
import { showSuccess, showError } from "../../../components/common/Toast/Toast";
import { useNavigate, useLocation } from "react-router-dom";

const ELECTRICAL_WORKS_SELECT = [
  { id: "1", ElectricalWorksval: "Yes" },
  { id: "0", ElectricalWorksval: "No" }
];

const ENERGISING_EQUIPMENT_SELECT = [
  { id: "1", EnergisingEquipmentval: "Yes" },
  { id: "0", EnergisingEquipmentval: "No" }
];

const ISOLATING_LIVE_SELECT = [
  { id: "1", IsolatingLiveval: "Yes" },
  { id: "0", IsolatingLiveval: "No" }
];

const WORKING_NEAR_LIVE_SELECT = [
  { id: "1", WorkingNearLiveval: "Yes" },
  { id: "0", WorkingNearLiveval: "No" }
];

const MECHANICAL_WORKS_SELECT = [
  { id: "1", MechanicalWorksval: "Yes" },
  { id: "0", MechanicalWorksval: "No" }
];

const TESTINGS_SELECT = [
  { id: "1", TESTINGsval: "Yes" },
  { id: "0", TESTINGsval: "No" }
];

function NewRequest() {
  const navigate = useNavigate();
  const location = useLocation();
  const editRequest = location.state?.editRequest;

  const [isEditMode, setIsEditMode] = useState(false);
  const [existingFiles, setExistingFiles] = useState([]);
  const [notesHistory, setNotesHistory] = useState([]);

  // Dynamic selector lists
  const [contractors, setContractors] = useState([]);
  const [activitiesList, setActivitiesList] = useState([]);
  const [electricalWorksList, setElectricalWorksList] = useState([]);
  const [mechanicalWorksList, setMechanicalWorksList] = useState([]);
  const [buildingsList, setBuildingsList] = useState([]);
  const [floorsList, setFloorsList] = useState([]);
  const [zonesList, setZonesList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [isLoadingSelectors, setIsLoadingSelectors] = useState(true);

  const shouldShowElectricianCert = () => {
    return formData.permit_type !== "Commissioning";
  };

  const [building, setBuilding] = useState("");
  const [level, setLevel] = useState("");
  const [isnewrequestcreated, setIsnewrequestcreated] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isElectricalDropdownOpen, setIsElectricalDropdownOpen] = useState(false);
  const [isMechanicalDropdownOpen, setIsMechanicalDropdownOpen] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      if (isEditMode) {
        // Upload immediately in edit mode
        const fd = new FormData();
        fd.append("id", editRequest.id);
        const currentUser = getUser();
        fd.append("userId", currentUser?.id || 1);
        newFiles.forEach((file) => {
          fd.append("rams_file[]", file);
        });

        try {
          const res = await addRamsFiles(fd);
          showSuccess("RAMS File uploaded successfully");
          if (res?.files) {
            setExistingFiles(res.files.map(f => ({ id: f.id, name: f.file_name, file: f.file })));
          }
        } catch (err) {
          showError("Failed to upload file attachment.");
        }
      } else {
        // In creation mode, store locally
        setUploadedFiles((prev) => [...prev, ...newFiles]);
      }
    }
  };

  const handleRemoveFile = async (index, fileId) => {
    if (isEditMode && fileId) {
      try {
        await deleteRamsFile(fileId);
        showSuccess("RAMS File deleted successfully");
        setExistingFiles((prev) => prev.filter((_, idx) => idx !== index));
      } catch (err) {
        showError("Failed to delete file attachment.");
      }
    } else {
      setUploadedFiles((prev) => prev.filter((_, idx) => idx !== index));
    }
  };

  const [formData, setFormData] = useState({
    Request_Date: new Date().toLocaleDateString("en-GB"),
    Company_Name: "M3 North",
    Sub_Contractor_Id: "",
    new_sub_contractor: "",
    Foreman: "",
    Foreman_Phone_Number: "",
    Activity: "",
    Type_Of_Activity_Id: "",
    rams_number: "",
    permit_type: "Construction",
    description_of_activity: "",
    Working_Date: "",
    Start_Time: "",
    End_Time: "",
    night_shift: false,
    new_date: "",
    new_end_time: "",
    Site_Id: "5",
    Tools: "",
    Machinery: "",
    work_type: "",
    electrical_works: [],
    mechanical_works: [],
    // General Safety Questions (Yes=1, No=0, N/A=2)
    floatLabel11: "",
    floatLabel12: "",
    other_conditions_input: "",
    floatLabel13: "",
    floatLabel14: "",
    floatLabel15: "",
    floatLabel16: "",
    // Hot Work Section
    Hot_work: "0",
    floatLabel1: "",
    floatLabel3: "",
    floatLabel4: "",
    floatLabel5: "",
    floatLabel6: "",
    floatLabel7: "",
    floatLabel8: "",
    floatLabel9: "",
    floatLabel10: "",
    NEWHOTWORK: "0",
    NEWHOTWORK1: "",
    NEWHOTWORK2: "",
    // Temporary Electrical Systems
    working_on_electrical_system: "0",
    floatLabel17: "",
    floatLabel18: "",
    floatLabel19: "",
    floatLabel20: "",
    floatLabel22: "",
    // Hazardous Substances
    working_hazardious_substen: "0",
    floatLabel24: "",
    floatLabel25: "",
    floatLabel26: "",
    floatLabel27: "",
    floatLabel28: "",
    floatLabel29: "",
    floatLabel30: "",
    floatLabel31: "",
    // Working at Height
    working_at_height: "0",
    segragated_demarkated: "",
    floatLabel39: "",
    floatLabel40: "",
    floatLabel41: "",
    floatLabel42: "",
    floatLabel43: "",
    floatLabel44: "",
    floatLabel45: "",
    floatLabel46: "",
    floatLabel47: "",
    floatLabel48: "",
    floatLabel49: "",
    floatLabel50: "",
    // Working in Confined Spaces
    working_confined_spaces: "0",
    floatLabel51: "",
    floatLabel52: "",
    floatLabel53: "",
    floatLabel54: "",
    floatLabel55: "",
    floatLabel56: "",
    floatLabel57: "",
    floatLabel58: "",
    // Excavation Works
    excavation_works: "0",
    floatLabel71: "",
    floatLabel72: "",
    excavation_shoring: "",
    floatLabel74: "",
    floatLabel75: "",
    floatLabel76: "",
    floatLabel77: "",
    floatLabel78: "",
    floatLabel79: "",
    // Using Crane or Lifting
    using_cranes_or_lifting: "0",
    floatLabel80: "",
    floatLabel81: "",
    floatLabel82: "",
    floatLabel83: "",
    floatLabel84: "",
    floatLabel85: "",
    floatLabel86: "",
    floatLabel87: "",
    // pressurization Power On fields
    power_on: "0",
    EnergisingEquipment: "0",
    IsolatingLive: "0",
    WorkingNearLive: "0",
    floatLabel88: "",
    floatLabel89: "",
    floatLabel90: "",
    floatLabel110: "",
    floatLabel91: "",
    floatLabel92: "",
    floatLabel93: "",
    floatLabel94: "",
    floatLabel111: "",
    floatLabel112: "",
    floatLabel113: "",
    floatLabel114: "",
    floatLabel115: "",
    floatLabel116: "",
    floatLabel117: "",
    floatLabel118: "",
    floatLabel119: "",
    floatLabel120: "",
    floatLabel121: "",
    floatLabel122: "",
    floatLabel123: "",
    floatLabel124: "",
    floatLabel125: "",
    floatLabel126: "",
    floatLabel127: "",
    // pressurization fields
    pressurization: "0",
    floatLabel95: "",
    floatLabel96: "",
    floatLabel97: "",
    mc_number_text: "",
    floatLabel98: "",
    floatLabel99: "",
    floatLabel100: "",
    floatLabel101: "",
    // Pressure Testing
    pressure_testing_of_equipment: "0",
    floatLabel102: "",
    floatLabel103: "",
    floatLabel104: "",
    floatLabel105: "",
    floatLabel106: "",
    floatLabel107: "",
    pressure_pneumatic: "",
    floatLabel108: "",
    pressure_hydrostatic: "",
    floatLabel109: "",
    // Task Specific PPE
    eye_protection: "",
    fall_protection: "",
    hearing_protection: "",
    respiratory_protection: "",
    other_ppe: "",
    Number_Of_Workers: "",
    notes: "",
  });

  // Fetch all select lists and location data from backend
  useEffect(() => {
    const loadSelectors = async () => {
      try {
        const [
          contractorsRes,
          activitiesRes,
          electricalRes,
          mechanicalRes,
          buildingsRes,
          floorsRes,
          zonesRes,
          roomsRes
        ] = await Promise.all([
          getContractors(1, 1000),
          getActivities(1, 1000),
          getElectricalWorks(1, 1000),
          getMechanicalWorks(1, 1000),
          getBuildings(1, 1000),
          getFloors(1, 1000),
          getZones(1, 1000),
          getRooms(1, 1000)
        ]);

        setContractors(contractorsRes?.data?.rows ?? contractorsRes?.data ?? contractorsRes ?? []);
        setActivitiesList(activitiesRes?.data?.rows ?? activitiesRes?.data ?? activitiesRes ?? []);
        setElectricalWorksList(electricalRes?.data ?? []);
        setMechanicalWorksList(mechanicalRes?.data ?? []);
        setBuildingsList(buildingsRes?.data ?? []);
        setFloorsList(floorsRes?.data ?? []);
        setZonesList(zonesRes?.data ?? []);
        setRoomsList(roomsRes?.data?.rows ?? roomsRes?.data ?? roomsRes ?? []);
      } catch (err) {
        console.error("Failed to load request form selector data", err);
        showError("Failed to load selector databases.");
      } finally {
        setIsLoadingSelectors(false);
      }
    };
    loadSelectors();
  }, []);

  // Bind edit request data once selectors have finished loading
  useEffect(() => {
    if (!isLoadingSelectors && editRequest) {
      setIsEditMode(true);
      setBuilding(String(editRequest.Building_Id || ""));
      setLevel(editRequest.Room_Type || "");

      // Match room IDs to room names to render correctly in FloorDrawing
      if (editRequest.Room_Nos) {
        const editRoomIds = String(editRequest.Room_Nos).split(",");
        const matchedNames = roomsList
          .filter(r => editRoomIds.includes(String(r.room_id ?? r.id)))
          .map(r => r.room_name);
        setSelectedRooms(matchedNames);
      }

      // Display existing file attachments
      if (editRequest.files) {
        setExistingFiles(editRequest.files.map(f => ({ id: f.id, name: f.file_name, file: f.file })));
      }

      // Load notes history
      if (editRequest.note) {
        setNotesHistory(editRequest.note.map(n => ({ Note: n.note, Username: n.username })));
      } else if (editRequest.notes) {
        setNotesHistory(Array.isArray(editRequest.notes) ? editRequest.notes : []);
      }

      // Bind all fields into formData
      setFormData({
        Request_Date: editRequest.Request_Date || new Date().toLocaleDateString("en-GB"),
        Company_Name: editRequest.Company_Name || "M3 North",
        Sub_Contractor_Id: editRequest.Sub_Contractor_Id || "",
        new_sub_contractor: editRequest.new_sub_contractor || "",
        Foreman: editRequest.Foreman || "",
        Foreman_Phone_Number: editRequest.Foreman_Phone_Number || "",
        Activity: editRequest.Activity || "",
        Type_Of_Activity_Id: editRequest.Type_Of_Activity_Id || "",
        rams_number: editRequest.rams_number || "",
        permit_type: editRequest.permit_type || "Construction",
        description_of_activity: editRequest.description_of_activity || "",
        Working_Date: editRequest.Working_Date || "",
        Start_Time: editRequest.Start_Time ? editRequest.Start_Time.slice(0, 5) : "",
        End_Time: editRequest.End_Time ? editRequest.End_Time.slice(0, 5) : "",
        night_shift: editRequest.night_shift === 1 || editRequest.night_shift === true,
        new_date: editRequest.new_date || "",
        new_end_time: editRequest.new_end_time ? editRequest.new_end_time.slice(0, 5) : "",
        Site_Id: editRequest.Site_Id || "5",
        Tools: editRequest.Tools || "",
        Machinery: editRequest.Machinery || "",
        work_type: editRequest.work_type || "",
        electrical_works: editRequest.electrical_works ? String(editRequest.electrical_works).split(",") : [],
        mechanical_works: editRequest.mechanical_works ? String(editRequest.mechanical_works).split(",") : [],

        // General Safety Questions
        floatLabel11: editRequest.affecting_other_contractors || "",
        floatLabel12: editRequest.other_conditions || "",
        other_conditions_input: editRequest.other_conditions_input || "",
        floatLabel13: editRequest.lighting_begin_work || "",
        floatLabel14: editRequest.specific_risks || "",
        floatLabel15: editRequest.environment_ensured || "",
        floatLabel16: editRequest.course_of_action || "",

        // Hot Work
        Hot_work: String(editRequest.Hot_work ?? "0"),
        floatLabel1: editRequest.tasks_in_progress_in_the_area || "",
        floatLabel3: editRequest.lighting_sufficiently || "",
        floatLabel4: editRequest.specific_risks_based_on_task || "",
        floatLabel5: editRequest.work_environment_safety_ensured || "",
        floatLabel6: editRequest.course_of_action_in_emergencies || "",
        floatLabel7: editRequest.fire_watch_establish || "",
        floatLabel8: editRequest.combustible_material || "",
        floatLabel9: editRequest.safety_measures || "",
        floatLabel10: editRequest.extinguishers_and_fire_blanket || "",
        NEWHOTWORK: String(editRequest.welding_activitiy ?? "0"),
        NEWHOTWORK1: editRequest.heat_treatment || "",
        NEWHOTWORK2: editRequest.air_extraction_be_established || "",

        // Temporary Electrical Systems
        working_on_electrical_system: String(editRequest.working_on_electrical_system ?? "0"),
        floatLabel17: editRequest.responsible_for_the_informed || "",
        floatLabel18: editRequest.de_energized || "",
        floatLabel19: editRequest.if_no_loto || "",
        floatLabel20: editRequest.do_risk_assessment || "",
        floatLabel22: editRequest.electricity_have_isulation || "",

        // Hazardous Substances
        working_hazardious_substen: String(editRequest.working_hazardious_substen ?? "0"),
        floatLabel24: editRequest.relevant_mal || "",
        floatLabel25: editRequest.msds || "",
        floatLabel26: editRequest.equipment_taken_account || "",
        floatLabel27: editRequest.ventilation || "",
        floatLabel28: editRequest.hazardaus_substances || "",
        floatLabel29: editRequest.storage_and_disposal || "",
        floatLabel30: editRequest.reachable_case || "",
        floatLabel31: editRequest.checical_risk_assessment || "",

        // Working at Height
        working_at_height: String(editRequest.working_at_height ?? "0"),
        segragated_demarkated: editRequest.segragated_demarkated || "",
        floatLabel39: editRequest.lanyard_attachments || "",
        floatLabel40: editRequest.rescue_plan || "",
        floatLabel41: editRequest.avoid_hazards || "",
        floatLabel42: editRequest.height_training || "",
        floatLabel43: editRequest.supervision || "",
        floatLabel44: editRequest.shock_absorbing || "",
        floatLabel45: editRequest.height_equipments || "",
        floatLabel46: editRequest.vertical_life || "",
        floatLabel47: editRequest.secured_falling || "",
        floatLabel48: editRequest.dropped_objects || "",
        floatLabel49: editRequest.safe_acces || "",
        floatLabel50: editRequest.weather_acceptable || "",

        // Working in Confined Spaces
        working_confined_spaces: String(editRequest.working_confined_spaces ?? "0"),
        floatLabel51: editRequest.vapours_gases || "",
        floatLabel52: editRequest.lel_measurement || "",
        floatLabel53: editRequest.all_equipment || "",
        floatLabel54: editRequest.exit_conditions || "",
        floatLabel55: editRequest.communication_emergency || "",
        floatLabel56: editRequest.rescue_equipments || "",
        floatLabel57: editRequest.space_ventilation || "",
        floatLabel58: editRequest.oxygen_meter || "",

        // Excavation Works
        excavation_works: String(editRequest.excavation_works ?? "0"),
        floatLabel71: editRequest.excavation_segregated || "",
        floatLabel72: editRequest.nn_standards || "",
        excavation_shoring: editRequest.excavation_shoring || "",
        floatLabel74: editRequest.danish_regulation || "",
        floatLabel75: editRequest.safe_access_and_egress || "",
        floatLabel76: editRequest.correctly_sloped || "",
        floatLabel77: editRequest.inspection_dates || "",
        floatLabel78: editRequest.marked_drawings || "",
        floatLabel79: editRequest.underground_areas_cleared || "",

        // Using Crane or Lifting
        using_cranes_or_lifting: String(editRequest.using_cranes_or_lifting ?? "0"),
        floatLabel80: editRequest.appointed_person || "",
        floatLabel81: editRequest.vendor_supplier || "",
        floatLabel82: editRequest.lift_plan || "",
        floatLabel83: editRequest.supplied_and_inspected || "",
        floatLabel84: editRequest.legal_required_certificates || "",
        floatLabel85: editRequest.prapared_lifting || "",
        floatLabel86: editRequest.lifting_task_fenced || "",
        floatLabel87: editRequest.overhead_risks || "",

        // pressurization Power On fields
        power_on: String(editRequest.power_on ?? "0"),
        EnergisingEquipment: String(editRequest.energising_equipment ?? "0"),
        IsolatingLive: String(editRequest.isolating_live ?? "0"),
        WorkingNearLive: String(editRequest.working_near_live ?? "0"),
        floatLabel88: editRequest.responsible_for_the_area || "",
        floatLabel89: editRequest.risk_assessment_done || "",
        floatLabel90: editRequest.barriers_signage || "",
        floatLabel110: String(editRequest.arc_flash ?? "0"),
        floatLabel91: editRequest.energized_been_tested || "",
        floatLabel92: editRequest.punches_been_closed || "",
        floatLabel93: editRequest.toct_checklist || "",
        floatLabel94: editRequest.informed_aligned || "",
        floatLabel111: editRequest.isolating_resposible || "",
        floatLabel112: editRequest.isolating_risk_assessment || "",
        floatLabel113: editRequest.cq_informed || "",
        floatLabel114: editRequest.cq_provided || "",
        floatLabel115: editRequest.de_energisation_request || "",
        floatLabel116: editRequest.ppe_prepared || "",
        floatLabel117: editRequest.absence_of_voltage || "",
        floatLabel118: editRequest.stored_energy || "",
        floatLabel119: editRequest.backup_power || "",
        floatLabel120: editRequest.unavoidable || "",
        floatLabel121: editRequest.reasonably_practicable || "",
        floatLabel122: editRequest.work_authorised || "",
        floatLabel123: editRequest.working_risk_assessment || "",
        floatLabel124: editRequest.working_arc_boundary || "",
        floatLabel125: editRequest.working_barriers || "",
        floatLabel126: editRequest.insulated_tools || "",
        floatLabel127: editRequest.event_of_emergency || "",

        // pressurization fields
        pressurization: String(editRequest.pressurization ?? "0"),
        floatLabel95: editRequest.performed_approved || "",
        floatLabel96: editRequest.flushing_approved || "",
        floatLabel97: editRequest.mc_approved || "",
        mc_number_text: editRequest.mc_number_text || "",
        floatLabel98: editRequest.visual_inspection || "",
        floatLabel99: editRequest.loto_plan_approved || "",
        floatLabel100: editRequest.follow_media_code || "",
        floatLabel101: editRequest.cq_safety_signs || "",

        // Pressure Testing
        pressure_testing_of_equipment: String(editRequest.pressure_testing_of_equipment ?? "0"),
        floatLabel102: editRequest.line_walk || "",
        floatLabel103: editRequest.pressure_test_coordinated || "",
        floatLabel104: editRequest.pipework_mic || "",
        floatLabel105: editRequest.loto_plan_attached || "",
        floatLabel106: editRequest.exclusion_zone_calculated || "",
        floatLabel107: editRequest.pneumatic_hydrostatic || "",
        pressure_pneumatic: editRequest.pressure_pneumatic || "",
        floatLabel108: editRequest.pressure_of_the_test || "",
        pressure_hydrostatic: editRequest.pressure_hydrostatic || "",
        floatLabel109: editRequest.safety_valves_calibrated || "",

        // Task Specific PPE
        eye_protection: editRequest.eye_protection || "",
        fall_protection: editRequest.fall_protection || "",
        hearing_protection: editRequest.hearing_protection || "",
        respiratory_protection: editRequest.respiratory_protection || "",
        other_ppe: editRequest.other_ppe || "",
        Number_Of_Workers: editRequest.Number_Of_Workers || "",
        notes: "",
      });

      setIsnewrequestcreated(true);
    }
  }, [isLoadingSelectors, editRequest]);

  const levels = useMemo(() => {
    return building ? floorsList.filter(f => String(f.build_id) === String(building)).map(f => f.floor_name) : [];
  }, [building, floorsList]);

  const selectedPdf = useMemo(() => {
    if (!building || !level) return "";
    // Find the building name from buildingList using building (which is database build_id)
    const dbBuilding = buildingsList.find(b => String(b.build_id || b.id) === String(building));
    const bName = dbBuilding ? dbBuilding.building_name : "";
    if (!bName) return "";

    // Map building_name to static building ID
    const staticB = BUILDINGS.find(item => item.name.toLowerCase().trim() === bName.toLowerCase().trim());
    const staticBuildingId = staticB ? staticB.id : "";
    if (!staticBuildingId) return "";

    const pdfsForBuilding = FLOOR_PDFS[staticBuildingId];
    if (!pdfsForBuilding) return "";

    // 1. Try exact match
    if (pdfsForBuilding[level]) return pdfsForBuilding[level];

    // 2. Try case-insensitive substring match
    const levelLower = level.toLowerCase().trim();
    const foundKey = Object.keys(pdfsForBuilding).find(key => {
      const keyLower = key.toLowerCase().trim();
      return keyLower.includes(levelLower) || levelLower.includes(keyLower);
    });
    if (foundKey) return pdfsForBuilding[foundKey];

    // 3. Fallback to first available PDF for that building
    return Object.values(pdfsForBuilding)[0] || "";
  }, [building, level, buildingsList]);

  const selectedZones = useMemo(() => {
    if (!level) return [];
    // 1. Try exact match
    if (ZONE_MAPPING[level]) return ZONE_MAPPING[level];

    // 2. Try case-insensitive substring match
    const levelLower = level.toLowerCase().trim();
    const foundKey = Object.keys(ZONE_MAPPING).find(key => {
      const keyLower = key.toLowerCase().trim();
      return keyLower.includes(levelLower) || levelLower.includes(keyLower);
    });
    if (foundKey) return ZONE_MAPPING[foundKey];

    return [];
  }, [level]);

  const zonesToDisplay = useMemo(() => {
    const active = selectedZones.filter(zone =>
      zone.rooms.some(room => {
        const roomName = typeof room === "object" ? room.name : room;
        return selectedRooms.includes(roomName);
      })
    );
    if (active.length === 0 && selectedZone) {
      const current = selectedZones.find(z => z.id === selectedZone.id || z.name === selectedZone.name);
      return current ? [current] : [selectedZone];
    }
    return active;
  }, [selectedZones, selectedRooms, selectedZone]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRoomsSelected = (rooms, zone) => {
    const zoneRoomNames = zone.rooms.map(r => typeof r === "object" ? r.name : r);
    setSelectedRooms(prev => {
      const filtered = prev.filter(r => !zoneRoomNames.includes(r));
      return [...filtered, ...rooms];
    });
    setSelectedZone(zone);
  };

  const selectedBuildingName = useMemo(() => {
    const b = buildingsList.find((x) => String(x.build_id) === String(building));
    return b ? b.building_name : "";
  }, [building, buildingsList]);

  // Group dynamic electrical works list by module name
  const groupedElectrical = useMemo(() => {
    const groups = {};
    electricalWorksList.forEach((item) => {
      const mod = item.module || "General";
      if (!groups[mod]) {
        groups[mod] = [];
      }
      groups[mod].push({ id: String(item.id), name: item.electrical_works });
    });
    return Object.keys(groups).map((key) => ({
      module: key,
      items: groups[key],
    }));
  }, [electricalWorksList]);

  // Map mechanical works list for display selection
  const mechanicalWorksOptions = useMemo(() => {
    return mechanicalWorksList.map((m) => ({
      id: String(m.id),
      name: m.mechanical_works,
    }));
  }, [mechanicalWorksList]);

  const handleSubmit = async (e, status) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!building) {
      showError("Please select a building.");
      return;
    }
    if (!level) {
      showError("Please select a level.");
      return;
    }

    // 1. Tally selected location items to resolve database IDs
    const Building_Id = building ? Number(building) : null;

    const matchedFloor = floorsList.find(
      (f) => String(f.build_id) === String(building) && (f.floor_name === level || f.floor_status === level)
    );
    const Floor_Id = matchedFloor ? matchedFloor.fl_id : null;

    // Find zone IDs and zone names
    const selectedZoneObjects = selectedZones.filter((zone) =>
      zone.rooms.some((room) => {
        const roomName = typeof room === "object" ? room.name : room;
        return selectedRooms.includes(roomName);
      })
    );
    const zoneVal = selectedZoneObjects.map((z) => z.name).join(",");

    const matchedZoneIds = zonesList
      .filter((z) => String(z.floor_id) === String(Floor_Id) && selectedZoneObjects.some((zo) => zo.name === z.zone))
      .map((z) => z.id ?? z.zoneStatusId);
    const Zone_Id = matchedZoneIds.join(",");

    // Find Room IDs — multi-strategy matching
    // Strategy 1: Match by zone_id + case-insensitive room_name
    const selectedRoomsLower = selectedRooms.map(n => n.toLowerCase().trim());
    let matchedRoomIds = roomsList
      .filter((r) =>
        matchedZoneIds.includes(r.zone_id ?? r.zoneStatusId) &&
        selectedRoomsLower.includes((r.room_name || "").toLowerCase().trim())
      )
      .map((r) => r.room_id ?? r.id);

    // Strategy 2: Fallback — match by fl_id + case-insensitive room_name
    if (matchedRoomIds.length === 0 && Floor_Id) {
      matchedRoomIds = roomsList
        .filter((r) =>
          String(r.fl_id) === String(Floor_Id) &&
          selectedRoomsLower.includes((r.room_name || "").toLowerCase().trim())
        )
        .map((r) => r.room_id ?? r.id);
    }

    // Strategy 3: Fallback — include ALL rooms belonging to the matched zones
    if (matchedRoomIds.length === 0 && matchedZoneIds.length > 0) {
      matchedRoomIds = roomsList
        .filter((r) => matchedZoneIds.includes(r.zone_id ?? r.zoneStatusId))
        .map((r) => r.room_id ?? r.id);
    }

    const Room_Nos = matchedRoomIds.join(",");

    // Debug log — remove after confirming Room_Nos works correctly
    console.log("[Room_Nos Debug]", {
      selectedRooms,
      Floor_Id,
      matchedZoneIds,
      roomsList: roomsList.slice(0, 5),
      matchedRoomIds,
      Room_Nos,
    });

    // Current User
    const currentUser = getUser();
    const currentUserId = currentUser?.id || 1;

    // 2. Prepare payload
    const payload = {
      ...formData,
      Building_Id,
      Floor_Id,
      Zone_Id,
      zone: zoneVal,
      Room_Nos,
      // RoomNos: Room_Nos,
      Room_Type: level,
      Request_status: status === "Hold" ? "Hold" : "Draft",
      userId: currentUserId,
      Request_Date: isEditMode ? editRequest.Request_Date : new Date().toISOString().split("T")[0],
      Working_Date: formData.Working_Date,
      Start_Time: formData.Start_Time ? `${formData.Start_Time}:00` : "",
      End_Time: formData.End_Time ? `${formData.End_Time}:00` : "",
      night_shift: formData.night_shift ? 1 : 0,
      new_end_time: formData.new_end_time ? `${formData.new_end_time}:00` : "",
      Assign_Start_Time: formData.Start_Time ? `${formData.Start_Time}:00` : "",
      Assign_End_Time: formData.End_Time ? `${formData.End_Time}:00` : "",
      Assign_Start_Date: formData.Working_Date,
      Assign_End_Date: formData.Working_Date,
      Sub_Contractor_Id: formData.Sub_Contractor_Id ? Number(formData.Sub_Contractor_Id) : null,
      Type_Of_Activity_Id: formData.Type_Of_Activity_Id ? Number(formData.Type_Of_Activity_Id) : null,
      Activity: formData.Activity || "",
      new_sub_contractor: formData.new_sub_contractor || "",
      Foreman_Phone_Number: formData.Foreman_Phone_Number || "",
      rams_number: formData.rams_number || "",
      description_of_activity: formData.description_of_activity || "",
      Site_Id: 5, // M3 North
      Company_Name: formData.Company_Name || "M3 North",
      Hot_work: formData.Hot_work === "1" ? 1 : 0,
      working_on_electrical_system: formData.working_on_electrical_system === "1" ? 1 : 0,
      working_hazardious_substen: formData.working_hazardious_substen === "1" ? 1 : 0,
      working_at_height: formData.working_at_height === "1" ? 1 : 0,
      working_confined_spaces: formData.working_confined_spaces === "1" ? 1 : 0,
      excavation_works: formData.excavation_works === "1" ? 1 : 0,
      using_cranes_or_lifting: formData.using_cranes_or_lifting === "1" ? 1 : 0,
      power_on: formData.power_on === "1" ? 1 : 0,
      pressurization: formData.pressurization === "1" ? 1 : 0,
      pressure_testing_of_equipment: formData.pressure_testing_of_equipment === "1" ? 1 : 0,
      Number_Of_Workers: formData.Number_Of_Workers,
      electrical_works: Array.isArray(formData.electrical_works) ? formData.electrical_works.join(",") : "",
      mechanical_works: Array.isArray(formData.mechanical_works) ? formData.mechanical_works.join(",") : "",

      // General Safety Checklist
      affecting_other_contractors: formData.floatLabel11 || 0,
      other_conditions: formData.floatLabel12 || 0,
      lighting_begin_work: formData.floatLabel13 || 0,
      specific_risks: formData.floatLabel14 || 0,
      environment_ensured: formData.floatLabel15 || 0,
      course_of_action: formData.floatLabel16 || 0,

      // Hot Work
      tasks_in_progress_in_the_area: formData.floatLabel1 || 0,
      lighting_sufficiently: formData.floatLabel3 || 0,
      specific_risks_based_on_task: formData.floatLabel4 || 0,
      work_environment_safety_ensured: formData.floatLabel5 || 0,
      course_of_action_in_emergencies: formData.floatLabel6 || 0,
      fire_watch_establish: formData.floatLabel7 || 0,
      combustible_material: formData.floatLabel8 || 0,
      safety_measures: formData.floatLabel9 || 0,
      extinguishers_and_fire_blanket: formData.floatLabel10 || 0,
      welding_activitiy: formData.NEWHOTWORK || 0,
      heat_treatment: formData.NEWHOTWORK1 || 0,
      air_extraction_be_established: formData.NEWHOTWORK2 || 0,

      // Temporary Electrical Systems
      responsible_for_the_informed: formData.floatLabel17 || 0,
      de_energized: formData.floatLabel18 || 0,
      if_no_loto: formData.floatLabel19 || 0,
      do_risk_assessment: formData.floatLabel20 || 0,
      electricity_have_isulation: formData.floatLabel22 || 0,
      // electrician_certification: formData.floatLabel23 || 0,

      // Hazardous Substances
      relevant_mal: formData.floatLabel24 || 0,
      msds: formData.floatLabel25 || 0,
      equipment_taken_account: formData.floatLabel26 || 0,
      ventilation: formData.floatLabel27 || 0,
      hazardaus_substances: formData.floatLabel28 || 0,
      storage_and_disposal: formData.floatLabel29 || 0,
      reachable_case: formData.floatLabel30 || 0,
      checical_risk_assessment: formData.floatLabel31 || 0,

      // Testing Section
      // transfer_of_palnt: formData.floatLabel32 || 0,
      // area_drained: formData.floatLabel33 || 0,
      // area_depressurised: formData.floatLabel34 || 0,
      // area_flused: formData.floatLabel35 || 0,
      // tank_area_container: formData.floatLabel36 || 0,
      // system_free_for_dust: formData.floatLabel37 || 0,
      // loto_plan_submitted: formData.floatLabel38 || 0,

      // Working at Height
      lanyard_attachments: formData.floatLabel39 || 0,
      rescue_plan: formData.floatLabel40 || 0,
      avoid_hazards: formData.floatLabel41 || 0,
      height_training: formData.floatLabel42 || 0,
      supervision: formData.floatLabel43 || 0,
      shock_absorbing: formData.floatLabel44 || 0,
      height_equipments: formData.floatLabel45 || 0,
      vertical_life: formData.floatLabel46 || 0,
      secured_falling: formData.floatLabel47 || 0,
      dropped_objects: formData.floatLabel48 || 0,
      safe_acces: formData.floatLabel49 || 0,
      weather_acceptable: formData.floatLabel50 || 0,

      // Working in Confined Spaces
      vapours_gases: formData.floatLabel51 || 0,
      lel_measurement: formData.floatLabel52 || 0,
      all_equipment: formData.floatLabel53 || 0,
      exit_conditions: formData.floatLabel54 || 0,
      communication_emergency: formData.floatLabel55 || 0,
      rescue_equipments: formData.floatLabel56 || 0,
      space_ventilation: formData.floatLabel57 || 0,
      oxygen_meter: formData.floatLabel58 || 0,

      // Work in Atex Area
      // ex_area_downgraded: formData.floatLabel59 || 0,
      // atmospheric_tester: formData.floatLabel60 || 0,
      // flammable_materials: formData.floatLabel61 || 0,
      // potential_explosive: formData.floatLabel62 || 0,
      // oxygen_meter_confined_spaces: formData.floatLabel63 || 0,

      // Excavation Works
      excavation_segregated: formData.floatLabel71 || 0,
      nn_standards: formData.floatLabel72 || 0,
      danish_regulation: formData.floatLabel74 || 0,
      safe_access_and_egress: formData.floatLabel75 || 0,
      correctly_sloped: formData.floatLabel76 || 0,
      inspection_dates: formData.floatLabel77 || 0,
      marked_drawings: formData.floatLabel78 || 0,
      underground_areas_cleared: formData.floatLabel79 || 0,

      // Using Cranes or Lifting
      appointed_person: formData.floatLabel80 || 0,
      vendor_supplier: formData.floatLabel81 || 0,
      lift_plan: formData.floatLabel82 || 0,
      supplied_and_inspected: formData.floatLabel83 || 0,
      legal_required_certificates: formData.floatLabel84 || 0,
      prapared_lifting: formData.floatLabel85 || 0,
      lifting_task_fenced: formData.floatLabel86 || 0,
      overhead_risks: formData.floatLabel87 || 0,

      // Pressurization Power On fields
      energising_equipment: formData.EnergisingEquipment === "1" ? 1 : 0,
      isolating_live: formData.IsolatingLive === "1" ? 1 : 0,
      working_near_live: formData.WorkingNearLive === "1" ? 1 : 0,
      responsible_for_the_area: formData.floatLabel88 || 0,
      risk_assessment_done: formData.floatLabel89 || 0,
      barriers_signage: formData.floatLabel90 || 0,
      energized_been_tested: formData.floatLabel91 || 0,
      punches_been_closed: formData.floatLabel92 || 0,
      toct_checklist: formData.floatLabel93 || 0,
      informed_aligned: formData.floatLabel94 || 0,

      // Pressurization Isolating Live fields
      isolating_resposible: formData.floatLabel111 || 0,
      isolating_risk_assessment: formData.floatLabel112 || 0,
      cq_informed: formData.floatLabel113 || 0,
      cq_provided: formData.floatLabel114 || 0,
      de_energisation_request: formData.floatLabel115 || 0,
      ppe_prepared: formData.floatLabel116 || 0,
      absence_of_voltage: formData.floatLabel117 || 0,
      stored_energy: formData.floatLabel118 || 0,
      backup_power: formData.floatLabel119 || 0,

      // Pressurization Working Near Live fields
      unavoidable: formData.floatLabel120 || 0,
      reasonably_practicable: formData.floatLabel121 || 0,
      work_authorised: formData.floatLabel122 || 0,
      working_risk_assessment: formData.floatLabel123 || 0,
      working_arc_boundary: formData.floatLabel124 || 0,
      working_barriers: formData.floatLabel125 || 0,
      insulated_tools: formData.floatLabel126 || 0,
      event_of_emergency: formData.floatLabel127 || 0,

      // Pressurization general fields
      performed_approved: formData.floatLabel95 || 0,
      flushing_approved: formData.floatLabel96 || 0,
      mc_approved: formData.floatLabel97 || 0,
      visual_inspection: formData.floatLabel98 || 0,
      loto_plan_approved: formData.floatLabel99 || 0,
      follow_media_code: formData.floatLabel100 || 0,
      cq_safety_signs: formData.floatLabel101 || 0,

      // Commission fields of electrical systems (Pressure testing of equipment)
      line_walk: formData.floatLabel102 || 0,
      pressure_test_coordinated: formData.floatLabel103 || 0,
      pipework_mic: formData.floatLabel104 || 0,
      loto_plan_attached: formData.floatLabel105 || 0,
      exclusion_zone_calculated: formData.floatLabel106 || 0,
      pneumatic_hydrostatic: formData.floatLabel107 || 0,
      pressure_of_the_test: formData.floatLabel108 || 0,
      safety_valves_calibrated: formData.floatLabel109 || 0,
    };

    // Remove internal React floatLabel keys and temporary properties from payload
    const keysToDelete = [
      "floatLabel1", "floatLabel3", "floatLabel4", "floatLabel5", "floatLabel6", "floatLabel7", "floatLabel8", "floatLabel9", "floatLabel10",
      "floatLabel11", "floatLabel12", "floatLabel13", "floatLabel14", "floatLabel15", "floatLabel16", "floatLabel17", "floatLabel18", "floatLabel19", "floatLabel20", "floatLabel22",
      "floatLabel24", "floatLabel25", "floatLabel26", "floatLabel27", "floatLabel28", "floatLabel29", "floatLabel30", "floatLabel31",
      "floatLabel39", "floatLabel40", "floatLabel41", "floatLabel42", "floatLabel43", "floatLabel44", "floatLabel45", "floatLabel46", "floatLabel47", "floatLabel48", "floatLabel49", "floatLabel50",
      "floatLabel51", "floatLabel52", "floatLabel53", "floatLabel54", "floatLabel55", "floatLabel56", "floatLabel57", "floatLabel58",
      "floatLabel71", "floatLabel72", "floatLabel74", "floatLabel75", "floatLabel76", "floatLabel77", "floatLabel78", "floatLabel79", "floatLabel80", "floatLabel81", "floatLabel82", "floatLabel83", "floatLabel84", "floatLabel85", "floatLabel86", "floatLabel87", "floatLabel88", "floatLabel89", "floatLabel90", "floatLabel91", "floatLabel92", "floatLabel93", "floatLabel94", "floatLabel95", "floatLabel96", "floatLabel97", "floatLabel98", "floatLabel99", "floatLabel100", "floatLabel101", "floatLabel102", "floatLabel103", "floatLabel104", "floatLabel105", "floatLabel106", "floatLabel107", "floatLabel108", "floatLabel109", "floatLabel110", "floatLabel111", "floatLabel112", "floatLabel113", "floatLabel114", "floatLabel115", "floatLabel116", "floatLabel117", "floatLabel118", "floatLabel119", "floatLabel120", "floatLabel121", "floatLabel122", "floatLabel123", "floatLabel124", "floatLabel125", "floatLabel126", "floatLabel127",
      "NEWHOTWORK", "NEWHOTWORK1", "NEWHOTWORK2",
      "EnergisingEquipment", "IsolatingLive", "WorkingNearLive"
    ];
    keysToDelete.forEach(k => delete payload[k]);

    // Construct FormData object
    const fd = new FormData();
    for (const [key, value] of Object.entries(payload)) {
      if (value !== null && value !== undefined) {
        fd.append(key, String(value));
      }
    }

    // Append files (only new files accumulated in creation mode)
    if (!isEditMode && uploadedFiles.length > 0) {
      uploadedFiles.forEach((file) => {
        fd.append("rams_file[]", file);
      });
    }

    try {
      if (isEditMode) {
        // Submit update request
        await updateRequest(editRequest.id, fd);

        // Submit notes if typed
        if (formData.notes && formData.notes.trim()) {
          const notePayload = {
            request_id: String(editRequest.id),
            permit_no: editRequest.PermitNo,
            user_id: currentUserId,
            username: currentUser?.displayName || currentUser?.username || "Supervisor",
            note: formData.notes.trim(),
          };
          await addListReqstNote(notePayload);
        }
        showSuccess("Work Permit Request updated successfully");
      } else {
        await createRequest(fd);
        showSuccess("Work Permit Request created successfully");
      }

      setIsnewrequestcreated(false);
      setBuilding("");
      setLevel("");
      setSelectedRooms([]);
      setSelectedZone(null);
      setUploadedFiles([]);
      navigate("/list-request");
    } catch (err) {
      console.error(err);
      showError("Operation failed. Please try again.");
    }
  };

  const toggleRoomSelection = (roomName) => {
    setSelectedRooms(prev =>
      prev.includes(roomName)
        ? prev.filter(r => r !== roomName)
        : [...prev, roomName]
    );
  };

  if (isnewrequestcreated) {

    return (
      <div className="dept-page">
        <div className="dept-page-header">
          <div className="dept-page-header__left">
            <h1 className="dept-page-title">New Work Permit Request Form</h1>
          </div>
          <div className="butns-grp-back">
            <button
              type="button"
              className="nr-btn nr-btn--ghost"
              onClick={() => setIsnewrequestcreated(false)}
            >
              Back to Drawing
            </button>
          </div>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="df-form premium-form-container">
          {/* Main Form Section */}
          <div className="form-card">
            <h2 className="form-card-title">General Information</h2>
            <div className="df-grid">
              <div className="df-field">
                <label className="df-label">Request Date</label>
                <input
                  type="text"
                  className="df-input df-readonly"
                  value={formData.Request_Date}
                  readOnly
                />
              </div>
              <div className="df-field">
                <label className="df-label">Project Name</label>
                <input
                  type="text"
                  className="df-input df-readonly"
                  value={formData.Company_Name}
                  readOnly
                />
              </div>
            </div>

            <div className="df-grid" style={{ marginTop: "16px" }}>
              <div className="df-field">
                <label className="df-label">Contractor</label>
                <select
                  className="df-select"
                  value={formData.Sub_Contractor_Id}
                  onChange={(e) => handleFieldChange("Sub_Contractor_Id", e.target.value)}
                >
                  <option value="">Select Contractor</option>
                  {contractors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.subContractorName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="df-field">
                <label className="df-label">Sub Contractor</label>
                <input
                  type="text"
                  className="df-input"
                  placeholder="Enter Sub Contractor Name"
                  value={formData.new_sub_contractor}
                  onChange={(e) => handleFieldChange("new_sub_contractor", e.target.value)}
                />
              </div>
            </div>

            <div className="df-grid" style={{ marginTop: "16px" }}>
              <div className="df-field">
                <label className="df-label">Permit Type</label>
                <select
                  className="df-select"
                  value={formData.permit_type}
                  onChange={(e) => handleFieldChange("permit_type", e.target.value)}
                >
                  <option value="Construction">Construction</option>
                  <option value="Commissioning">Commissioning</option>
                </select>
              </div>
              <div className="df-field">
                <label className="df-label">Foreman-Supervisor</label>
                <input
                  type="text"
                  className="df-input"
                  placeholder="Enter Foreman Supervisor Name"
                  value={formData.Foreman}
                  onChange={(e) => handleFieldChange("Foreman", e.target.value)}
                />
              </div>
            </div>

            <div className="df-grid" style={{ marginTop: "16px" }}>
              <div className="df-field">
                <label className="df-label">Foreman Phone</label>
                <input
                  type="text"
                  className="df-input"
                  placeholder="Enter Foreman Phone"
                  value={formData.Foreman_Phone_Number}
                  onChange={(e) => handleFieldChange("Foreman_Phone_Number", e.target.value)}
                />
              </div>
              <div className="df-field">
                <label className="df-label">Activity</label>
                <input
                  type="text"
                  className="df-input"
                  placeholder="Enter Activity"
                  value={formData.Activity}
                  onChange={(e) => handleFieldChange("Activity", e.target.value)}
                />
              </div>
            </div>

            <div className="df-grid" style={{ marginTop: "16px" }}>
              <div className="df-field">
                <label className="df-label">Type of Activity</label>
                <select
                  className="df-select"
                  value={formData.Type_Of_Activity_Id}
                  onChange={(e) => handleFieldChange("Type_Of_Activity_Id", e.target.value)}
                >
                  <option value="">Select Activity Type</option>
                  {activitiesList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.activityName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="df-field">
                <label className="df-label">RAMS Number</label>
                <input
                  type="text"
                  className="df-input"
                  placeholder="Enter RAMS Number"
                  value={formData.rams_number}
                  onChange={(e) => handleFieldChange("rams_number", e.target.value)}
                />
              </div>
            </div>

            <div className="df-field" style={{ marginTop: "16px" }}>
              <label className="df-label">Description of Activity</label>
              <textarea
                className="df-textarea"
                rows={3}
                placeholder="Enter Description of Activity"
                value={formData.description_of_activity}
                onChange={(e) => handleFieldChange("description_of_activity", e.target.value)}
              />
            </div>
          </div>
          {/* Schedule Section */}
          <div className="form-card">
            <h2 className="form-card-title">Schedule & Location</h2>
            <div className="df-grid">
              <div className="df-field">
                <label className="df-label">Date</label>
                <input
                  type="date"
                  className="df-input"
                  value={formData.Working_Date}
                  onChange={(e) => handleFieldChange("Working_Date", e.target.value)}
                />
              </div>
              <div className="df-field">
                <label className="df-label">Start Time</label>
                <input
                  type="time"
                  className="df-input"
                  value={formData.Start_Time}
                  onChange={(e) => handleFieldChange("Start_Time", e.target.value)}
                />
              </div>
            </div>

            <div className="df-grid" style={{ marginTop: "16px" }}>
              <div className="df-field">
                <label className="df-label">End Time</label>
                <input
                  type="time"
                  className="df-input"
                  value={formData.End_Time}
                  onChange={(e) => handleFieldChange("End_Time", e.target.value)}
                />
              </div>
              <div className="df-field night-shift-field" style={{ display: "flex", alignItems: "center" }}>
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={formData.night_shift}
                    onChange={(e) => handleFieldChange("night_shift", e.target.checked)}
                  />
                  <span className="checkbox-label">Is this a night shift?</span>
                </label>
              </div>
            </div>

            {formData.night_shift && (
              <div className="df-grid night-shift-subform" style={{ marginTop: "16px" }}>
                <div className="df-field">
                  <label className="df-label">New Date (Night Shift)</label>
                  <input
                    type="date"
                    className="df-input"
                    value={formData.new_date}
                    onChange={(e) => handleFieldChange("new_date", e.target.value)}
                  />
                </div>
                <div className="df-field">
                  <label className="df-label">New End Time (Night Shift)</label>
                  <input
                    type="time"
                    className="df-input"
                    value={formData.new_end_time}
                    onChange={(e) => handleFieldChange("new_end_time", e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="df-grid" style={{ marginTop: "16px" }}>
              <div className="df-field">
                <label className="df-label">Site</label>
                <input
                  type="text"
                  className="df-input df-readonly"
                  value="M3 North"
                  readOnly
                />
              </div>
              <div className="df-field">
                <label className="df-label">Building</label>
                <input
                  type="text"
                  className="df-input df-readonly"
                  value={selectedBuildingName}
                  readOnly
                />
              </div>
            </div>

            <div className="df-grid" style={{ marginTop: "16px" }}>
              <div className="df-field">
                <label className="df-label">Level</label>
                <input
                  type="text"
                  className="df-input df-readonly"
                  value={level}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Selected Area / Rooms Card */}
          <div className="form-card" style={{ position: "relative" }}>
            <h2 className="form-card-title">Selected Area / Rooms</h2>

            <div className="df-field">
              <label className="df-label">Rooms Selection</label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  className="df-input"
                  style={{ cursor: "pointer", background: "rgba(255, 255, 255, 0.02)" }}
                  placeholder="Click to select rooms..."
                  value={selectedRooms.length > 0 ? selectedRooms.join(", ") : ""}
                  readOnly
                  onClick={() => setIsDropdownOpen(prev => !prev)}
                />
                <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none", fontSize: "10px" }}>
                  ▼
                </span>
              </div>
            </div>

            {isDropdownOpen && zonesToDisplay.length > 0 && (
              <div className="zone-rooms-dropdown" style={{ background: "#111827", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "8px", padding: "16px", marginTop: "8px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)", zIndex: 100 }}>
                {zonesToDisplay.map((zoneToDraw) => (
                  <div key={zoneToDraw.name} style={{ marginBottom: "20px" }}>
                    <div style={{ fontWeight: "bold", color: "#00e5a0", marginBottom: "12px", fontSize: "14px" }}>
                      Zone {zoneToDraw.name}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingLeft: "8px" }}>
                      {zoneToDraw.rooms.map((room) => {
                        const roomName = typeof room === "object" ? room.name : room;
                        const isChecked = selectedRooms.includes(roomName);
                        return (
                          <label key={roomName} className="custom-checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input
                              type="checkbox"
                              className="custom-checkbox-input"
                              checked={isChecked}
                              onChange={() => toggleRoomSelection(roomName)}
                            />
                            <span>{roomName}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tools & Equipment */}
          <div className="form-card">
            <h2 className="form-card-title">Tools & Machinery</h2>
            <div className="df-grid">
              <div className="df-field">
                <label className="df-label">Tools Used</label>
                <textarea
                  className="df-textarea"
                  rows={2}
                  placeholder="Enter tools to be used..."
                  value={formData.Tools}
                  onChange={(e) => handleFieldChange("Tools", e.target.value)}
                />
              </div>
              <div className="df-field">
                <label className="df-label">Machinery Used</label>
                <textarea
                  className="df-textarea"
                  rows={2}
                  placeholder="Enter machinery to be used..."
                  value={formData.Machinery}
                  onChange={(e) => handleFieldChange("Machinery", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="form-card">
            <h2 className="form-card-title">Attachments</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px", alignItems: "start" }}>
              <div>
                <button
                  type="button"
                  className="logo-btn-sty"
                  onClick={triggerFileInput}
                >
                  Add Files
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  multiple
                />
              </div>
              <div className="file-list-container">
                {isEditMode ? (
                  existingFiles.map((file, idx) => (
                    <div key={file.id || idx} className="file-item">
                      <span>{file.name}</span>
                      <button
                        type="button"
                        className="file-remove-btn"
                        onClick={() => handleRemoveFile(idx, file.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  uploadedFiles.map((file, idx) => (
                    <div key={idx} className="file-item">
                      <span>{file.name}</span>
                      <button
                        type="button"
                        className="file-remove-btn"
                        onClick={() => handleRemoveFile(idx)}
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
                {isEditMode && existingFiles.length === 0 && (
                  <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "13px" }}>No files uploaded yet.</span>
                )}
                {!isEditMode && uploadedFiles.length === 0 && (
                  <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "13px" }}>No files uploaded yet.</span>
                )}
              </div>
            </div>
          </div>

          {/* Type of Work - ONLY shown if permit_type is Commissioning */}
          {formData.permit_type === "Commissioning" && (
            <div className="form-card">
              <h2 className="form-card-title">Type of Work</h2>
              <div className="df-grid">
                <div className="df-field">
                  <label className="df-label">Type of Work</label>
                  <select
                    className="df-select"
                    value={formData.work_type}
                    onChange={(e) => handleFieldChange("work_type", e.target.value)}
                  >
                    <option value="">Select Type of Work</option>
                    <option value="Electrical Works">Electrical Works</option>
                    <option value="Mechanical Works">Mechanical Works</option>
                  </select>
                </div>

                {formData.work_type === "Electrical Works" && (
                  <div className="df-field" style={{ position: "relative" }}>
                    <label className="df-label">Electrical Works</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        className="df-input"
                        style={{ cursor: "pointer", background: "rgba(255, 255, 255, 0.02)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                        placeholder="Click to select electrical works..."
                        value={
                          formData.electrical_works?.length > 0
                            ? formData.electrical_works.map(id => electricalWorksList.find(x => String(x.id) === String(id))?.name || id).join(", ")
                            : ""
                        }
                        readOnly
                        onClick={() => setIsElectricalDropdownOpen(prev => !prev)}
                      />
                      <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none", fontSize: "10px" }}>
                        ▼
                      </span>
                    </div>

                    {isElectricalDropdownOpen && groupedElectrical.length > 0 && (
                      <div className="zone-rooms-dropdown" style={{ background: "#111827", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "8px", padding: "16px", marginTop: "8px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)", position: "absolute", top: "100%", left: 0, width: "100%", zIndex: 100, maxHeight: "300px", overflowY: "auto" }}>
                        {groupedElectrical.map((g) => (
                          <div key={g.module} style={{ marginBottom: "20px" }}>
                            <div style={{ fontWeight: "bold", color: "#00e5a0", marginBottom: "12px", fontSize: "14px", textTransform: "uppercase" }}>
                              {g.module}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingLeft: "8px" }}>
                              {g.items.map((i) => {
                                const isChecked = (formData.electrical_works || []).includes(String(i.id));
                                return (
                                  <label key={i.id} className="custom-checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <input
                                      type="checkbox"
                                      className="custom-checkbox-input"
                                      checked={isChecked}
                                      onChange={() => {
                                        const current = formData.electrical_works || [];
                                        const newValues = isChecked
                                          ? current.filter(val => val !== String(i.id))
                                          : [...current, String(i.id)];
                                        handleFieldChange("electrical_works", newValues);
                                      }}
                                    />
                                    <span>{i.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {formData.work_type === "Mechanical Works" && (
                  <div className="df-field" style={{ position: "relative" }}>
                    <label className="df-label">Mechanical Works</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        className="df-input"
                        style={{ cursor: "pointer", background: "rgba(255, 255, 255, 0.02)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                        placeholder="Click to select mechanical works..."
                        value={
                          formData.mechanical_works?.length > 0
                            ? formData.mechanical_works.map(id => mechanicalWorksOptions.find(x => String(x.id) === String(id))?.name || id).join(", ")
                            : ""
                        }
                        readOnly
                        onClick={() => setIsMechanicalDropdownOpen(prev => !prev)}
                      />
                      <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none", fontSize: "10px" }}>
                        ▼
                      </span>
                    </div>

                    {isMechanicalDropdownOpen && mechanicalWorksOptions.length > 0 && (
                      <div className="zone-rooms-dropdown" style={{ background: "#111827", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "8px", padding: "16px", marginTop: "8px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)", position: "absolute", top: "100%", left: 0, width: "100%", zIndex: 100, maxHeight: "300px", overflowY: "auto" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          {mechanicalWorksOptions.map((m) => {
                            const isChecked = (formData.mechanical_works || []).includes(String(m.id));
                            return (
                              <label key={m.id} className="custom-checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <input
                                  type="checkbox"
                                  className="custom-checkbox-input"
                                  checked={isChecked}
                                  onChange={() => {
                                    const current = formData.mechanical_works || [];
                                    const newValues = isChecked
                                      ? current.filter(val => val !== String(m.id))
                                      : [...current, String(m.id)];
                                    handleFieldChange("mechanical_works", newValues);
                                  }}
                                />
                                <span>{m.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* General Safety Checklist */}
          <div className="form-card">
            <h2 className="form-card-title">General Safety Checklist</h2>

            <div className="checklist-item">
              <p className="checklist-question">
                1. Can you confirm that your work not affecting with other contractors working in this area before starting the work?
              </p>
              <div className="radio-group">
                <label><input type="radio" name="floatLabel11" value="1" checked={formData.floatLabel11 === "1"} onChange={(e) => handleFieldChange("floatLabel11", e.target.value)} /> Yes</label>
                <label><input type="radio" name="floatLabel11" value="0" checked={formData.floatLabel11 === "0"} onChange={(e) => handleFieldChange("floatLabel11", e.target.value)} /> No</label>
                <label><input type="radio" name="floatLabel11" value="2" checked={formData.floatLabel11 === "2"} onChange={(e) => handleFieldChange("floatLabel11", e.target.value)} /> N/A</label>
              </div>
            </div>

            <div className="checklist-item">
              <p className="checklist-question">
                2. Are there other conditions that must be taken into account during the work? If Yes, note in 'Other conditions'
              </p>
              <div className="radio-group">
                <label><input type="radio" name="floatLabel12" value="1" checked={formData.floatLabel12 === "1"} onChange={(e) => handleFieldChange("floatLabel12", e.target.value)} /> Yes</label>
                <label><input type="radio" name="floatLabel12" value="0" checked={formData.floatLabel12 === "0"} onChange={(e) => handleFieldChange("floatLabel12", e.target.value)} /> No</label>
                <label><input type="radio" name="floatLabel12" value="2" checked={formData.floatLabel12 === "2"} onChange={(e) => handleFieldChange("floatLabel12", e.target.value)} /> N/A</label>
              </div>
              {formData.floatLabel12 === "1" && (
                <div className="df-field" style={{ marginTop: "8px" }}>
                  <label className="df-label">Note the Other Condition</label>
                  <input
                    type="text"
                    className="df-input"
                    placeholder="Enter other conditions..."
                    value={formData.other_conditions_input}
                    onChange={(e) => handleFieldChange("other_conditions_input", e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="checklist-item">
              <p className="checklist-question">
                3. Can you confirm that there will be enough work lighting to begin the work?
              </p>
              <div className="radio-group">
                <label><input type="radio" name="floatLabel13" value="1" checked={formData.floatLabel13 === "1"} onChange={(e) => handleFieldChange("floatLabel13", e.target.value)} /> Yes</label>
                <label><input type="radio" name="floatLabel13" value="0" checked={formData.floatLabel13 === "0"} onChange={(e) => handleFieldChange("floatLabel13", e.target.value)} /> No</label>
                <label><input type="radio" name="floatLabel13" value="2" checked={formData.floatLabel13 === "2"} onChange={(e) => handleFieldChange("floatLabel13", e.target.value)} /> N/A</label>
              </div>
            </div>

            <div className="checklist-item">
              <p className="checklist-question">
                4. Have the team been informed about the specific risks based on task? (RAMS/Toolbox talk etc.)
              </p>
              <div className="radio-group">
                <label><input type="radio" name="floatLabel14" value="1" checked={formData.floatLabel14 === "1"} onChange={(e) => handleFieldChange("floatLabel14", e.target.value)} /> Yes</label>
                <label><input type="radio" name="floatLabel14" value="0" checked={formData.floatLabel14 === "0"} onChange={(e) => handleFieldChange("floatLabel14", e.target.value)} /> No</label>
                <label><input type="radio" name="floatLabel14" value="2" checked={formData.floatLabel14 === "2"} onChange={(e) => handleFieldChange("floatLabel14", e.target.value)} /> N/A</label>
              </div>
            </div>

            <div className="checklist-item">
              <p className="checklist-question">
                5. Is the work environment safety ensured? Have the necessary warning signs been placed?
              </p>
              <div className="radio-group">
                <label><input type="radio" name="floatLabel15" value="1" checked={formData.floatLabel15 === "1"} onChange={(e) => handleFieldChange("floatLabel15", e.target.value)} /> Yes</label>
                <label><input type="radio" name="floatLabel15" value="0" checked={formData.floatLabel15 === "0"} onChange={(e) => handleFieldChange("floatLabel15", e.target.value)} /> No</label>
                <label><input type="radio" name="floatLabel15" value="2" checked={formData.floatLabel15 === "2"} onChange={(e) => handleFieldChange("floatLabel15", e.target.value)} /> N/A</label>
              </div>
            </div>

            <div className="checklist-item">
              <p className="checklist-question">
                6. Have the team been informed about the course of action in any emergency situation?
              </p>
              <div className="radio-group">
                <label><input type="radio" name="floatLabel16" value="1" checked={formData.floatLabel16 === "1"} onChange={(e) => handleFieldChange("floatLabel16", e.target.value)} /> Yes</label>
                <label><input type="radio" name="floatLabel16" value="0" checked={formData.floatLabel16 === "0"} onChange={(e) => handleFieldChange("floatLabel16", e.target.value)} /> No</label>
                <label><input type="radio" name="floatLabel16" value="2" checked={formData.floatLabel16 === "2"} onChange={(e) => handleFieldChange("floatLabel16", e.target.value)} /> N/A</label>
              </div>
            </div>
          </div>

          {/* Safety Options dropdowns with logos on the left */}
          <div className="form-card">
            <h2 className="form-card-title">Safety Precautions & Tasks</h2>

            {/* Hotwork dropdown */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "center" }}>
              <img src="/src/assets/images/logos/HotWorks.png" alt="HotWorks" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
              <div className="df-field" style={{ flex: 1 }}>
                <label className="df-label">Is Hotwork Required?</label>
                <select
                  className="df-select"
                  value={formData.Hot_work}
                  onChange={(e) => handleFieldChange("Hot_work", e.target.value)}
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>
            </div>

            {formData.Hot_work === "1" && (
              <div className="conditional-fields-block" style={{ marginBottom: "20px" }}>
                <div className="checklist-item">
                  <p className="checklist-question">Are there other tasks in progress in the area?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel1" value="1" checked={formData.floatLabel1 === "1"} onChange={(e) => handleFieldChange("floatLabel1", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel1" value="0" checked={formData.floatLabel1 === "0"} onChange={(e) => handleFieldChange("floatLabel1", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel1" value="2" checked={formData.floatLabel1 === "2"} onChange={(e) => handleFieldChange("floatLabel1", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Have you considered any alternative methods to the hot work method?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel3" value="1" checked={formData.floatLabel3 === "1"} onChange={(e) => handleFieldChange("floatLabel3", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel3" value="0" checked={formData.floatLabel3 === "0"} onChange={(e) => handleFieldChange("floatLabel3", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel3" value="2" checked={formData.floatLabel3 === "2"} onChange={(e) => handleFieldChange("floatLabel3", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Have the team been informed about the specific risks based on task?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel4" value="1" checked={formData.floatLabel4 === "1"} onChange={(e) => handleFieldChange("floatLabel4", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel4" value="0" checked={formData.floatLabel4 === "0"} onChange={(e) => handleFieldChange("floatLabel4", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel4" value="2" checked={formData.floatLabel4 === "2"} onChange={(e) => handleFieldChange("floatLabel4", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Is the work environment safety ensured? Have the necessary warning signs been placed?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel5" value="1" checked={formData.floatLabel5 === "1"} onChange={(e) => handleFieldChange("floatLabel5", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel5" value="0" checked={formData.floatLabel5 === "0"} onChange={(e) => handleFieldChange("floatLabel5", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel5" value="2" checked={formData.floatLabel5 === "2"} onChange={(e) => handleFieldChange("floatLabel5", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Have the team been informed about the course of action in emergencies?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel6" value="1" checked={formData.floatLabel6 === "1"} onChange={(e) => handleFieldChange("floatLabel6", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel6" value="0" checked={formData.floatLabel6 === "0"} onChange={(e) => handleFieldChange("floatLabel6", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel6" value="2" checked={formData.floatLabel6 === "2"} onChange={(e) => handleFieldChange("floatLabel6", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Should a fire watch be established?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel7" value="1" checked={formData.floatLabel7 === "1"} onChange={(e) => handleFieldChange("floatLabel7", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel7" value="0" checked={formData.floatLabel7 === "0"} onChange={(e) => handleFieldChange("floatLabel7", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel7" value="2" checked={formData.floatLabel7 === "2"} onChange={(e) => handleFieldChange("floatLabel7", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Can you confirm that the flammable material are removed from the work area?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel8" value="1" checked={formData.floatLabel8 === "1"} onChange={(e) => handleFieldChange("floatLabel8", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel8" value="0" checked={formData.floatLabel8 === "0"} onChange={(e) => handleFieldChange("floatLabel8", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel8" value="2" checked={formData.floatLabel8 === "2"} onChange={(e) => handleFieldChange("floatLabel8", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Should safety measures implemented to stop sparks from splattering on a flooring or other surfaces?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel9" value="1" checked={formData.floatLabel9 === "1"} onChange={(e) => handleFieldChange("floatLabel9", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel9" value="0" checked={formData.floatLabel9 === "0"} onChange={(e) => handleFieldChange("floatLabel9", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel9" value="2" checked={formData.floatLabel9 === "2"} onChange={(e) => handleFieldChange("floatLabel9", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Are fire extinguishers and fire blanket ready for use in the area?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel10" value="1" checked={formData.floatLabel10 === "1"} onChange={(e) => handleFieldChange("floatLabel10", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel10" value="0" checked={formData.floatLabel10 === "0"} onChange={(e) => handleFieldChange("floatLabel10", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel10" value="2" checked={formData.floatLabel10 === "2"} onChange={(e) => handleFieldChange("floatLabel10", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="df-field" style={{ marginTop: "16px" }}>
                  <label className="df-label">Is there any welding activity?</label>
                  <select
                    className="df-select"
                    value={formData.NEWHOTWORK}
                    onChange={(e) => handleFieldChange("NEWHOTWORK", e.target.value)}
                  >
                    <option value="0">No</option>
                    <option value="1">Yes</option>
                  </select>
                </div>

                {formData.NEWHOTWORK === "1" && (
                  <div className="welding-subform" style={{ marginTop: "12px", paddingLeft: "16px", borderLeft: "3px solid #2563eb" }}>
                    <div className="checklist-item">
                      <p className="checklist-question">The people who will do heat treatment, had welder certificates?</p>
                      <div className="radio-group">
                        <label><input type="radio" name="NEWHOTWORK1" value="1" checked={formData.NEWHOTWORK1 === "1"} onChange={(e) => handleFieldChange("NEWHOTWORK1", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="NEWHOTWORK1" value="0" checked={formData.NEWHOTWORK1 === "0"} onChange={(e) => handleFieldChange("NEWHOTWORK1", e.target.value)} /> No</label>
                        <label><input type="radio" name="NEWHOTWORK1" value="2" checked={formData.NEWHOTWORK1 === "2"} onChange={(e) => handleFieldChange("NEWHOTWORK1", e.target.value)} /> N/A</label>
                      </div>
                    </div>
                    <div className="checklist-item">
                      <p className="checklist-question">Should air extraction be established?</p>
                      <div className="radio-group">
                        <label><input type="radio" name="NEWHOTWORK2" value="1" checked={formData.NEWHOTWORK2 === "1"} onChange={(e) => handleFieldChange("NEWHOTWORK2", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="NEWHOTWORK2" value="0" checked={formData.NEWHOTWORK2 === "0"} onChange={(e) => handleFieldChange("NEWHOTWORK2", e.target.value)} /> No</label>
                        <label><input type="radio" name="NEWHOTWORK2" value="2" checked={formData.NEWHOTWORK2 === "2"} onChange={(e) => handleFieldChange("NEWHOTWORK2", e.target.value)} /> N/A</label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Temporary Electrical Systems dropdown */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "center" }}>
              <img src="/src/assets/images/logos/ElectricalSystems.png" alt="ElectricalSystems" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
              <div className="df-field" style={{ flex: 1 }}>
                <label className="df-label">Working on Site Temporary Electrical Systems?</label>
                <select
                  className="df-select"
                  value={formData.working_on_electrical_system}
                  onChange={(e) => handleFieldChange("working_on_electrical_system", e.target.value)}
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>
            </div>

            {formData.working_on_electrical_system === "1" && (
              <div className="conditional-fields-block" style={{ marginBottom: "20px" }}>
                <div className="checklist-item">
                  <p className="checklist-question">Is the responsible for the area informed?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel17" value="1" checked={formData.floatLabel17 === "1"} onChange={(e) => handleFieldChange("floatLabel17", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel17" value="0" checked={formData.floatLabel17 === "0"} onChange={(e) => handleFieldChange("floatLabel17", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel17" value="2" checked={formData.floatLabel17 === "2"} onChange={(e) => handleFieldChange("floatLabel17", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Check if the board is de-energized - is it de-energized?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel18" value="1" checked={formData.floatLabel18 === "1"} onChange={(e) => handleFieldChange("floatLabel18", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel18" value="0" checked={formData.floatLabel18 === "0"} onChange={(e) => handleFieldChange("floatLabel18", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel18" value="2" checked={formData.floatLabel18 === "2"} onChange={(e) => handleFieldChange("floatLabel18", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Secure the area against reconnection using LOTO (Lock-out/Tag-out) with at least a padlock.</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel19" value="1" checked={formData.floatLabel19 === "1"} onChange={(e) => handleFieldChange("floatLabel19", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel19" value="0" checked={formData.floatLabel19 === "0"} onChange={(e) => handleFieldChange("floatLabel19", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel19" value="2" checked={formData.floatLabel19 === "2"} onChange={(e) => handleFieldChange("floatLabel19", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Do you have risk assessment done (RAMS)?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel20" value="1" checked={formData.floatLabel20 === "1"} onChange={(e) => handleFieldChange("floatLabel20", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel20" value="0" checked={formData.floatLabel20 === "0"} onChange={(e) => handleFieldChange("floatLabel20", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel20" value="2" checked={formData.floatLabel20 === "2"} onChange={(e) => handleFieldChange("floatLabel20", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Do appliances/devices that run on electricity have insulation?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel22" value="1" checked={formData.floatLabel22 === "1"} onChange={(e) => handleFieldChange("floatLabel22", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel22" value="0" checked={formData.floatLabel22 === "0"} onChange={(e) => handleFieldChange("floatLabel22", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel22" value="2" checked={formData.floatLabel22 === "2"} onChange={(e) => handleFieldChange("floatLabel22", e.target.value)} /> N/A</label>
                  </div>
                </div>
              </div>
            )}

            {/* Hazardous Substances dropdown */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "center" }}>
              <img src="/src/assets/images/logos/substanceChemical.png" alt="Chemicals" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
              <div className="df-field" style={{ flex: 1 }}>
                <label className="df-label">Working with Hazardous Substances/Chemicals?</label>
                <select
                  className="df-select"
                  value={formData.working_hazardious_substen}
                  onChange={(e) => handleFieldChange("working_hazardious_substen", e.target.value)}
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>
            </div>

            {formData.working_hazardious_substen === "1" && (
              <div className="conditional-fields-block" style={{ marginBottom: "20px" }}>
                <div className="checklist-item">
                  <p className="checklist-question">Relevant MAL-codes and safety datasheets for hazardous medias have been presented?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel24" value="1" checked={formData.floatLabel24 === "1"} onChange={(e) => handleFieldChange("floatLabel24", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel24" value="0" checked={formData.floatLabel24 === "0"} onChange={(e) => handleFieldChange("floatLabel24", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel24" value="2" checked={formData.floatLabel24 === "2"} onChange={(e) => handleFieldChange("floatLabel24", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Is MSDS (Material Safety Data Sheet) submitted?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel25" value="1" checked={formData.floatLabel25 === "1"} onChange={(e) => handleFieldChange("floatLabel25", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel25" value="0" checked={formData.floatLabel25 === "0"} onChange={(e) => handleFieldChange("floatLabel25", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel25" value="2" checked={formData.floatLabel25 === "2"} onChange={(e) => handleFieldChange("floatLabel25", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Has the use of protective equipment been taken into account - and are they present?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel26" value="1" checked={formData.floatLabel26 === "1"} onChange={(e) => handleFieldChange("floatLabel26", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel26" value="0" checked={formData.floatLabel26 === "0"} onChange={(e) => handleFieldChange("floatLabel26", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel26" value="2" checked={formData.floatLabel26 === "2"} onChange={(e) => handleFieldChange("floatLabel26", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Has the use of ventilation been taken into account?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel27" value="1" checked={formData.floatLabel27 === "1"} onChange={(e) => handleFieldChange("floatLabel27", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel27" value="0" checked={formData.floatLabel27 === "0"} onChange={(e) => handleFieldChange("floatLabel27", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel27" value="2" checked={formData.floatLabel27 === "2"} onChange={(e) => handleFieldChange("floatLabel27", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Will the hazardous substances affect people outside the working area? (fumes)</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel28" value="1" checked={formData.floatLabel28 === "1"} onChange={(e) => handleFieldChange("floatLabel28", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel28" value="0" checked={formData.floatLabel28 === "0"} onChange={(e) => handleFieldChange("floatLabel28", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel28" value="2" checked={formData.floatLabel28 === "2"} onChange={(e) => handleFieldChange("floatLabel28", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Are there means for safe storage and disposal? Is it mapped on the site plan?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel29" value="1" checked={formData.floatLabel29 === "1"} onChange={(e) => handleFieldChange("floatLabel29", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel29" value="0" checked={formData.floatLabel29 === "0"} onChange={(e) => handleFieldChange("floatLabel29", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel29" value="2" checked={formData.floatLabel29 === "2"} onChange={(e) => handleFieldChange("floatLabel29", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Are the spill kits in place and reachable in case of a leak or spill?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel30" value="1" checked={formData.floatLabel30 === "1"} onChange={(e) => handleFieldChange("floatLabel30", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel30" value="0" checked={formData.floatLabel30 === "0"} onChange={(e) => handleFieldChange("floatLabel30", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel30" value="2" checked={formData.floatLabel30 === "2"} onChange={(e) => handleFieldChange("floatLabel30", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Is RAMS covering chemicals risk assessment for working with the substance?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel31" value="1" checked={formData.floatLabel31 === "1"} onChange={(e) => handleFieldChange("floatLabel31", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel31" value="0" checked={formData.floatLabel31 === "0"} onChange={(e) => handleFieldChange("floatLabel31", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel31" value="2" checked={formData.floatLabel31 === "2"} onChange={(e) => handleFieldChange("floatLabel31", e.target.value)} /> N/A</label>
                  </div>
                </div>
              </div>
            )}

            {/* Working at Height dropdown */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "center" }}>
              <img src="/src/assets/images/logos/WorkingAtHight.png" alt="Working at Height" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
              <div className="df-field" style={{ flex: 1 }}>
                <label className="df-label">WORKING AT HEIGHT?</label>
                <select
                  className="df-select"
                  value={formData.working_at_height}
                  onChange={(e) => handleFieldChange("working_at_height", e.target.value)}
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>
            </div>

            {formData.working_at_height === "1" && (
              <div className="conditional-fields-block" style={{ marginBottom: "20px" }}>
                <div className="checklist-item">
                  <p className="checklist-question">Has the working area been segregated or demarkated with hand barriers?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="segragated_demarkated" value="1" checked={formData.segragated_demarkated === "1"} onChange={(e) => handleFieldChange("segragated_demarkated", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="segragated_demarkated" value="0" checked={formData.segragated_demarkated === "0"} onChange={(e) => handleFieldChange("segragated_demarkated", e.target.value)} /> No</label>
                    <label><input type="radio" name="segragated_demarkated" value="2" checked={formData.segragated_demarkated === "2"} onChange={(e) => handleFieldChange("segragated_demarkated", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Are suitable anchor points in place for lanyard attachments?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel39" value="1" checked={formData.floatLabel39 === "1"} onChange={(e) => handleFieldChange("floatLabel39", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel39" value="0" checked={formData.floatLabel39 === "0"} onChange={(e) => handleFieldChange("floatLabel39", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel39" value="2" checked={formData.floatLabel39 === "2"} onChange={(e) => handleFieldChange("floatLabel39", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">In case of emergency is there a rescue plan in place?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel40" value="1" checked={formData.floatLabel40 === "1"} onChange={(e) => handleFieldChange("floatLabel40", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel40" value="0" checked={formData.floatLabel40 === "0"} onChange={(e) => handleFieldChange("floatLabel40", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel40" value="2" checked={formData.floatLabel40 === "2"} onChange={(e) => handleFieldChange("floatLabel40", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Have the work been planned and coordinated to avoid hazards like (falling objects/materials onto other workers, interference between the machines etc.)?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel41" value="1" checked={formData.floatLabel41 === "1"} onChange={(e) => handleFieldChange("floatLabel41", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel41" value="0" checked={formData.floatLabel41 === "0"} onChange={(e) => handleFieldChange("floatLabel41", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel41" value="2" checked={formData.floatLabel41 === "2"} onChange={(e) => handleFieldChange("floatLabel41", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Have the team had certified working at height training?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel42" value="1" checked={formData.floatLabel42 === "1"} onChange={(e) => handleFieldChange("floatLabel42", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel42" value="0" checked={formData.floatLabel42 === "0"} onChange={(e) => handleFieldChange("floatLabel42", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel42" value="2" checked={formData.floatLabel42 === "2"} onChange={(e) => handleFieldChange("floatLabel42", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Will this work be carried out by, and under the supervision of personnel who have received 'Working at Height' training?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel43" value="1" checked={formData.floatLabel43 === "1"} onChange={(e) => handleFieldChange("floatLabel43", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel43" value="0" checked={formData.floatLabel43 === "0"} onChange={(e) => handleFieldChange("floatLabel43", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel43" value="2" checked={formData.floatLabel43 === "2"} onChange={(e) => handleFieldChange("floatLabel43", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Full body harness with fall-preventing system deployed & twin lanyard provided?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel44" value="1" checked={formData.floatLabel44 === "1"} onChange={(e) => handleFieldChange("floatLabel44", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel44" value="0" checked={formData.floatLabel44 === "0"} onChange={(e) => handleFieldChange("floatLabel44", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel44" value="2" checked={formData.floatLabel44 === "2"} onChange={(e) => handleFieldChange("floatLabel44", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Are the working at height equipments (Safety harness and lanyard) inspected and suitable to carry out the task?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel45" value="1" checked={formData.floatLabel45 === "1"} onChange={(e) => handleFieldChange("floatLabel45", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel45" value="0" checked={formData.floatLabel45 === "0"} onChange={(e) => handleFieldChange("floatLabel45", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel45" value="2" checked={formData.floatLabel45 === "2"} onChange={(e) => handleFieldChange("floatLabel45", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Horizontal or vertical life line systems in place?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel46" value="1" checked={formData.floatLabel46 === "1"} onChange={(e) => handleFieldChange("floatLabel46", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel46" value="0" checked={formData.floatLabel46 === "0"} onChange={(e) => handleFieldChange("floatLabel46", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel46" value="2" checked={formData.floatLabel46 === "2"} onChange={(e) => handleFieldChange("floatLabel46", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Are all tools secured from falling from height?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel47" value="1" checked={formData.floatLabel47 === "1"} onChange={(e) => handleFieldChange("floatLabel47", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel47" value="0" checked={formData.floatLabel47 === "0"} onChange={(e) => handleFieldChange("floatLabel47", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel47" value="2" checked={formData.floatLabel47 === "2"} onChange={(e) => handleFieldChange("floatLabel47", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Have protective measures for dropped objects been established (e.g. lanyards, demarcated working area, nets)?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel48" value="1" checked={formData.floatLabel48 === "1"} onChange={(e) => handleFieldChange("floatLabel48", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel48" value="0" checked={formData.floatLabel48 === "0"} onChange={(e) => handleFieldChange("floatLabel48", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel48" value="2" checked={formData.floatLabel48 === "2"} onChange={(e) => handleFieldChange("floatLabel48", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Has proper and safe access and egress been ensured?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel49" value="1" checked={formData.floatLabel49 === "1"} onChange={(e) => handleFieldChange("floatLabel49", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel49" value="0" checked={formData.floatLabel49 === "0"} onChange={(e) => handleFieldChange("floatLabel49", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel49" value="2" checked={formData.floatLabel49 === "2"} onChange={(e) => handleFieldChange("floatLabel49", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Are the weather conditions acceptable?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel50" value="1" checked={formData.floatLabel50 === "1"} onChange={(e) => handleFieldChange("floatLabel50", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel50" value="0" checked={formData.floatLabel50 === "0"} onChange={(e) => handleFieldChange("floatLabel50", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel50" value="2" checked={formData.floatLabel50 === "2"} onChange={(e) => handleFieldChange("floatLabel50", e.target.value)} /> N/A</label>
                  </div>
                </div>
              </div>
            )}

            {/* Working in Confined Spaces dropdown */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "center" }}>
              <img src="/src/assets/images/logos/ConfinedSpace.png" alt="Confined Spaces" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
              <div className="df-field" style={{ flex: 1 }}>
                <label className="df-label">WORKING IN CONFINED SPACES?</label>
                <select
                  className="df-select"
                  value={formData.working_confined_spaces}
                  onChange={(e) => handleFieldChange("working_confined_spaces", e.target.value)}
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>
            </div>

            {formData.working_confined_spaces === "1" && (
              <div className="conditional-fields-block" style={{ marginBottom: "20px" }}>
                <div className="checklist-item">
                  <p className="checklist-question">Is the tank/container cleaned so that the task can take place without risk from vapours, gases etc.?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel51" value="1" checked={formData.floatLabel51 === "1"} onChange={(e) => handleFieldChange("floatLabel51", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel51" value="0" checked={formData.floatLabel51 === "0"} onChange={(e) => handleFieldChange("floatLabel51", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel51" value="2" checked={formData.floatLabel51 === "2"} onChange={(e) => handleFieldChange("floatLabel51", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Are oxygen measurement and LEL measurement done before starting the work?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel52" value="1" checked={formData.floatLabel52 === "1"} onChange={(e) => handleFieldChange("floatLabel52", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel52" value="0" checked={formData.floatLabel52 === "0"} onChange={(e) => handleFieldChange("floatLabel52", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel52" value="2" checked={formData.floatLabel52 === "2"} onChange={(e) => handleFieldChange("floatLabel52", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Are the container and all equipment on the container, including agitator properly secured?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel53" value="1" checked={formData.floatLabel53 === "1"} onChange={(e) => handleFieldChange("floatLabel53", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel53" value="0" checked={formData.floatLabel53 === "0"} onChange={(e) => handleFieldChange("floatLabel53", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel53" value="2" checked={formData.floatLabel53 === "2"} onChange={(e) => handleFieldChange("floatLabel53", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Are there safe entry and exit conditions? (e.g. ladder)</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel54" value="1" checked={formData.floatLabel54 === "1"} onChange={(e) => handleFieldChange("floatLabel54", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel54" value="0" checked={formData.floatLabel54 === "0"} onChange={(e) => handleFieldChange("floatLabel54", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel54" value="2" checked={formData.floatLabel54 === "2"} onChange={(e) => handleFieldChange("floatLabel54", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Are means of communication for emergency rescue determined? (Siren, radio or telephone options for emergency rescue?)</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel55" value="1" checked={formData.floatLabel55 === "1"} onChange={(e) => handleFieldChange("floatLabel55", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel55" value="0" checked={formData.floatLabel55 === "0"} onChange={(e) => handleFieldChange("floatLabel55", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel55" value="2" checked={formData.floatLabel55 === "2"} onChange={(e) => handleFieldChange("floatLabel55", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Are rescue equipments in place and ready for use?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel56" value="1" checked={formData.floatLabel56 === "1"} onChange={(e) => handleFieldChange("floatLabel56", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel56" value="0" checked={formData.floatLabel56 === "0"} onChange={(e) => handleFieldChange("floatLabel56", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel56" value="2" checked={formData.floatLabel56 === "2"} onChange={(e) => handleFieldChange("floatLabel56", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Are space and ventilation adequate?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel57" value="1" checked={formData.floatLabel57 === "1"} onChange={(e) => handleFieldChange("floatLabel57", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel57" value="0" checked={formData.floatLabel57 === "0"} onChange={(e) => handleFieldChange("floatLabel57", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel57" value="2" checked={formData.floatLabel57 === "2"} onChange={(e) => handleFieldChange("floatLabel57", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Is an oxygen meter provided for the work?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel58" value="1" checked={formData.floatLabel58 === "1"} onChange={(e) => handleFieldChange("floatLabel58", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel58" value="0" checked={formData.floatLabel58 === "0"} onChange={(e) => handleFieldChange("floatLabel58", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel58" value="2" checked={formData.floatLabel58 === "2"} onChange={(e) => handleFieldChange("floatLabel58", e.target.value)} /> N/A</label>
                  </div>
                </div>
              </div>
            )}

            {/* Excavation Works dropdown */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "center" }}>
              <img src="/src/assets/images/logos/ExcavationWorks.png" alt="Excavation Works" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
              <div className="df-field" style={{ flex: 1 }}>
                <label className="df-label">EXCAVATION WORKS?</label>
                <select
                  className="df-select"
                  value={formData.excavation_works}
                  onChange={(e) => handleFieldChange("excavation_works", e.target.value)}
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>
            </div>

            {formData.excavation_works === "1" && (
              <div className="conditional-fields-block" style={{ marginBottom: "20px" }}>
                <div className="checklist-item">
                  <p className="checklist-question">Is the excavation area segregated (1 meter from edge with hard barriers or 2 meters with soft barriers) before the work begins?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel71" value="1" checked={formData.floatLabel71 === "1"} onChange={(e) => handleFieldChange("floatLabel71", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel71" value="0" checked={formData.floatLabel71 === "0"} onChange={(e) => handleFieldChange("floatLabel71", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel71" value="2" checked={formData.floatLabel71 === "2"} onChange={(e) => handleFieldChange("floatLabel71", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Has the digging permit been obtained in accordance with Danish regulations and NN standards?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel72" value="1" checked={formData.floatLabel72 === "1"} onChange={(e) => handleFieldChange("floatLabel72", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel72" value="0" checked={formData.floatLabel72 === "0"} onChange={(e) => handleFieldChange("floatLabel72", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel72" value="2" checked={formData.floatLabel72 === "2"} onChange={(e) => handleFieldChange("floatLabel72", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Does excavation require shoring?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="excavation_shoring" value="1" checked={formData.excavation_shoring === "1"} onChange={(e) => handleFieldChange("excavation_shoring", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="excavation_shoring" value="0" checked={formData.excavation_shoring === "0"} onChange={(e) => handleFieldChange("excavation_shoring", e.target.value)} /> No</label>
                    <label><input type="radio" name="excavation_shoring" value="2" checked={formData.excavation_shoring === "2"} onChange={(e) => handleFieldChange("excavation_shoring", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Is the sloping correct in relation to the depth of the dig as per Danish regulations?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel74" value="1" checked={formData.floatLabel74 === "1"} onChange={(e) => handleFieldChange("floatLabel74", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel74" value="0" checked={formData.floatLabel74 === "0"} onChange={(e) => handleFieldChange("floatLabel74", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel74" value="2" checked={formData.floatLabel74 === "2"} onChange={(e) => handleFieldChange("floatLabel74", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Have proper and safe access and egress been provided?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel75" value="1" checked={formData.floatLabel75 === "1"} onChange={(e) => handleFieldChange("floatLabel75", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel75" value="0" checked={formData.floatLabel75 === "0"} onChange={(e) => handleFieldChange("floatLabel75", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel75" value="2" checked={formData.floatLabel75 === "2"} onChange={(e) => handleFieldChange("floatLabel75", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Are correctly positioned ladders or correctly sloped stairways accessible?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel76" value="1" checked={formData.floatLabel76 === "1"} onChange={(e) => handleFieldChange("floatLabel76", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel76" value="0" checked={formData.floatLabel76 === "0"} onChange={(e) => handleFieldChange("floatLabel76", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel76" value="2" checked={formData.floatLabel76 === "2"} onChange={(e) => handleFieldChange("floatLabel76", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Do all machines have valid inspection dates?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel77" value="1" checked={formData.floatLabel77 === "1"} onChange={(e) => handleFieldChange("floatLabel77", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel77" value="0" checked={formData.floatLabel77 === "0"} onChange={(e) => handleFieldChange("floatLabel77", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel77" value="2" checked={formData.floatLabel77 === "2"} onChange={(e) => handleFieldChange("floatLabel77", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Have clearly marked drawings been submitted?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel78" value="1" checked={formData.floatLabel78 === "1"} onChange={(e) => handleFieldChange("floatLabel78", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel78" value="0" checked={formData.floatLabel78 === "0"} onChange={(e) => handleFieldChange("floatLabel78", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel78" value="2" checked={formData.floatLabel78 === "2"} onChange={(e) => handleFieldChange("floatLabel78", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Are the underground areas cleared from all electrical, piping and other services?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel79" value="1" checked={formData.floatLabel79 === "1"} onChange={(e) => handleFieldChange("floatLabel79", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel79" value="0" checked={formData.floatLabel79 === "0"} onChange={(e) => handleFieldChange("floatLabel79", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel79" value="2" checked={formData.floatLabel79 === "2"} onChange={(e) => handleFieldChange("floatLabel79", e.target.value)} /> N/A</label>
                  </div>
                </div>
              </div>
            )}

            {/* Using Crane or Lifting dropdown */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "center" }}>
              <img src="/src/assets/images/logos/Craneslifting.png" alt="Crane Lifting" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
              <div className="df-field" style={{ flex: 1 }}>
                <label className="df-label">USING CRANE OR LIFTING?</label>
                <select
                  className="df-select"
                  value={formData.using_cranes_or_lifting}
                  onChange={(e) => handleFieldChange("using_cranes_or_lifting", e.target.value)}
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>
            </div>

            {formData.using_cranes_or_lifting === "1" && (
              <div className="conditional-fields-block" style={{ marginBottom: "20px" }}>
                <div className="checklist-item">
                  <p className="checklist-question">Is there an appointed person in charge of the lifting/crane operation?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel80" value="1" checked={formData.floatLabel80 === "1"} onChange={(e) => handleFieldChange("floatLabel80", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel80" value="0" checked={formData.floatLabel80 === "0"} onChange={(e) => handleFieldChange("floatLabel80", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel80" value="2" checked={formData.floatLabel80 === "2"} onChange={(e) => handleFieldChange("floatLabel80", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Are the details of load (dimensions, SWL) and the loading/unloading requirements provided from vendor or supplier?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel81" value="1" checked={formData.floatLabel81 === "1"} onChange={(e) => handleFieldChange("floatLabel81", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel81" value="0" checked={formData.floatLabel81 === "0"} onChange={(e) => handleFieldChange("floatLabel81", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel81" value="2" checked={formData.floatLabel81 === "2"} onChange={(e) => handleFieldChange("floatLabel81", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Is lift plan submitted?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel82" value="1" checked={formData.floatLabel82 === "1"} onChange={(e) => handleFieldChange("floatLabel82", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel82" value="0" checked={formData.floatLabel82 === "0"} onChange={(e) => handleFieldChange("floatLabel82", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel82" value="2" checked={formData.floatLabel82 === "2"} onChange={(e) => handleFieldChange("floatLabel82", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Has the correct crane/lifting equipment as stated in the lift plan been supplied and inspected?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel83" value="1" checked={formData.floatLabel83 === "1"} onChange={(e) => handleFieldChange("floatLabel83", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel83" value="0" checked={formData.floatLabel83 === "0"} onChange={(e) => handleFieldChange("floatLabel83", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel83" value="2" checked={formData.floatLabel83 === "2"} onChange={(e) => handleFieldChange("floatLabel83", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Do the crane operators have the legal required certificates?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel84" value="1" checked={formData.floatLabel84 === "1"} onChange={(e) => handleFieldChange("floatLabel84", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel84" value="0" checked={formData.floatLabel84 === "0"} onChange={(e) => handleFieldChange("floatLabel84", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel84" value="2" checked={formData.floatLabel84 === "2"} onChange={(e) => handleFieldChange("floatLabel84", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Is laydown area suitable and prepared for lifting?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel85" value="1" checked={formData.floatLabel85 === "1"} onChange={(e) => handleFieldChange("floatLabel85", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel85" value="0" checked={formData.floatLabel85 === "0"} onChange={(e) => handleFieldChange("floatLabel85", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel85" value="2" checked={formData.floatLabel85 === "2"} onChange={(e) => handleFieldChange("floatLabel85", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Is the entire area of the lifting task fenced off?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel86" value="1" checked={formData.floatLabel86 === "1"} onChange={(e) => handleFieldChange("floatLabel86", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel86" value="0" checked={formData.floatLabel86 === "0"} onChange={(e) => handleFieldChange("floatLabel86", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel86" value="2" checked={formData.floatLabel86 === "2"} onChange={(e) => handleFieldChange("floatLabel86", e.target.value)} /> N/A</label>
                  </div>
                </div>

                <div className="checklist-item">
                  <p className="checklist-question">Have all overhead risks (cables, adjacent structures etc.) been identified and suitable precautions implemented?</p>
                  <div className="radio-group">
                    <label><input type="radio" name="floatLabel87" value="1" checked={formData.floatLabel87 === "1"} onChange={(e) => handleFieldChange("floatLabel87", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="floatLabel87" value="0" checked={formData.floatLabel87 === "0"} onChange={(e) => handleFieldChange("floatLabel87", e.target.value)} /> No</label>
                    <label><input type="radio" name="floatLabel87" value="2" checked={formData.floatLabel87 === "2"} onChange={(e) => handleFieldChange("floatLabel87", e.target.value)} /> N/A</label>
                  </div>
                </div>
              </div>
            )}

            {/* pressurization power on dropdown */}
            {formData.permit_type === "Commissioning" && !shouldShowElectricianCert() && (
              <>
                <div style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "center", marginTop: "20px" }}>
                  <img src="/src/assets/images/logos/electrical_works.png" alt="electrical_works" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
                  <div className="df-field" style={{ flex: 1 }}>
                    <label className="df-label">Energising, Isolating and Working on Live Electrical Systems</label>
                    <select
                      className="df-select"
                      value={formData.power_on}
                      onChange={(e) => handleFieldChange("power_on", e.target.value)}
                    >
                      <option value="">Select Option</option>
                      {ELECTRICAL_WORKS_SELECT.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                          {tech.ElectricalWorksval}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.power_on === "1" && (
                  <div className="conditional-fields-block" style={{ marginBottom: "20px" }}>
                    {/* Energising Electrical Equipment */}
                    <div style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "center" }}>
                      <img src="/src/assets/images/logos/electrical_works.png" alt="electrical_works" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
                      <div className="df-field" style={{ flex: 1 }}>
                        <label className="df-label">Energising Electrical Equipment</label>
                        <select
                          className="df-select"
                          value={formData.EnergisingEquipment}
                          onChange={(e) => handleFieldChange("EnergisingEquipment", e.target.value)}
                        >
                          <option value="">Select Option</option>
                          {ENERGISING_EQUIPMENT_SELECT.map((tech) => (
                            <option key={tech.id} value={tech.id}>
                              {tech.EnergisingEquipmentval}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {formData.EnergisingEquipment === "1" && (
                      <div className="conditional-fields-block" style={{ marginBottom: "20px", paddingLeft: "16px", borderLeft: "3px solid #10b981" }}>
                        <div className="checklist-item">
                          <p className="checklist-question">Is the responsible for the area informed?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel88" value="1" checked={formData.floatLabel88 === "1"} onChange={(e) => handleFieldChange("floatLabel88", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel88" value="0" checked={formData.floatLabel88 === "0"} onChange={(e) => handleFieldChange("floatLabel88", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel88" value="2" checked={formData.floatLabel88 === "2"} onChange={(e) => handleFieldChange("floatLabel88", e.target.value)} /> N/A</label>
                          </div>
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">Have you completed a risk assessment?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel89" value="1" checked={formData.floatLabel89 === "1"} onChange={(e) => handleFieldChange("floatLabel89", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel89" value="0" checked={formData.floatLabel89 === "0"} onChange={(e) => handleFieldChange("floatLabel89", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel89" value="2" checked={formData.floatLabel89 === "2"} onChange={(e) => handleFieldChange("floatLabel89", e.target.value)} /> N/A</label>
                          </div>
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">Barriers & Signage in place?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel90" value="1" checked={formData.floatLabel90 === "1"} onChange={(e) => handleFieldChange("floatLabel90", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel90" value="0" checked={formData.floatLabel90 === "0"} onChange={(e) => handleFieldChange("floatLabel90", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel90" value="2" checked={formData.floatLabel90 === "2"} onChange={(e) => handleFieldChange("floatLabel90", e.target.value)} /> N/A</label>
                          </div>
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">Arc flash boundary and PPE evaluated?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel110" value="1" checked={formData.floatLabel110 === "1"} onChange={(e) => handleFieldChange("floatLabel110", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel110" value="0" checked={formData.floatLabel110 === "0"} onChange={(e) => handleFieldChange("floatLabel110", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel110" value="2" checked={formData.floatLabel110 === "2"} onChange={(e) => handleFieldChange("floatLabel110", e.target.value)} /> N/A</label>
                          </div>
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">Have all the cables that need to be energized been tested?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel91" value="1" checked={formData.floatLabel91 === "1"} onChange={(e) => handleFieldChange("floatLabel91", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel91" value="0" checked={formData.floatLabel91 === "0"} onChange={(e) => handleFieldChange("floatLabel91", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel91" value="2" checked={formData.floatLabel91 === "2"} onChange={(e) => handleFieldChange("floatLabel91", e.target.value)} /> N/A</label>
                          </div>
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">Have all punches been closed?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel92" value="1" checked={formData.floatLabel92 === "1"} onChange={(e) => handleFieldChange("floatLabel92", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel92" value="0" checked={formData.floatLabel92 === "0"} onChange={(e) => handleFieldChange("floatLabel92", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel92" value="2" checked={formData.floatLabel92 === "2"} onChange={(e) => handleFieldChange("floatLabel92", e.target.value)} /> N/A</label>
                          </div>
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">Has the EIC line walk taken place?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel93" value="1" checked={formData.floatLabel93 === "1"} onChange={(e) => handleFieldChange("floatLabel93", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel93" value="0" checked={formData.floatLabel93 === "0"} onChange={(e) => handleFieldChange("floatLabel93", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel93" value="2" checked={formData.floatLabel93 === "2"} onChange={(e) => handleFieldChange("floatLabel93", e.target.value)} /> N/A</label>
                          </div>
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">Have you Informed and Aligned with EL LOTO Team and provided them with an energisation request form?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel94" value="1" checked={formData.floatLabel94 === "1"} onChange={(e) => handleFieldChange("floatLabel94", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel94" value="0" checked={formData.floatLabel94 === "0"} onChange={(e) => handleFieldChange("floatLabel94", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel94" value="2" checked={formData.floatLabel94 === "2"} onChange={(e) => handleFieldChange("floatLabel94", e.target.value)} /> N/A</label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Isolating Live Electrical Systems */}
                    <div style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "center", marginTop: "20px" }}>
                      <img src="/src/assets/images/logos/electrical_works.png" alt="electrical_works" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
                      <div className="df-field" style={{ flex: 1 }}>
                        <label className="df-label">Isolating Live Electrical Systems for Maintenance or Modification</label>
                        <select
                          className="df-select"
                          value={formData.IsolatingLive}
                          onChange={(e) => handleFieldChange("IsolatingLive", e.target.value)}
                        >
                          <option value="">Select Option</option>
                          {ISOLATING_LIVE_SELECT.map((tech) => (
                            <option key={tech.id} value={tech.id}>
                              {tech.IsolatingLiveval}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {formData.IsolatingLive === "1" && (
                      <div className="conditional-fields-block" style={{ marginBottom: "20px", paddingLeft: "16px", borderLeft: "3px solid #10b981" }}>
                        <div className="checklist-item">
                          <p className="checklist-question">Is the responsible for the area informed?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel111" value="1" checked={formData.floatLabel111 === "1"} onChange={(e) => handleFieldChange("floatLabel111", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel111" value="0" checked={formData.floatLabel111 === "0"} onChange={(e) => handleFieldChange("floatLabel111", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel111" value="2" checked={formData.floatLabel111 === "2"} onChange={(e) => handleFieldChange("floatLabel111", e.target.value)} /> N/A</label>
                          </div>
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">Has a Risk Assessment been completed?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel112" value="1" checked={formData.floatLabel112 === "1"} onChange={(e) => handleFieldChange("floatLabel112", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel112" value="0" checked={formData.floatLabel112 === "0"} onChange={(e) => handleFieldChange("floatLabel112", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel112" value="2" checked={formData.floatLabel112 === "2"} onChange={(e) => handleFieldChange("floatLabel112", e.target.value)} /> N/A</label>
                          </div>
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">Have C&Q LOTO been informed and tasks co-ordinated for shutdown work?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel113" value="1" checked={formData.floatLabel113 === "1"} onChange={(e) => handleFieldChange("floatLabel113", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel113" value="0" checked={formData.floatLabel113 === "0"} onChange={(e) => handleFieldChange("floatLabel113", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel113" value="2" checked={formData.floatLabel113 === "2"} onChange={(e) => handleFieldChange("floatLabel113", e.target.value)} /> N/A</label>
                          </div>
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">Have C&Q LOTO been provided marked up single line diagrams/electrical drawings?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel114" value="1" checked={formData.floatLabel114 === "1"} onChange={(e) => handleFieldChange("floatLabel114", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel114" value="0" checked={formData.floatLabel114 === "0"} onChange={(e) => handleFieldChange("floatLabel114", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel114" value="2" checked={formData.floatLabel114 === "2"} onChange={(e) => handleFieldChange("floatLabel114", e.target.value)} /> N/A</label>
                          </div>
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">Has a De-Energisation Request form and supporting documentation been provided to C&Q LOTO?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel115" value="1" checked={formData.floatLabel115 === "1"} onChange={(e) => handleFieldChange("floatLabel115", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel115" value="0" checked={formData.floatLabel115 === "0"} onChange={(e) => handleFieldChange("floatLabel115", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel115" value="2" checked={formData.floatLabel115 === "2"} onChange={(e) => handleFieldChange("floatLabel115", e.target.value)} /> N/A</label>
                          </div>
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">Are all barriers, signage and PPE prepared for the task?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel116" value="1" checked={formData.floatLabel116 === "1"} onChange={(e) => handleFieldChange("floatLabel116", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel116" value="0" checked={formData.floatLabel116 === "0"} onChange={(e) => handleFieldChange("floatLabel116", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel116" value="2" checked={formData.floatLabel116 === "2"} onChange={(e) => handleFieldChange("floatLabel116", e.target.value)} /> N/A</label>
                          </div>
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">Has absence of voltage been verified and proven dead?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel117" value="1" checked={formData.floatLabel117 === "1"} onChange={(e) => handleFieldChange("floatLabel117", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel117" value="0" checked={formData.floatLabel117 === "0"} onChange={(e) => handleFieldChange("floatLabel117", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel117" value="2" checked={formData.floatLabel117 === "2"} onChange={(e) => handleFieldChange("floatLabel117", e.target.value)} /> N/A</label>
                          </div>
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">Has stored energy been discharged?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel118" value="1" checked={formData.floatLabel118 === "1"} onChange={(e) => handleFieldChange("floatLabel118", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel118" value="0" checked={formData.floatLabel118 === "0"} onChange={(e) => handleFieldChange("floatLabel118", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel118" value="2" checked={formData.floatLabel118 === "2"} onChange={(e) => handleFieldChange("floatLabel118", e.target.value)} /> N/A</label>
                          </div>
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">Have any secondary or back up power supplies been confirmed and accounted for?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel119" value="1" checked={formData.floatLabel119 === "1"} onChange={(e) => handleFieldChange("floatLabel119", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel119" value="0" checked={formData.floatLabel119 === "0"} onChange={(e) => handleFieldChange("floatLabel119", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel119" value="2" checked={formData.floatLabel119 === "2"} onChange={(e) => handleFieldChange("floatLabel119", e.target.value)} /> N/A</label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Working on OR near live electrical systems */}
                    <div style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "center", marginTop: "20px" }}>
                      <img src="/src/assets/images/logos/electrical_works.png" alt="electrical_works" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
                      <div className="df-field" style={{ flex: 1 }}>
                        <label className="df-label">Working on OR near live electrical systems (Live testing, commissioning, fault finding, working inside live enclosures)</label>
                        <select
                          className="df-select"
                          value={formData.WorkingNearLive}
                          onChange={(e) => handleFieldChange("WorkingNearLive", e.target.value)}
                        >
                          <option value="">Select Option</option>
                          {WORKING_NEAR_LIVE_SELECT.map((tech) => (
                            <option key={tech.id} value={tech.id}>
                              {tech.WorkingNearLiveval}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {formData.WorkingNearLive === "1" && (
                      <div className="conditional-fields-block" style={{ marginBottom: "20px", paddingLeft: "16px", borderLeft: "3px solid #10b981" }}>
                        <div className="checklist-item">
                          <p className="checklist-question">Live work is unavoidable and justified?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel120" value="1" checked={formData.floatLabel120 === "1"} onChange={(e) => handleFieldChange("floatLabel120", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel120" value="0" checked={formData.floatLabel120 === "0"} onChange={(e) => handleFieldChange("floatLabel120", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel120" value="2" checked={formData.floatLabel120 === "2"} onChange={(e) => handleFieldChange("floatLabel120", e.target.value)} /> N/A</label>
                          </div>
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">De-energisation is not reasonably practicable?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel121" value="1" checked={formData.floatLabel121 === "1"} onChange={(e) => handleFieldChange("floatLabel121", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel121" value="0" checked={formData.floatLabel121 === "0"} onChange={(e) => handleFieldChange("floatLabel121", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel121" value="2" checked={formData.floatLabel121 === "2"} onChange={(e) => handleFieldChange("floatLabel121", e.target.value)} /> N/A</label>
                          </div>
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">Live work authorised by electrical responsible person?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel122" value="1" checked={formData.floatLabel122 === "1"} onChange={(e) => handleFieldChange("floatLabel122", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel122" value="0" checked={formData.floatLabel122 === "0"} onChange={(e) => handleFieldChange("floatLabel122", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel122" value="2" checked={formData.floatLabel122 === "2"} onChange={(e) => handleFieldChange("floatLabel122", e.target.value)} /> N/A</label>
                          </div>
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">Risk assessment has been completed?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel123" value="1" checked={formData.floatLabel123 === "1"} onChange={(e) => handleFieldChange("floatLabel123", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel123" value="0" checked={formData.floatLabel123 === "0"} onChange={(e) => handleFieldChange("floatLabel123", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel123" value="2" checked={formData.floatLabel123 === "2"} onChange={(e) => handleFieldChange("floatLabel123", e.target.value)} /> N/A</label>
                          </div>
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">Arc flash boundary and PPE evaluated?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel124" value="1" checked={formData.floatLabel124 === "1"} onChange={(e) => handleFieldChange("floatLabel124", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel124" value="0" checked={formData.floatLabel124 === "0"} onChange={(e) => handleFieldChange("floatLabel124", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel124" value="2" checked={formData.floatLabel124 === "2"} onChange={(e) => handleFieldChange("floatLabel124", e.target.value)} /> N/A</label>
                          </div>
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">Barriers and Signage in place?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel125" value="1" checked={formData.floatLabel125 === "1"} onChange={(e) => handleFieldChange("floatLabel125", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel125" value="0" checked={formData.floatLabel125 === "0"} onChange={(e) => handleFieldChange("floatLabel125", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel125" value="2" checked={formData.floatLabel125 === "2"} onChange={(e) => handleFieldChange("floatLabel125", e.target.value)} /> N/A</label>
                          </div>
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">Insulated tools and approved test equipment to be used?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel126" value="1" checked={formData.floatLabel126 === "1"} onChange={(e) => handleFieldChange("floatLabel126", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel126" value="0" checked={formData.floatLabel126 === "0"} onChange={(e) => handleFieldChange("floatLabel126", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel126" value="2" checked={formData.floatLabel126 === "2"} onChange={(e) => handleFieldChange("floatLabel126", e.target.value)} /> N/A</label>
                          </div>
                        </div>

                        <div className="checklist-item">
                          <p className="checklist-question">Work will always be carried out with a second person to assist in the event of an emergency?</p>
                          <div className="radio-group">
                            <label><input type="radio" name="floatLabel127" value="1" checked={formData.floatLabel127 === "1"} onChange={(e) => handleFieldChange("floatLabel127", e.target.value)} /> Yes</label>
                            <label><input type="radio" name="floatLabel127" value="0" checked={formData.floatLabel127 === "0"} onChange={(e) => handleFieldChange("floatLabel127", e.target.value)} /> No</label>
                            <label><input type="radio" name="floatLabel127" value="2" checked={formData.floatLabel127 === "2"} onChange={(e) => handleFieldChange("floatLabel127", e.target.value)} /> N/A</label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* pressurization starts */}
            {formData.permit_type === "Commissioning" && !shouldShowElectricianCert() && (
              <>
                <div style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "center", marginTop: "20px" }}>
                  <img src="/src/assets/images/logos/mechanical1.png" alt="mechanical1" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
                  <div className="df-field" style={{ flex: 1 }}>
                    <label className="df-label">Energization of Mechanical equipment</label>
                    <select
                      className="df-select"
                      value={formData.pressurization}
                      onChange={(e) => handleFieldChange("pressurization", e.target.value)}
                    >
                      <option value="">Select Option</option>
                      {MECHANICAL_WORKS_SELECT.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                          {tech.MechanicalWorksval}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.pressurization === "1" && (
                  <div className="conditional-fields-block" style={{ marginBottom: "20px" }}>
                    <div className="checklist-item">
                      <p className="checklist-question">Pressure test performed and approved?</p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel95" value="1" checked={formData.floatLabel95 === "1"} onChange={(e) => handleFieldChange("floatLabel95", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel95" value="0" checked={formData.floatLabel95 === "0"} onChange={(e) => handleFieldChange("floatLabel95", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel95" value="2" checked={formData.floatLabel95 === "2"} onChange={(e) => handleFieldChange("floatLabel95", e.target.value)} /> N/A</label>
                      </div>
                    </div>

                    <div className="checklist-item">
                      <p className="checklist-question">Flushing approved?</p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel96" value="1" checked={formData.floatLabel96 === "1"} onChange={(e) => handleFieldChange("floatLabel96", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel96" value="0" checked={formData.floatLabel96 === "0"} onChange={(e) => handleFieldChange("floatLabel96", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel96" value="2" checked={formData.floatLabel96 === "2"} onChange={(e) => handleFieldChange("floatLabel96", e.target.value)} /> N/A</label>
                      </div>
                    </div>

                    <div className="checklist-item">
                      <p className="checklist-question">MC approved?</p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel97" value="1" checked={formData.floatLabel97 === "1"} onChange={(e) => handleFieldChange("floatLabel97", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel97" value="0" checked={formData.floatLabel97 === "0"} onChange={(e) => handleFieldChange("floatLabel97", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel97" value="2" checked={formData.floatLabel97 === "2"} onChange={(e) => handleFieldChange("floatLabel97", e.target.value)} /> N/A</label>
                      </div>
                    </div>

                    {formData.floatLabel97 === "1" && (
                      <div className="df-field" style={{ marginTop: "12px", marginBottom: "16px", paddingLeft: "16px" }}>
                        <label className="df-label">MC Number <span className="df-required">*</span></label>
                        <input
                          type="text"
                          className="df-input"
                          placeholder="MC number Required"
                          value={formData.mc_number_text}
                          onChange={(e) => handleFieldChange("mc_number_text", e.target.value)}
                        />
                      </div>
                    )}

                    <div className="checklist-item">
                      <p className="checklist-question">Walkdown with Visual inspection performed?</p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel98" value="1" checked={formData.floatLabel98 === "1"} onChange={(e) => handleFieldChange("floatLabel98", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel98" value="0" checked={formData.floatLabel98 === "0"} onChange={(e) => handleFieldChange("floatLabel98", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel98" value="2" checked={formData.floatLabel98 === "2"} onChange={(e) => handleFieldChange("floatLabel98", e.target.value)} /> N/A</label>
                      </div>
                    </div>

                    <div className="checklist-item">
                      <p className="checklist-question">LOTO plan approved and installed by LOTO officer?</p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel99" value="1" checked={formData.floatLabel99 === "1"} onChange={(e) => handleFieldChange("floatLabel99", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel99" value="0" checked={formData.floatLabel99 === "0"} onChange={(e) => handleFieldChange("floatLabel99", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel99" value="2" checked={formData.floatLabel99 === "2"} onChange={(e) => handleFieldChange("floatLabel99", e.target.value)} /> N/A</label>
                      </div>
                    </div>

                    <div className="checklist-item">
                      <p className="checklist-question">Ensure Safety Valves follow Media Code?</p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel100" value="1" checked={formData.floatLabel100 === "1"} onChange={(e) => handleFieldChange("floatLabel100", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel100" value="0" checked={formData.floatLabel100 === "0"} onChange={(e) => handleFieldChange("floatLabel100", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel100" value="2" checked={formData.floatLabel100 === "2"} onChange={(e) => handleFieldChange("floatLabel100", e.target.value)} /> N/A</label>
                      </div>
                    </div>

                    <div className="checklist-item">
                      <p className="checklist-question">C&Q Safety signs are in place?</p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel101" value="1" checked={formData.floatLabel101 === "1"} onChange={(e) => handleFieldChange("floatLabel101", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel101" value="0" checked={formData.floatLabel101 === "0"} onChange={(e) => handleFieldChange("floatLabel101", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel101" value="2" checked={formData.floatLabel101 === "2"} onChange={(e) => handleFieldChange("floatLabel101", e.target.value)} /> N/A</label>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Pressure Testing dropdown */}
            {formData.permit_type === "Commissioning" && !shouldShowElectricianCert() && (
              <>
                <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "20px" }}>
                  <img src="/src/assets/images/logos/testingequipment.png" alt="testingequipment" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", background: "#fff" }} />
                  <div className="df-field" style={{ flex: 1 }}>
                    <label className="df-label">PRESSURE TESTING OF EQUIPMENT REQUIRED?</label>
                    <select
                      className="df-select"
                      value={formData.pressure_testing_of_equipment}
                      onChange={(e) => handleFieldChange("pressure_testing_of_equipment", e.target.value)}
                    >
                      <option value="">Select Option</option>
                      {TESTINGS_SELECT.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                          {tech.TESTINGsval}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.pressure_testing_of_equipment === "1" && (
                  <div className="conditional-fields-block" style={{ marginBottom: "20px", marginTop: "20px" }}>
                    <div className="checklist-item">
                      <p className="checklist-question">Linewalk of the pipework/equipment done?</p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel102" value="1" checked={formData.floatLabel102 === "1"} onChange={(e) => handleFieldChange("floatLabel102", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel102" value="0" checked={formData.floatLabel102 === "0"} onChange={(e) => handleFieldChange("floatLabel102", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel102" value="2" checked={formData.floatLabel102 === "2"} onChange={(e) => handleFieldChange("floatLabel102", e.target.value)} /> N/A</label>
                      </div>
                    </div>

                    <div className="checklist-item">
                      <p className="checklist-question">Pressure test is coordinated with NNE C&Q?</p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel103" value="1" checked={formData.floatLabel103 === "1"} onChange={(e) => handleFieldChange("floatLabel103", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel103" value="0" checked={formData.floatLabel103 === "0"} onChange={(e) => handleFieldChange("floatLabel103", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel103" value="2" checked={formData.floatLabel103 === "2"} onChange={(e) => handleFieldChange("floatLabel103", e.target.value)} /> N/A</label>
                      </div>
                    </div>

                    <div className="checklist-item">
                      <p className="checklist-question">Is the pipework/equipment MIC? (Mechanical Installation Complete)?</p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel104" value="1" checked={formData.floatLabel104 === "1"} onChange={(e) => handleFieldChange("floatLabel104", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel104" value="0" checked={formData.floatLabel104 === "0"} onChange={(e) => handleFieldChange("floatLabel104", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel104" value="2" checked={formData.floatLabel104 === "2"} onChange={(e) => handleFieldChange("floatLabel104", e.target.value)} /> N/A</label>
                      </div>
                    </div>

                    <div className="checklist-item">
                      <p className="checklist-question">LOTO plan attached to the work permit?</p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel105" value="1" checked={formData.floatLabel105 === "1"} onChange={(e) => handleFieldChange("floatLabel105", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel105" value="0" checked={formData.floatLabel105 === "0"} onChange={(e) => handleFieldChange("floatLabel105", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel105" value="2" checked={formData.floatLabel105 === "2"} onChange={(e) => handleFieldChange("floatLabel105", e.target.value)} /> N/A</label>
                      </div>
                    </div>

                    <div className="checklist-item">
                      <p className="checklist-question">Is the exclusion zone calculated and layout attached to work permit?</p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel106" value="1" checked={formData.floatLabel106 === "1"} onChange={(e) => handleFieldChange("floatLabel106", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel106" value="0" checked={formData.floatLabel106 === "0"} onChange={(e) => handleFieldChange("floatLabel106", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel106" value="2" checked={formData.floatLabel106 === "2"} onChange={(e) => handleFieldChange("floatLabel106", e.target.value)} /> N/A</label>
                      </div>
                    </div>

                    <div className="checklist-item">
                      <p className="checklist-question">Pneumatic Test?</p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel107" disabled={formData.floatLabel108 === "1"} value="1" checked={formData.floatLabel107 === "1"} onChange={(e) => handleFieldChange("floatLabel107", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel107" value="0" checked={formData.floatLabel107 === "0"} onChange={(e) => handleFieldChange("floatLabel107", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel107" value="2" checked={formData.floatLabel107 === "2"} onChange={(e) => handleFieldChange("floatLabel107", e.target.value)} /> N/A</label>
                      </div>
                    </div>

                    {formData.floatLabel107 === "1" && (
                      <div className="df-field" style={{ marginTop: "8px", marginBottom: "16px" }}>
                        <label className="df-label">Pressure of Pneumatic Test (in BarG)</label>
                        <input
                          type="text"
                          className="df-input"
                          placeholder="Provide the pressure value"
                          value={formData.pressure_pneumatic}
                          onChange={(e) => handleFieldChange("pressure_pneumatic", e.target.value)}
                        />
                      </div>
                    )}

                    <div className="checklist-item">
                      <p className="checklist-question">Hydrostatic test?</p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel108" disabled={formData.floatLabel107 === "1"} value="1" checked={formData.floatLabel108 === "1"} onChange={(e) => handleFieldChange("floatLabel108", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel108" value="0" checked={formData.floatLabel108 === "0"} onChange={(e) => handleFieldChange("floatLabel108", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel108" value="2" checked={formData.floatLabel108 === "2"} onChange={(e) => handleFieldChange("floatLabel108", e.target.value)} /> N/A</label>
                      </div>
                    </div>

                    {formData.floatLabel108 === "1" && (
                      <div className="df-field" style={{ marginTop: "8px", marginBottom: "16px" }}>
                        <label className="df-label">Pressure of Hydrostatic Test (in BarG)</label>
                        <input
                          type="text"
                          className="df-input"
                          placeholder="Provide the pressure value"
                          value={formData.pressure_hydrostatic}
                          onChange={(e) => handleFieldChange("pressure_hydrostatic", e.target.value)}
                        />
                      </div>
                    )}

                    <div className="checklist-item">
                      <p className="checklist-question">Safety Valves are calibrated and attached to the Pressure testing rig?</p>
                      <div className="radio-group">
                        <label><input type="radio" name="floatLabel109" value="1" checked={formData.floatLabel109 === "1"} onChange={(e) => handleFieldChange("floatLabel109", e.target.value)} /> Yes</label>
                        <label><input type="radio" name="floatLabel109" value="0" checked={formData.floatLabel109 === "0"} onChange={(e) => handleFieldChange("floatLabel109", e.target.value)} /> No</label>
                        <label><input type="radio" name="floatLabel109" value="2" checked={formData.floatLabel109 === "2"} onChange={(e) => handleFieldChange("floatLabel109", e.target.value)} /> N/A</label>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* PPE Section */}
          <div className="form-card">
            <h2 className="form-card-title">PPE Requirements</h2>

            <div style={{ marginBottom: "20px" }}>
              <label className="df-label" style={{ marginBottom: "12px" }}>Mandatory PPE Required:</label>
              <div className="ppe-mandatory-row">
                <img src="/src/assets/images/safetyIcons/HardHat.png" alt="HardHat" className="ppe-mandatory-icon" />
                <img src="/src/assets/images/safetyIcons/SpecificGloves.png" alt="SpecificGloves" className="ppe-mandatory-icon" />
                <img src="/src/assets/images/safetyIcons/Safetyshoes.png" alt="Safety Shoes" className="ppe-mandatory-icon" />
                <img src="/src/assets/images/safetyIcons/HighVisibility.png" alt="High Visibility" className="ppe-mandatory-icon" />
                <img src="/src/assets/images/safetyIcons/Longpants.png" alt="Long Pants" className="ppe-mandatory-icon" />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label className="df-label" style={{ marginBottom: "16px" }}>Task Specific PPE Required:</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <img src="/src/assets/images/safetyIcons/Eyeprotection.png" alt="Eye Protection" style={{ width: "64px", height: "64px", marginBottom: "8px" }} />
                  <span style={{ fontSize: "13px", fontWeight: "bold", color: "#fff", marginBottom: "8px" }}>Eye Protection</span>
                  <div className="radio-group">
                    <label><input type="radio" name="eye_protection" value="1" checked={formData.eye_protection === "1"} onChange={(e) => handleFieldChange("eye_protection", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="eye_protection" value="0" checked={formData.eye_protection === "0"} onChange={(e) => handleFieldChange("eye_protection", e.target.value)} /> No</label>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <img src="/src/assets/images/safetyIcons/Fallprotection.png" alt="Fall Protection" style={{ width: "64px", height: "64px", marginBottom: "8px" }} />
                  <span style={{ fontSize: "13px", fontWeight: "bold", color: "#fff", marginBottom: "8px" }}>Fall Protection</span>
                  <div className="radio-group">
                    <label><input type="radio" name="fall_protection" value="1" checked={formData.fall_protection === "1"} onChange={(e) => handleFieldChange("fall_protection", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="fall_protection" value="0" checked={formData.fall_protection === "0"} onChange={(e) => handleFieldChange("fall_protection", e.target.value)} /> No</label>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <img src="/src/assets/images/safetyIcons/Hearingprotection.png" alt="Hearing Protection" style={{ width: "64px", height: "64px", marginBottom: "8px" }} />
                  <span style={{ fontSize: "13px", fontWeight: "bold", color: "#fff", marginBottom: "8px" }}>Hearing Protection</span>
                  <div className="radio-group">
                    <label><input type="radio" name="hearing_protection" value="1" checked={formData.hearing_protection === "1"} onChange={(e) => handleFieldChange("hearing_protection", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="hearing_protection" value="0" checked={formData.hearing_protection === "0"} onChange={(e) => handleFieldChange("hearing_protection", e.target.value)} /> No</label>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <img src="/src/assets/images/safetyIcons/Respiratoryprotection.png" alt="Respiratory Protection" style={{ width: "64px", height: "64px", marginBottom: "8px" }} />
                  <span style={{ fontSize: "13px", fontWeight: "bold", color: "#fff", marginBottom: "8px" }}>Respiratory Protection</span>
                  <div className="radio-group">
                    <label><input type="radio" name="respiratory_protection" value="1" checked={formData.respiratory_protection === "1"} onChange={(e) => handleFieldChange("respiratory_protection", e.target.value)} /> Yes</label>
                    <label><input type="radio" name="respiratory_protection" value="0" checked={formData.respiratory_protection === "0"} onChange={(e) => handleFieldChange("respiratory_protection", e.target.value)} /> No</label>
                  </div>
                </div>

              </div>
            </div>

            <div className="df-field" style={{ marginTop: "16px" }}>
              <label className="df-label">Other PPE</label>
              <textarea
                className="df-textarea"
                rows={2}
                placeholder="Enter other PPE details..."
                value={formData.other_ppe}
                onChange={(e) => handleFieldChange("other_ppe", e.target.value)}
              />
            </div>

            <div className="df-field" style={{ marginTop: "16px" }}>
              <label className="df-label">Number of workers involved</label>
              <input
                type="text"
                className="df-input"
                placeholder="Enter number of workers"
                value={formData.Number_Of_Workers}
                onChange={(e) => handleFieldChange("Number_Of_Workers", e.target.value)}
              />
            </div>

            {isEditMode && notesHistory.length > 0 && (
              <div className="notes-history-section" style={{ marginTop: "16px", background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <h4 style={{ color: "#fff", marginBottom: "8px", fontSize: "14px" }}>Notes History</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "150px", overflowY: "auto" }}>
                  {notesHistory.map((n, idx) => (
                    <div key={idx} style={{ padding: "8px", background: "rgba(255,255,255,0.02)", borderRadius: "4px" }}>
                      <strong style={{ color: "#3b82f6", fontSize: "12px" }}>{n.Username}:</strong>
                      <p style={{ color: "#d1d5db", fontSize: "13px", margin: "2px 0 0 0" }}>{n.Note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="df-field" style={{ marginTop: "16px" }}>
              <label className="df-label">{isEditMode ? "Add New Note" : "Note"}</label>
              <textarea
                className="df-textarea"
                rows={3}
                placeholder="Notes...."
                value={formData.notes}
                onChange={(e) => handleFieldChange("notes", e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="df-footer" style={{ marginTop: "24px" }}>
            <button
              type="button"
              className="nr-btn nr-btn--ghost"
              onClick={() => setIsnewrequestcreated(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="nr-btn nr-btn--ghost"
              style={{ background: "#2563eb", color: "#fff", borderColor: "#2563eb", boxShadow: "0 0 18px rgba(37, 99, 235, 0.2)" }}
              onClick={(e) => handleSubmit(e, "Hold")}
            >
              Change to Hold
            </button>
            <button
              type="button"
              className="nr-btn nr-btn--primary"
              onClick={(e) => handleSubmit(e, "Draft")}
            >
              Save
            </button>
          </div>
        </form>
      </div>

    );
  }

  return (
    <div className="dept-page">
      <div className="dept-page-header">
        <div className="dept-page-header__left">
          <h1 className="dept-page-title">New Work Permit Request</h1>
        </div>
        {selectedRooms.length > 0 && (
          <div className="butns-grp-back">
            <button
              className="nr-btn nr-btn--primary"
              onClick={() => setIsnewrequestcreated(true)}
            >
              Continue to Form →
            </button>
          </div>
        )}
      </div>

      <div className="dept-table-card">
        <div className="df-form">
          <div className="df-grid">
            <div className="df-field">
              <label className="df-label">Building</label>
              <select
                className="df-select"
                value={building}
                onChange={(e) => {
                  setBuilding(e.target.value);
                  setLevel("");
                  setSelectedRooms([]);
                  setSelectedZone(null);
                }}
              >
                <option value="">Select Building</option>
                {buildingsList.map((item) => (
                  <option key={item.build_id} value={item.build_id}>
                    {item.building_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="df-field">
              <label className="df-label">Level</label>
              <select
                className="df-select"
                value={level}
                disabled={!building}
                onChange={(e) => {
                  setLevel(e.target.value);
                  setSelectedRooms([]);
                  setSelectedZone(null);
                }}
              >
                <option value="">Select Level</option>
                {levels.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {selectedPdf && (
        <div style={{ position: "relative" }}>
          <FloorDrawing
            pdf={selectedPdf}
            zones={selectedZones}
            level={level}
            selectedRooms={selectedRooms}
            onRoomsSelected={handleRoomsSelected}
          />
          {selectedRooms.length > 0 && (
            <div className="drawing-floating-action" style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
              <button
                className="nr-btn nr-btn--primary"
                style={{ height: "46px", padding: "0 32px", fontSize: "15px" }}
                onClick={() => setIsnewrequestcreated(true)}
              >
                Continue with {selectedRooms.length} Room{selectedRooms.length > 1 ? "s" : ""} selected →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NewRequest;