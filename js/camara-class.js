class Camara {
    constructor(videoNode) {
        this.videoNode = videoNode;
        console.log('Camara inicializada');
    }
    encender() {
        // Obtén las dimensiones del elemento de video
        const width = 300
        const height = 300

        // Agrega los atributos al elemento de video
        this.videoNode.setAttribute('autoplay', '');
        this.videoNode.setAttribute('muted', '');
        this.videoNode.setAttribute('playsinline', '');

        navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { width: width, height: height }
        }).then(stream => {
            this.videoNode.srcObject = stream;
            this.stream = stream;
        });
    }
    apagar() {
        this.videoNode.pause();
        if (this.stream) {
            this.stream.getTracks()[0].stop();
        }
    }
    tomarFoto() {
        // Obtén las dimensiones del elemento de video
        const width = this.videoNode.videoWidth;
        const height = this.videoNode.videoHeight;

        let canvas = document.createElement('canvas');
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        let context = canvas.getContext('2d');
        context.drawImage(this.videoNode, 0, 0, width, height);
        this.foto = context.canvas.toDataURL();
        canvas = null;
        context = null;
        return this.foto;
    }
}