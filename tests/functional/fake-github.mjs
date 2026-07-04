// Faux GitHub Contents API en mémoire, pour les tests fonctionnels.
//
// Reproduit le sous-ensemble exact du contrat utilisé par l'app :
// - GET    /repos/:owner/:repo/contents/<path>?ref=<branch>  → { content, sha } | 404
// - PUT    /repos/:owner/:repo/contents/<path>               → { content: { sha } } (201/200)
// - DELETE /repos/:owner/:repo/contents/<path>               → 200 | 404 | 409
//
// Les règles de sha suivent le comportement GitHub attendu par server/ :
// PUT sans sha sur un fichier existant → 422 ; sha périmé → 409/422 ;
// DELETE avec sha périmé → 409.

import { createHash } from "node:crypto";
import http from "node:http";

export function createFakeGitHub() {
  /** @type {Map<string, { contentBase64: string, sha: string }>} */
  const files = new Map();
  let commitCounter = 0;

  function computeSha(contentBase64) {
    commitCounter += 1;
    return createHash("sha1").update(`${commitCounter}:${contentBase64}`).digest("hex");
  }

  function parsePath(url) {
    // /repos/<owner>/<repo>/contents/<path...>
    const match = url.pathname.match(/^\/repos\/[^/]+\/[^/]+\/contents\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  function sendJson(res, status, body) {
    const payload = JSON.stringify(body);
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
    });
    res.end(payload);
  }

  async function readBody(req) {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const raw = Buffer.concat(chunks).toString("utf8");
    return raw ? JSON.parse(raw) : {};
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      const filePath = parsePath(url);

      if (!filePath) {
        sendJson(res, 404, { message: "Not Found" });
        return;
      }

      if (req.method === "GET") {
        const file = files.get(filePath);
        if (!file) {
          sendJson(res, 404, { message: "Not Found" });
          return;
        }
        sendJson(res, 200, {
          content: file.contentBase64,
          sha: file.sha,
          encoding: "base64",
          path: filePath,
        });
        return;
      }

      if (req.method === "PUT") {
        const body = await readBody(req);
        const existing = files.get(filePath);

        if (existing && !body.sha) {
          // GitHub : écrire par-dessus un fichier existant sans sha → 422.
          sendJson(res, 422, { message: `sha wasn't supplied for ${filePath}` });
          return;
        }
        if (existing && body.sha !== existing.sha) {
          sendJson(res, 409, { message: `${filePath} does not match ${body.sha}` });
          return;
        }
        if (!existing && body.sha) {
          sendJson(res, 422, { message: `${filePath} does not exist` });
          return;
        }

        const sha = computeSha(body.content ?? "");
        files.set(filePath, { contentBase64: body.content ?? "", sha });
        sendJson(res, existing ? 200 : 201, { content: { sha } });
        return;
      }

      if (req.method === "DELETE") {
        const body = await readBody(req);
        const existing = files.get(filePath);
        if (!existing) {
          sendJson(res, 404, { message: "Not Found" });
          return;
        }
        if (body.sha !== existing.sha) {
          sendJson(res, 409, { message: `${filePath} does not match ${body.sha}` });
          return;
        }
        files.delete(filePath);
        sendJson(res, 200, { content: null });
        return;
      }

      sendJson(res, 405, { message: "Method Not Allowed" });
    } catch (error) {
      sendJson(res, 500, { message: String(error) });
    }
  });

  return {
    files,
    server,
    /** Contenu décodé (JSON) d'un fichier stocké, ou null. */
    readJson(filePath) {
      const file = files.get(filePath);
      if (!file) {
        return null;
      }
      return JSON.parse(Buffer.from(file.contentBase64, "base64").toString("utf8"));
    },
    listen(port = 0) {
      return new Promise((resolve) => {
        server.listen(port, "127.0.0.1", () => {
          resolve(server.address().port);
        });
      });
    },
    close() {
      return new Promise((resolve) => server.close(resolve));
    },
  };
}
