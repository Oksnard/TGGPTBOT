import { Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import { code } from "telegraf/format";
import config from "config";
import { ogg } from "./ogg.js";
import { openai } from "./openai.js";

console.info(config.get('TEST_ENV'))

const INITIAL_SESSION = {
    messages: [],
};

const bot = new Telegraf(config.get("GPTTG_BOT_TOKEN"));

bot.use(session());

bot.command("new", async (ctx) => {
    ctx.session = INITIAL_SESSION;
    await ctx.reply("Спрашивай, я жду");
});

bot.command("start", async (ctx) => {
    ctx.session = INITIAL_SESSION;
    await ctx.reply("Спрашивай, я жду");
});

bot.on(message("voice"), async (ctx) => {
    ctx.session ??= INITIAL_SESSION;
    try {
        await ctx.reply(code(`Запрос отправлен чат-боту`));
        const fileLink = await ctx.telegram.getFileLink(
            ctx.message.voice.file_id
        );
        const userId = String(ctx.message.from.id);
        const oggFilePath = await ogg.create(fileLink.href, userId);
        const MP3FilePath = await ogg.toMP3(oggFilePath, userId);
        const text = await openai.transcription(MP3FilePath);

        await ctx.reply(code(`GPT:: Ваш запрос: ${text}`));

        await ctx.reply(code(`Запрос принял, думаю...`));

        ctx.session.messages.push({ role: openai.roles.USER, content: text });

        const response = await openai.chat(ctx.session.messages);

        ctx.session.messages.push({
            role: openai.roles.ASSISTANT,
            content: response.content,
        });

        await ctx.reply(response.content);
    } catch (e) {
        console.error(`Ошибка в работе TG-бота`, e.message);
    }
});

bot.on(message("text"), async (ctx) => {
    ctx.session ??= INITIAL_SESSION;
    try {
        await ctx.reply(code(`Запрос принял, думаю...`));

        ctx.session.messages.push({ role: openai.roles.USER, content: ctx.message.text });

        const response = await openai.chat(ctx.session.messages);

        ctx.session.messages.push({
            role: openai.roles.ASSISTANT,
            content: response.content,
        });

        await ctx.reply(response.content);
    } catch (e) {
        console.error(`Ошибка в работе TG-бота`, e.message);
    }
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
