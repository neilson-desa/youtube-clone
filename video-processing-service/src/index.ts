import express from 'express';

import {
    uploadProcessedVideo,
    downloadRawVideo,
    deleteLocalRawVideo,
    deleteLocalProcessedVideo,
    setupDirectories,
    convertVideo
} from "./storage";
import {isVideoNew, setVideo} from "./firestore";

setupDirectories();

const app = express();
app.use(express.json());

// create post endpoint
app.post('/process-video', async (req, res) => {

    // get bucket & filename from Cloud Pub/Sub message
    let data;
    try {
        // Base64 because of pub/sub
        const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
        data = JSON.parse(message);
        if (!data.name) {
            throw new Error('Invalid message.data field from request body received')
        }
    } catch (error) {
        console.log(error);
        res.status(400).send('Invalid request body: bad filename.');
    }

    const inputFileName = data.name; // Format of <UID>-<DATE>.<EXTENSION>
    const outputFileName = `processed-${inputFileName}`;
    const videoId = inputFileName.split(".")[0];

    if (!isVideoNew(videoId)) {
        return res.status(400).send('Bad Request: video already processing or processed')
    } else {
        await setVideo(videoId, {
            id: videoId,
            uid: videoId.split("-")[0],
            status: 'processing'
        });
    }

    // download raw data from Cloud Storage
    await downloadRawVideo(inputFileName);

    // process the video into 360p
    try {
        await convertVideo(inputFileName, outputFileName);
    } catch (error) {
        await Promise.all([
            deleteLocalRawVideo(inputFileName),
            deleteLocalProcessedVideo(outputFileName)
        ]);
        return res.status(500).send('Error processing video. Video upload terminated.');
    }

    // upload processed video to Cloud Storage
    await uploadProcessedVideo(outputFileName);

    await setVideo(videoId, {
        status: 'processed',
        filename: outputFileName
    });

    await Promise.all([
        deleteLocalRawVideo(inputFileName),
        deleteLocalProcessedVideo(outputFileName)
    ]);
    return res.status(200).send('Video processed successfully');
})

// start express server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
})