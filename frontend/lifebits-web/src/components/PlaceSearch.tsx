import { useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  searchPlacesApi,
  type MapCenter,
  type PlaceSearchResult,
} from "../api/placesApi";

interface PlaceSearchProps {
  mapCenter: MapCenter;
  selectedResult: PlaceSearchResult | null;
  onSelectResult: (result: PlaceSearchResult) => void;
  onClearSelection: () => void;
  onAddNote: (result: PlaceSearchResult) => void;
}

const PlaceSearch = ({
  mapCenter,
  selectedResult,
  onSelectResult,
  onClearSelection,
  onAddNote,
}: PlaceSearchProps) => {
  const requestIdRef = useRef(0);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      setResults([]);
      setMessage("Enter at least 2 characters");
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsSearching(true);
    setMessage(null);

    try {
      const nextResults = await searchPlacesApi(normalizedQuery, mapCenter);

      // Ignore an older response if the user has already started another search.
      if (requestId !== requestIdRef.current) return;

      setResults(nextResults);
      setMessage(nextResults.length === 0 ? "No places found" : null);
    } catch (error) {
      console.error(error);

      if (requestId !== requestIdRef.current) return;

      setResults([]);
      setMessage("Could not search places");
    } finally {
      if (requestId === requestIdRef.current) {
        setIsSearching(false);
      }
    }
  };

  const handleClear = () => {
    requestIdRef.current += 1;
    setQuery("");
    setResults([]);
    setMessage(null);
    setIsSearching(false);
    onClearSelection();
  };

  const handleSelect = (result: PlaceSearchResult) => {
    setQuery(result.name);
    setResults([]);
    setMessage(null);
    onSelectResult(result);
  };

  return (
    <section
      aria-label="Search the map"
      style={{
        position: "absolute",
        top: 12,
        left: "50%",
        zIndex: 12,
        width: "min(520px, calc(100% - 96px))",
        transform: "translateX(-50%)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          minHeight: 46,
          overflow: "hidden",
          border: "1px solid #d1d5db",
          borderRadius: 8,
          background: "#ffffff",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.18)",
        }}
      >
        <input
          aria-label="Search for a place"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setMessage(null);

            if (selectedResult) {
              onClearSelection();
            }
          }}
          placeholder="Search address or place"
          autoComplete="off"
          style={{
            minWidth: 0,
            flex: 1,
            padding: "0 14px",
            border: "none",
            outline: "none",
            color: "#111827",
            background: "transparent",
            fontSize: 15,
          }}
        />

        {query && (
          <button
            type="button"
            aria-label="Clear search"
            title="Clear search"
            onClick={handleClear}
            style={iconButtonStyle}
          >
            x
          </button>
        )}

        <button
          type="submit"
          disabled={isSearching}
          style={{
            minWidth: 78,
            padding: "0 16px",
            border: "none",
            borderLeft: "1px solid #e5e7eb",
            background: isSearching ? "#e5e7eb" : "#111827",
            color: isSearching ? "#6b7280" : "#ffffff",
            cursor: isSearching ? "wait" : "pointer",
            fontWeight: 700,
          }}
        >
          {isSearching ? "Searching" : "Search"}
        </button>
      </form>

      {(results.length > 0 || message) && (
        <div
          role="region"
          aria-label="Place search results"
          style={{
            marginTop: 6,
            overflow: "hidden",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: "#ffffff",
            boxShadow: "0 12px 28px rgba(15, 23, 42, 0.2)",
          }}
        >
          {message ? (
            <div style={{ padding: "13px 14px", color: "#6b7280", fontSize: 14 }}>
              {message}
            </div>
          ) : (
            results.map((result, index) => (
              <button
                key={`${result.longitude}-${result.latitude}-${index}`}
                type="button"
                onClick={() => handleSelect(result)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "11px 14px",
                  border: "none",
                  borderBottom:
                    index < results.length - 1 ? "1px solid #e5e7eb" : "none",
                  background: "#ffffff",
                  color: "#111827",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <strong
                  style={{
                    display: "block",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: 14,
                  }}
                >
                  {result.name}
                </strong>
                <span
                  style={{
                    display: "block",
                    marginTop: 3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: "#6b7280",
                    fontSize: 12,
                  }}
                >
                  {result.displayName}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {selectedResult && results.length === 0 && !message && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 6,
            padding: "10px 10px 10px 14px",
            border: "1px solid #d1fae5",
            borderRadius: 8,
            background: "#ffffff",
            boxShadow: "0 10px 24px rgba(15, 23, 42, 0.18)",
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <strong
              style={{
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "#111827",
                fontSize: 14,
              }}
            >
              {selectedResult.name}
            </strong>
            <span
              style={{
                display: "block",
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "#6b7280",
                fontSize: 12,
              }}
            >
              {selectedResult.displayName}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onAddNote(selectedResult)}
            style={{
              flex: "0 0 auto",
              minHeight: 38,
              padding: "8px 12px",
              border: "none",
              borderRadius: 7,
              background: "#047857",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Add note here
          </button>
        </div>
      )}
    </section>
  );
};

const iconButtonStyle = {
  width: 42,
  minWidth: 42,
  border: "none",
  background: "#ffffff",
  color: "#6b7280",
  cursor: "pointer",
  fontSize: 24,
  lineHeight: 1,
} as const;

export default PlaceSearch;
