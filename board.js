Board = function(dim, board=null) {
    //  Callback handlers on important events while playing the puzzle
    let handlers = {};

    let size = null;
    let tiles = null;
    let emptyTile = null;

    //  Boundaries of the puzzle board, outside of which the tiles are fixed, and can not be moved
    let topLeft = null;
    let bottomRight = null;

    // Notify on an event on all the registered handlers
    let notify = function(handle, args) {
        handlersList = handlers[handle];

        if(handlersList != undefined)
            for(handler of handlersList)
                handler.fn.call(handler.obj, args);
    }

    // Add or update an event handler
    this.addHandler = function(event, obj, fn) {
        handlersList = handlers[event];
        if(handlersList == undefined) {
            handlers[event] = [ { obj: obj, fn: fn } ];
        }
        else {
            let i = handlersList.findIndex(h => h.fn == fn && h.obj == obj)
            i = (i < 0) ? handlersList.length : i;
            handlersList[i] = { obj: obj, fn: fn };
        }
    }

    // Delete an event handler
    this.deleteHandler = function(event, obj, fn) {
        handlersList = handlers[event];
        if(handlersList != undefined) {
            let i = handlersList.findIndex(h => h.fn == fn && h.obj == obj)
            if(i >= 0)
                handlersList.splice(i, 1);
        }
    }

    // Validate a board position
    let validateBoard = function(dim, board) {
        if(dim.cx != board.length)
            throw "Row dimension does not match with the board position";
        
        for(row of board)
            if(dim.cy != row.length)
                throw "Column dimension does not match with the board position";

        let allTiles = [].concat.apply([], board).sort((i, j) => i-j);
        let validTiles = Array.from({length: dim.cx*dim.cy}, (x, i) => i);
        if(JSON.stringify(allTiles) != JSON.stringify(validTiles))
            throw "Invalid tile values";
    }

    //  Initialize the tile board with a given dimension and optionally a given board position
    this.initialize = function(dim, board=null) {
        if(board != null)
            validateBoard(dim, board)

        size = { cx: dim.cx, cy: dim.cy };
        topLeft = { x: 0, y: 0 };
        bottomRight = { x: size.cx-1, y: size.cy-1 };
        
        if(board != null) {
            tiles = board.map(r => r.slice());
            emptyTile = this.findTile(0);
        }
        else {
            let validTiles = Array.from({length: dim.cx*dim.cy}, (x, i) => i+1);
            tiles = [];
            while(validTiles.length > 0)
                tiles.push(validTiles.splice(0, dim.cy));
            
            emptyTile = { x: size.cx-1, y: size.cy-1 };
            tiles[emptyTile.x][emptyTile.y] = 0;
        }
    }

    this.getSize = () => ({ cx: size.cx, cy: size.cy });
    this.getTileValue = (r, c) => tiles[r][c];
    this.getEmptyTile = ()  => ({ x: emptyTile.x, y: emptyTile.y });

    //  Find a tile location given the tile value
    this.findTile = function(n) {
        for(let i = 0; i < size.cx; ++i) {
            for(let j = 0; j < size.cy; ++j) {
                if(tiles[i][j] == n)
                    return { x: i, y: j};
            }
        }
        return null;
    }
    
    //  Creates a snapshot that includes the board sie, and the tile values
    this.createSnapshot = function() {
        return {
            size: { cx: size.cx, cy: size.cy },
            tiles: tiles.map(r => r.slice())
        };
    }

    //  Restore a snapshot previously created
    this.restoreSnapshot = function(snapshot) {
        this.initialize(snapshot.size, snapshot.tiles);
    }

    //  This function shuffle the puzzle from the current position, by sliding the tiles a large number of times.
    //  Makes sure the empty tile is at the bottom right corner.
    this.shuffle = function() {
        for(let i = 0; i < 100*size.cx*size.cy; ++i) {
            let dir = Math.floor(Math.random() * 4);
            this.move("LRUD"[dir]);
        }

        //  Move empty tile to the bottom right corner
        this.multiMove("L".repeat(size.cy));
        this.multiMove("U".repeat(size.cx));

        notify("onShuffled", null);
    }

    //  This function shuffle the tiles by randomly placing the tiles on the board
    //  Makes sure that the puzzle is solvable
    this.quickShuffle = function() {
        let suffledTiles = Array.from({length: size.cx*size.cy-1}, (x, i) => i+1);
        
        for(let i = suffledTiles.length - 1; i > 0; --i) {
            let j = Math.floor(Math.random() * (i + 1));
            [suffledTiles[i], suffledTiles[j]] = [suffledTiles[j], suffledTiles[i]];
        }
        suffledTiles.push(0);   //  Don't forget to add the empty tile at the end

        tiles = [];
        while(suffledTiles.length > 0)
            tiles.push(suffledTiles.splice(0, size.cy));

        //  If the current position is not solvable, exchange the first two tiles, making the puzzle solvable
        if(!this.isSolvable())
            [ tiles[0][0], tiles[0][1] ] = [ tiles[0][1], tiles[0][0] ];

        notify("onShuffled", null);
    }

    //  Moves the tile next to the empty tile (in the opposite direction of 'dir') in the direction of 'dir'
    this.move = function(dir) {
        let newEmptyTile = getNeighbor(emptyTile, opposite(dir));

        //  Igmore if the command if there is no tile next to the empty tile
        if(newEmptyTile != null) {
            tiles[emptyTile.x][emptyTile.y] = tiles[newEmptyTile.x][newEmptyTile.y];
            tiles[newEmptyTile.x][newEmptyTile.y] = 0;

            notify("onMoved", [ dir, emptyTile, newEmptyTile ]);

            emptyTile = newEmptyTile;   //  Don't forget to to update the emptyTile to reflect where the moved tile was

            if(this.isSolved())
                notify("onSolved", null);
        }
    }

    //  Applies a sequence of moves
    this.multiMove = function(dirs) {
        for(let dir of dirs)
            this.move(dir);
    }

    //  Check if the puzzle is solved
    this.isSolved = function() {
        //  Check if the emptyTile is in the bottom right position
        if(emptyTile.x != size.cx-1 || emptyTile.y != size.cy-1)
            return false;

        //  Check if the tiles are in sequential order
        let nSq = 0;
        for(let i = 0 ; i < size.cx ; ++i) {
            for(let j = 0 ; j < size.cy ; ++j) {
                if(tiles[i][j] != ++nSq && tiles[i][j] != 0)
                    return false;
            }
        }
        return true;
    }

    //  Check is the puzzle position is solvable or not
    //  A puzzle position is solvable if and only if an even number of tile exchanges can lead to a solved position
    //  This can be further simplified to checking if an even number of "even-cycles" exists on the puzzle board
    this.isSolvable = function() {
        let nSq = 0, nEvenCycles = 0;
        for(let i = 0 ; i < size.cx ; ++i) {
            for(let j = 0 ; j < size.cy ; ++j) {
                ++nSq;
                if(tiles[i][j] <= 0)    //  Empty tile or a tile already visited
                    continue;

                //  Find a cycle of tiles starting with the 
                let nextTile = tiles[i][j];
                tiles[i][j] = -tiles[i][j];             //  Mark the tile as visited
                let nCycleLength = 1;

                while(nextTile != nSq) {
                    let ni = Math.floor((nextTile-1) / size.cy);
                    let nj = (nextTile-1) % size.cy;

                    nextTile = tiles[ni][nj];
                    tiles[ni][nj] = -tiles[ni][nj];     //  Mark the tile as visited
                    ++nCycleLength;
                }

                //  Ignore odd cycles, as they can be mapped to even number of tile exchanges
                if(nCycleLength % 2 == 0)
                    ++nEvenCycles;
            }
        }

        //  Don't forget to change the sign back to positive on each tile value
        for(let i = 0 ; i < size.cx ; ++i) {
            for(let j = 0 ; j < size.cy ; ++j) {
                tiles[i][j] = -tiles[i][j];
            }
        }
    
        //  Even number of even-cycles is sovable!
        return (nEvenCycles % 2 == 0);
    }

    let opposite = (dir) => ({ L:"R", R:"L", U:"D", D:"U" }[dir]);

    let getNeighbor = function(loc, dir) {
        //  Make a copy of the location value passed in, don't want to inadvertantly update an object that is not owned by the function
        let nloc = { x: loc.x, y: loc.y };

        if(dir == "L" && nloc.y > topLeft.y)            //	Empty square should not be in the left most column
            --nloc.y;
        else if(dir == "U" && nloc.x > topLeft.x)       //	Empty square should not be in the top most row
            --nloc.x;
        else if(dir == "R" && nloc.y < bottomRight.y)   //	Empty square should not be in the right most column
            ++nloc.y;
        else if(dir == "D" && nloc.x < bottomRight.x)   //	Empty square should not be in the bottom most row
            ++nloc.x;

        return ((loc.x != nloc.x || loc.y != nloc.y) ? nloc: null);
    }

    //  Temporarily restricts the boundaries of the puzzle board (helper function used in auto-solving)
    let restrict = function(tl=null, br=null) {
        let oldTL = { x: topLeft.x, y: topLeft.y }, oldBR = { x: bottomRight.x, y: bottomRight.y };
        
        topLeft = (tl != null) ? { x: tl.x, y: tl.y } : { x: 0, y: 0 };
        bottomRight = (br != null) ? { x: br.x, y: br.y } : bottomRight;
        
        return { topLeft: oldTL, bottomRight: oldBR };
    }

    //  Moves the empty tile from the current position to given position 'to', while avoid touching a given position 'fixed'
    //  Expects that the puzzle board corners are restricted accordingly so as not to disturb an existing solved tiles
    this.moveEmptyTile = function(to, fixed) {
        let xdir = ((to.x < emptyTile.x) ? "U" : ((to.x > emptyTile.x) ? "D" : "X"));
        let ydir = ((to.y < emptyTile.y) ? "L" : ((to.y > emptyTile.y) ? "R" : "X"));
    
        let stops = new Array();
    
        if(xdir == "U" && ydir == "L") {
            //  Tile moving in the north-west direction
            stops[0] = { x: emptyTile.x, y: to.y };
            if((fixed.y == stops[0].y && to.x < fixed.x && fixed.x <= stops[0].x) ||
               (fixed.x == stops[0].x && stops[0].y <= fixed.y && fixed.y < emptyTile.y)) {
                stops[0] = { x: to.x, y: emptyTile.y };
            }
        }
        else if(xdir == "U" && ydir == "R") {
            //  Tile moving in the north-east direction
            stops[0] = { x: emptyTile.x, y: to.y };
            if((fixed.y == stops[0].y && to.x < fixed.x && fixed.x <= stops[0].x) ||
               (fixed.x == stops[0].x && emptyTile.y < fixed.y && fixed.y <= stops[0].y)) {
                stops[0] = { x: to.x, y: emptyTile.y };
            }
        }
        else if(xdir == "D" && ydir == "L") {
            //  Tile moving in the south-west direction
            stops[0] = { x: emptyTile.x, y: to.y };
            if((fixed.y == stops[0].y && stops[0].x <= fixed.x && fixed.x < to.x) ||
               (fixed.x == stops[0].x && stops[0].y <= fixed.y && fixed.y < emptyTile.y)) {
                stops[0] = { x: to.x, y: emptyTile.y };
            }
        }
        else if(xdir == "D" && ydir == "R") {
            //  Tile moving in the south-east direction
            stops[0] = { x: emptyTile.x, y: to.y };
            if((fixed.y == stops[0].y && stops[0].x <= fixed.x && fixed.x < to.x) ||
               (fixed.x == stops[0].x && emptyTile.y < fixed.y && fixed.y <= stops[0].y)) {
                stops[0] = { x: to.x, y: emptyTile.y };
            }
        }
        else if(xdir == "U" && ydir == "X") {
            //  Tile moving in the north direction
            if(to.x < fixed.x && fixed.x < emptyTile.x) {
                let nb = getNeighbor(emptyTile, "L");
                stops[0] = (nb != null) ? nb: getNeighbor(emptyTile, "R");
                stops[1] = { x: to.x, y: stops[0].y };
            }
        }
        else if(xdir == "D" && ydir == "X") {
            //  Tile moving in the south direction
            if(emptyTile.x < fixed.x && fixed.x < to.x) {
                let nb = getNeighbor(emptyTile, "L");
                stops[0] = (nb != null) ? nb: getNeighbor(emptyTile, "R");
                stops[1] = { x: to.x, y: stops[0].y };
            }
        }
        else if(xdir == "X" && ydir == "L") {
            //  Tile moving in the west direction
            if(to.y < fixed.y && fixed.y < emptyTile.y) {
                let nb = getNeighbor(emptyTile, "U");
                stops[0] = (nb != null) ? nb: getNeighbor(emptyTile, "D");
                stops[1] = { x: stops[0].x, y: to.y };
            }
        }
        else if(xdir == "X" && ydir == "R") {
            //  Tile moving in the east direction
            if(emptyTile.y < fixed.y && fixed.y < to.y) {
                let nb = getNeighbor(emptyTile, "U");
                stops[0] = (nb != null) ? nb: getNeighbor(emptyTile, "D");
                stops[1] = { x: stops[0].x, y: to.y };
            }
        }
        else {
            //  The tile is already in the right position
            return;
        }
    
        stops[stops.length] = to;   //  Final stop of the tile
    
        //  Move tile through the stops
        for(let st of stops) {
            let dir = ((st.y < emptyTile.y) ? "R" : ((st.y > emptyTile.y) ? "L" : "X"));
            if(dir == "X")
                dir = ((st.x < emptyTile.x) ? "D" : ((st.x > emptyTile.x) ? "U" : "X"));
    
            while(st.x != emptyTile.x || st.y != emptyTile.y)
                this.move(dir);
        }
    }

    //  Move tile from position 'from'to position 'ito'
    //  Expects that the puzzle board corners are restricted accordingly so as not to disturb an existing solved tiles
    this.moveTile = function(ito, ifrom) {
        //  Make a copy of the input objects passed in, don't want to inadvertantly update an object that is not owned by the function
        let to = { x: ito.x, y:ito.y }, from = { x: ifrom.x, y:ifrom.y };

        let xdir = ((to.x < from.x) ? "U" : ((to.x > from.x) ? "D" : "X"));
        let ydir = ((to.y < from.y) ? "L" : ((to.y > from.y) ? "R" : "X"));
    
        let newTile, pdir = xdir;
        while(to.x != from.x || to.y != from.y) {   //  While the tile did not reach to target position
            pdir = (pdir == ydir) ? xdir: ydir;     //  alternate between X and Y directions to reduce the number of moves (staircase pattern)
            if((pdir == xdir && to.x != from.x) || (pdir == ydir && to.y != from.y)) {
                newTile = getNeighbor(from, pdir);
                if(newTile != null) {
                    this.moveEmptyTile(newTile, from);
                    this.move(pdir)
                    from = newTile;
                }
            }
        }
    }

    //  Auto solve the puzzle board
    this.solve = function() {
        let nSq = 0, to = {}, from = {}
        for(let i = 0; i < size.cx; ++i) {
            for(let j = 0; j < size.cy; ++j) {
                from = this.findTile(++nSq);
                if(from != null)
                    this.fixTile({x: i, y: j}, from);
            }
        }
    
        notify("onSolved", null);
    }
    
    //  Fix the tile in position 'from' to the right position given by 'to'
    this.fixTile = function(to, from) {
        if(to.x == from.x && to.y == from.y)
            return true;

        if(to.x < size.cx-2)
            return this.fixTileInTopRows(to, from);
        else if(to.x < size.cx-1)
            return this.fixTileInSecondRowFromBottom(to, from);
        else
            return this.fixTileInLastRow(to, from);
    }

    this.fixTileInTopRows = function(ito, ifrom) {
        //  Make a copy of the input objects passed in, don't want to inadvertantly update an object that is not owned by the function
        let to = { x: ito.x, y:ito.y }, from = { x: ifrom.x, y:ifrom.y };

        if(emptyTile.x == to.x) {
            this.move("U");
            if(emptyTile.x == from.x && emptyTile.y == from.y) {
                --from.x;
                if(to.x == from.x && to.y == from.y)
                    return true;
            }
        }
    
        if(to.y < size.cy-1) {
            if(from.x != to.x) {
                restrict({x: to.x+1, y: 0});
                this.moveTile({ x: to.x+1, y: to.y }, from);
                this.moveEmptyTile({ x: to.x+1, y: to.y+1 }, { x: to.x+1, y: to.y });
    
                restrict({ x: to.x, y: 0 });
                this.multiMove("DRU");
            }
            else {
                restrict({ x: to.x+1, y: 0 });
                this.moveEmptyTile({ x: to.x+1, y: to.y }, { x: -1, y: -1 });
                
                restrict(to);
                this.moveTile(to, from);
            }
        }
        else {
            restrict({ x: to.x+1, y: 0 });
            
            this.moveTile({ x: to.x+1, y: to.y }, from);
            this.moveEmptyTile({ x: to.x+1, y: to.y-1 }, { x: to.x+1, y: to.y });
            
            restrict({ x: to.x, y: 0 });
            this.multiMove("RDLLURDRU");
        }
    
        restrict();
        return true;
    }
    
    this.fixTileInSecondRowFromBottom = function(ito, ifrom) {
        //  Make a copy of the input objects passed in, don't want to inadvertantly update an object that is not owned by the function
        let to = { x: ito.x, y:ito.y }, from = { x: ifrom.x, y:ifrom.y };

        if(to.y < from.y)
            while(emptyTile.y < to.y) this.move("L");
    
        if(to.y <= from.y && to.y <= emptyTile.y) {
            restrict(to);
            this.moveTile(to, from);
            restrict();
        }
        else {
            if(emptyTile.x == size.cx-2) this.move("U");
            while(from.y < emptyTile.y) this.move("R");
            
            if(emptyTile.y == from.y)
                ++from.y;
    
            if(to.y == from.y) {
                if(from.y == 1) {
                    this.multiMove("DLULDRRULDL");
                }
                else {
                    while(emptyTile.y < from.y-2) this.move("L");
                    while(emptyTile.y > from.y-2) this.move("R");

                    this.multiMove("DLLURDRU");
                }
            }
            else {
                while(emptyTile.y < from.y-1) this.move("L");
    
                let nDiff = to.y - emptyTile.y;
                let hDir = "L", vDir = "D";
    
                for(let i = nDiff-1 ; i > 0 ; --i) {
                    this.move(vDir);
                    this.multiMove(hDir.repeat(i));
                    vDir = opposite(vDir);
                    hDir = opposite(hDir);
                }
    
                this.move(vDir);
    
                if(nDiff % 2)
                    this.multiMove("DLLURULDDRRUL");
    
                for(let i = 1 ; i <= nDiff ; ++i) {
                    hDir = opposite(hDir);
                    vDir = opposite(vDir);
                    this.multiMove(hDir.repeat(i));
                    this.move(vDir);
                }
            }
        }
    }

    this.fixTileInLastRow = function(ito, ifrom) {
        //  Make a copy of the input objects passed in, don't want to inadvertantly update an object that is not owned by the function
        let to = { x: ito.x, y:ito.y }, from = { x: ifrom.x, y:ifrom.y };
        
        while(emptyTile.y > from.y+1) this.multiMove("R");
        while(emptyTile.y < from.y) this.move("L");
        if(emptyTile.y == from.y)
            --from.y;
    
        if(from.x == to.x && from.y == to.y)
            return true;
    
        if(to.y != from.y-1)
        {
            let nShifts = from.y - to.y;
            if(nShifts > 0)
            {
                this.multiMove("DRRUL".repeat(nShifts));
                this.multiMove("DR");
                this.multiMove("DLLURULDDRRUL");
                this.multiMove("ULLDR".repeat(Math.max(nShifts-2, 0)));
                this.multiMove("ULDLU");
            }
        }
        else
        {
            this.multiMove("L");
            this.multiMove("DRRR");
            this.multiMove("ULL");
            this.multiMove("DRR");
            this.multiMove("UL");
            this.multiMove("DLU");
            this.multiMove("RRD");
            this.multiMove("LLLU");
        }
    
        return true;
    }

    this.initialize(dim, board);
}