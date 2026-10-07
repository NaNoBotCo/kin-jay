// node render.mjs [--stills t1,t2,...] [--fps 30]
// Steps stage.html frame by frame into ffmpeg, then lays audio/kin-jay.wav under it.
import { launch } from "./cdp.mjs";
import { spawn } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const FPS = Number(arg("--fps", 30));
const stills = arg("--stills", null);
const silent = "out/kin-jay-reel-silent.mp4", out = "out/kin-jay-reel.mp4", wav = "out/kin-jay.wav";
mkdirSync("out/stills", { recursive: true });

const t = await launch({ port: 9391 });
await t.size(1080, 1920, false, 1);
await t.go(pathToFileURL(resolve("stage.html")).href, 1500);
for (let i = 0; i < 200 && !(await t.eval("window.READY === true")); i++) await new Promise((r) => setTimeout(r, 100));
const total = await t.eval("stage.build()");

if (stills) {
  for (const s of stills.split(",")) { await t.eval(`stage.render(${Number(s)})`); await t.shot(`out/stills/${s}.png`); }
  t.close(); process.exit(0);
}

const N = Math.round(total * FPS);
const run = (args) => new Promise((ok, bad) => { const p = spawn("ffmpeg", args, { stdio: ["pipe", "inherit", "inherit"] }); p.on("close", (c) => c ? bad(new Error("ffmpeg " + c)) : ok()); return p; });
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
  "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
  "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", silent], { stdio: ["pipe", "inherit", "inherit"] });
const started = Date.now();
for (let f = 0; f < N; f++) {
  await t.eval(`stage.render(${f / FPS})`);
  const buf = await t.shot(null, { format: "jpeg", quality: 92 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  if (f % 150 === 0) console.log(`${f}/${N} ${((Date.now() - started) / 1000).toFixed(0)}s`);
}
ff.stdin.end();
await new Promise((r) => ff.on("close", r));
t.close();
if (existsSync(wav)) {
  await run(["-y", "-loglevel", "error", "-i", silent, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
    "-af", "loudnorm=I=-14:TP=-1.5:LRA=9", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", "-movflags", "+faststart", out]);
  console.log("wrote", out);
} else console.log("wrote", silent, "(no audio yet)");
console.log(((Date.now() - started) / 1000).toFixed(0), "s");
process.exit(0);
