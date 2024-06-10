import { Storage } from "@google-cloud/storage";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";

const storage = new Storage();

const RAW_VIDEO_BUCKET_NAME = "youtube-clone-raw-videos";
const PROCESSED_VIDEO_BUCKET_NAME = "youtube-clone-processed-videos";

const LOCAL_RAW_VIDEO_PATH = "./raw-videos";
const LOCAL_PROCESSED_VIDEO_PATH = "./processed-videos";

// Create local directories for raw and processed videos
export function setupDirectories() {
    ensureDirectoryExists(LOCAL_RAW_VIDEO_PATH);
    ensureDirectoryExists(LOCAL_PROCESSED_VIDEO_PATH);
}

// ensure directory exists
function ensureDirectoryExists(directoryPath: string) {
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true}); // recursive: true enables creating nested directories
    }
}

export function convertVideo(rawVideoName: string, processedVideoName: string) {
    return new Promise<void>((resolve, reject) => {
        ffmpeg(`${LOCAL_RAW_VIDEO_PATH}/${rawVideoName}`)
            .outputOptions("-vf", "scale=-1:360") // 360p resolution
            .on("end", function () {
                console.log("Processing finished successfully");
                resolve();
            })
            .on("error", function (err) {
                console.log(`An error occurred: ${err.message}`);
                reject(err);
            })
            .save(`${LOCAL_PROCESSED_VIDEO_PATH}/${processedVideoName}`);
    })
}

export async function downloadRawVideo(filename: string) {
    await storage.bucket(RAW_VIDEO_BUCKET_NAME)
        .file(filename)
        .download({
            destination: `${LOCAL_RAW_VIDEO_PATH}/${filename}`
        });
}

export async function uploadProcessedVideo(filename: string) {
    const bucket = storage.bucket(PROCESSED_VIDEO_BUCKET_NAME);

    // upload video to bucket
    await storage.bucket(PROCESSED_VIDEO_BUCKET_NAME)
        .upload(`${LOCAL_PROCESSED_VIDEO_PATH}/${filename}`, {
            destination: filename,
        });
    console.log(`Uploaded ${LOCAL_PROCESSED_VIDEO_PATH}/${filename} video to: ${PROCESSED_VIDEO_BUCKET_NAME}/${filename}`);

    // set video to be publicly readable
    await bucket.file(filename).makePublic();
}

export function deleteRawVideo(filename: string) {
    return deleteFile(`${LOCAL_RAW_VIDEO_PATH}/${filename}`);;
}

export function deleteProcessedVideo(filename: string) {
    return deleteFile(`${LOCAL_PROCESSED_VIDEO_PATH}/${filename}`);
}

function deleteFile(filePath: string) {
    return new Promise<void>((resolve, reject) => {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.log(`An error occurred: ${err.message}`);
                    reject(err);
                }

                console.log(`Deleted file: ${filePath}`);
                resolve();
            })
        } else {
            console.log(`File ${filePath} does not exist. Skipping delete`)
            resolve();
        }
    })
}