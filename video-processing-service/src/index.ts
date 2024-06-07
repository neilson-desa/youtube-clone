import express from 'express';

const app = express();
const port = 3000;

// create get endpoint
app.get('/', (req, res) => {
    res.send('Hello World!');
})

// start express server
app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
})