class Renderer {
    constructor(screenWidth, screenHeight, canvasContext, canvas3DContext) {
        this.canvasContext = canvasContext;
        this.canvas3dContext = canvas3DContext;
        this.blockW = 64;
        this.blockH = 64;
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.FOV = 90 / (360 / 4);
        this.raysNumber = 64;
        
        this.imageStoneWall = new Image();
        this.imageStoneWall.src = "assets/images/stone_wall.png";

        this.imageEnemyWizzard = new Image();
        this.imageEnemyWizzard.src = "assets/images/enemies/wizzard.png";

        this.globalObjects = {}; //objects with global lifespan
        this.globalClosestDistance = 10000;

        var map = new Map();
    }

    drawBlock(x, y)
    {
        this.canvasContext.fillStyle = "#fff";
        this.canvasContext.fillRect(x, y, this.blockW, this.blockH);
    }

    drawEntity(x, y)
    {
        this.canvasContext.fillStyle = "red";
        this.canvasContext.fillRect(x, y, this.blockW, this.blockH);
    }

    drawSpace(x, y, canvasContext)
    {
        this.canvasContext.fillStyle = "#000";
        this.canvasContext.fillRect(x, y, this.blockW, this.blockH);
    }

    drawPlayer(x, y, angle)
    {
        this.canvasContext.save();
        this.canvasContext.translate(x, y);
        this.canvasContext.rotate(angle);

        this.canvasContext.strokeStyle = "#4286f4";
        this.canvasContext.fillStyle = "#4286f4";

        //draw body
        this.canvasContext.beginPath();
        this.canvasContext.arc(0, 0, 25, 0, 2 * Math.PI);
        this.canvasContext.stroke();
        this.canvasContext.fill();

        //draw point
        this.canvasContext.beginPath();
        this.canvasContext.strokeStyle = "#fff";
        this.canvasContext.fillStyle = "#fff";
        this.canvasContext.arc(15, 0, 8, 0, 2 * Math.PI);
        this.canvasContext.stroke();
        this.canvasContext.fill();

        this.canvasContext.restore();
    }

    castRays(x,y,a, drawRay = false)
    {
        if (drawRay)
        {
            this.canvasContext.beginPath();
            this.canvasContext.strokeStyle = "#fffff0ff";
            this.canvasContext.lineWidth = "1";
        }
        
        let interStep = 0.1;
        let raysInterceptions = [];
        let entitiesInterceptions = {};
        let entitiesListCoords = {};
        let rayNumber = 0;

        for (let angleStep = (-this.FOV / 2) + 0.25; angleStep <= (this.FOV / 2) - 0.25; angleStep += ((this.FOV / 2) / this.raysNumber))
        {
            rayNumber++;

            let xTo = x;
            let yTo = y;
            let collision = false;

            while(!collision)
            {
                let crds = map.pixelPosToCoordinate(xTo, yTo);
                crds[0] = Math.ceil(crds[0]);
                crds[1] = Math.ceil(crds[1]);

                //if entity of any kind other than wall
                if (map.mapSpace[crds[0]][crds[1]] != "#" && map.mapSpace[crds[0]][crds[1]] != ".")
                {
                    //calculate distances from x1, y1 to x2, y2 (absolute values)
                    let xDistance = Math.abs(((x - xTo) * Math.cos(a)));
                    let yDistance = Math.abs(((y - yTo) * Math.sin(a)));
                    let distance = xDistance + yDistance;

                    entitiesInterceptions[crds[1]+"-"+crds[0]]=
                        {
                            distance: (distance),
                            mapCoords: {
                                x: crds[1],
                                y: crds[0]
                            },
                            type: map.mapSpace[crds[0]][crds[1]],
                            rayNumber: rayNumber
                        };
                }
    
                //if wall
                if (map.mapSpace[crds[0]][crds[1]] == "#")
                {   
                    let xDistance = Math.abs(((x - xTo) * Math.cos(a)));
                    let yDistance = Math.abs(((y - yTo) * Math.sin(a)));
                    let distance = (xDistance + yDistance);
                    
                    raysInterceptions.push(
                        {
                            rayx: (x),
                            rayy: (y),
                            rayx2: (xTo),
                            rayy2: (yTo),
                            distance: (distance),
                            mapCoords: {
                                x: crds[1],
                                y: crds[0]
                            },
                            type: map.mapSpace[crds[0]][crds[1]]
                        }
                    );

                    collision = true;
                } 
                else
                {
                    xTo += interStep * Math.cos(a + angleStep);
                    yTo += interStep * Math.sin(a + angleStep);
                }
            }
    
            //draw the ray
            if (drawRay)
            {
                this.canvasContext.moveTo(x ,y);
                this.canvasContext.lineTo(xTo,yTo);
                this.canvasContext.stroke();
            }
        }

        console.log("ray casting ended");
        return {wallsInterceptions: raysInterceptions, entitiesInterceptions: entitiesInterceptions};
    }

