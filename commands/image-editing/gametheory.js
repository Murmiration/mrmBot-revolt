import ImageCommand from "../../classes/imageCommand.js";

class GameTheoryCommand extends ImageCommand {
  params = {
    template: "./assets/images/gametheory.png",
    compdim: "+0+0",
    resizedim: "928x1080!",
    origdim: "1920x1080!",
    bgpath: "./assets/images/blackpixel.png"
  };

  static description = "Learn the truth about Sans Undertale!";
  static aliases = ["truthaboutsans"];

  static noImage = "You need to provide an image to fuck with!";
  static command = "template";
}

export default GameTheoryCommand;