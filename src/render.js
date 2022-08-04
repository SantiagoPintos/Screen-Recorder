const remote = require('@electron/remote');
const { Menu } = remote;

const { ipcRenderer } = require('electron')
const desktopCapturer = {
    getSources: (opts) => ipcRenderer.invoke('DESKTOP_CAPTURER_GET_SOURCES', opts)
}

const startBtn = document.getElementById('startBtn');
startBtn.onclick = e => {
  mediaRecorder.start();
  startBtn.classList.add('is-danger');
  startBtn.innerText = 'Recording';
};

const stopBtn = document.getElementById('stopBtn');
stopBtn.onclick = e => {
  mediaRecorder.stop();
  startBtn.classList.remove('is-danger');
  startBtn.innerText = 'Start';
};

//Obtener acceso a todas las pantallas disponibles en el sistema
const videoSelectBtn = document.getElementById('videoSelectBtn');
videoSelectBtn.onclick = getVideoSources;

async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
      types: ['window', 'screen']
    });

    const videoOptionsMenu = Menu.buildFromTemplate(
      inputSources.map(source => {
        console.log(source);
        return {
          label: source.name,
          click: () => selectSource(source)
        };
      })
    );
    videoOptionsMenu.popup();
}


let mediaRecorder;
const recordedChunks = [];
const videoElement = document.querySelector('video');

async function selectSource(source){
    videoSelectBtn.innerText = source.name;
    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id,
            }
        }
    }

    
    //chrome API
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    videoElement.srcObject = stream;
    videoElement.play();

    const options = { MimeType: 'video/mp4; codecs=vp9' };
    mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = handleDataAviable;
    mediaRecorder.onstop = handleStop;
}

function handleDataAviable(e){
    console.log('datos disponibles');
    recordedChunks.push(e.data);
}

const { dialog } = remote;
const { writeFile } = require('fs');

async function handleStop(e){
    const blob = new Blob(recordedChunks,{
        type: 'video/mp4; codecs=vp9'
    });
    
    const buffer = Buffer.from(await blob.arrayBuffer());

    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Guardar',
        defaultPath: `vid-${Date.now()}.mp4`
    });

    console.log(filePath);

    writeFile(filePath, buffer, () => console.log('video guardado'));
}