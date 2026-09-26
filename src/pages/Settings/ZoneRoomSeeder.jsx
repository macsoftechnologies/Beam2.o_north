import React, { useState } from "react";
import { ZONE_MAPPING } from "../../data/zones";
import { getFloors, addZone, addRoom } from "../../services/authService";
import "../styles/pages.css";

/**
 * ZoneRoomSeeder
 * ──────────────
 * Admin-only utility page that seeds zones and rooms from zones.js into
 * the database.
 *
 * Logic:
 *  1. Fetch all floors from the DB (with fl_id, floor_name, build_id).
 *  2. For each key in ZONE_MAPPING (optionally filtered to JF2/JS only):
 *       a. Look up the DB floor using the key (or a remapped key).
 *       b. For each zone object in that floor's array:
 *            i.  POST /zones  { building_id, floor_id, level, zone, status:"UC" }
 *            ii. For each room in zone.rooms:
 *                 POST /rooms { building_id, fl_id, zone_id, room_name }
 *
 * KEY MISMATCH FIX:
 *   zones.js uses "JS" as the floor key, but the DB floor_name is "JS-ZoneJS".
 *   KEY_REMAP below handles this translation automatically.
 */

// Maps ZONE_MAPPING key → actual floor_name in the DB where they differ
const KEY_REMAP = {
  "JS": "JS-ZoneJS",
};

// Which ZONE_MAPPING keys belong to JF2 and JS buildings
const JF2_JS_KEYS = new Set([
  "JF2-Ground Floor",
  "JF2-1st Floor",
  "JF2-2nd Floor",
  "JF2-3rd Floor",
  "JF2-4th Floor",
  "JF2-Roof Plan",
  "JS",
]);

