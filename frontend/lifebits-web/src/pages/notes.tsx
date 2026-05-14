import { useEffect, useState } from "react";
import { getNotesApi } from "../api/notesApi";
import MapView from "../components/MapView";
import type {
  GeoJsonFeature,
  GeoJsonFeatureCollection,
} from "../types/geojson";

const Notes = () => {
  // type SidebarMode = "all" | "location";

  const [selectedFeature, setSelectedFeature] = useState<GeoJsonFeature | null>(
    null,
  );
  const [filter, setFilter] = useState<"all" | "today" | "month">("all");

  // //Sidebar view mode status
  // const [sidebarMode, setSiderbarMode] = useState<SidebarMode>("all");

  //记录记事
  const [featuresGeoJson, setFeaturesGeoJson] =
    useState<GeoJsonFeatureCollection>({
      type: "FeatureCollection",
      features: [],
    });

  //获取所有记事
  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const data = await getNotesApi();

        setFeaturesGeoJson(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchFeatures();
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("token");
      window.location.href = "/login";
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ width: "30%", overflowY: "auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px",
          }}
        >
          {/* {sidebarMode === "location" && (
            <button
              onClick={() => {
                setSiderbarMode("all");
                setSelectedGroupId(null);
              }}
            >
              ← Back
            </button>
          )} */}
          {/* <h2 style={{ margin: 0 }}>
            {sidebarMode === "all"
              ? "My Notes"
              : `📍 ${selectedGroup?.notes.length} notes`}
          </h2> */}
          <button
            onClick={handleLogout}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>

        <div style={{ display: "flex", gap: "8px", padding: "0 10px 10px" }}>
          {["all", "today", "month"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                background: filter === f ? "#2563eb" : "#eee",
                color: filter === f ? "#fff" : "#333",
              }}
            >
              {f}
            </button>
          ))}
        </div>
        
        {selectedFeature && (
          <div>
            <h3>{selectedFeature.properties.title}</h3>

            <p>{selectedFeature.properties.content}</p>
          </div>
        )}

      </div>
      <div style={{ width: "70%" }}>
        <MapView
          featuresGeoJson={featuresGeoJson}
          selectedFeature={selectedFeature}
          onSelectFeature={setSelectedFeature}
        />
      </div>
    </div>
  );
};

export default Notes;
