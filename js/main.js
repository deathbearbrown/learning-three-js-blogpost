if ( ! Detector.webgl ) Detector.addGetWebGLMessage();


var container, stats;

var views, glScene, glRenderer, camera, cssrenderer;
var cssScene, cssRenderer;

var light;

var mouseX = 0, mouseY = 0;

var windowWidth = $("#container").innerWidth(),
		windowHeight = $("#container").innerHeight();

var realData;

var startPosition;


var data = {
  labels: {
  	y: ["2%", "4%", "6%", "8%"],
    x: ['', "\'14","\'13","\'12","\'11","\'10","\'09","\'08","\'07","\'06","\'05"],
    z: ["1-month","3-month","6-month","1-year","2-year","3-year","5-year","7-year","10-year", "20-year","30-year"]
  }
};

$.getJSON( "./js/2005-2015.json", function( data ) {
	realData = data;
	init();
	render();
});

var graphDimensions = {
	w:1000,
	d:2405,
	h:800
};


function labelAxis(width, data, direction){

  var separator = 2*width/data.length,
			p = {
				x:0,
				y:0,
				z:0
			},
			dobj = new THREE.Object3D();

  for ( var i = 0; i < data.length; i ++ ) {
		var label = makeTextSprite(data[i]);

		label.position.set(p.x,p.y,p.z);

		dobj.add( label );
		if (direction=="y"){
			p[direction]+=separator;
		}else{
			p[direction]-=separator;
		}

  }
  return dobj;
}


// This was written by Lee Stemkoski
// https://stemkoski.github.io/Three.js/Sprite-Text-Labels.html
function makeTextSprite( message, parameters )
{
	if ( parameters === undefined ) parameters = {};

	var fontface = parameters["fontface"] || "Helvetica";
	var fontsize = parameters["fontsize"] || 70;
	var canvas = document.createElement('canvas');
	var context = canvas.getContext('2d');
	context.font = fontsize + "px " + fontface;

	// get size data (height depends only on font size)
	var metrics = context.measureText( message );
	var textWidth = metrics.width;


	// text color
	context.fillStyle = "rgba(0, 0, 0, 1.0)";
	context.fillText( message, 0, fontsize);

	// canvas contents will be used for a texture
	var texture = new THREE.Texture(canvas)
			texture.minFilter = THREE.LinearFilter;
			texture.needsUpdate = true;

	var spriteMaterial = new THREE.SpriteMaterial({ map: texture, useScreenCoordinates: false});
	var sprite = new THREE.Sprite( spriteMaterial );
	sprite.scale.set(100,50,1.0);
	return sprite;
}


//----------------------------------------------------------------------------
//  createAGrid
//
// opts
// {
// 	height: width,
// 	width: depth,
// 	linesHeight: b,
// 	linesWidth: c,
// 	color: 0xcccccc
// }
//
//____________________________________________________________________________

function createAGrid(opts){
		var config = opts || {
			height: 500,
			width: 500,
			linesHeight: 10,
			linesWidth: 10,
			color: 0xDD006C
		};

		var material = new THREE.LineBasicMaterial({
			color: config.color,
			opacity: 0.2
		});

		var gridObject = new THREE.Object3D(),
				gridGeo= new THREE.Geometry(),
				stepw = 2*config.width/config.linesWidth,
				steph = 2*config.height/config.linesHeight;

		//width
		for ( var i = - config.width; i <= config.width; i += stepw ) {
				gridGeo.vertices.push( new THREE.Vector3( - config.height, i,0 ) );
				gridGeo.vertices.push( new THREE.Vector3(  config.height, i,0 ) );

		}
		//height
		for ( var i = - config.height; i <= config.height; i += steph ) {
				gridGeo.vertices.push( new THREE.Vector3( i,- config.width,0 ) );
				gridGeo.vertices.push( new THREE.Vector3( i, config.width, 0 ) );
		}

		var line = new THREE.Line( gridGeo, material, THREE.LinePieces );
		gridObject.add(line);

		return gridObject;
}

//----------------------------------------------------------
// Initialize grids
//----------------------------------------------------------


