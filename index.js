import './loadEnv.js'; // 꼭 가장 먼저 호출!

// index.js
import express from 'express';
import baemin from './src/BaeminController.js';
import coupang from './src/CoupangController.js';
import ddangyo from './src/DdangyoController.js';
import bodyParser from 'body-parser';


const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json()); // JSON 파싱

app.get('/', (req, res) => {res.json({success: true, message: 'mainPage!'})});

app.use('/api/baemin', baemin);
app.use('/api/coupang', coupang);
app.use('/api/ddangyo', ddangyo);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
