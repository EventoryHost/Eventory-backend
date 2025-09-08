import sharp from "sharp";
import path from "path";
import ffmpeg from "fluent-ffmpeg";  

export const compressImage = async (filePath) => {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);

  const outputPath = path.join(dir, `${base}-preview.webp`);

  await sharp(filePath)
    .resize({ width: 720 })
    .webp({ quality: 60 })
    .withMetadata(false)
    .toFile(outputPath);

  return {
    originalPath: filePath,
    previewPath: outputPath,
  };
};

export const compressVideo = (filePath) => {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath); 
    const base = path.basename(filePath, ext);

    const outputPath = path.join(dir, `${base}-preview.mp4`);

    ffmpeg(filePath)
      .outputOptions([
        "-vf scale=1280:-1",   
        "-c:v libx264",        
        "-preset veryfast",    
        "-crf 28",             
        "-c:a aac",           
        "-b:a 128k",           
      ])
      .save(outputPath)
      .on("end", () => {
        resolve({
          originalPath: filePath,
          previewPath: outputPath,  
        });
      })
      .on("error", (err) => reject(err));
  });
};
