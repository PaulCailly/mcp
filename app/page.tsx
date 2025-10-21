"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useWidgetProps,
  useMaxHeight,
  useDisplayMode,
  useRequestDisplayMode,
  useIsChatGptApp,
} from "./hooks";

export default function Home() {
  const toolOutput = useWidgetProps<{
    name?: string;
    result?: {
      structuredContent?: {
        name?: string;
        results?: Array<{
          id: number;
          title: string;
          title_short: string;
          link: string;
          duration: number;
          preview: string;
          artist?: { name: string; link: string };
          album?: { title: string; cover: string };
        }>;
      };
    };
  }>();
  const maxHeight = useMaxHeight() ?? undefined;
  const displayMode = useDisplayMode();
  const requestDisplayMode = useRequestDisplayMode();
  const isChatGptApp = useIsChatGptApp();

  const name = toolOutput?.result?.structuredContent?.name || toolOutput?.name;
  const results = toolOutput?.result?.structuredContent?.results || [];

  return (
    <div
      className="font-sans p-8"
      style={{
        maxHeight,
        height: displayMode === "fullscreen" ? maxHeight : undefined,
        overflowY: "auto",
      }}
    >
      {displayMode !== "fullscreen" && (
        <button
          aria-label="Enter fullscreen"
          className="fixed top-4 right-4 z-50 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-lg ring-1 ring-slate-900/10 dark:ring-white/10 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          onClick={() => requestDisplayMode("fullscreen")}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
            />
          </svg>
        </button>
      )}

      <main className="w-full max-w-4xl mx-auto">
        {name && (
          <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded">
            <h2 className="text-lg font-semibold">{name}</h2>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((track: any) => (
              <div
                key={track.id}
                className="p-3 border border-slate-200 dark:border-slate-700 rounded flex gap-3"
              >
                {track.album?.cover_medium && (
                  <img
                    src={track.album.cover_medium}
                    alt={track.album.title}
                    className="w-12 h-12 rounded flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                    {track.title}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 truncate">
                    {track.artist?.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500">
                    {track.album?.title && `${track.album.title} • `}
                    {Math.floor(track.duration / 60)}:
                    {String(track.duration % 60).padStart(2, "0")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isChatGptApp && (
          <div className="mt-8 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              This app relies on data from a ChatGPT session.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
