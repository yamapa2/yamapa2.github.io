Board = function(dim, board=null) {
    let handlers = {};
    let size = null;
    let tiles = null;
    let emptyTile = null;
    let topLeft = null;
    let bottomRight = null;

    let notify = function(handle, args) {
        handler = handlers[handle];
        if(handler != undefined && handler != null)
            handler.fn.call(handler.obj, args);
    }

    this.addHandler = function(event, obj, fn) {
        handlers[event] = { obj: obj, fn: fn };
    }

    this.initialize = function(dim, board=null) {
        size = { cx: dim.cx, cy: dim.cy };
        tiles = new Array(size.cx);
        
        emptyTile = { x: size.cx-1, y: size.cy-1 };
        topLeft = { x: 0, y: 0 };
        bottomRight = { x: size.cx-1, y: size.cy-1 };

        let nSq = 0;
        for(let i = 0; i < size.cx; ++i) {
            tiles[i] = new Array(size.cy)
            for(let j = 0; j < size.cy; ++j) {
                tiles[i][j] = (board != null) ? board[i][j] : ++nSq;
                if(board != null && tiles[i][j] == 0)
                    emptyTile = { x: i, y: j };
            }
        }

        tiles[emptyTile.x][emptyTile.y] = 0;
    }

    this.shuffle = function() {
        for(let i = 0; i < 1000; ++i) {
            let dir = Math.floor(Math.random() * 4);
            this.move("LRUD"[dir]);
        }
        this.multiMove("L".repeat(size.cy));
        this.multiMove("U".repeat(size.cx));

        notify("onShuffled", null);
    }

    this.quickShuffle = function() {
        for(let k = 0; k < 100; ++k) {
            let i = Math.floor(Math.random() * size.cx);
            let j = Math.floor(Math.random() * size.cy);

            if(i == emptyTile.x && j == emptyTile.y)
                continue;

            let ni = Math.floor(Math.random() * size.cx);
            let nj = Math.floor(Math.random() * size.cy);

            if(ni == emptyTile.x && nj == emptyTile.y)
                continue;

            let t = tiles[i][j];
            tiles[i][j] = tiles[ni][nj];
            tiles[ni][nj] = t;
        }

        if(!this.isSolvable()) {
            let t = tiles[0][0];
            tiles[0][0] = tiles[0][1];
            tiles[0][1] = t;
        }

        notify("onShuffled", null);
    }

    this.move = function(dir) {
        let newEmptyTile = getNeighbor(emptyTile, opposite(dir));
        if(newEmptyTile != null) {
            tiles[emptyTile.x][emptyTile.y] = tiles[newEmptyTile.x][newEmptyTile.y];
            tiles[newEmptyTile.x][newEmptyTile.y] = 0;

            notify("onMoved", [ dir, emptyTile, newEmptyTile ]);

            emptyTile = newEmptyTile;
        }
    }

    this.multiMove = function(dirs) {
        for(dir of dirs)
            this.move(dir);
     }

    this.solve = function() {
        this.initialize(size);
        notify("onSolved", null);
    }

    this.getSize = function() {
        return { cx: size.cx, cy: size.cy };
    }

    this.getTileValue = function(r, c) {
        return tiles[r][c];
    }

    this.getEmptyTile = function() {
        return { x: emptyTile.x, y: emptyTile.y };
    }

    this.createSnapshot = function() {
        let snapshot = {
            size: size,
            tiles: new Array(size.cx),
            emptyTile: emptyTile
        };

        for(let i = 0; i < size.cx; ++i) {
            snapshot.tiles[i] = new Array()
            for(let j = 0; j < size.cy; ++j) {
                snapshot.tiles[i][j] = tiles[i][j];
            }
        }

        return snapshot;
    }

    this.restoreSnapshot = function(snapshot) {
        this.initialize(snapshot.size, snapshot.tiles);
    }

    this.isGameOver = function() {
        let nSq = 0;
        for(let i = 0 ; i < size.cx ; ++i) {
            for(let j = 0 ; j < size.cy ; ++j) {
                if(tiles[i][j] != ++nSq && tiles[i][j] != 0)
                    return false;
            }
        }
        return true;
    }

    this.isSolvable = function() {
        let nSq = 0, nEvenCycles = 0;
        for(let i = 0 ; i < size.cx ; ++i) {
            for(let j = 0 ; j < size.cy ; ++j) {
                ++nSq;
                if(tiles[i][j] <= 0)
                    continue;

                if(tiles[i][j] == nSq) {
                    tiles[i][j] = -tiles[i][j];
                    continue;
                }
    
                let ni = i, nj = j;
                let nRep = tiles[i][j];
                tiles[ni][nj] = -tiles[ni][nj];
                
                let nCycleLength = 0;
                do {
                    ++nCycleLength;

                    ni = Math.floor((nRep-1) / size.cy);
                    nj = (nRep-1) % size.cy;
                    nRep = tiles[ni][nj];
                    tiles[ni][nj] = -tiles[ni][nj];
                } while(nRep != nSq);

                ++nCycleLength;
    
                if(nCycleLength % 2 == 0)
                    ++nEvenCycles;
            }
        }

        for(let i = 0 ; i < size.cx ; ++i) {
            for(let j = 0 ; j < size.cy ; ++j) {
                tiles[i][j] = -tiles[i][j];
            }
        }
    
        return (nEvenCycles%2 == 0);
    }

    let opposite = function(dir) { return { L:"R", R:"L", U:"D", D:"U" }[dir]; }

    this.fixTile = function(to, from) {
        if(to.x == from.x && from.x == from.y)
            return true;

        if(to.x < size.cx-2)
            return fixTile0(to, from);
        else if(to.x < sizecx-1)
            return fixTile1(to, from);
        else
            return fixTile2(to, from);
    }

    let getNeighbor = function(loc, dir) {
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

    let restrict = function(tl=null, br=null) {
        topLeft = (tl != undefined || tl != null) ? { x: tl.x, y: tl.y } : { x: 0, y: 0 };
        bottomRight = (br != undefined || br != null) ? { x: br.x, y: br.y } : bottomRight;
    }

    this.moveEmptyTile = function(to, fixed) {
        let xdir = ((to.x < emptyTile.x) ? "U" : ((to.x > emptyTile.x) ? "D" : "X"));
        let ydir = ((to.y < emptyTile.y) ? "L" : ((to.y > emptyTile.y) ? "R" : "X"));
    
        let stops = new Array();
    
        if(xdir == "U" && ydir == "L")
        {
            stops[0] = { x: emptyTile.x, y: to.y };
            if((fixed.y == stops[0].y && to.x < fixed.x && fixed.x <= stops[0].x) ||
               (fixed.x == stops[0].x && stops[0].y <= fixed.y && fixed.y < emptyTile.y))
            {
                stops[0] = { x: to.x, y: emptyTile.y };
            }
        }
        else if(xdir == "U" && ydir == "R")
        {
            stops[0] = { x: emptyTile.x, y: to.y };
            if((fixed.y == stops[0].y && to.x < fixed.x && fixed.x <= stops[0].x) ||
               (fixed.x == stops[0].x && emptyTile.y < fixed.y && fixed.y <= stops[0].y))
            {
                stops[0] = { x: to.x, y: emptyTile.y };
            }
        }
        else if(xdir == "D" && ydir == "L")
        {
            stops[0] = { x: emptyTile.x, y: to.y };
            if((fixed.y == stops[0].y && stops[0].x <= fixed.x && fixed.x < to.x) ||
               (fixed.x == stops[0].x && stops[0].y <= fixed.y && fixed.y < emptyTile.y))
            {
                stops[0] = { x: to.x, y: emptyTile.y };
            }
        }
        else if(xdir == "D" && ydir == "R")
        {
            stops[0] = { x: emptyTile.x, y: to.y };
            if((fixed.y == stops[0].y && stops[0].x <= fixed.x && fixed.x < to.x) ||
               (fixed.x == stops[0].x && emptyTile.y < fixed.y && fixed.y <= stops[0].y))
            {
                stops[0] = { x: to.x, y: emptyTile.y };
            }
        }
        else if((xdir == "U" && ydir == "X" && to.x < fixed.x && fixed.x < emptyTile.x) || 
                (xdir == "D" && ydir == "X" && emptyTile.x < fixed.x && fixed.x < to.x))
        {
            let nb = getNeighbor(emptyTile, "L");
            stops[0] = (nb != null) ? nb: getNeighbor(emptyTile, "R");
            stops[1] = { x: to.x, y: stops[0].y };
        }
        else if((xdir == "X" && ydir == "L" && to.y < fixed.y && fixed.y < emptyTile.y) ||
                (xdir == "X" && ydir == "R" && emptyTile.y < fixed.y && fixed.y < to.y))
        {
            let nb = getNeighbor(emptyTile, "U");
            stops[0] = (nb != null) ? nb: getNeighbor(emptyTile, "D");
            stops[1] = { x: stops[0].x, y: to.y };
        }
        else
        {
            return;
        }
    
        stops[stops.length] = to;
    
        for(st of stops) {
            let dir = ((st.y < emptyTile.y) ? "R" : ((st.y > emptyTile.y) ? "L" : "X"));
            if(dir == "X")
                dir = ((st.x < emptyTile.x) ? "D" : ((st.x > emptyTile.x) ? "U" : "X"));
    
            while(st.x != emptyTile.x || st.y != emptyTile.y)
                this.move(dir);
        }
    }

    this.moveTile = function(to, from) {
        let xdir = ((to.x < from.x) ? "U" : ((to.x > from.x) ? "D" : "X"));
        let ydir = ((to.y < from.y) ? "L" : ((to.y > from.y) ? "R" : "X"));
    
        let newTile;
        let pdir = xdir;
        while(to.x != from.x || to.y != from.y) {
            pdir = (pdir == ydir) ? xdir: ydir;
            newTile = getNeighbor(from, pdir);
            if(newTile != null) {
                this.moveEmptyTile(newTile, from);
                this.move(pdir)
                from = newTile;
            }
        }
    }

    this.fixTile0 = function(to, from) {
        if(emptyTile.x == to.x) {
            this.move("U");
            if(emptyTile.x == from.x && emptyTile.y == from.y) {
                --from.x;
                if(to.x == from.y && to.y == from.y)
                    return true;
            }
    
        }
    
        if(to.y < size.cy-1) {
            if(from.x != to.x) {
                restrict({x: to.x+1, y: 0});
                this.moveTile({ x: to.x+1, y: to.y }, from);
                this.moveEmptyTile({ x: to.x+1, y: to.y+1 }, { x: to.x+1, y: to.y });
    
                restrict({ x: to.x, y: 0 });
                this.multiMove("ULD");
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
            this.multiMove("LURRDLULD");
        }
    
        restrict();
        return true;
    }
    
    this.logTiles = function() {
        console.log(tiles);
    }
    
    this.initialize(dim, board);
}

View = function(size, board) {
    let displayParams = {
        left: 60,
        top: 60,
        tileWidth: 100,
        tileHeight: 100,
        padWidth: 5,
        padHeight: 5
    }

    let init = function() {
        let innerHTML = "";
        for(let i = 0; i < size.cx; ++i) {
            innerHTML += "<div class='row'>";
            for(let j = 0; j < size.cy; ++j) {
                tileId = size.cy*i + j + 1;
                if(tileId != size.cx*size.cy)
                    innerHTML += `<div id="${tileId}" class="tile" onclick="tv.move(this)">${tileId}</div>`
            }
            innerHTML += "</div>";
        }
        document.getElementById("board").innerHTML = innerHTML;
    }
    
    this.display = function() {
        for(let i = 0; i < size.cx; ++i) {
            for(let j = 0; j < size.cy; ++j) {
                let tile = document.getElementById(board.getTileValue(i, j).toString());
                if(tile == null)
                    continue;

                tile.innerHTML = board.getTileValue(i, j);
                tile.style.width = `${displayParams.tileWidth}px`;
                tile.style.height = `${displayParams.tileHeight}px`;
                tile.style.top = `${displayParams.top + i*(displayParams.tileHeight + displayParams.padHeight)}px`;
                tile.style.left = `${displayParams.left + j*(displayParams.tileWidth + displayParams.padWidth)}px`;
            }
        }
    }

    this.move = function(tile) {
        let top = parseInt(tile.style.top.substring(0, tile.style.top.length-2));
        let left = parseInt(tile.style.left.substring(0, tile.style.left.length-2));

        let tileLoc0 = Math.round(top - displayParams.top) / (displayParams.tileHeight + displayParams.padHeight);
        let tileLoc1 = Math.round(left - displayParams.left) / (displayParams.tileWidth + displayParams.padWidth);
        let emptyTile = board.getEmptyTile();

        let tileDiff = [ tileLoc0-emptyTile.x, tileLoc1-emptyTile.y ];
        
        let dir = null;
        if(tileDiff[0] == 0 && Math.abs(tileDiff[1]) == 1) {
            dir = (tileDiff[1] == 1) ? "L" : "R";
        }
        else if(tileDiff[1] == 0 && Math.abs(tileDiff[0]) == 1) {
            dir = (tileDiff[0] == 1) ? "U" : "D";
        }
        
        board.move(dir);
    }

    this.shuffle = function() {
        board.shuffle();
    }
    
    this.solve = function() {
        board.solve();
    }
    
   init();
}

var tb, tv;
function newGame(rows, cols) {
    tb = new Board({ cx: rows, cy: cols});
    tv = new View(tb.getSize(), tb);
    tb.addHandler("onMoved", tv, tv.display);
    tb.addHandler("onShuffled", tv, tv.display);
    tb.addHandler("onSolved", tv, tv.display);
    tb.shuffle();

    for(let i = 0; i < rows; ++i) { 
        for(let j = 0; j < cols; ++j) { 
            this[`p${i}${j}`] = { x: i, y: j };
        }
    }
}

// 1003920749

var moveHistory, snapshot;

function record() {
    moveHistory = "";
    snapshot = tb.createSnapshot();
    tb.addHandler("onMoved", null, function(args) {
        moveHistory += args[0];
    });
}

function play() {
    tb.restoreSnapshot(snapshot);
    tb.addHandler("onMoved", tv, tv.display);
    let myTimer = setInterval(function() {
        if(moveHistory.length == 0) {
            clearInterval(myTimer);
            return;
        }
    
        tb.move(moveHistory[0]);
        moveHistory = moveHistory.substring(1);
    }, 300);
}

function exec(cmd) {
    record();
    eval(cmd);
    play();
}