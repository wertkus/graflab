"use strict";

var canvas;
var gl;

// Mermi Değişkenleri
var Move_Missile_X = 0.0; 
var Move_Missile_Y = 0.0; 
var Move_Missile_X_Loc;
var Move_Missile_Y_Loc;

var fireMissile = 0;  // bool
// Mermi hızı (X ekseninde hareket edecek şekilde ayarlandı çünkü çizim sağa bakıyor)
var Missile_Speed = 0.02; 

// Tank Merkez Noktası (Yeni koordinatlara göre yaklaşık orta nokta)
// Bu nokta etrafında dönme işlemi gerçekleşecek.
var centerTank_X = -0.75; 
var centerTank_Y = 0.8; 
var centerTank_X_Loc;
var centerTank_Y_Loc;

var MoveTank = 0;  // bool
var moveTank_X = 0.0; 
var moveTank_Y = 0.0; 
var moveTank_X_Loc;
var moveTank_Y_Loc;

// Açılar
var theta = 0.0;       // Gövde açısı
var turretTheta = 0.0; // Namlu (kule) açısı
var thetaLoc;

var vertexElem;
var vertexShader;
var vertexElem_Missile;
var vertexShader_Missile;
var fragmentElem_1;
var fragmentShader_1;
var fragmentElem_2;
var fragmentShader_2;
var program_1;
var program_2;

var Key;
var KeyCode;

function keyFunction(event) 
{
    Key = event.key;
    KeyCode = event.code;
                
    // --- GÖVDE KONTROLLERİ ---
    if(KeyCode == "KeyA") // Tank Sola Dön (Gövde)
    {
        theta += 0.03;
    }
    
    if(KeyCode == "KeyD") // Tank Sağa Dön (Gövde) 
    {
        theta -= 0.03;
    }
    
    if(KeyCode == "KeyW") // Tank İleri Git
    {
        MoveTank = 1;
    }

    // --- NAMLU KONTROLLERİ (YENİ) ---
    if(KeyCode == "KeyZ") // Namlu Sola Dön
    {
        turretTheta += 0.03;
    }

    if(KeyCode == "KeyC") // Namlu Sağa Dön
    {
        turretTheta -= 0.03;
    }
    
    // --- MERMİ KONTROLLERİ ---
    if(KeyCode == "KeyF") // Ateşle
    {
        fireMissile = 1;
    }

    if(KeyCode == "KeyR") // RELOAD (YENİ: Mermiyi namlu ucuna geri getir)
    {
        fireMissile = 0;
        Move_Missile_X = 0.0;
        Move_Missile_Y = 0.0;
    }
}
            

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = canvas.getContext('webgl2');
    if (!gl) alert( "WebGL 2.0 isn't available" );

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);
    
    // Shader Derlemeleri
    vertexElem = document.getElementById( "vertex-shader" );
    vertexShader = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource( vertexShader, vertexElem.textContent.replace(/^\s+|\s+$/g, '' ));
    gl.compileShader( vertexShader );
    
    vertexElem_Missile = document.getElementById( "vertex-shader-missile" );
    vertexShader_Missile = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource( vertexShader_Missile, vertexElem_Missile.textContent.replace(/^\s+|\s+$/g, '' ));
    gl.compileShader( vertexShader_Missile );

    fragmentElem_1 = document.getElementById( "fragment-shader-1" );
    fragmentShader_1 = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource( fragmentShader_1, fragmentElem_1.textContent.replace(/^\s+|\s+$/g, '' ) );
    gl.compileShader( fragmentShader_1 );
    
    fragmentElem_2 = document.getElementById( "fragment-shader-2" );
    fragmentShader_2 = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource( fragmentShader_2, fragmentElem_2.textContent.replace(/^\s+|\s+$/g, '' ) );
    gl.compileShader( fragmentShader_2 );   
    
    render();
    
    addEventListener('keypress', keyFunction);
};

