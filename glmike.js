/*
 * Copyright (C) 2011-2012 Frogtoss Games, Inc.
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 *    1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 *
 *    2. Altered source versions must be plainly marked as such, and must not
 *    be misrepresented as being the original software.
 *
 *    3. This notice may not be removed or altered from any source
 *    distribution.
 */

//
// To investigate: glDepthTest(GL_ALWAYS) to write to the depth buffer for later 3d particles 
//

/* Scene globals */
var gl;
var scene = {};
scene.mvMatrix = mat4.create();
scene.pMatrix  = mat4.create();
scene.mvMatrixStack = [];
scene.closestZ = 1;

//
// Begin helpers
//

function degToRad( deg ) {
    return deg * Math.PI / 180;
}

function mvPushMatrix( s ) {
    var copy = mat4.create();
    mat4.set( s.mvMatrix, copy );
    s.mvMatrixStack.push( copy );
}

function mvPopMatrix( s ) {
    if ( s.mvMatrixStack.length == 0 ) {
        throw "Invalid popMatrix!";
    }

    s.mvMatrix = s.mvMatrixStack.pop();
}

function getArg(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
    );
}


//
// End helpers
//

function initBuffers( panel ) {
    /* plane setup */
    scene.planeSpan = new ftgPlaneSpan();

    // Programmatically generate panel or not
    if ( panel == 'null' ) {
        // Foreground one
        var p = scene.planeSpan.allocPlane();
        p.addObb( [-2,0,0], [0.75,1.25], 90.0,  "texture.gif", undefined );
        p.addObb( [0,0,0], [0.75,1.25], 45.0,  "texture.gif", ftg.mats.silouhette );
        //p.addObb( [0,0,0], [0.75,1.25], 45.0,  "texture.gif", undefined );
        p.addZ( -4.0 );

        // Background one
        var p = scene.planeSpan.allocPlane();
        p.addObb( [0,0,0], [1.5,1.5], 180.0, "texture.gif" );
        p.addObb( [-2,-2,0], [1.25,1.25], 0.0,  "nehe.gif" );
        p.addZ( -8.0 );

        var p = scene.planeSpan.allocPlane();
        p.addObb( [0,-1,0], [0.75,1.25], -45.0,  "nehe.gif" );    
        p.addZ( -10.0 );
    } else {
        scene.planeSpan.loadPanel( "/resources/" + panel + ".xml" );
    }

    scene.planeSpan.updateZOrder();

    /* rendertarget setup */
    scene.rt = new ftgRenderTarget();
}

function draw() {
    gl.viewport( 0, 0, gl.viewportWidth, gl.viewportHeight );
    gl.clear( gl.COLOR_BUFFER_BIT );

    scene.closestZ = scene.planeSpan.getClosestPlaneZ();

    mat4.perspective( 45, gl.viewportWidth / gl.viewportHeight, 1.0, 4096, scene.pMatrix );
    mat4.lookAt( scene.cameraPos, [0,0,scene.closestZ], [0,1,0], scene.mvMatrix );

    ftg.mats.def.setProjectionUniform( scene.pMatrix );
    ftg.mats.silhouette.setProjectionUniform( scene.pMatrix );

    mvPushMatrix( scene );  
    scene.planeSpan.drawArrays( scene.mvMatrix );
    mvPopMatrix( scene );
}

function animate() {

    /* Shift camera x & y.  Browser window is the available screen and
       it ranges from normalized -1 to 1 in x and y. */
    scene.cameraPos = [0,0,1];
    var w = $(window).width();
    var h = $(window).height();
    var nw = (scene.mouseX - (w/2))/w*2;
    var nh = (scene.mouseY - (h/2))/h*2;

    var MOVESCALE = -scene.closestZ/2;

    scene.cameraPos[0] = nw * -MOVESCALE;
    scene.cameraPos[1] = nh * MOVESCALE;
}


// Main loop
function tick() {
    // Update timer
    requestAnimFrame( tick );

    // Update scene
    animate();

    // Draw scene
    draw(); 
}

function setCanvasSize() {
    var canvas = document.getElementById( 'maincanvas' );
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
}

function webGLStart() {
    var canvas = document.getElementById( 'maincanvas' );
    gl = WebGLUtils.setupWebGL(canvas);
    gl.viewportWidth  = canvas.width;
    gl.viewportHeight = canvas.height;

    ftg.init( gl );

    scene.panel = getArg('panel');
    initBuffers( scene.panel );

    // resize handling
    $(window).resize( function() {setCanvasSize();});
    setCanvasSize();

    // mouse handling
    $(document).mousemove( function( e ) {
        scene.mouseX = parseFloat( event.pageX );
        scene.mouseY = parseFloat( event.pageY );
    });
    scene.mouseX = scene.mouseY = 0;

    gl.clearColor( 0.5, 0.0, 0.0, 1.0 );
    //gl.enable( gl.DEPTH_TEST );
    //gl.depthFunc( gl.ALWAYS );
    gl.enable( gl.BLEND );
    gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    tick();
}
