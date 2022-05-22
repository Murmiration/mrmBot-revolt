import fetch from "node-fetch";
import Command from "../../classes/command.js";

class HorseCommand extends Command {
  async run() {
    const request = await fetch("https://thishorsedoesnotexist.com");
    return {
      file: await request.buffer(),
      name: "horse.jpg"
    };
  }

  static description = "Generates a Horse";
  static aliases = ["thishorsedoesntexist", "horsedoesntexist", "horse"];
  static arguments = [];
}

export default HorseCommand;