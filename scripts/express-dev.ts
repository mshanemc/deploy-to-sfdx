const path = require('path');
const express = require('express');

const customServer = require(path.resolve('./src/server/process/web.ts')).default;

const app = express();

customServer(app);

app.listen(3002, () => {
    // eslint-disable-next-line no-console
    console.log('Yay, local server started');
});
