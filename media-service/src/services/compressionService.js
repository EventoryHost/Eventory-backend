import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import { Readable } from "stream";
import fs from "fs";
import path from "path";
import os from "os";

export const compressImage = async (fileBuffer) => {
  // Process original buffer to create preview
  const previewBuffer = await sharp(fileBuffer)
    .resize({ width: 720 })
    .webp({ quality: 60 })
    .withMetadata(false)
    .toBuffer();

  return {
    originalBuffer: fileBuffer,
    previewBuffer: previewBuffer,
  };
};

export const compressVideo = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    // Create temporary files for FFmpeg processing (FFmpeg works better with files)
    const tempDir = os.tmpdir();
    const inputPath = path.join(tempDir, `input_${Date.now()}.mp4`);
    const outputPath = path.join(tempDir, `output_${Date.now()}.mp4`);

    try {
      // Write buffer to temporary input file
      fs.writeFileSync(inputPath, fileBuffer);

      ffmpeg(inputPath)
        .outputOptions([
          "-vf scale=1280:-1",   
          "-c:v libx264",        
          "-preset veryfast",    
          "-crf 28",             
          "-c:a aac",           
          "-b:a 128k",           
        ])
        .output(outputPath)
        .on('end', () => {
          try {
            // Read the compressed video back into a buffer
            const previewBuffer = fs.readFileSync(outputPath);
            
            // Clean up temporary files
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
            
            resolve({
              originalBuffer: fileBuffer,
              previewBuffer: previewBuffer,  
            });
          } catch (readError) {
            reject(readError);
          }
        })
        .on('error', (err) => {
          // Clean up temporary files on error
          try {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          } catch {}
          reject(err);
        })
        .run();
    } catch (writeError) {
      reject(writeError);
    }
  });
};
