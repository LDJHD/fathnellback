import { PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { r2, R2_BUCKET_NAME, R2_PUBLIC_URL } from "./r2.js";

export async function uploadImagesToR2(files, folder = "dev/produit") {
  const urls = [];

  for (const file of files) {
    const fileBuffer = fs.readFileSync(file.path);

    // Compression
    const compressed = await sharp(fileBuffer)
      .resize(1600, null, { withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const fileName = `${folder}/${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;

    // Upload vers R2
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      Body: compressed,
      ContentType: "image/jpeg",
    });

    await r2.send(command);

    urls.push(`${R2_PUBLIC_URL}/${fileName}`);

    // Supprimer le fichier local
    fs.unlinkSync(file.path);
  }

  return urls;
}
