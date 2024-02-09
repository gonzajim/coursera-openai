"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModelResponse = exports.addMessageToThread = void 0;
const index_1 = require("./index");
const modern_async_1 = require("modern-async");
// This function adds user messages to a given thread object (needs thread object and message body)
const addMessageToThread = (thread, body) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield index_1.openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: body
    });
    return message.id;
});
exports.addMessageToThread = addMessageToThread;
// This is the crux of the tool-calling logic.
// Essentially, this model handles a "run" - or single execution of the the model. It retrieves the status of the run, given the latest user message
// and then has different logic depending on that status of the run. If the run requires functions to be parsed, it parses those functions and returns the output
// to the thread. At the end, it returns the latest message to the user once it decides that the run is completed.
const getModelResponse = (latestMessageID, runID, threadID) => __awaiter(void 0, void 0, void 0, function* () {
    while (true) {
        const run = yield index_1.openai.beta.threads.runs.retrieve(threadID, runID);
        switch (run.status) {
            case "failed":
                console.log('Run failed');
                return;
            case "cancelled":
                console.log('Run cancelled');
                return;
            case "completed":
                const responseMessages = yield index_1.openai.beta.threads.messages.list(threadID, { after: latestMessageID, order: 'asc' });
                for (const message of responseMessages.data) {
                    console.log(message.content[0].type === 'text' ? message.content[0].text.value : 'No text');
                }
                return;
            case "requires_action":
                if (run.required_action) {
                    let toolsToCall = run.required_action.submit_tool_outputs.tool_calls;
                    const toolOutputArray = [];
                    for (const tool of toolsToCall) {
                        let toolCallID = tool.id;
                        let functionName = tool.function.name;
                        let functionArgs = tool.function.arguments;
                        let output;
                        if (functionName === '') {
                            output = {};
                        }
                        toolOutputArray.push({ tool_call_id: toolCallID, output: JSON.stringify(output) });
                        yield index_1.openai.beta.threads.runs.submitToolOutputs(threadID, runID, { tool_outputs: toolOutputArray });
                    }
                    yield (0, modern_async_1.sleep)(1000);
                }
        }
    }
});
exports.getModelResponse = getModelResponse;
