import Command from "../../classes/command.js";

class PingCommand extends Command {
  async run() {
    const pingMessage = await this.message.reply(Object.assign({
      content: "🏓 Ping?"
    }, this.reference));
    pingMessage.edit({content: `🏓 Pong!\n\`\`\`\nLatency: ${pingMessage.createdAt - this.message.createdAt}ms`});
  }

  static description = "Pings Discord's servers";
  static aliases = ["pong"];
}

export default PingCommand;