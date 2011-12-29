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

/*;
 * ftgplane.js - Renderer for a series of plane-aligned images.
 * Version 0.1a
 */

"use strict";

/* ftgplane-local state */
var ftg = {};
ftg.plane = {};
ftg.mats = {};

/* 
 * initialize planes local states
 * ctx - the openGL context
 */
ftg.init = function( ctx ) {
    ftg.gl = ctx;
    var gl = ftg.gl;

    ftg.plane.textures = []
    ftg.dbg = 0; 

    /* Init the texture manager */
    ftg.texMan = new ftgTextureManager();

    /* Init the coordinates for boxes */
    var gl = ftg.gl;
    ftg.plane.boxVerts = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, ftg.plane.boxVerts );
    var vertices = [ 
        1.0, 1.0, 0.0,
       -1.0, 1.0, 0.0, 
        1.0,-1.0, 0.0,
       -1.0,-1.0, 0.0
    ];
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( vertices ), gl.STATIC_DRAW );
    ftg.plane.boxVerts.itemSize = 3;
    ftg.plane.boxVerts.numItems = 4;

    ftg.plane.boxTexCoords = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, ftg.plane.boxTexCoords );
    var textureCoords = [ 
        1.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        0.0, 0.0 ];
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW );
    ftg.plane.boxTexCoords.itemSize = 2;
    ftg.plane.boxTexCoords.numItems = 4;


    /* Init frag shader */ 
    var s = "precision mediump float;\n";
    s += "      varying vec2 vTextureCoord;\n";
    s += "      uniform sampler2D uSampler;\n";

    s += "      void main(void) {\n";
    s += "        vec4 col = texture2D( uSampler, vec2(vTextureCoord.s, vTextureCoord.t ) );\n";
    s += "        gl_FragColor = col;\n";
    s += "      }\n";
    var fragObj = ftg.compileShader( s, gl.FRAGMENT_SHADER );

    /* Init vert shader */
    var t;
    t  = "attribute vec3 aVertexPosition;\n";
    t += "attribute vec2 aTextureCoord;\n";

    t += "uniform mat4 uMVMatrix;\n";
    t += "uniform mat4 uPMatrix;\n";
    t += "uniform mat4 uBoxMatrix;\n";

    t += "varying vec2 vTextureCoord;\n";

    t += "void main( void ) {\n";
    t += "  gl_Position = uPMatrix * uMVMatrix * uBoxMatrix * vec4(aVertexPosition, 1 );\n";
    t += "  vTextureCoord = aTextureCoord;\n";
    t += "}\n";
    var vertObj = ftg.compileShader( t, gl.VERTEX_SHADER );

    /* Init default material */
    ftg.mats.def = new ftgMaterial();
    ftg.mats.def.initShader( t, s );

    /* Init frag shader */ 
    s = "precision mediump float;\n";
    s += "      varying vec2 vTextureCoord;\n";
    s += "      uniform sampler2D uSampler;\n";

    s += "      void main(void) {\n";
    s += "        vec4 col = texture2D( uSampler, vec2(vTextureCoord.s, vTextureCoord.t ) );\n";
    s += "        gl_FragColor = vec4(0.0,0.0,0.0,col.a);"; // broken on purpose
    s += "      }\n";
    var fragObj = ftg.compileShader( s, gl.FRAGMENT_SHADER );

    /* Init vert shader */
    var vertObj = ftg.compileShader( t, gl.VERTEX_SHADER );
    ftg.mats.silhouette = new ftgMaterial();
    ftg.mats.silhouette.initShader( t, s );
}


/* 
 * Degrees to radians
 */
ftg.degtoRad = function( deg ) {
    return deg * Math.PI / 180;
}


/* 
 * Round up to next power of 2.
 *
 * n - Integer to round
 */
ftg.roundUpPow2 = function( n ) {
    n--;
	n |= n >> 1;
	n |= n >> 2;
	n |= n >> 4;
	n |= n >> 8;
	n |= n >> 16;
	return ++n;
}

