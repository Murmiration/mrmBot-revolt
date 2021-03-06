import { promises } from "fs";
import database from "../utils/database.js";
import { log, error as _error } from "../utils/logger.js";
import { prefixCache, aliases, disabledCache, disabledCmdCache, commands } from "../utils/collections.js";
import parseCommand from "../utils/parseCommand.js";
import { clean } from "../utils/misc.js";
import fetch, { FormData, File } from 'node-fetch'
import {fileTypeFromBuffer} from 'file-type';

// run when someone sends a message
export default async (client, message) => {
  // ignore other bots
  if (message.author.bot) return;

  // don't run command if bot can't send messages
  // if (message.channel.server !== null && !message.channel.permissionsOf(client.user.id).has("sendMessages")) return;

  // let prefixCandidate;
  // let guildDB;
  // if (message.channel.guild) {
  //   const cachedPrefix = prefixCache.get(message.channel.guild.id);
  //   if (cachedPrefix) {
  //     prefixCandidate = cachedPrefix;
  //   } else {
  //     guildDB = await database.getGuild(message.channel.guild.id);
  //     if (!guildDB) {
  //       guildDB = await database.fixGuild(message.channel.guild);
  //     }
  //     prefixCandidate = guildDB.prefix;
  //     prefixCache.set(message.channel.guild.id, guildDB.prefix);
  //   }
  // }

  let prefix = process.env.PREFIX;
  let isMention = false;

  // ignore other stuff
  if (!message.content.startsWith(prefix)) return;

  // separate commands and args
  const content = message.content.substring(prefix.length).trim();
  // safely handle strings later
  const rawContent = content;
  const preArgs = content.split(/\s+/g);
  preArgs.shift();
  const command = rawContent.split(/\s+/g).shift().toLowerCase();
  const parsed = parseCommand(preArgs);
  const aliased = aliases.get(command);

  // don't run if message is in a disabled channel
  if (message.channel.guild) {
    const disabled = disabledCache.get(message.channel.guild.id);
    if (disabled) {
      if (disabled.includes(message.channel.id) && command != "channel") return;
    } else {
      guildDB = await database.getGuild(message.channel.guild.id);
      disabledCache.set(message.channel.guild.id, guildDB.disabled);
      if (guildDB.disabled.includes(message.channel.id) && command !== "channel") return;
    }

    const disabledCmds = disabledCmdCache.get(message.channel.guild.id);
    if (disabledCmds) {
      if (disabledCmds.includes(aliased ?? command)) return;
    } else {
      guildDB = await database.getGuild(message.channel.guild.id);
      disabledCmdCache.set(message.channel.guild.id, guildDB.disabled_commands ?? guildDB.disabledCommands);
      if ((guildDB.disabled_commands ?? guildDB.disabledCommands).includes(aliased ?? command)) return;
    }
  }

  // check if command exists and if it's enabled
  const cmd = commands.get(aliased ?? command);
  if (!cmd) return;

  // actually run the command
  log("log", `${message.author.username} (${message.author._id}) ran classic command ${command}`);
  // console.log(message);
  const reference = {
    messageReference: {
      channelID: message.channel_id,
      messageID: message._id,
      guildID: message.channel.server ? message.channel.server._id : undefined,
      failIfNotExists: false
    },
    allowedMentions: {
      repliedUser: false
    }
  };
  try {
    // await database.addCount(aliases.get(command) ?? command);
    const startTime = new Date();
    // eslint-disable-next-line no-unused-vars
    const commandClass = new cmd(client, null, null, null, { type: "classic", message, args: parsed._, content: message.content.substring(prefix.length).trim().replace(command, "").trim(), specialArgs: (({ _, ...o }) => o)(parsed) }); // we also provide the message content as a parameter for cases where we need more accuracy
    const result = await commandClass.run();
    const endTime = new Date();
    // if ((endTime - startTime) >= 180000) reference.allowedMentions.repliedUser = true;
    if (typeof result === "string") {
      reference.allowedMentions.repliedUser = true;
      await message.reply(Object.assign({
        content: result
      }, reference));
    } else if (typeof result === "object" && result.embeds) {
      await message.reply(Object.assign(result, reference));
    } else if (typeof result === "object" && result.file) {
      let fileSize = 8388119;
      if (result.file.length > fileSize) {
        await message.reply("The resulting image was more than 8MB in size, so I can't upload it.");
      } else {
        const filetype = await fileTypeFromBuffer(Buffer.from(result.file));
        const formData = new FormData();
        const resultdata = new File([result.file], `output.${filetype.ext}`, {type: filetype.mime});
        formData.append('file', resultdata);
        const attachment = await fetch("https://autumn.revolt.chat/attachments", {
          method: 'POST', 
          body: formData
        })
        const attachmentjson = await attachment.json()
        await message.reply({attachments: [attachmentjson.id]});
      }
    }
  } catch (error) {
    if (error.toString().includes("Request entity too large")) {
      await message.reply(Object.assign({
        content: "The resulting file was too large to upload. Try again with a smaller image if possible."
      }, reference));
    } else if (error.toString().includes("Job ended prematurely")) {
      await message.reply(Object.assign({
        content: "Something happened to the image servers before I could receive the image. Try running your command again."
      }, reference));
    } else if (error.toString().includes("Timed out")) {
      await message.reply(Object.assign({
        content: "The request timed out before I could download that image. Try uploading your image somewhere else or reducing its size."
      }, reference));
    } else if (error.toString().includes("Error: Request failed with status code 403")) {
      _error(`No send message permissions for command ${message.content}: ${error.toString()}`)
    } else {
      _error(`Error occurred with command message ${message.content}: ${error.toString()}`);
      _error(error.stack)
      try {
        await message.reply({content: `Message: ${await clean(error)}`});
      } catch { /* silently ignore */ }
    }
  }
};
