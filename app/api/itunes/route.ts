import { NextResponse } from "next/server";

const SEARCH_QUERY = "NieR Automata Fortress of Lies";
const ITUNES_URL = `https://itunes.apple.com/search?term=${encodeURIComponent(SEARCH_QUERY)}&media=music&limit=1`;

// hardcoded fallback so music works even when the iTunes API is unreachable
const FALLBACK_RESULT = {
  trackName: "Fortress of Lies",
  artistName: "Keiichi Okabe",
  collectionName: "NieR:Automata Original Soundtrack",
  artworkUrl100: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/8c/5a/08/8c5a08f3-c1c3-c498-9553-3e7fbc8c7c6b/source/100x100bb.jpg",
  previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/0f/c8/65/0fc86547-a429-4a1e-3284-1be88afba361/mzaf_5765506857912006034.plus.aac.p.m4a",
  trackViewUrl: "https://music.apple.com/album/fortress-of-lies/1521281798?i=1521281805"
};

export async function GET() {
  try {
    const res = await fetch(ITUNES_URL, { next: { revalidate: 86400 } });

    if (!res.ok) {
      return NextResponse.json({ results: [FALLBACK_RESULT] });
    }

    const data = await res.json();

    if (!data.results?.length) {
      return NextResponse.json({ results: [FALLBACK_RESULT] });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ results: [FALLBACK_RESULT] });
  }
}
