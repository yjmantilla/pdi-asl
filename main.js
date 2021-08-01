//-----------------------------------------------------------------------------------------------
//-------Funciones de Procesamiento De Imagenes del Juego----------------------------------------
//-----------------------------------------------------------------------------------------------
//-------------Alexis Rafael del Carmen Ávila Ortiz--------CC 1083555169-------------------------
//------------ alexis.avila@udea.edu.co--------------------Wpp +57 305 2230574-------------------
//-----------------------------------------------------------------------------------------------
//-------------Yorguin José Mantilla Ramos-----------------CC 1127617499-------------------------
//-------------yorguinj.mantilla@udea.edu.co---------------Wpp +57 311 5154452-------------------
//-----------------------------------------------------------------------------------------------
//----------------------Estudiantes Facultad de Ingenieria  -------------------------------------
//--------Curso Básico de Procesamiento de Imágenes y Visión Artificial--------------------------
//---------------------------Abril de 2021-------------------------------------------------------
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
//-------Configuración de Elementos HTML---------------------------------------------------------
//-----------------------------------------------------------------------------------------------
const canvasElement = document.getElementById('canvas');    // Obtenemos el elmento html 'canvas' donde se pintara todo
document.getElementById("video").style.display="none";      // Ocultar video original de la webcam, solo queremos que se muestre el canvas
const video = document.getElementById('video');             // Obtenemos el elemento html donde esta el video
const canvas2 = document.getElementById('canvas2');    // Obtenemos el elmento html 'canvas' donde se pintara todo

//-----------------------------------------------------------------------------------------------
//-------Inicialización de lo Parámeros Configurables por el Usuario-----------------------------
//-----------------------------------------------------------------------------------------------
let game = {thr:15,max_vel:30};                             // Diccionario que configura propiedades del jueg
                                                            // Este diccionario define las propiedades y su valor inicial
                                                            // thr define la mínima velocidad en una sola componente (x o y)
                                                            // max_vel define la máxima norma (sqrt(x*x+y*y)) que puede tener la velocidad

let cfg={                                                   // Diccionario que define propiedades del procesamiento de imágenes
                                                            // Este diccionario define las propiedades y su valor inicial
    low_th:30,                                              // Umbral para el mínimo de intensidad en el proceso de binarización
    high_th:255,                                            // Umbral para el máximo de intensidad en el proceso de binarización
    color:'R',                                              // Color del objeto a detectar, debe ser 'R','G' o 'B'
    frame:'raw',                                            // Que imagen mostrar como fondo del juego
                                                            // Puede ser: 
                                                            // 'raw':cruda,
                                                            // 'blur':luego de transformacion rhb y difuminacion,
                                                            // 'the_color':capa del color elegida,
                                                            // 'grey':escala de grises,
                                                            // 'subtract':resta de la capa de color escogida - escala de grises,
                                                            // 'binary':binarizada por los umbrales,
                                                            // 'morph': luego de una difuminación y las transformaciones de morfologia
    segmentation: 'true',                                   // Indica si se hace el proceso de segmentación y reconocimiento o no
                                                            // Ya que se le da la opción al usuario de utilizar el teclado para mover su paleta
    blur_ksize:8,                                           // Tamaño del elemento estructurante para el blur
    morph_ksize:3,                                          // Tamaño del elemento estructurante para la morfología
    get_color:function(){                                   // Función que mapea colores a indices de un arreglo de color
        if(this.color=='R'){
            return 0;                                       // R:0
        }
        else if(this.color=='G'){
            return 1;                                       // G:1
        }
        else if(this.color=='B')
        {
            return 2;                                       // B:2
        }
    }
};



// Notice there is no 'import' statement. 'tf' is available on the index-page
// because of the script tag above.''
async function f1() {
    let model2 = await tf.loadLayersModel('model_tfjs\model.json');
    //console.log(x); // 10
    return model2
    }
    