/* 
 * compile a shader into an unlinked program object
 * code - The source code for the shader to compile
 * shaderType - one of gl.FRAGMENT_SHADER or gl.VERTEX_SHADER
 */
ftg.compileShader = function(shaderCode, shaderType) {
    var gl = ftg.gl;
    var shader;
    shader = gl.createShader( shaderType );

    gl.shaderSource( shader, shaderCode );
    gl.compileShader( shader );

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        var shaderTypeStr = "vertex";
        if ( shaderType == gl.FRAGMENT_SHADER )
            shaderTypeStr = "fragment";
        alert("error compiling " + shaderTypeStr + " shader: " + gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}


/* 
 * get a compiled shader program object from an element stored 
 * in the html.
 *
 * id - the name of the shader element in the html file to reference
 */
ftg.getShaderById = function(id) {
    var gl = ftg.gl;
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var id;
    if ( shaderScript.type == "x-shader/x-fragment" )
        id = gl.FRAGMENT_SHADER;
    else
        id = gl.VERTEX_SHADER;

    return ftg.compileShader( str, id );
}


/* 
 * link a vertex and fragment object into a full shader program
 * vertObj - compiled vertex shader
 * fragObj - compiled fragment shader
 */
ftg.linkProgram = function( vertObj, fragObj ) {
    var gl = ftg.gl;

    if ( !gl.isShader( vertObj ) ) {
        alert("link: vertObj is not a shader.");
    }
    if ( !gl.isShader( fragObj ) ) {
        alert("link: fragObj is not a shader.");
    }

    var program = gl.createProgram();
    gl.attachShader( program, vertObj );
    gl.attachShader( program, fragObj );
    gl.linkProgram( program );

    if ( !gl.getProgramParameter( program, gl.LINK_STATUS ) ) {
        alert("Could not link shaders." );
        return null;
    }

    return program; 
}


/* 
 * shortcut to bind and point to a gl.ARRAY_BUFFER.
 * Assumes itemSize attribute
 * buffer - the buffer data
 * attribute - the index of the attribute in the shader 
 */
ftg.bindAndPoint = function( buffer, attribute ) {
    var gl = ftg.gl;
    gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
    gl.vertexAttribPointer( attribute,
                            buffer.itemSize,
                            gl.FLOAT, false, 0, 0 );
}

/*
 * initialize an rbo, returning its name.
 *
 * rboFormat     - One of the format constants for renderbufferStorage(). ex: gl.RGBA4
 * width, height - Dimensions for rbo
 */
ftg.initRBO = function( rboFormat, width, height ) {
    var rb = gl.createRenderbuffer();
    gl.bindRenderbuffer( gl.RENDERBUFFER, rb );
    gl.renderbufferStorage( gl.RENDERBUFFER, rboFormat,
                            width, height );
    if ( !gl.isRenderbuffer( rb ) )
        console.log("Error creating RBO of format " + rboFormat );
    
    return rb;
}


/*
 * Using the current WebGL state, draw a single plane to the viewport.
 * 
 * material - ftgMaterial to render with.
 */
ftg.drawTextureToViewport = function( material ) {
    var gl = ftg.gl;

    // Set up matrices
    var pMatrix = mat4.create();
    var mvMatrix = mat4.create();
    gl.viewport( 0, 0, gl.viewportWidth, gl.viewportHeight );
    mat4.ortho( -1.0, 1.0, 1.0, -1.0, 1.0, 4096.0, pMatrix );
    mat4.lookAt( [0,0,-1], [0,0,0], [0,-1,0], mvMatrix );

    var boxMat = mat4.create();
    mat4.identity( boxMat );

    material.useProgram();

    // Set up vertex arrays 
    ftg.bindAndPoint( ftg.plane.boxVerts, material.attr['aVertexPosition'] );
    ftg.bindAndPoint( ftg.plane.boxTexCoords, material.attr['aTextureCoord'] );

    gl.uniformMatrix4fv( material.uniforms['uMVMatrix'], false, mvMatrix );
    gl.uniformMatrix4fv( material.uniforms['uPMatrix'], false, pMatrix );
    
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, ftg.plane.boxVerts.numItems );
}


