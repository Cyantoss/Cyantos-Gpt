import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs';

dotenv.config();

const configuration = new Configuration({
    apiKey: process.env.OPEN_API_KEY,
});

const openai = new OpenAIApi(configuration);

const app = express();
app.use(cors())
app.use(express.json());

const historyFilePath = './history.json';

function readHistory() {
    try {
        const historyData = fs.readFileSync(historyFilePath, 'utf8');
        return JSON.parse(historyData);
    } catch (error) {
        console.error(error);
        return {};
    }
}

function writeHistory(history) {
    fs.writeFileSync(historyFilePath, JSON.stringify(history), 'utf8');
}

app.get('/', async (req, res) => {
    res.status(200).send({
        message: 'Hello World'
    })
});

app.post('/', async (req, res) => {
    try {
        const prompt = req.body.prompt;
        const history = readHistory();

        // Add the user's input to the conversation history
        if (!history[prompt]) {
            history[prompt] = [];
        }
        history[prompt].push(req.body.userInput);
        writeHistory(history);

        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: `${prompt}`,
            temperature: 0.5,
            max_tokens: 2500,
            top_p: 1,
            frequency_penalty: 0.5,
            presence_penalty: 0,
        });

        // Add the bot's response to the conversation history
        history[prompt].push(response.data.choices[0].text);
        writeHistory(history);

        res.status(200).send({
            bot: response.data.choices[0].text
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({ error })
    }
})

app.listen(5000, () => console.log('Server is running on port http://localhost:5000/ '))
