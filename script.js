// --- DOM Elements ---
const cameraIdInput = document.getElementById('camera-id-input');
const completeConsultationBtn = document.getElementById('complete-consultation-btn');

// Camera related DOM Elements
const startCameraBtn = document.getElementById('start-camera-btn');
const captureImageBtn = document.getElementById('capture-image-btn');
const cameraStreamElement = document.getElementById('camera-stream');
const imageCaptureCanvas = document.getElementById('image-capture-canvas');
const cameraPlaceholder = document.getElementById('camera-placeholder');
const imageCaptureStatus = document.getElementById('image-capture-status');

// --- Global Variables ---
let currentStream = null;
let capturedImageData = null; // To store the captured image data URL

// --- Simulation Logic ---

// Simulated mapping of Camera IDs to plates they might detect
async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Tu navegador no soporta el acceso a la cámara.");
        cameraPlaceholder.innerHTML = "<p><i class='fas fa-exclamation-triangle'></i> Tu navegador no soporta el acceso a la cámara.</p>";
        return;
    }

    try {
        currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        cameraStreamElement.srcObject = currentStream;
        cameraStreamElement.style.display = 'block';
        cameraPlaceholder.style.display = 'none';
        startCameraBtn.style.display = 'none';
        captureImageBtn.style.display = 'inline-flex';
        imageCaptureStatus.style.display = 'none'; // Hide status on new camera start
        capturedImageData = null; // Reset any previously captured image
    } catch (err) {
        console.error("Error al acceder a la cámara: ", err);
        let errorMessage = "<p><i class='fas fa-exclamation-triangle'></i> Error al acceder a la cámara.</p>";
        if (err.name === "NotAllowedError") {
            errorMessage += "<p>Has denegado el permiso para acceder a la cámara. Por favor, habilítalo en la configuración de tu navegador.</p>";
        } else if (err.name === "NotFoundError") {
            errorMessage += "<p>No se encontró una cámara compatible.</p>";
        } else {
            errorMessage += "<p>Detalles: " + err.message + "</p>";
        }
        cameraPlaceholder.innerHTML = errorMessage;
        cameraPlaceholder.style.display = 'flex';
        cameraStreamElement.style.display = 'none';
        startCameraBtn.style.display = 'inline-flex';
        captureImageBtn.style.display = 'none';
        imageCaptureStatus.style.display = 'none';
    }
}

function stopCameraStream() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    if (cameraStreamElement) cameraStreamElement.srcObject = null;
    if (cameraStreamElement) cameraStreamElement.style.display = 'none';
    if (cameraPlaceholder) {
        cameraPlaceholder.style.display = 'flex';
         // Reset placeholder text if needed
        cameraPlaceholder.innerHTML = '<p><i class="fas fa-video-slash"></i> Cámara no activada.</p><p>Presione "Activar Cámara" para iniciar la captura.</p>';
    }
    if (startCameraBtn) startCameraBtn.style.display = 'inline-flex';
    if (captureImageBtn) captureImageBtn.style.display = 'none';
}

function captureImage() {
    if (!currentStream || !cameraStreamElement.srcObject) {
        alert("La cámara no está activa. Por favor, activa la cámara primero.");
        return;
    }

    const context = imageCaptureCanvas.getContext('2d');
    imageCaptureCanvas.width = cameraStreamElement.videoWidth;
    imageCaptureCanvas.height = cameraStreamElement.videoHeight;
    context.drawImage(cameraStreamElement, 0, 0, imageCaptureCanvas.width, imageCaptureCanvas.height);

    capturedImageData = imageCaptureCanvas.toDataURL('image/png');
    
    // Update UI to show image captured
    if(imageCaptureStatus) {
        imageCaptureStatus.textContent = "✔️ Foto capturada con éxito. Presione 'Completar Consulta'.";
        imageCaptureStatus.style.display = 'block';
    } else {
        alert("Foto capturada. Presione 'Completar Consulta' para procesar.");
    }
    
}

