import { Client } from "revolt.js";
let client = new Client();

import { config } from "dotenv";
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), ".env") });

const { messages } = JSON.parse(readFileSync(new URL("./messages.json", import.meta.url)));
import { random } from "./utils/misc.js";

// path stuff
import { readdir } from "fs/promises";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
// fancy loggings
import { log, error } from "./utils/logger.js";
// initialize command loader
import { load } from "./utils/handler.js";
import database from "./utils/database.js";

database.upgrade().then(result => {
  if (result === 1) return process.exit(1);
});

async function* getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const name = dir + (dir.charAt(dir.length - 1) !== "/" ? "/" : "") + dirent.name;
    if (dirent.isDirectory()) {
      yield* getFiles(name);
    } else if (dirent.name.endsWith(".js")) {
      yield name;
    }
  }
}

log("info", "Attempting to load commands...");
for await (const commandFile of getFiles(resolve(dirname(fileURLToPath(import.meta.url)), "./commands/"))) {
  log("log", `Loading command from ${commandFile}...`);
  try {
    await load(commandFile);
  } catch (e) {
    error(`Failed to register command from ${commandFile}: ${e}`);
  }
}

// register events
log("info", "Attempting to load events...");
// for await (const file of getFiles(resolve(dirname(fileURLToPath(import.meta.url)), "./revoltevents/"))) {
//   log("log", `Loading event from ${file}...`);
//   const eventArray = file.split("/");
//   const eventName = eventArray[eventArray.length - 1].split(".")[0];
//   const { default: event } = await import(file);
//   client.on(eventName, event.bind(message));
// }
const { default: messageEvent } = await import("./revoltevents/message.js");
client.on("message", async (message) => {
  messageEvent(client, message)
});
log("info", "Finished loading events.");

client.on("ready", async () => {

  // THE GAMER CODE RETURNS (status changer)
  (async function activityChanger() {
    await client.api.patch("/users/@me", {status: {text: `${random(messages)} | <help`, presence: "Busy"}});
    setTimeout(activityChanger.bind(this), 900000);
  }).bind(this)();
});

client.loginBot(process.env.TOKEN);