const ZoneRoomSeeder = () => {
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState({ zones: 0, rooms: 0, errors: 0 });
  // Mode: "all" = all floors, "jf2js" = only JF2 + JS
  const [mode, setMode] = useState("jf2js");

  const appendLog = (msg, type = "info") => {
    setLog((prev) => [...prev, { msg, type, ts: new Date().toLocaleTimeString() }]);
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const handleSeed = async () => {
    if (running) return;
    setLog([]);
    setDone(false);
    setStats({ zones: 0, rooms: 0, errors: 0 });
    setRunning(true);

    let totalZones = 0;
    let totalRooms = 0;
    let totalErrors = 0;

    try {
      // Step 1: fetch all floors from DB
      appendLog("Fetching floors from database...", "info");
      const floorsRes = await getFloors(1, 5000);
      const allFloors = floorsRes?.data ?? floorsRes ?? [];
      appendLog(`Loaded ${allFloors.length} floor(s) from DB.`, "success");

      // Build lookup: floor_name -> { fl_id, build_id }
      const floorByName = {};
      allFloors.forEach((f) => {
        floorByName[f.floor_name] = f;
      });

      // Step 2: determine which keys to process
      const allKeys = Object.keys(ZONE_MAPPING);
      const keysToProcess = mode === "jf2js"
        ? allKeys.filter((k) => JF2_JS_KEYS.has(k))
        : allKeys;

      appendLog(
        `Mode: ${mode === "jf2js" ? "JF2 + JS only" : "All floors"} — processing ${keysToProcess.length} floor key(s).`,
        "info"
      );

      for (const floorKey of keysToProcess) {
        // Resolve the actual DB floor name (handle key remaps like "JS" → "JS-ZoneJS")
        const dbFloorName = KEY_REMAP[floorKey] ?? floorKey;
        const dbFloor = floorByName[dbFloorName];

        if (!dbFloor) {
          appendLog(
            `WARNING: No DB floor matching "${dbFloorName}" (zone key: "${floorKey}") — skipping.`,
            "warn"
          );
          totalErrors++;
          continue;
        }

        const { fl_id, build_id } = dbFloor;
        appendLog(
          `\nFloor: "${floorKey}" → DB floor_name="${dbFloorName}", fl_id=${fl_id}, build_id=${build_id}`,
          "info"
        );

        const zonesArray = ZONE_MAPPING[floorKey];

        for (const zoneObj of zonesArray) {
          const zoneName = zoneObj.name;

          // Step 2a: add zone
          let newZoneId = null;
          try {
            const zonePayload = {
              building_id: Number(build_id),
              floor_id: Number(fl_id),
              level: dbFloorName,        // use the DB floor name as level
              zone: zoneName,
              status: "UC",
            };
            const zoneRes = await addZone(zonePayload);
            newZoneId =
              zoneRes?.id ??
              zoneRes?.zoneStatusId ??
              zoneRes?.data?.id ??
              zoneRes?.data?.zoneStatusId ??
              null;

            totalZones++;
            appendLog(`  [OK] Zone: "${zoneName}" (id=${newZoneId})`, "success");
          } catch (err) {
            const msg = err?.response?.data?.message ?? err?.message ?? "Unknown error";
            appendLog(`  [FAIL] Zone "${zoneName}" — ${msg}`, "error");
            totalErrors++;
            continue;
          }

          if (!newZoneId) {
            appendLog(
              `  WARNING: Zone "${zoneName}" added but no ID returned — rooms skipped.`,
              "warn"
            );
            totalErrors++;
            continue;
          }

          // Step 2b: add rooms
          const rooms = zoneObj.rooms ?? [];
          for (const room of rooms) {
            const roomName = room.name;
            try {
              const roomPayload = {
                building_id: Number(build_id),
                fl_id: Number(fl_id),
                zone_id: Number(newZoneId),
                room_name: roomName,
              };
              await addRoom(roomPayload);
              totalRooms++;
              appendLog(`    [OK] Room: "${roomName}"`, "success");
            } catch (err) {
              const msg = err?.response?.data?.message ?? err?.message ?? "Unknown error";
              appendLog(`    [FAIL] Room "${roomName}" — ${msg}`, "error");
              totalErrors++;
            }
            await sleep(50);
          }

          await sleep(100);
        }
      }
    } catch (err) {
      appendLog(`Fatal error: ${err?.message ?? err}`, "error");
      totalErrors++;
    }

    setStats({ zones: totalZones, rooms: totalRooms, errors: totalErrors });
    appendLog(
      `\nDONE — Zones: ${totalZones}, Rooms: ${totalRooms}, Errors: ${totalErrors}`,
      "done"
    );
    setDone(true);
    setRunning(false);
  };

  const logTypeStyle = {
    info: { color: "#93c5fd" },
    success: { color: "#86efac" },
    warn: { color: "#fde68a" },
    error: { color: "#fca5a5" },
    done: { color: "#a78bfa", fontWeight: "bold" },
  };

  return (
    <div className="dept-page">
      {/* Header */}
      <div className="dept-page-header">
        <div className="dept-page-header__left">
          <h1 className="dept-page-title">Zone &amp; Room Seeder</h1>
          <p className="dept-page-subtitle">
            Seeds zones and rooms from <code>zones.js</code> into the database
            with status <strong>UC</strong> (Construction).
          </p>
        </div>
        <div className="dept-page-header__right">
          {done && (
            <span className="dept-count-badge" style={{ background: "#7c3aed" }}>
              {stats.zones} zones &middot; {stats.rooms} rooms &middot; {stats.errors} errors
            </span>
          )}
        </div>
      </div>

      {/* Warning banner */}
      <div
        className="dept-table-card"
        style={{
          marginBottom: 16,
          padding: "14px 24px",
          borderLeft: "4px solid #f59e0b",
          background: "rgba(245,158,11,0.08)",
        }}
      >
        <p style={{ margin: 0, color: "#fde68a", fontSize: "0.9rem" }}>
          &#9888; Only run this once per floor group. Running twice will create
          duplicate entries. The <strong>JS key fix</strong> is applied
          automatically: <code>"JS"</code> in zones.js maps to{" "}
          <code>"JS-ZoneJS"</code> in the database.
        </p>
      </div>

      {/* Mode selector + button */}
      <div
        className="dept-table-card"
        style={{ marginBottom: 16, padding: "16px 24px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}
      >
        {/* Mode radio buttons */}
        <div style={{ display: "flex", gap: 24 }}>
          <label style={{ color: "#e2e8f0", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="radio"
              value="jf2js"
              checked={mode === "jf2js"}
              onChange={() => setMode("jf2js")}
              disabled={running}
            />
            JF2 &amp; JS only <span style={{ color: "#86efac", fontSize: "0.8rem" }}>(recommended)</span>
          </label>
          <label style={{ color: "#e2e8f0", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="radio"
              value="all"
              checked={mode === "all"}
              onChange={() => setMode("all")}
              disabled={running}
            />
            All floors
          </label>
        </div>

        <button
          className="dept-add-btn"
          onClick={handleSeed}
          disabled={running}
          style={{
            background: running
              ? "rgba(99,102,241,0.4)"
              : "linear-gradient(135deg,#7c3aed,#4f46e5)",
            border: "none",
            cursor: running ? "not-allowed" : "pointer",
            fontSize: "1rem",
            padding: "10px 28px",
          }}
        >
          {running
            ? "Seeding in progress..."
            : mode === "jf2js"
            ? "Seed JF2 & JS Data"
            : "Seed All Data"}
        </button>
      </div>

      {/* What will be seeded info box */}
      {mode === "jf2js" && !running && (
        <div
          className="dept-table-card"
          style={{ marginBottom: 16, padding: "14px 24px", background: "rgba(14,165,233,0.06)", borderLeft: "4px solid #0ea5e9" }}
        >
          <p style={{ margin: "0 0 8px", color: "#7dd3fc", fontWeight: 600 }}>
            Will seed the following floor keys:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[...JF2_JS_KEYS].map((k) => (
              <span
                key={k}
                style={{
                  background: "rgba(14,165,233,0.15)",
                  border: "1px solid rgba(14,165,233,0.3)",
                  borderRadius: 6,
                  padding: "2px 10px",
                  color: "#7dd3fc",
                  fontSize: "0.82rem",
                  fontFamily: "monospace",
                }}
              >
                {k === "JS" ? "JS → JS-ZoneJS (remapped)" : k}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Log output */}
      {log.length > 0 && (
        <div
          className="dept-table-card"
          style={{
            padding: "16px 24px",
            fontFamily: "monospace",
            fontSize: "0.82rem",
            maxHeight: "60vh",
            overflowY: "auto",
            background: "#0f172a",
            border: "1px solid rgba(99,102,241,0.3)",
          }}
        >
          {log.map((entry, i) => (
            <div key={i} style={{ ...logTypeStyle[entry.type], marginBottom: 2 }}>
              <span style={{ color: "#64748b", marginRight: 8 }}>[{entry.ts}]</span>
              {entry.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ZoneRoomSeeder;
