function cubejs(file, id){
            //id="divPlot1";
            //file='cube_Dec15/Data.csv';
            var container = document.getElementById(id); 
//adjust far dynamically
    //need to adjust far dynamically
        //ini gui
        var effectController = {
                searchedSample:"",
                showPoints: true,
                showAxis: true,
                Rotate:false,
                saveProjection:function(){alert('save png')}
            }
        var searchedname="";
        function initGUI(){
            //gui location
            var gui = new dat.GUI({autoPlace:false});
            //gui.domElement.id=id;
            //show points
            gui.add(effectController, "showPoints").onChange(function (value) {
                    points.visible = value;
                });
            //show axis helper
            /*
            gui.add(effectController, "showAxis").onChange(function (value) {
                    arrow3value = value;
                });
*/
            //rotate cube
            gui.add(effectController,"Rotate").onChange(function(value){rotate = value;});
            //save image
            //gui.add(effectController,'saveProjection');
            //search sample
            //gui.add(effectController,"searchedSample").onChange(function searchSample (string) {
             //   console.log(string);searchedname=string;
            //})
            //gui.add(effectController,"searchedSample").listen();

             container.appendChild(gui.domElement);
        };

        initGUI();

            //need to adjust far dynamically

        var seeing12 = true,
            seeing23 = false,
            seeing13 = false;

        function setcamera12() {
            camera.position.z = 200;
            camera.position.x = 0;
            camera.position.y = 0;
            scene.rotation.y = 0;
            scene.rotation.x = 0;
            scene.rotation.z = 0;
            seeing12 = true;
            seeing23 = false;
            seeing13 = false;
        }

        function setcamera13() {
            camera.position.z = 0;
            camera.position.x = 0;
            camera.position.y = 200;
            scene.rotation.y = 0;
            scene.rotation.x = 0;
            scene.rotation.z = 0;
            seeing13 = true;
            seeing23 = false;
            seeing12 = false;
        }

        function setcamera23() {
            camera.position.z = 0;
            camera.position.x = 200;
            camera.position.y = 0;
            scene.rotation.y = 0;
            scene.rotation.x = 0;
            scene.rotation.z = 0;
            seeing23 = true;
            seeing13 = false;
            seeing12 = false;
        }

        function createTextCanvas(text, color, font, size) {

            //size = size || 24;
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            var fontStr = (size + 'px ') + (font || 'Arial');
            ctx.font = fontStr;
            var w = ctx.measureText(text).width;
            var h = Math.ceil(size);

            canvas.width = w;
            canvas.height = h;

            ctx.font = fontStr;

            ctx.fillStyle = color || 'black';
            ctx.fillText(text, 0, Math.ceil(size * 0.8));

            return canvas;

        }

        function createText2D(text, color, font, size, segW, segH) {

            var canvas = createTextCanvas(text, color, font, size);
            var plane = new THREE.PlaneGeometry(canvas.width, canvas.height, segW, segH);
            var tex = new THREE.Texture(canvas);

            tex.needsUpdate = true;

            var planeMat = new THREE.MeshBasicMaterial({
                map: tex,
                color: 0xffffff,
                transparent: true
            });

            var mesh = new THREE.Mesh(plane, planeMat);
            mesh.scale.set(0.2, 0.2, 0.2);
            //mesh.doubleSided = true; // this is no longer a property of mesh // CHANGED
            mesh.quaternion.copy(camera.quaternion); // CHANGED

            return mesh;

        }
        //text canvas on small axis
        var smallArrowText_PC1; 
        var smallArrowText_PC2; 
        var smallArrowText_PC3; 

//var renderer, camera, camera2, far, controls,controls2;
        //var scene, scatterPlot, unfiltered, cluster;
        var sceneScreen,quad,cameraS;
        var points,arrow3,arrow3value;
        var speed,rotate=false;


            var plotxyz=[];
            var cluster=[];


            var far=150;
            var w=window.innerWidth;
            var h=window.innerHeight;
            //var w=document.getElementById(id).offsetWidth;
            //var h=document.getElementById(id).offsetHeight;
            //console.log(w);
            //console.log(window.innerWidth);

            var scene = new THREE.Scene();
            var camera = new THREE.PerspectiveCamera( 75, 0.5*window.innerWidth/window.innerHeight, 0.1, 10000 );
            var camera_arrow = new THREE.PerspectiveCamera( 75, 0.5*window.innerWidth/window.innerHeight, 0.1, 10000 );
            var camera2 = new THREE.OrthographicCamera(-far * 1.4 / 2, far * 1.4 / 2, far, -far, 0.1, 10000);

            var renderer = new THREE.WebGLRenderer({alpha:true});
            renderer.setSize( window.innerWidth, window.innerHeight );
            renderer.setClearColor(0xffffcc, 1);
            renderer.autoClear = false;
            document.getElementById(id).appendChild( renderer.domElement );

            /*
            //a cube for test
            var geometry = new THREE.BoxGeometry( 1, 1, 1 );
            var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
            var cube = new THREE.Mesh( geometry, material );
            //scene.add( cube );
            */
            /*
            var svg=d3.select('#divPlot').selectAll('circle').data([1,2,3]).enter().append('circle').attr('cx',function(d){d*100}).attr('cy',function(d){d*100}).style('fill','red').attr('r',500).style('stroke',true)
            scene.add(svg)
            */
            //controls
            var controls = new THREE.OrbitControls(camera,container);
            var controls_arrow = new THREE.OrbitControls(camera_arrow,container);
            var controls2 = new THREE.OrbitControls(camera2,container);

            var line=[];
            var arrow3 = new THREE.Object3D();
            var smallArrowGroup = new THREE.Group();
            var scatterPlot = new THREE.Object3D();
            //camera position should be set properly based on xExtent...
            
            
            //howtoadjust?: 
            camera.lookAt(scene.position);
            camera.position.z = far;
            camera.position.x = far/10;
            camera.position.y = far/10;

            camera_arrow.lookAt(scene.position);
            camera_arrow.position.z = far;
            camera_arrow.position.x = far/10;
            camera_arrow.position.y = far/10;

            camera2.lookAt(scene.position);
            camera2.position.z = far;
            camera2.position.x = far/10;
            camera2.position.y = far/10;

            queue()
                .defer(d3.csv,file)
                .await(ready);


            function ready(error,Data){
                    if(error) throw error;
                    drawPlot(Data);
                }
            //add pointcloud and axis
            var drawPlot=function(data){
                
                //getdata
                data.forEach(function (d, i) {
                plotxyz[i] = {
                    x: +d.PC1, //:+  if not defined, return the num after + 
                    y: +d.PC2,
                    z: +d.PC3
                };
                cluster[i] = d.cluster;
                })

             //object3D:class, for scene graph objects
            scatterPlot.name = "scatterPlot";
            scene.add(scatterPlot);
            scatterPlot.rotation.y = 0; //rotation in euler angles,radians

            function v(x, y, z) {
                return new THREE.Vector3(x, y, z);
            }
  
            var mat = new THREE.PointCloudMaterial({ //default material for particle system
                vertexColors: true, //define material do not use vertex colors
                sizeAttenuation: false,
                blending: THREE.AdditiveBlending,
                //need png.map:sprite,//circle?
                size: 5
            });
            //get cluster color

            var colorList =d3.scale.ordinal()
            .range(["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf",
                    "#aec7e8","#ffbb78","#98df8a","#ff9896","#c5b0d5","#c49c94","#f7b6d2","#c7c7c7","#dbdb8d","#9edae5"]);
;

            var pointCount = plotxyz.length;
            var pointGeo = new THREE.Geometry(); //update plot cubes?
            for (var i = 0; i < pointCount; i++) {
                var x = plotxyz[i].x;
                var y = plotxyz[i].y;
                var z = plotxyz[i].z;

                pointGeo.vertices.push(new THREE.Vector3(x, y, z));
                pointGeo.colors.push(new THREE.Color(colorList.range()[cluster[i]-1]));

            }

            points = new THREE.PointCloud(pointGeo, mat); //pointcloud: class for displaying particles, variable size point
            name = "points";
            scatterPlot.add(points);

/*
//try combining d3 with three. not working
var geometrysphere=new THREE.SphereGeometry();

d3.select(scatterPlot).selectAll().data(data).enter().append(function(){
    return new THREE.Mesh(geometrysphere,material);}).attr("position.x",function(d,i){return d.PC1;}).attr("position.x",function(d,i){return d.PC2;})
*/


            //add axis and arrow
            var xExent = d3.extent(plotxyz, function (d) {
                    return d.x;
                }), //extent: return array limits. use function(d)to return itself.
                yExent = d3.extent(plotxyz, function (d) {
                    return d.y;
                }),
                zExent = d3.extent(plotxyz, function (d) {
                    return d.z;
                });

            var vpts = { //generate every cube. 
                xMax: xExent[1],
                xCen: (xExent[1] + xExent[0]) / 2,
                xMin: xExent[0],
                yMax: yExent[1],
                yCen: (yExent[1] + yExent[0]) / 2,
                yMin: yExent[0],
                zMax: zExent[1],
                zCen: (zExent[1] + zExent[0]) / 2,
                zMin: zExent[0]
            }
            console.log(vpts.xMax)
            far=Math.max(vpts.xMax,vpts.yMax,vpts.zMax)+10;
            var lineGeo = new THREE.Geometry();
            lineGeo.vertices.push( //this are the grids! 

                v(vpts.xMin, vpts.yCen, vpts.zCen), v(vpts.xMax, vpts.yCen, vpts.zCen),
                v(vpts.xCen, vpts.yMin, vpts.zCen), v(vpts.xCen, vpts.yMax, vpts.zCen),
                v(vpts.xCen, vpts.yCen, vpts.zMax), v(vpts.xCen, vpts.yCen, vpts.zMin),

                v(vpts.xMin, vpts.yMax, vpts.zMin), v(vpts.xMax, vpts.yMax, vpts.zMin),
                v(vpts.xMin, vpts.yMin, vpts.zMin), v(vpts.xMax, vpts.yMin, vpts.zMin),
                v(vpts.xMin, vpts.yMax, vpts.zMax), v(vpts.xMax, vpts.yMax, vpts.zMax),
                v(vpts.xMin, vpts.yMin, vpts.zMax), v(vpts.xMax, vpts.yMin, vpts.zMax),

                v(vpts.xMin, vpts.yCen, vpts.zMax), v(vpts.xMax, vpts.yCen, vpts.zMax),
                v(vpts.xMin, vpts.yCen, vpts.zMin), v(vpts.xMax, vpts.yCen, vpts.zMin),
                v(vpts.xMin, vpts.yMax, vpts.zCen), v(vpts.xMax, vpts.yMax, vpts.zCen),
                v(vpts.xMin, vpts.yMin, vpts.zCen), v(vpts.xMax, vpts.yMin, vpts.zCen),

                v(vpts.xMax, vpts.yMin, vpts.zMin), v(vpts.xMax, vpts.yMax, vpts.zMin),
                v(vpts.xMin, vpts.yMin, vpts.zMin), v(vpts.xMin, vpts.yMax, vpts.zMin),
                v(vpts.xMax, vpts.yMin, vpts.zMax), v(vpts.xMax, vpts.yMax, vpts.zMax),
                v(vpts.xMin, vpts.yMin, vpts.zMax), v(vpts.xMin, vpts.yMax, vpts.zMax),

                v(vpts.xCen, vpts.yMin, vpts.zMax), v(vpts.xCen, vpts.yMax, vpts.zMax),
                v(vpts.xCen, vpts.yMin, vpts.zMin), v(vpts.xCen, vpts.yMax, vpts.zMin),
                v(vpts.xMax, vpts.yMin, vpts.zCen), v(vpts.xMax, vpts.yMax, vpts.zCen),
                v(vpts.xMin, vpts.yMin, vpts.zCen), v(vpts.xMin, vpts.yMax, vpts.zCen),

                v(vpts.xMax, vpts.yMax, vpts.zMin), v(vpts.xMax, vpts.yMax, vpts.zMax),
                v(vpts.xMax, vpts.yMin, vpts.zMin), v(vpts.xMax, vpts.yMin, vpts.zMax),
                v(vpts.xMin, vpts.yMax, vpts.zMin), v(vpts.xMin, vpts.yMax, vpts.zMax),
                v(vpts.xMin, vpts.yMin, vpts.zMin), v(vpts.xMin, vpts.yMin, vpts.zMax),

                v(vpts.xMin, vpts.yCen, vpts.zMin), v(vpts.xMin, vpts.yCen, vpts.zMax),
                v(vpts.xMax, vpts.yCen, vpts.zMin), v(vpts.xMax, vpts.yCen, vpts.zMax),
                v(vpts.xCen, vpts.yMax, vpts.zMin), v(vpts.xCen, vpts.yMax, vpts.zMin),
                v(vpts.xCen, vpts.yMin, vpts.zMin), v(vpts.xCen, vpts.yMin, vpts.zMax),
                v(vpts.xCen, vpts.yMax, vpts.zMin), v(vpts.xCen, vpts.yMax, vpts.zMax)

            );

/*
            var = d3.scal.l
          omain(xEx)t)
                .range([-10, 10]);
            var yScale = d3.scale.linear()
                .domain(yExent)
                .range([-10, 10]);
            var zScale = d3.scale.linear()
                .domain(zExent)
                .range([-10, 10]);

            var lineGeo = new THREE.Geometry();
            lineGeo.vertices.push( //this are the grids! 

                v(vpts.xMin, vpts.yCen, vpts.zCen), v(vpts.xMax, vpts.yCen, vpts.zCen),
                v(vpts.xCen, vpts.yMin, vpts.zCen), v(vpts.xCen, vpts.yMax, vpts.zCen),
                v(vpts.xCen, vpts.yCen, vpts.zMax), v(vpts.xCen, vpts.yCen, vpts.zMin),

                v(vpts.xMin, vpts.yMax, vpts.zMin), v(vpts.xMax, vpts.yMax, vpts.zMin),
                v(vpts.xMin, vpts.yMin, vpts.zMin), v(vpts.xMax, vpts.yMin, vpts.zMin),
                v(vpts.xMin, vpts.yMax, vpts.zMax), v(vpts.xMax, vpts.yMax, vpts.zMax),
                v(vpts.xMin, vpts.yMin, vpts.zMax), v(vpts.xMax, vpts.yMin, vpts.zMax),

                v(vpts.xMin, vpts.yCen, vpts.zMax), v(vpts.xMax, vpts.yCen, vpts.zMax),
                v(vpts.xMin, vpts.yCen, vpts.zMin), v(vpts.xMax, vpts.yCen, vpts.zMin),
                v(vpts.xMin, vpts.yMax, vpts.zCen), v(vpts.xMax, vpts.yMax, vpts.zCen),
                v(vpts.xMin, vpts.yMin, vpts.zCen), v(vpts.xMax, vpts.yMin, vpts.zCen),

                v(vpts.xMax, vpts.yMin, vpts.zMin), v(vpts.xMax, vpts.yMax, vpts.zMin),
                v(vpts.xMin, vpts.yMin, vpts.zMin), v(vpts.xMin, vpts.yMax, vpts.zMin),
                v(vpts.xMax, vpts.yMin, vpts.zMax), v(vpts.xMax, vpts.yMax, vpts.zMax),
                v(vpts.xMin, vpts.yMin, vpts.zMax), v(vpts.xMin, vpts.yMax, vpts.zMax),

                v(vpts.xCen, vpts.yMin, vpts.zMax), v(vpts.xCen, vpts.yMax, vpts.zMax),
                v(vpts.xCen, vpts.yMin, vpts.zMin), v(vpts.xCen, vpts.yMax, vpts.zMin),
                v(vpts.xMax, vpts.yMin, vpts.zCen), v(vpts.xMax, vpts.yMax, vpts.zCen),
                v(vpts.xMin, vpts.yMin, vpts.zCen), v(vpts.xMin, vpts.yMax, vpts.zCen),

                v(vpts.xMax, vpts.yMax, vpts.zMin), v(vpts.xMax, vpts.yMax, vpts.zMax),
                v(vpts.xMax, vpts.yMin, vpts.zMin), v(vpts.xMax, vpts.yMin, vpts.zMax),
                v(vpts.xMin, vpts.yMax, vpts.zMin), v(vpts.xMin, vpts.yMax, vpts.zMax),
                v(vpts.xMin, vpts.yMin, vpts.zMin), v(vpts.xMin, vpts.yMin, vpts.zMax),

                v(vpts.xMin, vpts.yCen, vpts.zMin), v(vpts.xMin, vpts.yCen, vpts.zMax),
                v(vpts.xMax, vpts.yCen, vpts.zMin), v(vpts.xMax, vpts.yCen, vpts.zMax),
                v(vpts.xCen, vpts.yMax, vpts.zMin), v(vpts.xCen, vpts.yMax, vpts.zMin),
                v(vpts.xCen, vpts.yMin, vpts.zMin), v(vpts.xCen, vpts.yMin, vpts.zMax),
                v(vpts.xCen, vpts.yMax, vpts.zMin), v(vpts.xCen, vpts.yMax, vpts.zMax)

            );

*/
            var lineMat = new THREE.LineBasicMaterial({
                color: 0x999999, //grid line color
                lineWidth: 1
            });

            line = new THREE.Line(lineGeo, lineMat, THREE.LinePieces); //draw pairs rather than series
            line.type = THREE.Lines;
            line.name = "line";
            scatterPlot.add(line);

            var smallArrow = new THREE.AxisHelper(100);
            
            smallArrowGroup.add(smallArrow);
            smallArrowText_PC1= createText2D('PC1','red',null,100);
            smallArrowText_PC2= createText2D('PC2','green',null,100);
            smallArrowText_PC3= createText2D('PC3','blue',null,100);
            smallArrowText_PC1.position.x = 50;smallArrowText_PC1.position.y = 0;smallArrowText_PC1.position.z = 0;
            smallArrowText_PC2.position.x = 0;smallArrowText_PC2.position.y = 50;smallArrowText_PC2.position.z = 0;
            smallArrowText_PC3.position.x = 0;smallArrowText_PC3.position.y = 0;smallArrowText_PC3.position.z = 50;
            smallArrowGroup.add(smallArrowText_PC1);
            smallArrowGroup.add(smallArrowText_PC2);
            smallArrowGroup.add(smallArrowText_PC3);
            scene.add(smallArrowGroup);
            //axis
             arrow3 = new THREE.Object3D();

            function addarrow3(len) {
                var d = new THREE.Object3D();
                var dir = v(len / 2, 0, 0);
                var origin = v(0, 0, 0);
                var length = 100;
                var hex = 0xFF0000;
                var arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
                d.add(arrowHelper);
                dir = v(0, len / 2, 0);
                origin = v(0, 0, 0);
                hex = 0x00FF00;
                arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
                d.add(arrowHelper);
                dir = v(0, 0, len / 2);
                origin = v(0, 0, 0);
                hex = 0x0000FF;
                arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
                d.add(arrowHelper);
                return d
            }

            arrow3.add(addarrow3(200));
            //scatterPlot.add(arrow3);


            }
            

            //

/*
var canvas = document.createElement( 'canvas' );
var context = canvas.getContext('2d');
context.beginPath();
context.rect(0, 0, w/4, w/40);
context.fillStyle = 'white';
context.fill();
context.lineWidth = 3;
context.strokeStyle = 'black';
context.stroke();
context.font = "12px Verdana";
context.fillStyle = 'red';
context.fillText("Perspective View", 40, 15);


canvas.style.position = 'absolute';
canvas.style.top =  ( 20 ) + 'px';
canvas.style.left = w/3+'px';
canvas.style.margin = '0px';
canvas.style.padding = '0px';
            
           

container.appendChild( canvas );
*/

            var animate= function() {
                requestAnimationFrame(animate);
                
                camera.lookAt(scene.position);
                camera_arrow.lookAt(scene.position);
                camera2.lookAt(scene.position);
                line.visible = true;
                scatterPlot.visible = true;
                arrow3.visible = arrow3value;
                arrow3.visible = true;
                smallArrowGroup.visible = false;
                //renderer.clear();
                renderer.autoClear = false;
                renderer.clearDepth();
                renderer.setViewport(0, 0, w / 2-100, h);
               //renderer.setScissor(0, 0, w/2, h);
               // renderer.enableScissorTest ( true );
               // renderer.setClearColor('#FF4444');
                renderer.render(scene, camera);
                //renderer.clearDepth();
                //renderer.autoClear= false;
                
                line.visible = false;
                scatterPlot.visible = false;
                arrow3.visible = false;
                smallArrowGroup.visible = true;
                    if ( smallArrowText_PC1 ) {smallArrowText_PC1.lookAt( camera_arrow.position );
                                    //smallArrowText.quaternion.copy(camera.quaternion)
                                }
                    if ( smallArrowText_PC2) {smallArrowText_PC2.lookAt( camera_arrow.position );
                                }
                    if ( smallArrowText_PC3 ) {smallArrowText_PC3.lookAt( camera_arrow.position );
                                }       
                renderer.setViewport(w / 2-100, h/2, w/10, w/10);
                 //renderer.setScissor(w/2, 0, w/2, h);
                //renderer.enableScissorTest ( true );
               // renderer.setClearColor('#FFCC99');
                controls_arrow.noZoom=true;
                renderer.render(scene, camera_arrow);
                renderer.clearDepth();
                
                line.visible = false;
                scatterPlot.visible = true;
                arrow3.visible = false;
                smallArrowGroup.visible = false;
                renderer.setViewport(w / 2-100, 0, w / 2-30, h);
                renderer.autoClear=false;
                //renderer.setScissor(w / 2, 0, w/2, h);
                //renderer.enableScissorTest ( true );
              
                //scatterPlot.visible = false;
               // smallArrowGroup.visible = true;
                renderer.render(scene, camera2);//actually there is renderTarget
                //renderer.clearDepth();
                
                
            
                controls.update();
                controls_arrow.update();
                controls2.update();
                //
                if (rotate!=false){
                var time = Date.now()*0.01;
                    scene.rotation.y = time*0.03; 
                };
            }
            animate();
}