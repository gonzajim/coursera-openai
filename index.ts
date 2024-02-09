import dotenv from 'dotenv';
import OpenAI from 'openai';
import { Thread } from 'openai/resources/beta/threads/threads';
import {addMessageToThread, getModelResponse} from './structure'
dotenv.config();


const inquirer = require('inquirer')

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

const assistantID = process.env.ASSISTANT_ID || '';
export const polygonAPIKey = process.env.POLYGON_API_KEY;


// This function updates the assistant model we established in Task3.
// We can now change the prompt/tools through our code rather than the playground
const updateAssistant = async () => {
    if (assistantID) {
        await openai.beta.assistants.update(assistantID, {
            // instructions: '',
            tools: [
                {type: 'retrieval'},
            ]
        });
    }
};

// This is function creates a new thread (conversation session) which we can add to our assistant
const createThread = async () => {
    const thread = await openai.beta.threads.create();
    return thread;
};

// This is the main function that polls the user for input and returns the response of the assistant to the user and adds both user and ai messages to the thread
const main = async (thread: Thread) => {

    if(assistantID) {

        while(true) {

            const answer = await inquirer.prompt([

                {
                    type: 'input',
                    name: 'user_query',
                    message: 'What would you like to ask?'
                }
            ])

            if (answer.user_query === 'exit') {
                break
            }
            
            console.log('\n')
            const msgID = await addMessageToThread(thread, answer.user_query)
            const run = await openai.beta.threads.runs.create(thread.id, {
                assistant_id: assistantID
            })

            await getModelResponse(msgID, run.id, thread.id)
            console.log('\n')
        }

    }

}

// Here we update the assistant based on our new defined parameters (above) and start the conversation with the assistant if a thread is created successfully
updateAssistant()
const thread = createThread().then((thread) => {
    try {
        main(thread)
    } catch (error) {
        console.log('Error: Could not initialize conversation loop as thread was not created due to below error.\n')
        console.log(error)
    }
})