function gridInit(){

	var boundingGrid = new THREE.Object3D(),
			depth = graphDimensions.w/2, //depth
			width = graphDimensions.d/2, //width
			height = graphDimensions.h/2, //height
			a =data.labels.y.length,
			b= data.labels.x.length,
			c= data.labels.z.length;

	//pink
	var newGridXY = createAGrid({
				height: width,
				width: height,
				linesHeight: b,
				linesWidth: a,
				color: 0xcccccc
			});
			//newGridXY.position.y = height;
	  	newGridXY.position.z = -depth;
			boundingGrid.add(newGridXY);

	//blue
	var newGridYZ = createAGrid({
				height: width,
				width: depth,
				linesHeight: b,
				linesWidth: c,
				color: 0xcccccc
			});
	 		newGridYZ.rotation.x = Math.PI/2;
	 		newGridYZ.position.y = -height;
			boundingGrid.add(newGridYZ);

	//green
	var newGridXZ = createAGrid({
				height: depth,
				width: height,
				linesHeight:c,
				linesWidth: a,
				color: 0xcccccc
			});

			newGridXZ.position.x = width;
			//newGridXZ.position.y = height;
	 		newGridXZ.rotation.y = Math.PI/2;
			boundingGrid.add(newGridXZ);

	glScene.add(boundingGrid);


	var labelsW = labelAxis(width, data.labels.x,"x");
			labelsW.position.x = width+40;
			labelsW.position.y = -height -40;
			labelsW.position.z = depth;
			glScene.add(labelsW);

	var labelsH = labelAxis(height, data.labels.y,"y");
			labelsH.position.x = width;
			labelsH.position.y = - height +(2*height/a)-20;
			labelsH.position.z = depth;
			glScene.add(labelsH);

	var labelsD = labelAxis(depth, data.labels.z, "z");
			labelsD.position.x = width;
			labelsD.position.y = -(height)-40;
			labelsD.position.z = depth-40;
			glScene.add(labelsD);
};


function init() {

  container = document.getElementById( 'container' );


//----------------------------------------------------------------------------
//   Set up camera
//____________________________________________________________________________
	vFOVRadians = 2 * Math.atan( windowHeight / ( 2 * 1500 ) ),
	//fov = vFOVRadians * 180 / Math.PI;
	fov = 40; 
	startPosition = new THREE.Vector3( 0, 0, 3000 );
	camera = new THREE.PerspectiveCamera( fov, windowWidth / windowHeight, 1, 30000 );
	camera.position.set( startPosition.x, startPosition.y, startPosition.z );


	controls = new THREE.OrbitControls( camera );
	controls.damping = 0.2;
	controls.addEventListener( 'change', render );

//----------------------------------------------------------------------------
//   Create scenes for webGL
//____________________________________________________________________________

  glScene = new THREE.Scene();


//----------------------------------------------------------------------------
//    Add a light source & create Canvas
//____________________________________________________________________________

  light = new THREE.DirectionalLight( 0xffffff );
  light.position.set( 0, 0, 1 );
  glScene.add( light );

  // create canvas
  var canvas = document.createElement( 'canvas' );
      canvas.width = 128;
      canvas.height = 128;

  var context = canvas.getContext( '2d' );


//----------------------------------------------------------------------------
//    data
//____________________________________________________________________________

	gridInit();

	var wireframeMaterial = new THREE.MeshBasicMaterial( {
														side:THREE.DoubleSide,
														vertexColors: THREE.VertexColors
													});

	var lineMat = new THREE.LineBasicMaterial({
									color: 0xffffff
								});
	var blacklineMat = new THREE.LineBasicMaterial({
												color: 0x000000
											});

	var floorGeometry = new THREE.PlaneGeometry(graphDimensions.w,graphDimensions.d,10,2405);
	var colors = ["#eef4f8","#ddecf4","#cce5f0","#bcddec","#aed5e7","#a0cde2","#94c5dc","#89bcd6","#7eb4d0","#74abc9","#6aa2c2","#619abb","#5892b4","#4f8aad","#4781a6","#3f799f","#3a7195","#35688c","#326082","#2f5877","#2c506c","#243d52"];
	var faceColors = [];
	var lines={};

	// on plane Geometry, change the z value to create the 3D area surface
	// just like when creating a terrain
	for (var i =0; i< floorGeometry.vertices.length; i++){

		//push colors to the faceColors array
		faceColors.push(colors[Math.round(realData[i][2]*4)]);

		if (realData[i][2] == null){
			//hack hack hack
			floorGeometry.vertices[i].z="null";
		}else{
			floorGeometry.vertices[i].z=realData[i][2]*100;
			if (!lines[floorGeometry.vertices[i].x]) {
				lines[floorGeometry.vertices[i].x] = new THREE.Geometry();
			}
			//arrays for the grid lines
			lines[floorGeometry.vertices[i].x].vertices.push(new THREE.Vector3(floorGeometry.vertices[i].x, floorGeometry.vertices[i].y, realData[i][2]*100));
		}
	}

	//vertexColors
	for (var x= 0; x <floorGeometry.faces.length; x++){
		floorGeometry.faces[x].vertexColors[0] = new THREE.Color(faceColors[floorGeometry.faces[x].a]);
		floorGeometry.faces[x].vertexColors[1] = new THREE.Color(faceColors[floorGeometry.faces[x].b]);
		floorGeometry.faces[x].vertexColors[2] = new THREE.Color(faceColors[floorGeometry.faces[x].c]);
	}

	//grid lines
	for (line in lines){
		if (line == "-500"){
			var graphLine= new THREE.Line(lines[line], blacklineMat);
		}else{
			var graphLine = new THREE.Line(lines[line], lineMat);
		}

		graphLine.rotation.x = -Math.PI/2;
		graphLine.position.y = -graphDimensions.h/2;

		graphLine.rotation.z = Math.PI/2;

		glScene.add(graphLine);
	}


	var floor = new THREE.Mesh(floorGeometry, wireframeMaterial);
		floor.rotation.x = -Math.PI/2;
		floor.position.y = -graphDimensions.h/2;

		floor.rotation.z = Math.PI/2;
		glScene.add(floor);

//----------------------------------------------------------------------------
//    SET UP RENDERERS
//____________________________________________________________________________

  //set up webGL renderer
  glRenderer = new THREE.WebGLRenderer();
  glRenderer.setPixelRatio( window.devicePixelRatio );
  glRenderer.setClearColor( 0xf0f0f0 );
  glRenderer.setSize( windowWidth, windowHeight);
  container.appendChild( glRenderer.domElement );

//----------------------------------------------------------------------------
//    SET UP STATS
//____________________________________________________________________________

  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.bottom = '10px';
  stats.domElement.style.left= '10px';
  container.appendChild( stats.domElement );


	// set up window resize listener
	window.addEventListener( 'resize', onWindowResize, false );
	animate();
}



