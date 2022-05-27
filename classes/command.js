class Command {
  constructor(client, cluster, worker, ipc, options) {
    this.client = client;
    this.cluster = null;
    this.worker = null;
    this.ipc = null;
    this.origOptions = options;
    this.type = "classic";
    this.args = options.args;
    this.message = options.message;
      this.channel = options.message.channel;
      this.author = options.message.author;
      this.member = options.message.member;
      this.content = options.content;
      this.specialArgs = options.specialArgs;
      this.reference = {
        messageReference: {
          channelID: this.channel._id,
          messageID: this.message._id,
          guildID: this.channel.server ? this.channel.server._id : undefined,
          failIfNotExists: false
        },
        allowedMentions: {
          repliedUser: false
        }
      };
  }

  async run() {
    return "It works!";
  }

  async acknowledge() {
    await this.channel.startTyping(this.channel._id);
  }

  static init() {
    return this;
  }

  static description = "No description found";
  static aliases = [];
  static arguments = [];
  static flags = [];
  static requires = [];
  static slashAllowed = true;
}

export default Command;