//
// ftgTextureManager class -- Ensures all textures are RIM only once
//
function ftgTextureManager() {
    // Resource name to id
    this.textureHash = {};

    /* 
     * Get a texture.  if it doesn't exist, download it.
     * Return the WebGL unique texture id for gl.BindTexture() calls.
     * path - resource path to the texture
     */
    this.fetchTexture = function( path ) {
        if ( path in this.textureHash ) 
            return this.textureHash[path];

        // Texture does not exist - build it
        var tex = ftg.gl.createTexture();
        tex.image = new Image();
        tex.image.onload = function() {
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT );
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT );
            gl.generateMipmap( gl.TEXTURE_2D );
            gl.bindTexture(gl.TEXTURE_2D, null);            
        }
        tex.image.src = path;
        this.textureHash[path] = tex;

        return tex;
    }
}

//
// ftgPlaneSpan -- A series of planes in space
//
function ftgPlaneSpan() {
    this.planes = [];
    this.drawOrder = []; 

    /* 
     * Allocate a new plane and return it.  This should be the only way to get a plane.
     */
    this.allocPlane = function() {
        var p = new ftgPlane();
        this.planes.push( p );

        return p;
    }

    /* 
     * Draw all planes in the span using drawArrays.
     * Must call updateZOrder() first.
     * mvMatrix - the modelview matrix.
     */
    this.drawArrays = function( mvMatrix ) {
        var gl = ftg.gl;
        
        if ( this.drawOrder.length == 0 )  {
            if ( this.planes.length != 0 )
                console.log("warning: drawOrder length is 0. Call updateZOrder.");
            return;
        }

        for ( var i = this.drawOrder.length-1; i >= 0; --i ) {
            var mvMat = mat4.create();
            var plane = this.planes[ this.drawOrder[i][0] ];

            mat4.multiply( mvMatrix, plane.model, mvMat );

            plane.drawArrays( mvMat );
        }
    }

    /* 
     * Call after all objects have been added to the scene.
     * It is still possible to move things around, but the Z order
     * should be fixed.
     */
    this.updateZOrder = function() {
        this.drawOrder = [];

        // Get plane centroids
        var centroids = [];
        for ( var i = this.planes.length-1; i >= 0; --i ) {        
            var plane = this.planes[i];
            var point = vec3.create([0,0,0]);
            mat4.multiplyVec3( plane.model, point );

            this.drawOrder[i] = [i, point[2]];
        }

        // Sort centroids by value from smallest (most negative) to largest (closest to zero)
        // Put the result in drawOrder
        this.drawOrder.sort( function(a,b) {
            return ( a[1] < b[1] );
        });
    }

    /* 
     * Load a .pan file from a URL into the plane.
     */
    this.loadPanel = function( url ) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", url, false );
        xmlHttp.send();
        if ( xmlHttp.readyState != 4 ) {
            console.log( "Error reading xml file." );
            return;
        }

        var xmlDoc = xmlHttp.responseXML;
        var xmlLayers = xmlDoc.getElementsByTagName("Layer");

        for ( var i = xmlLayers.length-1; i>= 0; --i ) {
            var plane = this.allocPlane();

            var zDistance = xmlLayers[i].attributes.getNamedItem( "zDistance" ).nodeValue; 

            var xmlPutboxes = xmlLayers[i].getElementsByTagName("PutBox");
            for ( var j = xmlPutboxes.length-1; j>=0; --j ) {

                var putbox = xmlPutboxes[j];

                var name    = putbox.attributes.getNamedItem( "name" ).nodeValue;
                var degrees = putbox.attributes.getNamedItem( "degrees" ).nodeValue;
                var tx      = putbox.attributes.getNamedItem( "tx" ).nodeValue;
                var ty      = putbox.attributes.getNamedItem( "ty" ).nodeValue;
                var ex      = putbox.attributes.getNamedItem( "ex" ).nodeValue;
                var ey      = putbox.attributes.getNamedItem( "ey" ).nodeValue;
                var material= putbox.attributes.getNamedItem( "material" );

                var matHandle = undefined;
                if ( material ) {
                    matHandle = ftg.mats[material.nodeValue];
                    if ( matHandle == undefined )
                        console.log( "Unknown material referenced: " + material.nodeValue );
                }

                plane.addObb( [tx,ty], [ex,ey], degrees, "/resources/"+ name, matHandle );
            }

            plane.addZ( zDistance );
        }
        
    }

    /* 
     * Helper to get the z location of the closest plane to 0,0,0.  Returns float.
     */
    this.getClosestPlaneZ = function() {
        var point = vec3.create([0,0,0]);
        mat4.multiplyVec3( this.planes[ this.drawOrder[0][0] ].model, point );
        return point[2];
    }

}

