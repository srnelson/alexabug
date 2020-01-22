/* 
This code, along with the APL doc "helloTest.json" demonstrates anomalous behavior:
The APL doc hellotest.json has a video component and a text component.
On launch, helloTest.json is rendered via APL.RenderDocument, followed by a APL.ExecuteCommands to play the video.
The video component includes an onEnd to send an event back to the lambda, which is handled by HelloHandler. 
HelloHandler sends an APL.ExecuteCommands "speakItem" command targeting the text component.
BUG: The targeted text component is read twice, instead of once
(This is a simplified version of my skill use case, where a Sequence of text components is to be read using the speakList command, but also shows the anomalous repetition.)
*/

const Alexa = require("ask-sdk-core");

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return handlerInput.requestEnvelope.request.type === "LaunchRequest";
  },
  handle(handlerInput) {
    let myDoc = require("./helloTest");
    return (
      handlerInput.responseBuilder
        .speak("Playing video.")
        // test to see if I can handle a varible or empty directive. deprecable kludge?
        .addDirective({
          type: "Alexa.Presentation.APL.RenderDocument",
          token: "VideoPlayerToken",
          document: myDoc,
          datasources: {
            helloData: {
              type: "object",
              objectId: "helloData",
              properties: {
                hello: "<speak>Hello world</speak>"
              },
              transformers: [
                {
                  inputPath: "hello",
                  outputName: "helloSpeech",
                  transformer: "ssmlToSpeech"
                },
                {
                  inputPath: "hello",
                  outputName: "helloText",
                  transformer: "ssmlToText"
                }
              ]
            }
          }
        })
        /* This code sends the "play" command. I also tried removing this directive and using autoplay in the video component of the APL doc, but still have the anomolous repeating behavior */
        .addDirective({
          type: "Alexa.Presentation.APL.ExecuteCommands",
          token: "VideoPlayerToken",
          commands: [
            {
              type: "ControlMedia",
              componentId: "myVideoPlayer",
              command: "play"
            }
          ]
        })

        .getResponse()
    );
  }
};

const HelloHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (
      request.type === "Alexa.Presentation.APL.UserEvent" &&
      request.arguments.length > 0 &&
      request.arguments[0] === "videoEnded"
    );
  },
  handle(handlerInput) {
    const speechText = "Speaking text item.";
    return handlerInput.responseBuilder
      .speak(speechText)
      .addDirective({
        type: "Alexa.Presentation.APL.ExecuteCommands",
        token: "VideoPlayerToken",
        commands: [
          {
            type: "SpeakItem",
            componentId: "helloWorld",
            minimumDwellTime: "500",
            align: "center"
          }
        ]
      })
      .getResponse();
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const speechText =
      "You can say your name, or, you can say exit... What can I help you with?";
    const repromptText = "What can I help you with?";

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      (handlerInput.requestEnvelope.request.intent.name ===
        "AMAZON.CancelIntent" ||
        handlerInput.requestEnvelope.request.intent.name ===
          "AMAZON.StopIntent")
    );
  },
  handle(handlerInput) {
    const speechText = "Goodbye!";

    return handlerInput.responseBuilder.speak(speechText).getResponse();
  }
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "SessionEndedRequest";
  },
  handle(handlerInput) {
    console.log(
      `Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`
    );

    return handlerInput.responseBuilder.getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak("Sorry, an error occurred.")
      .reprompt("Sorry, an error occurred.")
      .getResponse();
  }
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    HelloHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
