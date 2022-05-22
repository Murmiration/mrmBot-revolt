import ImageCommand from "../../classes/imageCommand.js";

class MeemayCommand extends ImageCommand {
  params = {
    template: "./assets/images/meemay.png",
    compdim: "+347+0",
    resizedim: "333x332!",
    origdim: "680x694!"
  };

  static description = "ohohoho";
  static aliases = [];

  static noImage = "You need to provide an image to fuck with!";
  static command = "template";
}

export default MeemayCommand;