//
// ftgPlane class -- A single renderable plane
//
function ftgPlane() {
    this.model = mat4.identity();
    this.obbs = []

    /* 
     * pos - array of 2 floats denoting position from the center of the plane
     * ext - array of 2 floats, full extents
     * deg - float specifying rotation degrees
     * path- image resource path
     * material-  material or undefined for the default material
     */
    this.addObb = function( pos, ext, deg, path, material ) {
        var obb = {};

        obb.mat = mat4.identity(); 
        //var z= this.obbs.length*0.0001;
        var z = 0.0;

        mat4.translate( obb.mat, [pos[0],pos[1],z] );
        mat4.rotate( obb.mat, deg * Math.PI / 180, [0,0,1] );
        mat4.scale( obb.mat, [ext[0],ext[1],1] );

        obb.tex = ftg.texMan.fetchTexture( path );

        obb.material = material;

        this.obbs.push( obb );
    }


    /* 
     * Draw the plane using drawArrays.
     * mvMatrix - the modelview matrix.
     */
    this.drawArrays = function( mvMatrix ) {
        var gl = ftg.gl;

        /* perf notes:
           
           A lot of stuff here can be set per-material, per-frame:
           uMVMatrix
           aVertexPosition
           aTextureCoord
           */

        for ( var i = this.obbs.length-1; i >= 0; --i ) {
            var obb = this.obbs[i];

            var material = ftg.mats.def;
            if ( obb.material != undefined ) {
                material = obb.material;
            }

            material.useProgram();
            
            // Set up renderer-required material parameters
            ftg.bindAndPoint( ftg.plane.boxVerts, material.attr['aVertexPosition'] );
            ftg.bindAndPoint( ftg.plane.boxTexCoords, material.attr['aTextureCoord'] );
            gl.uniformMatrix4fv( material.uniforms['uMVMatrix'], false, mvMatrix );

            gl.uniformMatrix4fv( material.uniforms['uBoxMatrix'], false, obb.mat );

            material.prepareSamplers();
            gl.bindTexture( gl.TEXTURE_2D, obb.tex );

            gl.drawArrays( gl.TRIANGLE_STRIP, 0, ftg.plane.boxVerts.numItems );
        }
    }

    /* 
     * Convenience function to set the z-distance from the camera.
     * z - z distance
     */
    this.addZ = function( z ) {
        mat4.translate( this.model, [0.0,0.0,z] );
    }
}

