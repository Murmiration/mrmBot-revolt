import * as collections from "../collections.js";
import * as logger from "../logger.js";

import sqlite3 from "better-sqlite3";
const connection = sqlite3(process.env.DB.replace("sqlite://", ""));

const sqliteUpdates = [
  "", // reserved
  "ALTER TABLE servers ADD COLUMN accessed int",
  "ALTER TABLE servers DROP COLUMN accessed"
];

export async function setup() {
  const counts = connection.prepare("SELECT * FROM counts").all();
  if (!counts) {
    for (const command of collections.commands.keys()) {
      connection.prepare("INSERT INTO counts (command, count) VALUES (?, ?)").run(command, 0);
    }
  } else {
    const exists = [];
    for (const command of collections.commands.keys()) {
      const count = connection.prepare("SELECT * FROM counts WHERE command = ?").get(command);
      if (!count) {
        connection.prepare("INSERT INTO counts (command, count) VALUES (?, ?)").run(command, 0);
      }
      exists.push(command);
    }

    for (const { command } of counts) {
      if (!exists.includes(command)) {
        connection.prepare("DELETE FROM counts WHERE command = ?").run(command);
      }
    }
  }
}

export async function stop() {
  connection.close();
}

export async function upgrade() {
  connection.prepare("CREATE TABLE IF NOT EXISTS servers ( server_id VARCHAR(30) NOT NULL PRIMARY KEY, prefix VARCHAR(15) NOT NULL, disabled text NOT NULL, disabled_commands text NOT NULL )").run();
  connection.prepare("CREATE TABLE IF NOT EXISTS counts ( command VARCHAR NOT NULL PRIMARY KEY, count integer NOT NULL )").run();
  connection.prepare("CREATE TABLE IF NOT EXISTS tags ( server_id VARCHAR(30) NOT NULL, name text NOT NULL, content text NOT NULL, author VARCHAR(30) NOT NULL, UNIQUE(server_id, name) )").run();

  let version = connection.pragma("user_version", { simple: true });
  if (version < (sqliteUpdates.length - 1)) {
    console.log(`Migrating SQLite database at ${process.env.DB}, which is currently at version ${version}...`);
    connection.prepare("BEGIN TRANSACTION").run();
    try {
      while (version < (sqliteUpdates.length - 1)) {
        version++;
        console.log(`Running version ${version} update script (${sqliteUpdates[version]})...`);
        connection.prepare(sqliteUpdates[version]).run();
      }
      connection.pragma(`user_version = ${version}`); // insecure, but the normal templating method doesn't seem to work here
      connection.prepare("COMMIT").run();
    } catch (e) {
      console.log(`SQLite migration failed: ${e}`);
      connection.prepare("ROLLBACK").run();
      console.log("Unable to start the bot, quitting now.");
      return 1;
    }
  }
}

export async function fixGuild(server) {
  let serverDB;
  try {
    serverDB = connection.prepare("SELECT * FROM servers WHERE server_id = ?").get(server._id);
  } catch {
    connection.prepare("CREATE TABLE servers ( server_id VARCHAR(30) NOT NULL PRIMARY KEY, prefix VARCHAR(15) NOT NULL, disabled text NOT NULL, disabled_commands text NOT NULL )").run();
  }
  if (!serverDB) {
    logger.log(`Registering server database entry for server ${server._id}...`);
    return await this.addGuild(server);
  }
}

export async function addCount(command) {
  connection.prepare("UPDATE counts SET count = count + 1 WHERE command = ?").run(command);
}

export async function getCounts() {
  const counts = connection.prepare("SELECT * FROM counts").all();
  const countObject = {};
  for (const { command, count } of counts) {
    countObject[command] = count;
  }
  return countObject;
}

export async function disableCommand(server, command) {
  const serverDB = await this.getGuild(server);
  connection.prepare("UPDATE servers SET disabled_commands = ? WHERE server_id = ?").run(JSON.stringify((serverDB.disabledCommands ? [...JSON.parse(serverDB.disabledCommands), command] : [command]).filter((v) => !!v)), server);
  collections.disabledCmdCache.set(server, serverDB.disabled_commands ? [...JSON.parse(serverDB.disabledCommands), command] : [command].filter((v) => !!v));
}

export async function enableCommand(server, command) {
  const serverDB = await this.getGuild(server);
  const newDisabled = serverDB.disabledCommands ? JSON.parse(serverDB.disabledCommands).filter(item => item !== command) : [];
  connection.prepare("UPDATE servers SET disabled_commands = ? WHERE server_id = ?").run(JSON.stringify(newDisabled), server);
  collections.disabledCmdCache.set(server, newDisabled);
}

export async function disableChannel(channel) {
  const serverDB = await this.getGuild(channel.server._id);
  connection.prepare("UPDATE servers SET disabled = ? WHERE server_id = ?").run(JSON.stringify([...JSON.parse(serverDB.disabled), channel._id]), channel.server._id);
  collections.disabledCache.set(channel.server._id, [...JSON.parse(serverDB.disabled), channel._id]);
}

export async function enableChannel(channel) {
  const serverDB = await this.getGuild(channel.server._id);
  const newDisabled = JSON.parse(serverDB.disabled).filter(item => item !== channel._id);
  connection.prepare("UPDATE servers SET disabled = ? WHERE server_id = ?").run(JSON.stringify(newDisabled), channel.server._id);
  collections.disabledCache.set(channel.server._id, newDisabled);
}

export async function getTag(server, tag) {
  const tagResult = connection.prepare("SELECT * FROM tags WHERE server_id = ? AND name = ?").get(server, tag);
  return tagResult ? { content: tagResult.content, author: tagResult.author } : undefined;
}

export async function getTags(server) {
  const tagArray = connection.prepare("SELECT * FROM tags WHERE server_id = ?").all(server);
  const tags = {};
  if (!tagArray) return [];
  for (const tag of tagArray) {
    tags[tag.name] = { content: tag.content, author: tag.author };
  }
  return tags;
}

export async function setTag(name, content, server) {
  const tag = {
    id: server._id,
    name: name,
    content: content.content,
    author: content.author
  };
  connection.prepare("INSERT INTO tags (server_id, name, content, author) VALUES (@id, @name, @content, @author)").run(tag);
}

export async function removeTag(name, server) {
  connection.prepare("DELETE FROM tags WHERE server_id = ? AND name = ?").run(server._id, name);
}

export async function editTag(name, content, server) {
  connection.prepare("UPDATE tags SET content = ?, author = ? WHERE server_id = ? AND name = ?").run(content.content, content.author, server._id, name);
}

export async function setPrefix(prefix, server) {
  connection.prepare("UPDATE servers SET prefix = ? WHERE server_id = ?").run(prefix, server._id);
  collections.prefixCache.set(server._id, prefix);
}

export async function addGuild(server) {
  const query = await this.getGuild(server);
  if (query) return query;
  const serverObject = {
    id: server._id,
    prefix: process.env.PREFIX,
    disabled: "[]",
    disabledCommands: "[]"
  };
  connection.prepare("INSERT INTO servers (server_id, prefix, disabled, disabled_commands) VALUES (@id, @prefix, @disabled, @disabledCommands)").run(serverObject);
  return serverObject;
}

export async function getGuild(query) {
  try {
    return connection.prepare("SELECT * FROM servers WHERE server_id = ?").get(query);
  } catch {
    return;
  }
}
