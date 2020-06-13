const { doujinExists, getDoujin, getMangaMessage } = require("../someFuncs.js");
const fs = require("fs");
const nhdl = require("nhentaidownloader");

module.exports.dlzip = async function(ctx) {
  let msg = ctx.message.text,
    mangaId = msg.match(/\d+/) ? msg.match(/\d+/)[0] : null;
  if (!mangaId) {
    await ctx.reply("Yuo have to specify a code: `/zip 234638`", {
      parse_mode: "Markdown"
    });
    return;
  }
  let exists = await doujinExists(mangaId);

  if (!exists) {
    await ctx.reply("`" + mangaId + "` does not exist :/", {
      parse_mode: "Markdown"
    });
    return;
  }
  let manga = await getDoujin(mangaId);
  if (!manga) {
    await ctx.reply("Failed to get doujin `" + mangaId + "` :/", {
      parse_mode: "Markdown"
    });
    return;
  }
  if (manga.details.pages[0] > 100) {
    await ctx.reply("Sorry, that's too many pages :(", {
      parse_mode: "Markdown"
    });
    return;
  }
  await ctx.reply("wait a bit..");
  let messageText = getMangaMessage(manga);

  await nhdl(mangaId).then(buffer => {
    fs.writeFileSync(`./${mangaId}.zip`, buffer);
  });
  let stats = await fs.statSync(`./${mangaId}.zip`),
    fileSizeB = stats["size"],
    fileSizeMB = fileSizeB / 1000000.0;
  console.log(fileSizeMB);
  await ctx.telegram.deleteMessage(ctx.from.id, ctx.message.message_id + 1);
  if (fileSizeMB > 50) {
    await ctx.reply(
      "Sorry, file is too big, for bots telegram allow " +
        "sending files only less then 50 mb, when this file is " +
        fileSizeMB +
        ":(",
      {
        parse_mode: "Markdown"
      }
    );
    return;
  }else{
    await ctx.telegram
    .sendDocument(
      ctx.from.id,
      {
        source: fs.readFileSync(`./${mangaId}.zip`),
        filename: `./${mangaId}.zip`
      },
      {
        caption: messageText,
        parse_mode: "HTML"
      }
    )
    .catch(err => {
      console.log("reply with file failed :( ", err);
    });
  }
  await fs.unlink(`./${mangaId}.zip`, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log(`File ${mangaId}.zip deleted!`);
    }
  });
};