function handleCompleteConsultation() {
    const cameraId = cameraIdInput.value.trim().toUpperCase();
    let plateToMonitor = null;
    let sourceOfPlate = "";

    // Si hay imagen capturada, envíala al backend y muestra la placa real en consola
    if (capturedImageData) {
        // Convertir dataURL a Blob
        function dataURLtoBlob(dataurl) {
            var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
                bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
            while(n--){
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new Blob([u8arr], {type:mime});
        }
        const imageBlob = dataURLtoBlob(capturedImageData);

        const formData = new FormData();
        formData.append('image', imageBlob, 'captura.jpg');
        fetch('http://127.0.0.1:5000/procesar_imagen', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // Imprime en consola la placa analizada por code_ORC.py
            console.log("Placa analizada por code_ORC.py:", data.mensaje);
            alert('Respuesta del backend: ' + data.mensaje);

            // Opcional: Redirigir o limpiar campos después de procesar
            stopCameraStream();
            cameraIdInput.value = '';
            capturedImageData = null;
            if(imageCaptureStatus) imageCaptureStatus.style.display = 'none';
        })
        .catch(error => {
            alert('Error al enviar la imagen: ' + error);
        });
        return; // No continuar con la simulación
    }

    // --- Simulación si no hay imagen ---
    if (cameraId) {
        plateToMonitor = cameraPlateMap[cameraId] || cameraPlateMap["DEFAULT"];
        sourceOfPlate = `el ID de cámara '${cameraId}'`;
    }

    if (plateToMonitor) {
        console.log("Placa simulada:", plateToMonitor);
        alert(`Procesando consulta con placa ${plateToMonitor} (obtenida de ${sourceOfPlate}).\nRedirigiendo a monitoreo...`);
        stopCameraStream();
        window.location.href = `monitoring.html?plate=${encodeURIComponent(plateToMonitor)}`;
        cameraIdInput.value = '';
        capturedImageData = null;
        if(imageCaptureStatus) imageCaptureStatus.style.display = 'none';
    } else {
        alert("Por favor, ingrese un ID de cámara o capture una foto antes de completar la consulta.");
        if(cameraIdInput && !capturedImageData) {
             cameraIdInput.focus();
        } else if (!currentStream && !capturedImageData) {
            if(startCameraBtn) startCameraBtn.focus();
        }
    }
}

// --- Event Listeners ---
if (cameraIdInput) {
    cameraIdInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default form submission if it's in a form
            handleCompleteConsultation();
        }
    });
} else {
    console.warn("Camera ID input element not found.");
}

if (completeConsultationBtn) {
    completeConsultationBtn.addEventListener('click', handleCompleteConsultation);
} else {
    console.warn("Complete consultation button not found.");
}

if (startCameraBtn) {
    startCameraBtn.addEventListener('click', startCamera);
} else {
    console.warn("Start camera button not found.");
}

if (captureImageBtn) {
    captureImageBtn.addEventListener('click', captureImage); 
} else {
    console.warn("Capture image button not found.");
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    if(cameraIdInput) {
        // autofocus is set in HTML, but good to ensure if logic changes
        // cameraIdInput.focus(); 
    }
    // Ensure camera is stopped if user navigates back/forward and stream was active
    // and the page reloads without re-running full JS initialization in some cases.
    if (cameraStreamElement && cameraStreamElement.srcObject) {
        // This check might be redundant if pagehide handles it, but defensive.
        if (!currentStream) { // If srcObject is set but currentStream is somehow null
             cameraStreamElement.srcObject.getTracks().forEach(track => track.stop());
             cameraStreamElement.srcObject = null;
        }
    }
    if (imageCaptureStatus) imageCaptureStatus.style.display = 'none'; // Initially hide
});

// Stop camera stream when the page is hidden (e.g., user switches tabs or navigates away)
window.addEventListener('pagehide', () => {
    if (currentStream) { // Only stop if it's our managed stream
        stopCameraStream();
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        // Optional: If you want to stop camera aggressively when tab is backgrounded
        // if (currentStream) {
        //     stopCameraStream();
        // }
    } else if (document.visibilityState === 'visible') {
        // Optional: re-initialize camera if it was stopped due to tab becoming hidden
        // This would require more complex state management (e.g., was camera meant to be on?)
        // For now, user has to click "Activar Cámara" again if it was stopped.
    }
});