f1().then(model=>{



//-----------------------------------------------------------------------------------------------
//-------Configuración de la Interfaz de Parámetros del Juego------------------------------------
//-----------------------------------------------------------------------------------------------
let gui = new dat.GUI({ autoPlace: true, width: 450 });                         // Instancia de dat.GUI para generar un panel de configuracion para el juego
let gameFolder = gui.addFolder('Game');                                         // Carpeta de configuración de propiedades del juego
gameFolder.add(game, 'max_vel', 20, 50).name('max_vel').step(1);                // Configuración de la velocidad máxima
gameFolder.add(game, 'thr', 10, 20).name('thr').step(1);                        // Configuración de la mínima velocidad en una sola componente de la velocidad

let cfgFolder = gui.addFolder('Processing');                                                 // Carpeta de configuracion de propiedades del procesado de imágenes
cfgFolder.add(cfg, 'low_th', 0, 255).name('low_th').step(1);                                 // Configuración del Umbral para el mínimo de intensidad en el proceso de binarización
cfgFolder.add(cfg, 'high_th', 0, 255).name('high_th').step(1);                               // Configuración del Umbral para el máximo de intensidad en el proceso de binarización
cfgFolder.add(cfg, 'color', ['R','G','B']);                                                  // Configuración del color del objeto a detectar
cfgFolder.add(cfg, 'frame', ['raw','blur','the_color','grey','subtract','binary','morph']);  // Configuración de la imagen mostrar como fondo del juego
cfgFolder.add(cfg, 'blur_ksize', 2, 100).name('blur_ksize').step(1);                         // Configuracion del tamaño del elemento estructurante del blur
cfgFolder.add(cfg, 'morph_ksize', 2, 10).name('morph_ksize').step(1);                        // Configuracion del tamaño del elemento estructurante del para la morfología
cfgFolder.add(cfg, 'segmentation',['true','false']);                                         // Configurar si hacer el proceso de segmentación y reconocimiento o no



//-----------------------------------------------------------------------------------------------
//-------Inicialización de Variables de OPENCV---------------------------------------------------
//-----------------------------------------------------------------------------------------------
const FPS = 30;                                                         // Frames por segundo a usar
let cap = new cv.VideoCapture(video);                                   // Instancia de la clase de captura de video de opencv
let streaming = true;                                                   // Booleano que indica si la camara esta transmitiendo video
let frame = new cv.Mat(video.height, video.width, cv.CV_8UC4);          // Reserva de una matriz frame que es la captura de la imagen de un video en un tiempo especifico
                                                                        // RGBA: 4 canales de unsigned integer 8
let dummyFrame = new cv.Mat(video.height, video.width, cv.CV_8UC4);     // Reserva de la matriz auxiliar que irá guardando la imagen actual en cada momento

let resizedFrame = new cv.Mat(64, 64, cv.CV_8UC4);
let dsize = new cv.Size(64,64);

function draw(frame,canvas='canvas'){
    let f;                                             // Variable auxiliar donde copiar el frame
    f = frame.clone();                                 // Clonar el frame para no alterar el espacio de memoria original
    cv.imshow(canvas,f);                             // Mostrar la imagen pintada en el canvas del html
    f.delete();                                        // Eliminamos variable para conservar memoria
}

//-----------------------------------------------------------------------------------------------
//-------Procesamiento de la imagen y su influencia en el juego----------------------------------
//-----------------------------------------------------------------------------------------------

function processVideo() {                               // Función que realiza todo el procesamiento
    try 
    {

//-------Inicialización, Reserva y Eliminación de Variables--------------------------------------


        if (!streaming) {                               // Si ya no se esta capturando video
            frame.delete();
            dummyFrame.delete();
            resizedFrame.delete();
            return;
        }

//-------Obtención de la Imagen Cruda------------------------------------------------------------

        cap.read(frame);                                        // Lectura del frame de la camara
        cv.flip(frame, frame, 1);                               // Giro en espejo del fondo, esto es para que concuerde 
                                                                // de forma intuitiva la imagen mostrada con la posición del usuario

//-------Conversion de RGBA a RGB----------------------------------------------------------------

        cv.cvtColor(frame, dummyFrame, cv.COLOR_RGBA2RGB);      // Conversión de RHBA a RGB

        draw(dummyFrame)

        cv.resize(dummyFrame, resizedFrame, dsize, 0, 0, cv.INTER_AREA);
        draw(resizedFrame,'canvas2')
        
        let example = tf.browser.fromPixels(canvas2);  // for example
        console.log(example)
        let prediction = model.predict(example);
        console.log(prediction)
        requestAnimationFrame(processVideo);                        // Pasa a procesar el siguiente frame cuando el browser este listo
    } 
    catch (err) {                                                   // Esto es un mecanismo de control de errores
        console.log(err);                                           // Imprimir el error en consola
        //requestAnimationFrame(processVideo);                      // Si quisieramos seguir intentando descomentariamos esto, pero es más seguro parar
    }
};


requestAnimationFrame(processVideo);                                // Esta es realmente la línea que inicia todo al llamar a proceesVideo por primera vez, sin ella no se hiciera nada

});


