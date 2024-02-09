import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { Thread } from 'openai/resources/beta/threads/threads';
import {addMessageToThread, getModelResponse} from './structure'

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const assistantID = process.env.ASSISTANT_ID || '';

const app = express();
app.use(bodyParser.json());

let thread: Thread | null = null;

app.post('/api/chat', async (req, res) => {
    const userInput = req.body.message;

    if (!thread) {
        thread = await createThread();
    }

    if (assistantID && thread) {
        const msgID = await addMessageToThread(thread, userInput);
        const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: assistantID
        });

        const response = await getModelResponse(msgID, run.id, thread.id);

        // Send the response back to the client
        res.json({ response });
    } else {
        res.status(500).json({ error: 'Assistant ID or thread not initialized' });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));

async function createThread() {
    const thread = await openai.beta.threads.create();
    return thread;
}