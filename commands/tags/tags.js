import database from "../../utils/database.js";
import paginator from "../../utils/pagination/pagination.js";
import { random } from "../../utils/misc.js";
import Command from "../../classes/command.js";
const blacklist = ["create", "add", "edit", "remove", "delete", "list", "random", "own", "owner"];

class TagsCommand extends Command {
  // todo: attempt to not make this file the worst thing that human eyes have ever seen
  async run() {
    if (this.channel.server == null) return "This command only works in servers!";
    const cmd = this.type === "classic" ? (this.args[0] ?? "").toLowerCase() : this.optionsArray[0].name;
    if (!cmd || !cmd.trim()) return "You need to provide the name of the tag you want to view!";
    const tagName = this.type === "classic" ? this.args.slice(1)[0] : (this.optionsArray[0].options[0] ?? {}).value;

    if (cmd === "create" || cmd === "add") {
      if (!tagName || !tagName.trim()) return "You need to provide the name of the tag you want to add!";
      if (blacklist.includes(tagName)) return "You can't make a tag with that name!";
      const getResult = await database.getTag(this.channel.server._id, tagName);
      if (getResult) return "This tag already exists!";
      const result = await database.setTag(tagName, {content: this.args.slice(2).join(" "), author: this.message.author._id}, this.channel.server);
      if (result) return result;
      return `The tag \`${tagName}\` has been added!`;
    } else if (cmd === "delete" || cmd === "remove") {
      if (!tagName || !tagName.trim()) return "You need to provide the name of the tag you want to delete!";
      const getResult = await database.getTag(this.channel.server._id, tagName);
      if (!getResult) return "This tag doesn't exist!";
      const owners = process.env.OWNER.split(",");
      if (getResult.author !== this.author._id && !owners.includes(this.author._id)) return "You don't own this tag!";
      await database.removeTag(tagName, this.channel.server);
      return `The tag \`${tagName}\` has been deleted!`;
    } else if (cmd === "edit") {
      if (!tagName || !tagName.trim()) return "You need to provide the name of the tag you want to edit!";
      const getResult = await database.getTag(this.channel.server._id, tagName);
      if (!getResult) return "This tag doesn't exist!";
      const owners = process.env.OWNER.split(",");
      if (getResult.author !== this.author._id && !owners.includes(this.author._id)) return "You don't own this tag!";
      await database.editTag(tagName, { content: this.type === "classic" ? this.args.slice(2).join(" ") : this.optionsArray[0].options[1].value, author: this.member._id }, this.channel.server);
      return `The tag \`${tagName}\` has been edited!`;
    } else if (cmd === "own" || cmd === "owner") {
      if (!tagName || !tagName.trim()) return "You need to provide the name of the tag you want to check the owner of!";
      const getResult = await database.getTag(this.channel.server._id, tagName);
      if (!getResult) return "This tag doesn't exist!";
      return `Owner's ID: \`${getResult.author}\``;
    } else {
      let getResult;
      if (cmd === "random") {
        const tagList = await database.getTags(this.channel.server._id);
        getResult = tagList[random(Object.keys(tagList))];
      } else {
        getResult = await database.getTag(this.channel.server._id, this.type === "classic" ? cmd : tagName);
      }
      if (!getResult) return "This tag doesn't exist!";
      return getResult.content;
    }
  }

  static description = "Manage tags";
  static aliases = ["t", "tag", "ta"];
  static arguments = {
    default: ["[name]"],
    add: ["[name]", "[content]"],
    delete: ["[name]"],
    edit: ["[name]", "[content]"],
    owner: ["[name]"]
  };

  static subArgs = [{
    name: "name",
    type: 3,
    description: "The name of the tag",
    required: true
  }, {
    name: "content",
    type: 3,
    description: "The content of the tag",
    required: true
  }];

  static flags = [{
    name: "add",
    type: 1,
    description: "Adds a new tag",
    options: this.subArgs
  }, {
    name: "delete",
    type: 1,
    description: "Deletes a tag",
    options: [this.subArgs[0]]
  }, {
    name: "edit",
    type: 1,
    description: "Edits an existing tag",
    options: this.subArgs
  }, {
    name: "get",
    type: 1,
    description: "Gets a tag",
    options: [this.subArgs[0]]
  }, {
    name: "owner",
    type: 1,
    description: "Gets the owner of a tag",
    options: [this.subArgs[0]]
  }, {
    name: "random",
    type: 1,
    description: "Gets a random tag"
  }];
}

export default TagsCommand;
