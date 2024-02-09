import { Thread } from 'openai/resources/beta/threads/threads'
import {openai} from './index'
import { sleep } from "modern-async";


// This function adds user messages to a given thread object (needs thread object and message body)
export const addMessageToThread = async (thread: Thread, body: string) => {

    const message = await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: body
    })
    return message.id
}

// This is the crux of the tool-calling logic.
// Essentially, this model handles a "run" - or single execution of the the model. It retrieves the status of the run, given the latest user message
// and then has different logic depending on that status of the run. If the run requires functions to be parsed, it parses those functions and returns the output
// to the thread. At the end, it returns the latest message to the user once it decides that the run is completed.
export const getModelResponse = async (latestMessageID: string, runID: string, threadID: string) => {

    while (true) {

        const run = await openai.beta.threads.runs.retrieve(threadID, runID)


        switch (run.status) {
        
        case "failed":
            console.log('Run failed')
            return
        case "cancelled":
            console.log('Run cancelled')
            return
        case "completed":
            const responseMessages = await openai.beta.threads.messages.list(threadID, {after: latestMessageID, order: 'asc'})

            for (const message of responseMessages.data) {
                console.log(message.content[0].type === 'text' ? message.content[0].text.value : 'No text')
            
            }
            return
        case "requires_action":
            if(run.required_action) {

                let toolsToCall = run.required_action.submit_tool_outputs.tool_calls
                const toolOutputArray = []

                for (const tool of toolsToCall) {

                    let toolCallID = tool.id
                    let functionName = tool.function.name
                    let functionArgs = tool.function.arguments
                    let output

                    if(functionName === '') {
                        output = {}
                }
                toolOutputArray.push({tool_call_id: toolCallID, output: JSON.stringify(output)})
                await openai.beta.threads.runs.submitToolOutputs(threadID, runID, { tool_outputs: toolOutputArray})
                }

            await sleep(1000)
            }
        }
    }
}