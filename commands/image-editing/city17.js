import ImageCommand from "../../classes/imageCommand.js";

class CitySeventeenCommand extends ImageCommand {
  params = {
    distortcoords: [0,0,92,7,420,0,420,0,0,770,0,726,420,770,331,767],
    template: "./assets/images/city17.png",
    compdim: "+120+360",
    resizedim: "175x300!",
    origdim: "900x900!"
  };

  static description = "Welcome! Welcome to City 17!";
  static aliases = ["cityseventeen"];

  static noImage = "You need to provide an image to fuck with!";
  static command = "jjos";
}

export default CitySeventeenCommand;