//
// ftgMaterial class -- Shaders and attributes for forward rendering
//
function ftgMaterial() {
    this.gl = ftg.gl;
    this.shader = undefined;
    this.attr = {};
    this.uniforms = {};

    // Setup

    /* 
     * Initialize this material's shader from string sources.
     * After this, you can call ftgMaterial.useProgram()
     *
     * vertStr - The vertex shader
     * fragStr - The fragment shader
     */
    this.initShader = function( vertStr, fragStr ) {
        var vertObj = ftg.compileShader( vertStr, gl.VERTEX_SHADER );
        var fragObj = ftg.compileShader( fragStr, gl.FRAGMENT_SHADER );
        this.shader = ftg.linkProgram( vertObj, fragObj );

        gl.useProgram( this.shader );

        this.initShaderValues();
    }

    /* 
     * Initialize this material's shader from glsl source
     * embedded in HTML.  
     *
     * This looks like:
     * <SCRIPT id="someid" type="x-shader/x-vertex">
     * <SCRIPT id="someid" type="x-shader/x-fragment">
     *
     * vertId - The vertex shader id
     * fragId - The fragment shadre id
     */
    this.initShaderById = function( vertId, fragId ) {
        var vertObj = ftg.getShaderById( vertId );
        var fragObj = ftg.getShaderById( fragId );
        this.shader = ftg.linkProgram( vertObj, fragObj );

        gl.useProgram( this.shader );

        this.initShaderValues();
    }

    /* 
     * Bind an attribute, enabling the vertex array and storing 
     * it in attr{}.
     */
    this.bindAttribute = function(a) {
        this.attr[a] = gl.getAttribLocation( this.shader, a ); 
        gl.enableVertexAttribArray( this.attr[a] );
    }

    /* 
     * Get the location of a uniform, storing it in uniforms{}.
     */
    this.initUniform = function(u) {
        this.uniforms[u] = gl.getUniformLocation( this.shader, u );
    }

    // Polymorphic bits -- override in altered materials

    /* 
     * Use the material's shader.
     */
    this.useProgram = function() {
        gl.useProgram( this.shader );
    }

    /* 
     * Init shader attributes and uniforms inside material.
     */
    this.initShaderValues = function() {
        this.bindAttribute( "aVertexPosition" );
        this.bindAttribute( "aTextureCoord" );

        this.initUniform( "uPMatrix" );
        this.initUniform( "uMVMatrix" );
        this.initUniform( "uBoxMatrix" );
        this.initUniform( "uSampler" );
    }

    /* 
     * Set the projection uniform.  Call this one per shader per frame.
     */
    this.setProjectionUniform = function( matrix ) {
        this.useProgram();
        gl.uniformMatrix4fv( this.uniforms['uPMatrix'], false, matrix );
    }

    /* 
     * Prepare texture samplers before rendering.
     */
    this.prepareSamplers = function() {
        gl.activeTexture( gl.TEXTURE0 );
        gl.uniform1i( this.uniforms['uSampler'], 0 );
    }


    /* 
     * Bind textures for this material.
     * 
     * texName - Array of textures.
     */
    this.bindTextures = function( texName ) {
        gl.activeTexture( gl.TEXTURE0 );
        gl.bindTexture( gl.TEXTURE_2D, texName[0] );
    }
}


