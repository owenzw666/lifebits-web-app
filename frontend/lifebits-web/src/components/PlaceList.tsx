import { formatDisplayTime } from "../utils/time";
import type { PlaceFeature } from "../types/geojson";

interface Props {
  places: PlaceFeature[];
  selectedPlaceId?: number;
  onSelectPlace: (placeId: number) => void;
}

const PlaceList = ({ places, selectedPlaceId, onSelectPlace }: Props) => {
  if (places.length === 0) {
    return (
      <div style={{ padding: "24px 16px", color: "#6b7280" }}>
        Click the map to create your first place.
      </div>
    );
  }

  return (
    <div style={{ padding: "8px 10px 16px" }}>
      {places.map((place) => {
        const isActive = selectedPlaceId === place.properties.placeId;
        const placeName =
          place.properties.name || `Place #${place.properties.placeId}`;

        return (
          <button
            key={place.properties.placeId}
            onClick={() => onSelectPlace(place.properties.placeId)}
            style={{
              width: "100%",
              textAlign: "left",
              display: "block",
              marginBottom: "8px",
              padding: "12px",
              border: `1px solid ${isActive ? "#2563eb" : "#e5e7eb"}`,
              borderRadius: "8px",
              background: isActive ? "#eff6ff" : "#ffffff",
              color: "#111827",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "8px",
                alignItems: "center",
              }}
            >
              <strong style={{ fontSize: "14px" }}>{placeName}</strong>
              <span style={{ fontSize: "12px", color: "#2563eb" }}>
                {place.properties.noteCount} notes
              </span>
            </div>

            {place.properties.latestEventTime && (
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "12px",
                  color: "#6b7280",
                }}
              >
                Latest: {formatDisplayTime(place.properties.latestEventTime)}
              </div>
            )}

            {place.properties.notes[0] && (
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "13px",
                  color: "#4b5563",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {place.properties.notes[0].title ||
                  place.properties.notes[0].content}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default PlaceList;
