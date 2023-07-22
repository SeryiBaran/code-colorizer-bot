import { Bot, InputFile } from "grammy";
import puppeteer from "puppeteer";
import "dotenv/config";

const TOKEN = process.env.TOKEN;
if (!TOKEN) {
  throw new Error("Нет токена!");
}

async function createImage(text: string) {
  const browser = await puppeteer.launch({
    // headless: false,
  });
  const page = await browser.newPage();

  await page.goto("https://ray.so/");

  await page.setViewport({ width: 1280, height: 1024 });

  const textarea = await page.$("div[class*='Editor_editor'] > textarea");

  // For updating syntax highlighting block
  async function updateFrame() {
    await textarea?.press("Space");
    await textarea?.press("Backspace");
  }

  await updateFrame();

  await page.evaluate((text) => {
    const textarea = document.querySelector(
      "div[class*='Editor_editor'] > textarea"
    ) as HTMLTextAreaElement;
    textarea.value = text;
  }, text);

  await updateFrame();

  await page.evaluate(() => {
    const controls = document.querySelectorAll(
      "div[class*='ResizableFrame_windowSizeDragPoint'], div[class*='Controls_controls']"
    ) as NodeListOf<HTMLElement>;
    if (controls) {
      controls.forEach((elem) => {
        elem.style.display = "none";
      });
    }
  });

  const frame = await page.$("div[class*='ResizableFrame_resizableFrame']");

  return frame?.screenshot();
}

const bot = new Bot(TOKEN);

bot.command("hl", async (ctx) => {
  const messageText = ctx.message?.reply_to_message?.text;

  if (!messageText) {
    ctx.reply("Вы не ответили на сообщение!");
  } else {
    const buffer = await createImage(messageText);

    if (buffer) {
      ctx.replyWithPhoto(new InputFile(buffer));
    } else {
      ctx.reply("Произошла ошибка, изображение не было создано!");
    }
  }
});

bot.start();
