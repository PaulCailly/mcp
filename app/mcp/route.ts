import { baseURL } from "@/baseUrl";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const getAppsSdkCompatibleHtml = async (baseUrl: string, path: string) => {
  const result = await fetch(`${baseUrl}${path}`);
  return await result.text();
};

type ContentWidget = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  html: string;
  description: string;
  widgetDomain: string;
};

function widgetMeta(widget: ContentWidget) {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": false,
    "openai/resultCanProduceWidget": true,
  } as const;
}

const handler = createMcpHandler(async (server: any) => {
  const html = await getAppsSdkCompatibleHtml(baseURL, "/");

  const contentWidget: ContentWidget = {
    id: "show_content",
    title: "Show Content",
    templateUri: "ui://widget/content-template.html",
    invoking: "Loading content...",
    invoked: "Content loaded",
    html: html,
    description: "Displays the homepage content",
    widgetDomain: "https://nextjs.org/docs",
  };
  server.registerResource(
    "content-widget",
    contentWidget.templateUri,
    {
      title: contentWidget.title,
      description: contentWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": contentWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri: any) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${contentWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": contentWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": contentWidget.widgetDomain,
          },
        },
      ],
    })
  );

  server.registerTool(
    contentWidget.id,
    {
      title: contentWidget.title,
      description:
        "Fetch and display the homepage content with the name of the user",
      inputSchema: {
        name: z
          .string()
          .describe("The name of the user to display on the homepage"),
      },
      _meta: widgetMeta(contentWidget),
    },
    async ({ name }: { name: string }) => {
      return {
        content: [
          {
            type: "text",
            text: name,
          },
        ],
        structuredContent: {
          name: name,
          timestamp: new Date().toISOString(),
        },
        _meta: widgetMeta(contentWidget),
      };
    }
  );

  server.registerTool(
    "deezer_search",
    {
      title: "Deezer Search",
      description:
        "Search Deezer tracks by query string and return a list of results",
      inputSchema: {
        query: z
          .string()
          .describe("Search query to send to Deezer's search API"),
      },
      _meta: widgetMeta(contentWidget),
    },
    async ({ query }: { query: string }) => {
      const url = `https://api.deezer.com/search?q=${encodeURIComponent(
        String(query ?? "")
      )}&limit=100`;

      try {
        const response = await fetch(url, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = (await response.json()) as {
          data?: any[];
          total?: number;
          next?: string;
        };

        const rawItems = Array.isArray(json?.data) ? json.data : [];

        const results = rawItems.map((t: any) => ({
          id: t?.id,
          readable: t?.readable,
          title: t?.title,
          title_short: t?.title_short,
          title_version: t?.title_version,
          link: t?.link,
          duration: t?.duration,
          rank: t?.rank,
          explicit_lyrics: t?.explicit_lyrics,
          preview: t?.preview,
          artist: t?.artist
            ? {
                id: t.artist.id,
                name: t.artist.name,
                link: t.artist.link,
                picture: t.artist.picture,
                picture_small: t.artist.picture_small,
                picture_medium: t.artist.picture_medium,
                picture_big: t.artist.picture_big,
                picture_xl: t.artist.picture_xl,
              }
            : null,
          album: t?.album
            ? {
                id: t.album.id,
                title: t.album.title,
                cover: t.album.cover,
                cover_small: t.album.cover_small,
                cover_medium: t.album.cover_medium,
                cover_big: t.album.cover_big,
                cover_xl: t.album.cover_xl,
              }
            : null,
        }));

        const summary = `Found ${results.length} track(s) for "${String(
          query ?? ""
        )}"`;

        return {
          content: [
            {
              type: "text",
              text: summary,
            },
          ],
          structuredContent: {
            name: summary,
            query,
            results,
            total: json?.total ?? results.length,
          },
          _meta: widgetMeta(contentWidget),
        };
      } catch (error: any) {
        const message = `Search failed for "${String(query ?? "")}"`;
        return {
          content: [
            {
              type: "text",
              text: `${message}: ${error?.message ?? "Unknown error"}`,
            },
          ],
          structuredContent: {
            name: message,
            query,
            results: [],
            total: 0,
          },
          _meta: widgetMeta(contentWidget),
        };
      }
    }
  );
});

export const GET = handler;
export const POST = handler;
