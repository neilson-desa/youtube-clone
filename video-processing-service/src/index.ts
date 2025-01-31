import express from 'express';

import {
    uploadProcessedVideo,
    downloadRawVideo,
    deleteRawVideo,
    deleteProcessedVideo,
    setupDirectories,
    convertVideo
} from "./storage";

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

    const inputFileName = data.name;
    const outputFileName = `processed-${inputFileName}`;

    // download raw data from Cloud Storage
    await downloadRawVideo(inputFileName);

    // process the video into 360p
    try {
        await convertVideo(inputFileName, outputFileName);
    } catch (error) {
        await Promise.all([
            deleteRawVideo(inputFileName),
            deleteProcessedVideo(outputFileName)
        ]);
        return res.status(500).send('Error processing video. Video upload terminated.');
    }

    // upload processed video to Cloud Storage
    await uploadProcessedVideo(outputFileName);

    await Promise.all([
        deleteRawVideo(inputFileName),
        deleteProcessedVideo(outputFileName)
    ]);
    return res.status(200).send('Video processed successfully');
})

// start express server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
})