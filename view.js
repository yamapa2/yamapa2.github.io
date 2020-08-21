View = function(size, board) {
    let displayParams = {
        left: 50,
        top: 50,
        tileWidth: 100,
        tileHeight: 100,
        padWidth: 5,
        padHeight: 5,
        moveSpeed: 300,
        hideTileValues: true,
        backgroundColors: [ "#ffff00", "#00ffff" ],
        backgroundImage: "https://wallpapercave.com/wp/wp4637628.jpg"
    }

    //  Initialize the board view, create grid view with DIV cards
    let initialize = function() {
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

        //  If an image background is provided, scale the image to fit to the puzzle board
        if(displayParams.backgroundImage != undefined && displayParams.backgroundImage != null) {
            let img = new Image();
            img.src = displayParams.backgroundImage;
            
            let wScale = size.cy * displayParams.tileWidth / img.width;
            let hScale = size.cx * displayParams.tileHeight / img.height;

            if(wScale < hScale)
                displayParams.backgroundSize = `auto ${size.cx * displayParams.tileHeight}px`;
            else
                displayParams.backgroundSize = `${size.cy * displayParams.tileWidth}px auto`;
        }
    }
    
    //  Update the content of each DIV card (representing a tile) with the corresponding value from the assoiciated board
    this.display = function() {
        //console.log([displayParams, displayParams.backgroundImage.length])
        for(let i = 0; i < size.cx; ++i) {
            for(let j = 0; j < size.cy; ++j) {
                let tile = document.getElementById(board.getTileValue(i, j).toString());
                if(tile == null)
                    continue;

                //  Set tile width, height and position of each DIV card
                tile.style.width = `${displayParams.tileWidth}px`;
                tile.style.height = `${displayParams.tileHeight}px`;
                tile.style.top = `${displayParams.top + i*(displayParams.tileHeight + displayParams.padHeight)}px`;
                tile.style.left = `${displayParams.left + j*(displayParams.tileWidth + displayParams.padWidth)}px`;

                if(displayParams.backgroundImage != undefined && displayParams.backgroundImage != null && displayParams.backgroundImage.length > 0) {
                    //  A background image is provided, paint the tiles with image
                    tile.style.background = 'none';

                    let posx = Math.floor((board.getTileValue(i, j)-1) / size.cy);
                    let posy = (board.getTileValue(i, j)-1) % size.cy;

                    tile.style.backgroundImage = `url(${displayParams.backgroundImage})`;
                    tile.style.backgroundPosition = `-${posy * displayParams.tileWidth}px -${posx * displayParams.tileHeight}px`;
                    tile.style.backgroundSize = displayParams.backgroundSize;
                }
                else if(displayParams.backgroundColors != undefined && displayParams.backgroundColors != null) {
                    //  Background color tranisiton is provided, paint the tiles by color scaled by the tile value
                    tile.style.background = 'none';

                    let scale = (board.getTileValue(i, j)-1)/(size.cx*size.cy-1)
                    let bgcolor = "#"
                    for(let i = 0; i < 3; ++i) {
                        let c1 = parseInt("0x"+displayParams.backgroundColors[0].substring(1+2*i, 3+2*i))
                        let c2 = parseInt("0x"+displayParams.backgroundColors[1].substring(1+2*i, 3+2*i))

                        let cc = Math.max(0, Math.min(0xff, Math.floor(c1 + (c2 - c1)*scale)));
                        bgcolor += ((cc < 16) ? "0" : "") + cc.toString(16);
                    }
                    tile.style.backgroundColor = bgcolor;
                }

                //  Set tile value only if hideTileValue is set to false
                tile.innerHTML = displayParams.hideTileValues ? " ": board.getTileValue(i, j);
            }
        }
    }

    //  Find the DIV card that is touched, check if empty tile is a neighbor, if so move the tile accordingly
    this.move = function(tile) {
        let touchedTile = board.findTile(parseInt(tile.id));
        let emptyTile = board.getEmptyTile();

        let dir = null;
        if(touchedTile.x == emptyTile.x && Math.abs(touchedTile.y-emptyTile.y) == 1)
            dir = (touchedTile.y > emptyTile.y) ? "L" : "R";
        else if(touchedTile.y == emptyTile.y && Math.abs(touchedTile.x-emptyTile.x) == 1)
            dir = (touchedTile.x > emptyTile.x) ? "U" : "D";
        
        if(dir != null)
            board.move(dir);
    }

    //  Sets up a new puzzle board with given rows and columns
    this.new = function(rows, cols) {
        size = (rows != null) ? { cx: rows, cy: cols} : board.getSize();
        board = new Board(size);
        
        //  Do not forget to reinitialize the view, board dimensions might have changed, and so is the board HTML
        initialize();
        board.shuffle();

        board.addHandler("onMoved", tv, tv.display);
        board.addHandler("onShuffled", tv, tv.display);
        board.addHandler("onSolved", null, () => alert("Solved!"));

        this.display();
    }

    this.shuffle = function() {
        let recorder = this.record();
        board.shuffle();
        this.replay(recorder);
    }
    
    this.random = function() {
        board.quickShuffle();
    }
    
    //  This function creates a recorder object to save the current board, snapshot and a history moves to be recorded
    this.record = function() {
        let recorder = { board: board, snapshot: board.createSnapshot(), history: "" }

        board = new Board(board.getSize(), recorder.snapshot.tiles);
        board.addHandler("onMoved", null, (args) => recorder.history += args[0]);

        return recorder;
    }

    //  Replays the moves collected in the recorder, and resets the board to original position
    this.replay = function(recorder) {
        board = new Board(board.getSize(), recorder.snapshot.tiles);
        board.addHandler("onMoved", tv, tv.display);

        let myTimer = setInterval(function() {
            if(recorder.history.length <= 0) {
                clearInterval(myTimer);
            }
            else {
                board.move(recorder.history[0]);
                recorder.history = recorder.history.substring(1);
            }
        }, displayParams.moveSpeed);

        board = recorder.board;
    }

    this.solve = function() {
        let recorder = this.record();
        board.solve();
        this.replay(recorder);
    }
    
    this.getSize = () => board.getSize();

    this.updateSettings = function(params) {
        for(pname in params)
            displayParams[pname] = params[pname];
    }

    this.getSettings = function() {
        let params = {}
        for(pname in displayParams)
            params[pname] = displayParams[pname];
        return params;
    }
}

