# alexabug
This code, along with the APL doc "helloTest.json" demonstrates anomalous behavior:

The APL doc hellotest.json has a video component and a text component.

On launch, helloTest.json is rendered via APL.RenderDocument, followed by a APL.ExecuteCommands to play the video.

The video component includes an onEnd to send an event back to the lambda, which is handled by HelloHandler. 

HelloHandler sends an APL.ExecuteCommands "speakItem" command targeting the text component.

BUG: The targeted text component is read twice, instead of once

(This is a simplified version of my skill use case, where a Sequence of text components is to be read using the speakList command, but also shows the anomalous repetition.)
