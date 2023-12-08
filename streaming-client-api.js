//working DONOTEDIT
//CMD C:\Projects\DID\streams_Oct>node app.js on http://localhost:3000/

'use strict';
import DID_API from './api.json' assert { type: 'json' };

if (DID_API.key == '🤫') alert('Please put your API key inside ./api.json and restart.');

// Load the OpenAI API from file new 10/23 
let OPENAI_API_KEY;
fetch('./config.json')
  .then((response) => response.json())
  .then(async (config) => {
    OPENAI_API_KEY = config.OPENAI_API_KEY;
  })
  .catch((error) => {
    console.error('Error loading config.json:', error);
  });

// OpenAI API endpoint set up new 10/23 
async function fetchOpenAIResponse(messageGpt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: messageGpt,
      temperature: 0.7,
      max_tokens: 200
    }),
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API request failed with status ${response.status}`);
  }
  const data = await response.json();
  return data.choices[0].message.content.trim();
}
  
//same  - No edits from Github example for this whole section
const RTCPeerConnection = (
  window.RTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.mozRTCPeerConnection
).bind(window);

let peerConnection;
let streamId;
let sessionId;
let sessionClientAnswer;

let statsIntervalId;
let videoIsPlaying;
let lastBytesReceived;

const talkVideo = document.getElementById('talk-video');
talkVideo.setAttribute('playsinline', '');
const peerStatusLabel = document.getElementById('peer-status-label');
const iceStatusLabel = document.getElementById('ice-status-label');
const iceGatheringStatusLabel = document.getElementById('ice-gathering-status-label');
const signalingStatusLabel = document.getElementById('signaling-status-label');
const streamingStatusLabel = document.getElementById('streaming-status-label');

const connectButton = document.getElementById('connect-button');
connectButton.onclick = async () => {
  if (peerConnection && peerConnection.connectionState === 'connected') {
    return;
  }

  stopAllStreams();
  closePC();

  const sessionResponse = await fetch(`${DID_API.url}/talks/streams`, {
    method: 'POST',
    headers: {'Authorization': `Basic ${DID_API.key}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      source_url: "https://raw.githubusercontent.com/jjmlovesgit/D-id_Streaming_Chatgpt/main/oracle_pic.jpg",
    }),
  });

  const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json()
  streamId = newStreamId;
  sessionId = newSessionId;
  
  try {
    sessionClientAnswer = await createPeerConnection(offer, iceServers);
  } catch (e) {
    console.log('error during streaming setup', e);
    stopAllStreams();
    closePC();
    return;
  }

  const sdpResponse = await fetch(`${DID_API.url}/talks/streams/${streamId}/sdp`,
    {
      method: 'POST',
      headers: {Authorization: `Basic ${DID_API.key}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({answer: sessionClientAnswer, session_id: sessionId})
    });
};

// This is changed to accept the ChatGPT response as Text input to D-ID #138 responseFromOpenAI 
const talkButton = document.getElementById('talk-button');
const sysPrompt= "You are a mental health therapist specialized in assisting children who are being bullied. Your primary goal is to create a conversational, safe, and empowering environment for these children. Begin by acknowledging and validating the child's feelings and experiences with bullying. It's important to express empathy and understanding, showing that you're there to listen and support them. Ensure that the child feels the space is safe for sharing their feelings. Reinforce that all emotions they are experiencing are valid and it’s okay to feel upset or scared. Your responses should be nurturing and non-judgmental. Encourage the child to share their experiences at their own pace. Use open-ended questions that allow them to express more about what they're going through, without feeling pressured. Show that you value their perspective and that their voice is important. Avoid suggesting solutions immediately. Instead, focus on making the child feel heard and understood. Offer support and let them know that when they're ready, you can explore ways to help them feel better. Conclude your interactions with reassurance of confidentiality and ongoing support."
const conversation_alone="Therapist: Hello there, I'm glad you came in today. How are you feeling?Teenager: I don't know, just kinda alone, you know? Like nobody really gets what I'm going through.Therapist: I hear you. It can be tough when you feel like you're on your own. Can you tell me more about why you're feeling this way?Teenager: I guess it's just everything - school, family stuff, and even when I try to talk about it, it feels like nobody really gets it. I'm just tired of feeling like this.Therapist: It sounds like you're going through a challenging time. Do you feel comfortable sharing more about what's been on your mind lately?Teenager: Yeah, but I don't want to burden them. Plus, I don't think they'll really understand. It's like I'm trapped in my own head.Therapist: It's understandable that you might be worried about burdening others. It's important to remember that people who care about you often want to know what you're going through. Maybe there's a way to express yourself that feels safe for you.Teenager: I don't even know where to start. It just feels like nobody really cares.Therapist: I hear you, and I want you to know that I care. Sometimes it takes time to find the right words or the right person to talk to. How about we work together to explore some ways you might feel more connected or understood?Teenager: I guess that could help. I just don't want to feel like this anymore.Therapist: That's a great first step. We can take it one step at a time, and I'm here to support you. Is there something specific you'd like to focus on or explore in our sessions.Teenager: I don't know, maybe just figuring out how to talk to my friends without feeling like I'm a burden.Therapist: That's a valid concern. We can work on communication strategies and ways to express yourself authentically. It's important to build connections that feel supportive. How does that sound to you?Teenager: Yeah, I think that could be helpful. I just want things to get better.Therapist: I understand. It's okay to want things to improve. We'll work together on strategies and coping mechanisms. In the meantime, remember that you're not alone, and it's okay to ask for help.Teenager: Thanks. I appreciate that. It's just hard sometimes, you know?Therapist: Absolutely, it can be challenging. I'm here to support you through the challenges. Let's take this one step at a time, and we'll find ways to make things more manageable for you."
// const conversation_bullying=
const messageGpt = [{role:"system", content:`You are a helpful, respectful and honest assistant. Always answer as helpfully as possible, while being safe.  Your answers should not include any harmful, unethical, racist, sexist, toxic, dangerous, or illegal content. Please ensure that your responses are socially unbiased and positive in nature.Act like a therapist. ${sysPrompt} Make sure that you do not ask a lot of questions.Only ask questions when needed. Do not exceed your responses beyond 3 sentences. Max_tokens should be 70`}]
talkButton.onclick = async () => {
  if (peerConnection?.signalingState === 'stable' || peerConnection?.iceConnectionState === 'connected') {
    //
    // New from Jim 10/23 -- Get the user input from the text input field get ChatGPT Response
    const userInput = document.getElementById('user-input-field').value;
    messageGpt.push({role:"user",content:userInput})
    const responseFromOpenAI = await fetchOpenAIResponse(messageGpt);
    messageGpt.push({role:"assistant",content:responseFromOpenAI})
    console.log(messageGpt)
    //
    // Print the openAIResponse to the console
    console.log("OpenAI Response:", responseFromOpenAI);
    
    const talkResponse = await fetch(`${DID_API.url}/talks/streams/${streamId}`, {
      method: 'POST',
      headers: { 
        Authorization: `Basic ${DID_API.key}`, 
        'Content-Type': 'application/json'
     },
      body: JSON.stringify({
        script: {
          type: 'text',
          subtitles: 'false',
          provider: { type: 'microsoft', voice_id: 'en-US-ChristopherNeural' },
          ssml: false,
          input: responseFromOpenAI  //send the openAIResponse to D-id
        },
        config: {
          fluent: true,
          pad_audio: 0,
          driver_expressions: {
            expressions: [{ expression: 'neutral', start_frame: 0, intensity: 0 }],
            transition_frames: 0
          },
          align_driver: true,
          align_expand_factor: 0,
          auto_match: true,
          motion_factor: 0,
          normalization_factor: 0,
          sharpen: true,
          stitch: true,
          result_format: 'mp4'
        },
        'driver_url': 'bank://lively/',
        'config': {
          'stitch': true,
        },
        'session_id': sessionId
      })
    });
  }
};



if ("webkitSpeechRecognition" in window) {
  let speechRecognition = new webkitSpeechRecognition();
  let final_transcript = "";

  speechRecognition.continuous = true;
  speechRecognition.interimResults = true;
  speechRecognition.lang = 'en-US'; 
  speechRecognition.onstart = () => {
    document.querySelector("#status").style.display = "block";
  };
  speechRecognition.onerror = () => {
    document.querySelector("#status").style.display = "none";
    console.log("Speech Recognition Error");
  };
  speechRecognition.onend = () => {
    document.querySelector("#status").style.display = "none";
    console.log("Speech Recognition Ended");
  };

  speechRecognition.onresult = (event) => {
    let interim_transcript = "";
    final_transcript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final_transcript += event.results[i][0].transcript;
      } else {
        interim_transcript += event.results[i][0].transcript;
      }
    }
    document.querySelector("#final").innerHTML = final_transcript;
    document.querySelector("#interim").innerHTML = interim_transcript;
  };

  document.querySelector("#record").onclick = () => {
    document.querySelector("#final").innerHTML = "";
    document.querySelector("#interim").innerHTML = "";
    speechRecognition.start();
  };

  const stopButton = document.getElementById('stop');
  stopButton.onclick = async () => {
    speechRecognition.stop();
    if (peerConnection?.signalingState === 'stable' || peerConnection?.iceConnectionState === 'connected') {
      //
      // New from Jim 10/23 -- Get the user input from the text input field get ChatGPT Response
      const userInput = document.getElementById('final').innerHTML;
      messageGpt.push({role:"user",content:userInput})
      const responseFromOpenAI = await fetchOpenAIResponse(messageGpt);
      messageGpt.push({role:"assistant",content:responseFromOpenAI})
      console.log(messageGpt)
      //
      // Print the openAIResponse to the console
      console.log("OpenAI Response:", responseFromOpenAI);
      //
      const talkResponse = await fetch(`${DID_API.url}/talks/streams/${streamId}`, {
        method: 'POST',
        headers: { 
          Authorization: `Basic ${DID_API.key}`, 
          'Content-Type': 'application/json'
      },
        body: JSON.stringify({
          script: {
            type: 'text',
            subtitles: 'false',
            provider: { type: 'microsoft', voice_id: 'en-US-ChristopherNeural' },
            ssml: false,
            input: responseFromOpenAI  //send the openAIResponse to D-id
          },
          config: {
            fluent: true,
            pad_audio: 0,
            driver_expressions: {
              expressions: [{ expression: 'neutral', start_frame: 0, intensity: 0 }],
              transition_frames: 0
            },
            align_driver: true,
            align_expand_factor: 0,
            auto_match: true,
            motion_factor: 0,
            normalization_factor: 0,
            sharpen: true,
            stitch: true,
            result_format: 'mp4'
          },
          'driver_url': 'bank://lively/',
          'config': {
            'stitch': true,
          },
          'session_id': sessionId
        })
      });
    }
  };


} else {
  console.log("Speech Recognition Not Available");
}









// NOTHING BELOW THIS LINE IS CHANGED FROM ORIGNAL D-id File Example
//

const destroyButton = document.getElementById('destroy-button');
destroyButton.onclick = async () => {
  await fetch(`${DID_API.url}/talks/streams/${streamId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId }),
  });

  stopAllStreams();
  closePC();
};