function render() 
{
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // --- GÖVDE HAREKET HESAPLAMASI (Sadece Theta kullanılır) ---
    let sin_t = Math.sin(theta);
    let cos_t = Math.cos(theta);
    
    // Tankın çizimi sağa baktığı için (X ekseni), hareket vektörü X tabanlıdır.
    let Tank_Dir_X = Missile_Speed * cos_t;
    let Tank_Dir_Y = Missile_Speed * sin_t;
    
    if(MoveTank == 1)
    { 
        centerTank_X += Tank_Dir_X;   
        centerTank_Y += Tank_Dir_Y;  
        
        moveTank_X += Tank_Dir_X; 
        moveTank_Y += Tank_Dir_Y; 
    }  
    
    // --- MERMİ YÖN HESAPLAMASI (Theta + TurretTheta kullanılır) ---
    // Mermi namlunun baktığı yere gitmeli.
    let totalTheta = theta + turretTheta;
    let sin_total = Math.sin(totalTheta);
    let cos_total = Math.cos(totalTheta);

    let Missile_Dir_X = Missile_Speed * cos_total;
    let Missile_Dir_Y = Missile_Speed * sin_total;


    // -------------------------------------------------------
    // 1. TANK GÖVDESİ (HULL) ÇİZİMİ
    // -------------------------------------------------------
    var vertices_hull = new Float32Array([
        -0.9, 0.9, -0.9, 0.7, -0.6, 0.9,
        -0.9, 0.7, -0.6, 0.7, -0.6, 0.9
    ]);
    
    var buffer_hull = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer_hull);
    gl.bufferData(gl.ARRAY_BUFFER, vertices_hull, gl.STATIC_DRAW);
    
    program_1 = gl.createProgram();
    gl.attachShader( program_1, vertexShader );
    gl.attachShader( program_1, fragmentShader_1 );
    gl.linkProgram( program_1 );    
    gl.useProgram( program_1 );

    var positionLoc_1 = gl.getAttribLocation(program_1, "vPosition");
    gl.vertexAttribPointer(positionLoc_1, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc_1);

    thetaLoc = gl.getUniformLocation(program_1, "vTheta");
    gl.uniform1f(thetaLoc, theta); // Gövde sadece kendi açısıyla döner
                
    centerTank_X_Loc = gl.getUniformLocation(program_1, "v_centerTank_X");
    gl.uniform1f(centerTank_X_Loc, centerTank_X);   
    centerTank_Y_Loc = gl.getUniformLocation(program_1, "v_centerTank_Y");
    gl.uniform1f(centerTank_Y_Loc, centerTank_Y);   

    moveTank_X_Loc = gl.getUniformLocation(program_1, "v_moveTank_X");      
    gl.uniform1f(moveTank_X_Loc, moveTank_X);   
    moveTank_Y_Loc = gl.getUniformLocation(program_1, "v_moveTank_Y");      
    gl.uniform1f(moveTank_Y_Loc, moveTank_Y);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    // -------------------------------------------------------
    // 2. KULE (TURRET) ÇİZİMİ
    // -------------------------------------------------------
    var vertices_turret = new Float32Array([
        -0.7, 0.85, -0.7, 0.75, -0.8, 0.75,
        -0.7, 0.85, -0.8, 0.75, -0.8, 0.85,
        
        -0.7, 0.81, -0.7, 0.79, -0.45, 0.79,
        -0.7, 0.81, -0.45, 0.81, -0.45, 0.79
    ]);
    
    var buffer_turret = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer_turret);
    gl.bufferData(gl.ARRAY_BUFFER, vertices_turret, gl.STATIC_DRAW);
    
    program_2 = gl.createProgram();
    gl.attachShader( program_2, vertexShader );
    gl.attachShader( program_2, fragmentShader_2 );
    gl.linkProgram( program_2 );    
    gl.useProgram( program_2 );

    var positionLoc_2 = gl.getAttribLocation(program_2, "vPosition");
    gl.vertexAttribPointer(positionLoc_2, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc_2);

    thetaLoc = gl.getUniformLocation(program_2, "vTheta");
    // Kule hem tankın açısını hem kendi açısını alır
    gl.uniform1f(thetaLoc, theta + turretTheta);  

    centerTank_X_Loc = gl.getUniformLocation(program_2, "v_centerTank_X");
    gl.uniform1f(centerTank_X_Loc, centerTank_X);
    centerTank_Y_Loc = gl.getUniformLocation(program_2, "v_centerTank_Y");
    gl.uniform1f(centerTank_Y_Loc, centerTank_Y);
    
    moveTank_X_Loc = gl.getUniformLocation(program_2, "v_moveTank_X");      
    gl.uniform1f(moveTank_X_Loc, moveTank_X);   
    moveTank_Y_Loc = gl.getUniformLocation(program_2, "v_moveTank_Y");      
    gl.uniform1f(moveTank_Y_Loc, moveTank_Y);
    
    gl.drawArrays(gl.TRIANGLES, 0, 12);
    
    // -------------------------------------------------------
    // 3. MERMİ (MISSILE) ÇİZİMİ
    // -------------------------------------------------------
    var vertices_missile = new Float32Array([
        -0.44, 0.81, -0.44, 0.79, -0.42, 0.80,
    ]);
    
    var buffer_missile = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer_missile);
    gl.bufferData(gl.ARRAY_BUFFER, vertices_missile, gl.STATIC_DRAW);
    
    // Shader programı aynı kalabilir (program_2) veya yeniden linklenebilir
    // Burada program_2'yi tekrar attach ediyoruz ama shader_missile vertex ile
    var program_missile = gl.createProgram(); // program_2 yerine yeni isim daha temiz olur
    gl.attachShader( program_missile, vertexShader_Missile );
    gl.attachShader( program_missile, fragmentShader_2 );
    gl.linkProgram( program_missile );    
    gl.useProgram( program_missile );

    var positionLoc_M = gl.getAttribLocation(program_missile, "vPosition");
    gl.vertexAttribPointer(positionLoc_M, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc_M);

    thetaLoc = gl.getUniformLocation(program_missile, "vTheta");
    // Mermi de kule ile aynı açıda dönmeli
    gl.uniform1f(thetaLoc, theta + turretTheta);  
    
    centerTank_X_Loc = gl.getUniformLocation(program_missile, "v_centerTank_X");
    gl.uniform1f(centerTank_X_Loc, centerTank_X);   
    centerTank_Y_Loc = gl.getUniformLocation(program_missile, "v_centerTank_Y");
    gl.uniform1f(centerTank_Y_Loc, centerTank_Y);
    
    moveTank_X_Loc = gl.getUniformLocation(program_missile, "v_moveTank_X");      
    gl.uniform1f(moveTank_X_Loc, moveTank_X);  
    moveTank_Y_Loc = gl.getUniformLocation(program_missile, "v_moveTank_Y");      
    gl.uniform1f(moveTank_Y_Loc, moveTank_Y);   
    
    if(fireMissile == 1)
    {
        // Mermi sadece ateşlendiğinde o anki namlu yönünde ilerler
        // Not: Gerçekçi olması için ateşlendiği andaki açıyı kilitlemek gerekir ama
        // şimdilik dinamik olarak namlu ucundan gitmesini sağlıyoruz.
        Move_Missile_X += Missile_Dir_X; 
        Move_Missile_Y += Missile_Dir_Y; 
    }   
    
    Move_Missile_X_Loc = gl.getUniformLocation(program_missile, "v_Move_Missile_X");
    gl.uniform1f(Move_Missile_X_Loc, Move_Missile_X);   
    Move_Missile_Y_Loc = gl.getUniformLocation(program_missile, "v_Move_Missile_Y");
    gl.uniform1f(Move_Missile_Y_Loc, Move_Missile_Y);   
    
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    
    MoveTank = 0;

    requestAnimationFrame(render);
}