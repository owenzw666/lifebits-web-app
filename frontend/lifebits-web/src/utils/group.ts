import type { Note } from "../api/notesApi";

export interface NoteGroup {
  key: string;
  lat: number;
  lng: number;
  notes: Note[];
}

export const groupByLocation = (notes: Note[]): NoteGroup[] => {
  const map = new Map<string, NoteGroup>();

  notes.forEach((n) => {
    //control accuracy
    const lat = Number(n.lat.toFixed(5));
    const lng = Number(n.lng.toFixed(5));
    const key = `${lat}-${lng}`;

    //If a key-NoteGroup dictionary has not been created for this location yet, create a new one
    if (!map.has(key)) {
      map.set(key, {
        key,
        lat,
        lng,
        notes: [],
      });
    }

    //Add the note to this group
    map.get(key)!.notes.push(n);
  });

  return Array.from(map.values()).map((g)=>({
    ...g,
    notes:g.notes.sort(
        (a,b)=>
            new Date(b.eventTime).getTime() -
            new Date(a.eventTime).getTime()
    ),
  }));
};