function onIceGatheringStateChange() {
  iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
  iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
}
function onIceCandidate(event) {
  console.log('onIceCandidate', event);
  if (event.candidate) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate;

    fetch(`${DID_API.url}/talks/streams/${streamId}/ice`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate,
        sdpMid,
        sdpMLineIndex,
        session_id: sessionId,
      }),
    });
  }
}
function onIceConnectionStateChange() {
  iceStatusLabel.innerText = peerConnection.iceConnectionState;
  iceStatusLabel.className = 'iceConnectionState-' + peerConnection.iceConnectionState;
  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
    stopAllStreams();
    closePC();
  }
}
function onConnectionStateChange() {
  // not supported in firefox
  peerStatusLabel.innerText = peerConnection.connectionState;
  peerStatusLabel.className = 'peerConnectionState-' + peerConnection.connectionState;
}
function onSignalingStateChange() {
  signalingStatusLabel.innerText = peerConnection.signalingState;
  signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
}

function onVideoStatusChange(videoIsPlaying, stream) {
  let status;
  if (videoIsPlaying) {
    status = 'streaming';
    const remoteStream = stream;
    setVideoElement(remoteStream);
  } else {
    status = 'empty';
    playIdleVideo();
  }
  streamingStatusLabel.innerText = status;
  streamingStatusLabel.className = 'streamingState-' + status;
}

