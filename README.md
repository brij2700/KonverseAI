# KonverseAI
Welcome to the KonverseAI repository, a revolutionary web application designed to provide personalized mental health support using ChatGPT and D-id technology. This innovative project combines advanced natural language processing with state-of-the-art avatar generation to create a unique and empathetic virtual companion for users seeking mental health assistance.

## Initial Setup:
* (install express) open a terminal in the folder:
    run this: npm install express
    run this: npm install openai
* (add your d-id api key) edit the `api.json` inside the uncompressed folder and replace the emoji with your key
* Run a test to ensure yor api is set correctly by checking d-id credit balance:  Run test_d_id.js
* (add your OpenAI api key) edit the `config.json` inside the uncompressed folder and replace the emoji with your key
* Run a test to ensure yor api is set correctly by checking ChatGPT:  Run test_openai.js

## Start the demo:
* Open a session in your terminal in the folder with our code run this: node app.js 
* You should see this message - server started on port localhost:3000
* (open index.html app) in the browser add localhost:3000
* (connect) press connect you should see the connection ready 
* (Enter Chat Text) press the send button to start streaming
* You can also record your input using the Record button
* Use the stop button once you are done recording

## Credits
* Built upon the demo shown in https://www.youtube.com/watch?v=WTONZ6T1LmA&ab_channel=AI_by_AI