    // , rayIndex, distance, isBlockEdge, mapCoords
    drawScene(raysInterceptions, entitiesInterceptions)
    {
        //scene only lifespan objects
        let localObjects = {};
        let surfaceIndex = 0;
        let distanceDirNegY = true;
        this.globalClosestDistance = 100000;

        for (let rayIndex in raysInterceptions)
        {
            let x = rayIndex; //x later becomes rayIndex * wallWidth
            let distance = raysInterceptions[rayIndex].distance;
            let objName = raysInterceptions[rayIndex].mapCoords.x.toString() + raysInterceptions[rayIndex].mapCoords.y.toString();

            if (localObjects[objName] === undefined)
            {
                let wallHeight = this.screenHeight / (distance / this.screenHeight); //this.blockH / (distance * this.screenHeight);
                wallHeight < 20 ? wallHeight = 20 : null;

                let wallYPos = (this.screenHeight - wallHeight) / 2 ;
                let wallVisFragmentW = (this.screenWidth / this.raysNumber);

                surfaceIndex = 0;
                distanceDirNegY = true;

                localObjects[objName] = {
                    distances: [],
                    surfaces: [{
                        objName: objName,
                        x1: x * wallVisFragmentW,
                        x2: x * wallVisFragmentW,
                        y1: wallYPos,
                        y11: wallYPos,
                        y2: wallYPos + wallHeight,
                        y22 : wallYPos + wallHeight,
                    }],
                    isDrawn: false
                };
            }

            //draw wall surfaces
            localObjects, surfaceIndex, distanceDirNegY = this.drawSceneWall(distance, x, localObjects, objName, surfaceIndex, distanceDirNegY, rayIndex);
            
            //draw entities in the scene if any
            if (Object.keys(entitiesInterceptions).length > 0)
            {
                for (let entity in entitiesInterceptions)
                {
                    let eDist = entitiesInterceptions[entity].distance;
                    let objType = entitiesInterceptions[entity].type;
                    let entityX = entitiesInterceptions[entity].rayNumber;
                    this.drawEntityIn3DSpace(eDist, objType, entityX);
                }
            }
            
                
            // console.log(raysInterceptions[rayIndex]);
            // console.log("entity:", entitiesInterceptions);
        }

        if (document.getElementById("debugModeChkBox").checked)
            this.localObjectsPostProcessing(localObjects);
    }

    drawEntityIn3DSpace(distance, objType, x)
    {       
        let imageTexture = this.imageStoneWall;
        if (objType == "@")
        {
            imageTexture = this.imageEnemyWizzard;
        }

        let rayWidth = this.screenWidth / this.raysNumber;
        let xPos = rayWidth * x;
        let entityH = ((imageTexture.height * 4) * this.screenHeight / (distance / 1.2));
        let yPos = 20 + (this.screenHeight - entityH) / 2;
        let entityW = (imageTexture.width * 4 * this.screenWidth / distance);
        xPos -= entityW / 2 + this.blockW / 2;


        this.canvas3dContext.drawImage(
            imageTexture,
            0, 0,
            imageTexture.width, imageTexture.height,
            //x y
            xPos, yPos, 
            //W, H
            entityW, entityH
        );

    }

    drawSceneWall(distance, x, localObjects, objName, surfaceIndex, distanceDirNegY, rayIndex)
    {
        let wallHeight = this.screenHeight / (distance * 2 / this.screenHeight); //this.blockH / distance * this.screenHeight;  
        wallHeight < 20 ? wallHeight = 20 : null;

        let wallYPos = (this.screenHeight - wallHeight) / 2 ;
        let wallVisFragmentW = this.screenWidth / this.raysNumber;

        // context3dCanvas.fillRect(x * wallVisFragmentW, wallYPos, wallVisFragmentW , wallHeight);

        this.canvas3dContext.drawImage(
            this.imageStoneWall,
            //map x, y
            1, 1,
            //slice x, y
            900, 900, 
            //x y
            x * wallVisFragmentW, wallYPos, 
            //W, H
            wallVisFragmentW + 1, wallHeight
        );
        // this.canvas3dContext.drawImage(this.imageStoneWall, 1 ,1);

        //make further objects in shadow
        this.canvas3dContext.fillStyle = this.getWallColorByDistance(distance);
        this.canvas3dContext.fillRect(x * wallVisFragmentW, wallYPos, wallVisFragmentW + 1, wallHeight);

        //if the object is not yet registered in the scene
        if (localObjects[objName] === undefined)
        {
            surfaceIndex = 0;
            distanceDirNegY = true;

            localObjects[objName] = {
                distances: [],
                surfaces: [{
                    objName: objName,
                    x1: x * wallVisFragmentW,
                    x2: x * wallVisFragmentW,
                    y1: wallYPos,
                    y11: wallYPos,
                    y2: wallYPos + wallHeight,
                    y22 : wallYPos + wallHeight
                }]
            };
        } else 
        {
            localObjects[objName].distances.push(distance);

            //create surfaces definitions: x1, y1, x2, y2
            //create surface with decrementing distance
            let lastDistanceIdx = localObjects[objName].distances.length - 2;
            let prevDistance = localObjects[objName].distances[lastDistanceIdx];
            let prevDistance2 = localObjects[objName].distances[lastDistanceIdx-1];

            if ((prevDistance >= distance && prevDistance2 >= distance) || 
            (prevDistance <= distance && prevDistance2 <= distance))
            {
                localObjects[objName].surfaces[surfaceIndex].x2 = x * wallVisFragmentW + wallVisFragmentW;
                localObjects[objName].surfaces[surfaceIndex].y11 = wallYPos;
                localObjects[objName].surfaces[surfaceIndex].y2 = wallYPos + wallHeight;
            }

            //creating new surface
            //if distance direction switch
            if (((prevDistance < distance && distanceDirNegY) || prevDistance > distance && !distanceDirNegY) && 
            localObjects[objName].surfaces.length <= 1)
            {
                localObjects[objName].surfaces.push({
                    objName: objName,
                    x1: x * wallVisFragmentW,
                    x2: x * wallVisFragmentW + wallVisFragmentW,
                    y1: wallYPos,
                    y11: wallYPos,
                    y2: wallYPos + wallHeight,
                    y22 : wallYPos + wallHeight
                });
                
                surfaceIndex++;
                distanceDirNegY = !distanceDirNegY;
            }

            if (this.globalClosestDistance > distance)
                this.globalClosestDistance = distance;
        }

        return localObjects, surfaceIndex, distanceDirNegY;
    }