function onTrack(event) {
  /**
   * The following code is designed to provide information about wether currently there is data
   * that's being streamed - It does so by periodically looking for changes in total stream data size
   *
   * This information in our case is used in order to show idle video while no talk is streaming.
   * To create this idle video use the POST https://api.d-id.com/talks endpoint with a silent audio file or a text script with only ssml breaks 
   * https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html#break-tag
   * for seamless results use `config.fluent: true` and provide the same configuration as the streaming video
   */

  if (!event.track) return;

  statsIntervalId = setInterval(async () => {
    const stats = await peerConnection.getStats(event.track);
    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
        const videoStatusChanged = videoIsPlaying !== report.bytesReceived > lastBytesReceived;

        if (videoStatusChanged) {
          videoIsPlaying = report.bytesReceived > lastBytesReceived;
          onVideoStatusChange(videoIsPlaying, event.streams[0]);
        }
        lastBytesReceived = report.bytesReceived;
      }
    });
  }, 500);
}

async function createPeerConnection(offer, iceServers) {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection({ iceServers });
    peerConnection.addEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
    peerConnection.addEventListener('icecandidate', onIceCandidate, true);
    peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange, true);
    peerConnection.addEventListener('signalingstatechange', onSignalingStateChange, true);
    peerConnection.addEventListener('track', onTrack, true);
  }

  await peerConnection.setRemoteDescription(offer);
  console.log('set remote sdp OK');

  const sessionClientAnswer = await peerConnection.createAnswer();
  console.log('create local sdp OK');

  await peerConnection.setLocalDescription(sessionClientAnswer);
  console.log('set local sdp OK');

  return sessionClientAnswer;
}

