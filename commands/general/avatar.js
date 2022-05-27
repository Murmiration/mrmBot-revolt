import Command from "../../classes/command.js";

class AvatarCommand extends Command {
  async run() {
    if (this.message.mention_ids !== null) {
      const target = await this.client.users.fetch(this.message.mention_ids[0]);
      return `https://autumn.revolt.chat/avatars/${target.avatar._id}?max_side=256`;
    } else {
      const target = this.author;
      return `https://autumn.revolt.chat/avatars/${target.avatar._id}?max_side=256`;
    }
  }

  static description = "Gets a user's avatar";
  static aliases = ["pfp", "ava"];
  static arguments = ["{mention/id}"];
  static slashAllowed = false;
}

export default AvatarCommand;
