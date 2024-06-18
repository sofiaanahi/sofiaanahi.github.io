// Función para configurar la cámara
async function setupCamera() {
    const video = document.getElementById('video'); // Obtiene el elemento de video del DOM
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 }, // Configura la resolución del video
        audio: false // Desactiva el audio
    });
    video.srcObject = stream; // Asigna el stream de video al elemento de video
    return new Promise(resolve => {
        video.onloadedmetadata = () => {
            resolve(video); // Resuelve la promesa una vez que los metadatos del video están cargados
        };
    });
}

// Función principal
async function main() {
    const video = await setupCamera(); // Configura la cámara y obtiene el elemento de video
    video.play(); // Reproduce el video

    const model = await handpose.load(); // Carga el modelo de Handpose

    const leftCanvas = document.getElementById('izquierdaCanvas'); // Obtiene el canvas para la mano izquierda
    const rightCanvas = document.getElementById('derechaCanvas'); // Obtiene el canvas para la mano derecha
    const leftCtx = leftCanvas.getContext('2d'); // Obtiene el contexto de dibujo para el canvas de la mano izquierda
    const rightCtx = rightCanvas.getContext('2d'); // Obtiene el contexto de dibujo para el canvas de la mano derecha

    // Función para detectar manos
    async function detectHands() {
        const predictions = await model.estimateHands(video, true); // Estima las manos en el video

        // Limpia ambos canvases
        leftCtx.clearRect(0, 0, leftCanvas.width, leftCanvas.height);
        rightCtx.clearRect(0, 0, rightCanvas.width, rightCanvas.height);

        let leftHand = null; // Inicializa la variable para la mano izquierda
        let rightHand = null; // Inicializa la variable para la mano derecha

        // Itera sobre cada predicción de mano
        predictions.forEach(prediction => {
            const landmarks = prediction.landmarks; // Obtiene los landmarks de la mano
            const centerX = (landmarks.reduce((sum, point) => sum + point[0], 0)) / landmarks.length; // Calcula el centro X de la mano

            // Determina si la mano está en el lado izquierdo o derecho del video
            if (centerX < video.width / 2) {
                leftHand = landmarks; // Asigna los landmarks a la mano izquierda
            } else {
                rightHand = landmarks; // Asigna los landmarks a la mano derecha
            }
        });

        // Dibuja la mano izquierda si existe
        if (leftHand) {
            drawHand(leftHand, leftCtx, 'blue');
        }

        // Dibuja la mano derecha si existe
        if (rightHand) {
            drawHand(rightHand, rightCtx, 'red');
        }

        requestAnimationFrame(detectHands); // Llama a detectHands en el siguiente frame
    }

    // Función para dibujar una mano
    function drawHand(landmarks, ctx, color) {
        ctx.fillStyle = color; // Establece el color de relleno
        landmarks.forEach(([x, y]) => {
            ctx.beginPath(); // Comienza un nuevo camino de dibujo
            ctx.arc(x, y, 5, 0, 2 * Math.PI); // Dibuja un círculo en cada landmark
            ctx.fill(); // Rellena el círculo
        });
    }

    detectHands(); // 

}

main(); // Ejecuta la función principal