import ImageCommand from "../../classes/imageCommand.js";

class ManiaCommand extends ImageCommand {
  params = {
    template: "./assets/images/mania.png",
    compdim: "+757+190",
    resizedim: "406x488!",
    origdim: "1920x1080!",
    bgpath: "./assets/images/maniabg.png"
  };

  static description = "Generate a custom Sonic Mania titlecard!";
  static aliases = ["sonicmania"];

  static noImage = "You need to provide an image to fuck with!";
  static command = "template";
}

export default ManiaCommand;