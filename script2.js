// Función asíncrona para configurar la cámara y obtener el stream de video
async function setupCamera() {
    // Obtiene el elemento de video del DOM
    const video = document.getElementById('video');
    // Solicita acceso a la cámara con una resolución de 320x240 sin audio
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
        audio: false
    });
    // Asigna el stream de video al elemento de video
    video.srcObject = stream;
    // Retorna una promesa que se resuelve cuando los metadatos del video se han cargado
    return new Promise(resolve => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

// Función principal asíncrona
async function main() {
    // Configura la cámara y espera a que esté lista
    const video = await setupCamera();
    video.play(); // Reproduce el video

    // Carga el modelo de handpose para la detección de manos
    const model = await handpose.load();

    // Obtiene los elementos de canvas y sus contextos de dibujo
    const leftCanvas = document.getElementById('izquierdaCanvas');
    const rightCanvas = document.getElementById('derechaCanvas');
    const leftCtx = leftCanvas.getContext('2d');
    const rightCtx = rightCanvas.getContext('2d');

    // Obtiene las imágenes y elementos de texto del DOM
    const pazImage = document.getElementById('paz');
    const chocaLos5Image = document.getElementById('chocaLos5Image');
    const p_chocalas = document.getElementById('p_chocalas')

    // Inicializa variables para almacenar las posiciones de las manos detectadas previamente
    let lastLeftHand = null;
    let lastRightHand = null;

    // Función asíncrona para detectar manos en el video
    async function detectHands() {
        // Estima las posiciones de las manos en el video
        const predictions = await model.estimateHands(video, true);

        // Limpia los canvas antes de dibujar
        leftCtx.clearRect(0, 0, leftCanvas.width, leftCanvas.height);
        rightCtx.clearRect(0, 0, rightCanvas.width, rightCanvas.height);

        // Inicializa variables para las manos izquierda y derecha
        let leftHand = null;
        let rightHand = null;

        // Itera sobre las predicciones para separar las manos izquierda y derecha
        predictions.forEach(prediction => {
            const landmarks = prediction.landmarks;
            // Calcula la posición horizontal promedio de la mano
            const centerX = (landmarks.reduce((sum, point) => sum + point[0], 0)) / landmarks.length;

            // Determina si la mano está a la izquierda o a la derecha del video
            if (centerX < video.videoWidth / 2) {
                leftHand = landmarks;
            } else {
                rightHand = landmarks;
            }
        });

        // Dibuja la mano izquierda si se ha detectado una o usa la última posición conocida
        if (leftHand || lastLeftHand) {
            drawHand(leftHand || lastLeftHand, leftCtx, 'blue');
            lastLeftHand = leftHand || lastLeftHand;
        }

        // Dibuja la mano derecha si se ha detectado una o usa la última posición conocida
        if (rightHand || lastRightHand) {
            drawHand(rightHand || lastRightHand, rightCtx, 'red');
            lastRightHand = rightHand || lastRightHand;
        }

        // Detecta gestos y muestra las imágenes correspondientes
        if (leftHand || rightHand) {
            const gesture = detectGesture(leftHand || rightHand);
            if (gesture === "chocaLos5") {
                chocaLos5Image.style.display = 'block';
                p_chocalas.style.display = 'block';
                
            }
        
        }

        // Llama a la función de detección de manos nuevamente en el próximo cuadro de animación
        requestAnimationFrame(detectHands);
    }

    // Función para detectar gestos basados en la posición de los puntos de referencia de la mano
    function detectGesture(landmarks) {
        if (!landmarks) return "ninguno";
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];

        // Define gestos basados en la posición vertical de los dedos
        if (thumbTip[1] < indexTip[1] && thumbTip[1] < middleTip[1]) {
            return "paz";
        } else if (thumbTip[1] > indexTip[1] && thumbTip[1] > middleTip[1]) {
            return "chocaLos5";
        } else {
            return "ninguno";
        }
    }

    // Función para dibujar una mano en el canvas
    function drawHand(landmarks, ctx, color) {
        ctx.fillStyle = color;
        // Dibuja cada punto de referencia como un círculo
        landmarks.forEach(([x, y]) => {
            const adjustedX = x / video.videoWidth * ctx.canvas.width;
            const adjustedY = y / video.videoHeight * ctx.canvas.height;
            ctx.beginPath();
            ctx.arc(adjustedX, adjustedY, 5, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    // Inicia la detección de manos
    detectHands();
}

// Llama a la función principal para iniciar todo el proceso
main();