//
// ftgRenderTarget class -- Render to texture
//
function ftgRenderTarget() {
    this.fb      = undefined;
    this.rbColor = undefined;
    this.rbDepth = undefined;
    this.texture = undefined;

    /* 
     * Initialize the render target.  Called automatically.
     * 
     * inWidth, inHeight - Dimensions of the rendertarget
     */
    this.init = function( inWidth, inHeight ) {
        var gl = ftg.gl;
        
        // ES2 has limited NPOT support
        var width = ftg.roundUpPow2( inWidth );
        var height= ftg.roundUpPow2( inHeight );
        if ( width != inWidth || height != inHeight )
            console.log( "Render target rounded up to " + width + "x" + height + " to avoid NPOT sizes." );

        // Check constants
        var maxSize = gl.getParameter( gl.MAX_RENDERBUFFER_SIZE );
        if ( width > maxSize || height > maxSize ) {
            console.log( "RenderTarget is too large.  Max size is " + maxSize );
            return;
        }
        
        // Create FBO
        this.fb = gl.createFramebuffer();
        gl.bindFramebuffer( gl.FRAMEBUFFER, this.fb );
        this.fb.width = width;  
        this.fb.height = height;

        // Create texture
        this.texture = gl.createTexture();
        gl.bindTexture( gl.TEXTURE_2D, this.texture );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP );

        gl.generateMipmap( gl.TEXTURE_2D );
        gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, this.fb.width, this.fb.height, 0, 
                       gl.RGBA, gl.UNSIGNED_BYTE, null );
        

        // Create RBOs  
        this.rbDepth = ftg.initRBO( gl.DEPTH_COMPONENT16, this.fb.width, this.fb.height );
        
        // Attach things to FBO
        gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
                                    gl.RENDERBUFFER, this.rbDepth );
        gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, 
                                 gl.TEXTURE_2D, this.texture, 0 );

        // Check for correctness
        if ( !gl.isFramebuffer( this.fb ) ) {
            console.log( "Failed to create framebuffer object." );
        } 

        var status = gl.checkFramebufferStatus( gl.FRAMEBUFFER );
        if ( status != gl.FRAMEBUFFER_COMPLETE ) {
            console.log("status != gl.FRAMEBUFFER_COMPLETE: " + this.getFbError( status ) );
        }

        // Unbind all
        gl.bindTexture( gl.TEXTURE_2D, null );
        gl.bindRenderbuffer( gl.RENDERBUFFER, null );
        gl.bindFramebuffer( gl.FRAMEBUFFER, null );
    }

    /* 
     * Bind this render target.
     */
    this.bind = function() {
        gl.bindFramebuffer( gl.FRAMEBUFFER, this.fb );
    }

    /* 
     * Unbind all render targets.  Provided for symmetry.
     */
    this.unbind = function() {
        gl.bindFramebuffer( gl.FRAMEBUFFER, null );
    }

    /* 
     * Get the framebuffer error as a descriptive string.
     * 
     * id - The gl.CheckFramebufferStatus response.
     */
    this.getFbError = function( id ) {
        switch ( id ) {
        case gl.FRAMEBUFFER_UNDEFINED:

            return "GL_FRAMEBUFFER_UNDEFINED is returned if target is the default framebuffer, but the default framebuffer does not exist.";

        case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
            return "GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT is returned if any of the framebuffer attachment points are framebuffer incomplete.";

        case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
            return "GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT is returned if the framebuffer does not have at least one image attached to it.";

        case gl.FRAMEBUFFER_INCOMPLETE_DRAW_BUFFER:
            return "GL_FRAMEBUFFER_INCOMPLETE_DRAW_BUFFER is returned if the value of GL_FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE is GL_NONE for any color attachment point(s) named by GL_DRAWBUFFERi.";

        case gl.FRAMEBUFFER_INCOMPLETE_READ_BUFFER:
            return "GL_FRAMEBUFFER_INCOMPLETE_READ_BUFFER is returned if GL_READ_BUFFER is not GL_NONE and the value of GL_FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE is GL_NONE for the color attachment point named by GL_READ_BUFFER.";
            
        case gl.FRAMEBUFFER_UNSUPPORTED:
            return "GL_FRAMEBUFFER_UNSUPPORTED is returned if the combination of internal formats of the attached images violates an implementation-dependent set of restrictions.";

        case gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE:
            return "GL_FRAMEBUFFER_INCOMPLETE_MULTISAMPLE is returned if the value of GL_RENDERBUFFER_SAMPLES is not the same for all attached renderbuffers; if the value of GL_TEXTURE_SAMPLES is the not same for all attached textures; or, if the attached images are a mix of renderbuffers and textures, the value of GL_RENDERBUFFER_SAMPLES does not match the value of GL_TEXTURE_SAMPLES.";

        case gl.FRAMEBUFFER_INCOMPLETE_LAYER_TARGETS:
            return "GL_FRAMEBUFFER_INCOMPLETE_LAYER_TARGETS is returned if any framebuffer attachment is layered, and any populated attachment is not layered, or if all populated color attachments are not from textures of the same target.";

        }

        return "Unknown error.";
    }
}

