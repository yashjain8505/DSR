const fs = require("fs");
const sharp = require("sharp");
const URL =
  "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/5d/06/1e/5d061ed1-4f02-4016-98d6-cdf67826d874/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/512x512bb.jpg";
(async () => {
  const r = await fetch(URL, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const buf = Buffer.from(await r.arrayBuffer());
  const out = await sharp(buf)
    .resize(512, 512, { fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
  fs.writeFileSync("/tmp/logos-final/khelomore.png", out);
  const m = await sharp(out).metadata();
  console.log(`khelomore.png ${m.width}x${m.height} ${out.length}B`);
})();