//----------------------------------------------------------------------------
//	Animate
//----------------------------------------------------------------------------

function animate() {
	requestAnimationFrame(animate);
	controls.update();
}

function render() {
	camera.lookAt( glScene.position );
	glRenderer.render( glScene, camera );
  stats.update();

}


//----------------------------------------------------------------------------
// ON RESIZE
//----------------------------------------------------------------------------
function onWindowResize() {

	camera.aspect = windowWidth / windowHeight;
	camera.updateProjectionMatrix();

	glRenderer.setSize( windowWidth, windowHeight );
	render();

}


//----------------------------------------------------------------------------
//    Camera controls
//____________________________________________________________________________

  $(".buttons").bind('click',function(){
  	if ($(this).attr('id')=="camera-1"){
			console.log("camera one");
			controls.reset();
			var vFOVRadians = 2 * Math.atan( windowHeight / ( 2 * 35000 ) ),
					fov = vFOVRadians * 180 / Math.PI;
			camera.fov = fov;
			controls.rotateUp(90*Math.PI/180);
			camera.position.z = startPosition.z* 23;
			camera.position.y = (startPosition.z)*55;
			camera.far = 1000000;
			camera.updateProjectionMatrix();
			console.log( camera.position.y);
			render();
  	}

		if ($(this).attr('id')=="camera-2"){
			console.log("camera two");
			controls.reset();

			var vFOVRadians = 2 * Math.atan( windowHeight / ( 2 * 35000 ) ),
					fov = vFOVRadians * 180 / Math.PI;
			camera.fov = fov;
			camera.position.z = startPosition.z* 58;
			camera.far = 1000000;
			camera.updateProjectionMatrix();
			render();
		}

		if ($(this).attr('id')=="camera-3"){
  		console.log("camera three");
  		controls.reset();
  		camera.fov = 30;
			camera.updateProjectionMatrix();
			render();
  	}


  });
