var url = window.location.href;
var swLocation = '/MI DIARIO DE VIAJE/sw.js';

var swReg;

if (navigator.serviceWorker) {
    if (url.includes('localhost')) {
        swLocation = '/sw.js';
    }
    window.addEventListener('load', function () {
        navigator.serviceWorker.register(swLocation).then(function (reg) {
            swReg = reg;
            swReg.pushManager.getSubscription().then(verificaSuscripcion);
        });
    });
}

// Referencias de jQuery
var googleMapKey = 'AIzaSyA5mjCwx1TRLuBAjwQw84WE6h5ErSe7Uj8';

var postBtn = $('#post-btn');
var timeline = $('#timeline');
var modal = $('#modal');
var txtMensaje = $('#txtMensaje');
var btnLocation = $('#location-btn');
var modalMapa = $('.modal-mapa');
var btnActivadas = $('.btn-noti-activadas');
var btnDesactivadas = $('.btn-noti-desactivadas');
var btnTomarFoto = $('#tomar-foto-btn');
var btnPhoto = $('#photo-btn');
var contenedorCamara = $('.camara-contenedor');
var lat = null;
var lng = null;
var foto = null;

// El usuario, contiene el ID del héroe seleccionado
const camara = new Camara($('#player')[0]);
// ===== Codigo de la aplicación

function crearMensajeHTML(mensaje, lat, lng, foto) {

    var ahora = new Date();
    var hora = ahora.getHours();
    var minutos = ahora.getMinutes();
    var content = `<div class="chat-message outgoing shadow">
    <p class="mb-0"><strong>Tú:</strong> ${mensaje}</p>
    `;
    if (foto) {
        content += `
                <img  class="foto-mensaje rounded-2 my-3" width="100%" src="${foto}">
        `;
    };
    // si existe la latitud y longitud, 
    // llamamos la funcion para crear el mapa
    if (lat) {
        content += crearMensajeMapa(lat, lng);
    }
    content += `<p class="p-0 m-0" style="text-align: right;"><small>${hora}:${minutos}</small></p> </div>`;
    // Borramos la latitud y longitud por si las usó
    lat = null;
    lng = null;

    timeline.prepend(content);
}
function crearMensajeMapa(lat, lng) {
    return `
            <iframe allow="camera"
                class="w-100 my-3 rounded-2"
                height="250"
                frameborder="0"
                src="https://www.google.com/maps/embed/v1/view?key=${googleMapKey}&center=${lat},${lng}&zoom=17" allowfullscreen>
            </iframe>
    `;
}
// Globals
function logIn(ingreso) {

    if (ingreso) {
        timeline.removeClass('oculto');
    } else {
        timeline.addClass('oculto');
    }
}
// Boton de enviar mensaje
postBtn.on('click', function () {

    var mensaje = txtMensaje.val();
    if (mensaje.length === 0) {
        return;
    }
    var data = {
        mensaje: mensaje,
        lat: lat,
        lng: lng,
        foto: foto
    };
    fetch('api', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then(res => console.log('app.js', res))
        .catch(err => console.log('app.js error:', err));
    //camera.apagar();
    contenedorCamara.addClass('oculto');
    crearMensajeHTML(mensaje, lat, lng, foto);
    lat = null;
    lng = null;
    foto = null;
    $('.modal-mapa').addClass('oculto');
    txtMensaje.val('');
});

// Obtener mensajes del servidor
function getMensajes() {

    fetch('api')
        .then(res => res.json())
        .then(posts => {


            posts.forEach(post =>
                crearMensajeHTML(post.mensaje, post.lat, post.lng, post.foto));
        });
}
getMensajes();

// Detectar cambios de conexión
function isOnline() {

    if (navigator.onLine) {
        // tenemos conexión
        // console.log('online');
        $.mdtoast('Online', {
            interaction: true,
            interactionTimeout: 1000,
            actionText: 'OK!'
        });
    } else {
        // No tenemos conexión
        $.mdtoast('Offline', {
            interaction: true,
            actionText: 'OK',
            type: 'warning'
        });
    }
}
window.addEventListener('online', isOnline);
window.addEventListener('offline', isOnline);

isOnline();

// Notificaciones
function verificaSuscripcion(activadas) {
    if (activadas) {

        btnActivadas.removeClass('oculto');
        btnDesactivadas.addClass('oculto');
    } else {
        btnActivadas.addClass('oculto');
        btnDesactivadas.removeClass('oculto');
    }
}
function enviarNotificacion() {

    const notificationOpts = {
        body: 'Este es el cuerpo de la notificación',
        icon: 'img/icons/icon-72x72.png'
    };

    const n = new Notification('Hola Mundo', notificationOpts);
    n.onclick = () => {
        console.log('Click');
    };
}
function notificarme() {

    if (!window.Notification) {
        console.log('Este navegador no soporta notificaciones');
        return;
    }

    if (Notification.permission === 'granted') {

        // new Notification('Hola Mundo! - granted');
        enviarNotificacion();

    } else if (Notification.permission !== 'denied' || Notification.permission === 'default') {

        Notification.requestPermission(function (permission) {

            console.log(permission);

            if (permission === 'granted') {
                // new Notification('Hola Mundo! - pregunta');
                enviarNotificacion();
            }

        });

    }
}
// notificarme();
// Get Key
function getPublicKey() {

    // fetch('api/key')
    //     .then( res => res.text())
    //     .then( console.log );

    return fetch('api/key')
        .then(res => res.arrayBuffer())
        // returnar arreglo, pero como un Uint8array
        .then(key => new Uint8Array(key));
}

// getPublicKey().then( console.log );
btnDesactivadas.on('click', function () {

    if (!swReg) return console.log('No hay registro de SW');

    getPublicKey().then(function (key) {

        swReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: key
        })
            .then(res => res.toJSON())
            .then(suscripcion => {

                // console.log(suscripcion);
                fetch('api/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(suscripcion)
                })
                    .then(verificaSuscripcion)
                    .catch(cancelarSuscripcion);
            });
    });

});

function cancelarSuscripcion() {

    swReg.pushManager.getSubscription().then(subs => {

        subs.unsubscribe().then(() => verificaSuscripcion(false));
    });

}

btnActivadas.on('click', function () {
    cancelarSuscripcion();

});

// Crear mapa en el modal
function mostrarMapaModal(lat, lng) {

    $('.modal-mapa').remove();

    var content = `
            <div class="modal-mapa">
                <iframe
                    width="100%"
                    height="250"
                    frameborder="0"
                    src="https://www.google.com/maps/embed/v1/view?key=${googleMapKey}&center=${lat},${lng}&zoom=17" allowfullscreen>
                    </iframe>
            </div>
    `;
    modal.append(content);
}

// Sección 11 - Recursos Nativos

// Obtener la geolocalización
btnLocation.on('click', () => {

    // console.log('Botón geolocalización');
    $.mdtoast('Cargado mapa...', {
        interaction: true,
        interactionTimeout: 2000,
        actionText: 'Ok'
    });
    navigator.geolocation.getCurrentPosition(pos => {
        console.log(pos);
        mostrarMapaModal(pos.coords.latitude, pos.coords.longitude);
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
    });
});

// Boton de la camara
// usamos la funcion de fleca para prevenir
// que jQuery me cambie el valor del this
btnPhoto.on('click', () => {

    //console.log('Inicializar camara');
    contenedorCamara.removeClass('oculto')
    camara.encender();
});


// Boton para tomar la foto
btnTomarFoto.on('click', () => {

    console.log('Botón tomar foto');
    foto = camara.tomarFoto();
    camara.apagar();
    //console.log(foto);
});


// Share API
