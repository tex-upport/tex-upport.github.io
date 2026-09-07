import http from "node:http";
import { readFile } from "node:fs/promises";

const files = new Map([
  ["/", ["index.html", "text/html"]],
  ...["index.html", "tutors.html", "booking.html", "admin.html"].map((file) => [
    `/${file}`,
    [file, "text/html"],
  ]),
  ["/styles.css", ["styles.css", "text/css"]],
  ["/app.js", ["app.js", "text/javascript"]],
  ["/assets/tutor-portraits.png", ["assets/tutor-portraits.png", "image/png"]],
]);
http
  .createServer(async (request, response) => {
    const file = files.get(new URL(request.url, "http://127.0.0.1").pathname);
    if (!file) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    try {
      const content = await readFile(new URL(file[0], import.meta.url));
      response.writeHead(200, {
        "Content-Type": `${file[1]}${file[1].startsWith("text/") ? "; charset=utf-8" : ""}`,
        "Cache-Control": "no-store",
      });
      response.end(content);
    } catch {
      response.writeHead(500);
      response.end("Could not load page");
    }
  })
  .listen(4173, "127.0.0.1", () =>
    console.log("ABC Tutoring preview: http://127.0.0.1:4173"),
  );
