import Command from "../../classes/command.js";

class HelpCommand extends Command {
    async run() {
        const placeholder = "The revolt edition of mrmBot is a HEAVY WIP, but if you want a list of commands, check out https://mrmbot.annoyingorange.xyz (and ignore the discord-specific commands as they're obviously not ported)";
        return placeholder;
    }
}

export default HelpCommand;