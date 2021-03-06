class Map {
    constructor()
    {
        this.mapSpace = [
            "############################################",
            "#....................#######################",
            "#......................................@...#",
            "#..........................................#",
            "#....................############..........#",
            "#....................##.........#..........#",
            "#....##..............##....######..........#",
            "#....##..............##....##..............#",
            "#....##..............##....##..............#",
            "#....##..............##....##..............#",
            "#...............@....##....................#",
            "#....................##....................#",
            "#....##..............##....##..............#",
            "####################################.....###",
            "####################################.....###",
            "#....................#...................###",
            "#....................#.....................#",
            "#....................##....##........##....#",
            "#....................##....##........##....#",
            "#....##..............##....................#",
            "#....##..............##.........@..........#",
            "#....##..............##....##........##....#",
            "#....##..............##....##........##....#",
            "#....................##....................#",
            "#....................##....................#",
            "#....................#.....##........##....#",
            "#....##..............##....##........##....#",
            "#..........................................#",
            "#..........................................#",
            "############################################"
        ];

        this.blockW = 64;
        this.blockH = 64;

        console.log("class Map initiated");
    }

    coordinateToPixelPos(xIndex, yIndex)
    {
        return (Array((xIndex) * this.blockW, (yIndex) * this.blockH));
    }

    //received in reverse order
    pixelPosToCoordinate(y, x)
    {
        x -= this.blockW;
        y -= this.blockH;
        return (Array(x / this.blockW, y / this.blockH));
    }

}