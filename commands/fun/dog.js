import fetch from "node-fetch";
import Command from "../../classes/command.js";

class DogCommand extends Command {
  async run() {
    await this.acknowledge();
    const imageData = await fetch("https://dog.ceo/api/breeds/image/random");
    const json = await imageData.json();
    return json.message;
  }

  static description = "Gets a random dog picture";
  static aliases = ["doggos", "doggo", "pupper", "puppers", "dogs", "puppy", "puppies", "pups", "pup"];
}

export default DogCommand;