var tv = new View({cx: 4, cy: 4});

//  Toggle the settings box
function toggle(div) {
    if(div.innerHTML == "x") {
        document.getElementById("settingsDetails").style.display = "none";
        document.getElementById("board").style.display = "block";
        div.innerHTML =  "+";
    }
    else {
        document.getElementById("settingsDetails").style.display = "block";
        document.getElementById("board").style.display = "none";
        div.innerHTML =  "x";
    }
}

//  Update view settings, creates a new board if the board dimensions are changed
//  Returns true if a new board is created
function updateSettings(form) {
    tv.updateSettings({
        tileWidth: parseInt(form.tiley.value.trim()),
        tileHeight: parseInt(form.tilex.value.trim()),
        moveSpeed: parseInt(form.speed.value.trim()),
        hideTileValues: form.hideNumbers.checked,
        backgroundColors: [ form.bgColor1.value.trim(), form.bgColor2.value.trim() ],
        backgroundImage: form.bgImage.value.trim()
    });

    let dim = { cx: parseInt(form.sizex.value.trim()), cy: parseInt(form.sizey.value.trim()) };
    let currentDim = tv.getSize();
    if(dim.cx != currentDim.cx || dim.cy != currentDim.cy)
        tv.new(dim.cx, dim.cy);

    return (dim.cx != currentDim.cx || dim.cy != currentDim.cy);
}

//  Form action handler, updates settings before any action is taken
function act(btn) {
    let nb = updateSettings(btn.form);
    if(btn.name == "update") {
        tv.display();
    }
    else if(btn.name == "new") {
        if(!nb) tv.new();
    }
    else if(btn.name == "random") {
        tv.random();
    }
    else if(btn.name == "shuffle") {
        tv.shuffle();
    }
    else if(btn.name == "solve") {
        tv.solve();
    }

    toggle(document.getElementById("settingsShow"))
}