    //localObjects = current scene frame only objects
    localObjectsPostProcessing(localObjects)
    {
        for (let obj in localObjects)
        {
            for (let surf in localObjects[obj].surfaces)
            {
                this.drawSurfaceDebugInfo(localObjects[obj].surfaces[surf], obj);
            }
            // console.log(localObjects[obj].surfaces);   
        }
    }

    drawSurfaceDebugInfo(surfaceCoords, objName)
    {
        let x1  = surfaceCoords.x1;
        let x2  = surfaceCoords.x2;
        let y1  = surfaceCoords.y1;
        let y11 = surfaceCoords.y11;
        let y2  = surfaceCoords.y2;
        let y22 = surfaceCoords.y22;

        // console.log(localObjects[obj].surfaces[surf]);
        this.canvas3dContext.beginPath();
        this.canvas3dContext.lineWidth = "1";
        this.canvas3dContext.strokeStyle = "white";
        this.canvas3dContext.fillStyle = "white";

        this.canvas3dContext.moveTo(x1, y1);//x1y1
        this.canvas3dContext.lineTo(x2, y11);//x2y1
        this.canvas3dContext.lineTo(x2, y2);//x2y2
        this.canvas3dContext.lineTo(x1, y22);//x1y2
        this.canvas3dContext.lineTo(x1, y1);//x1y1

        // this.canvas3dContext.rect(xStart, yStart, xEnd - xStart, yEnd - yStart);
        this.canvas3dContext.stroke();

        //info texts of the points
        this.canvas3dContext.fillText(`x1y1`, x1+5, y1-15);
        this.canvas3dContext.fillText(`x2y11`, x2-40, y11-15);
        this.canvas3dContext.fillText(`x2y2`, x2-40, y2+15);
        this.canvas3dContext.fillText(`x1y22`, x1, y22+15);

        this.canvas3dContext.font = "12px Arial";
        let infoTxtX = x1 + 20;
        let infoTxtY = y1 - 30;
        // this.canvas3dContext.moveTo(x1, y1);//x1y1
        // this.canvas3dContext.lineTo(infoTxtX, infoTxtY);  //x2y1
        this.canvas3dContext.stroke();
        this.canvas3dContext.fillText("Obj-"+objName, x1 + 20, y1 + 20);
    }

    drawCeilingAndFloor()
    {
        var ceilingColor = this.canvas3dContext.createLinearGradient(0, 0, 0, this.screenHeight);
        ceilingColor.addColorStop(0, "#9aa4b7");
        ceilingColor.addColorStop(0.2, "#4d525b");
        ceilingColor.addColorStop(0.5, "#202226");
        ceilingColor.addColorStop(0.8, "#4d525b");
        ceilingColor.addColorStop(1, "#9aa4b7");

        this.canvas3dContext.fillStyle = ceilingColor;
        this.canvas3dContext.fillRect(0, 0, this.screenWidth, this.screenHeight);
    }

    getWallColorByDistance(distance)
    {
        let color;

        if (distance > 0 && distance < 200)
        {
            color = "#0000002f";
        }

        if (distance > 200 && distance < 400)
        {
            color = "#0000004f";
        }

        if (distance > 400 && distance < 600)
        {
            color = "#0000006f";
        }

        if (distance > 600 && distance < 800)
        {
            color = "#0000008f";
        }

        if (distance > 800 && distance < 1000)
        {
            color = "#0000009f";
        }

        if (distance > 1000 && distance < 1200)
        {
            color = "#000000af";
        }

        if (distance > 1200)
        {
            color = "#000000bb";
        }
        
        return color;
    }
}