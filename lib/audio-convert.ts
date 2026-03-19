import { execSync } from "child_process";
import { writeFileSync, readFileSync, mkdirSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { put } from "@vercel/blob";

/**
 * Convert DS2/DSS files to 16kHz mono WAV using ffmpeg.
 * Returns a new Blob URL for the converted WAV, or null if conversion fails.
 */
export async function convertToWav(
  audioUrl: string,
  jobId: string
): Promise<string | null> {
  const workDir = join(tmpdir(), `skytp-convert-${jobId}`);
  const inputPath = join(workDir, "input.ds2");
  const outputPath = join(workDir, "output.wav");

  try {
    mkdirSync(workDir, { recursive: true });

    // Download the source file
    const res = await fetch(audioUrl);
    if (!res.ok) throw new Error(`Failed to download audio: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    writeFileSync(inputPath, buffer);

    // Convert with ffmpeg: DSS format flag, 16kHz mono WAV output
    try {
      execSync(
        `ffmpeg -f dss -i "${inputPath}" -ar 16000 -ac 1 "${outputPath}" -y`,
        { timeout: 60000, stdio: "pipe" }
      );
    } catch (ffmpegErr) {
      // The ffmpeg DSS decoder has a known pitch bug — log warning but
      // still check if output was produced (it often succeeds despite warnings)
      console.warn(
        `[DS2 convert] ffmpeg reported issues for job ${jobId} (DSS pitch bug may apply):`,
        ffmpegErr instanceof Error ? ffmpegErr.message : ffmpegErr
      );

      // Check if output file was actually created despite the error
      try {
        readFileSync(outputPath);
      } catch {
        console.error(`[DS2 convert] No output produced for job ${jobId}`);
        return null;
      }
    }

    // Upload converted WAV to Blob
    const wavData = readFileSync(outputPath);
    const blob = await put(`audio/${jobId}/converted.wav`, wavData, {
      access: "public",
      contentType: "audio/wav",
    });

    return blob.url;
  } catch (err) {
    console.error(
      `[DS2 convert] Conversion failed for job ${jobId}:`,
      err instanceof Error ? err.message : err
    );
    return null;
  } finally {
    // Cleanup temp files
    try {
      unlinkSync(inputPath);
    } catch {}
    try {
      unlinkSync(outputPath);
    } catch {}
    try {
      // rmdir only works if empty
      execSync(`rm -rf "${workDir}"`, { stdio: "pipe" });
    } catch {}
  }
}