function setVideoElement(stream) {
  if (!stream) return;
  talkVideo.srcObject = stream;
  talkVideo.loop = false;

  // safari hotfix
  if (talkVideo.paused) {
    talkVideo
      .play()
      .then((_) => {})
      .catch((e) => {});
  }
}

function playIdleVideo() {
  talkVideo.srcObject = undefined;
  talkVideo.src = 'oracle_Idle.mp4';
  talkVideo.loop = true;
}

function stopAllStreams() {
  if (talkVideo.srcObject) {
    console.log('stopping video streams');
    talkVideo.srcObject.getTracks().forEach((track) => track.stop());
    talkVideo.srcObject = null;
  }
}

function closePC(pc = peerConnection) {
  if (!pc) return;
  console.log('stopping peer connection');
  pc.close();
  pc.removeEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
  pc.removeEventListener('icecandidate', onIceCandidate, true);
  pc.removeEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
  pc.removeEventListener('connectionstatechange', onConnectionStateChange, true);
  pc.removeEventListener('signalingstatechange', onSignalingStateChange, true);
  pc.removeEventListener('track', onTrack, true);
  clearInterval(statsIntervalId);
  iceGatheringStatusLabel.innerText = '';
  signalingStatusLabel.innerText = '';
  iceStatusLabel.innerText = '';
  peerStatusLabel.innerText = '';
  console.log('stopped peer connection');
  if (pc === peerConnection) {
    peerConnection = null;
  }
}

const maxRetryCount = 3;
const maxDelaySec = 4;
// Default of 1 moved to 5
async function fetchWithRetries(url, options, retries = 3) {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (retries <= maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries) / 4 + Math.random(), maxDelaySec) * 1000;

      await new Promise((resolve) => setTimeout(resolve, delay));

      console.log(`Request failed, retrying ${retries}/${maxRetryCount}. Error ${err}`);
      return fetchWithRetries(url, options, retries + 1);
    } else {
      throw new Error(`Max retries exceeded. error: ${err}`);
    }
  }
}