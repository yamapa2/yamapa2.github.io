View = function(size, board) {
    let displayParams = {
        left: 60,
        top: 60,
        tileWidth: 100,
        tileHeight: 100,
        padWidth: 5,
        padHeight: 5,
        moveSpeed: 300
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
    }
    
    //  Update the content of each DIV card (representing a tile) with the corresponding value from the assoiciated board
    this.display = function() {
        for(let i = 0; i < size.cx; ++i) {
            for(let j = 0; j < size.cy; ++j) {
                let tile = document.getElementById(board.getTileValue(i, j).toString());
                if(tile == null)
                    continue;

                //  Set tile width, height and position of each DIV card
                tile.innerHTML = board.getTileValue(i, j);
                tile.style.width = `${displayParams.tileWidth}px`;
                tile.style.height = `${displayParams.tileHeight}px`;
                tile.style.top = `${displayParams.top + i*(displayParams.tileHeight + displayParams.padHeight)}px`;
                tile.style.left = `${displayParams.left + j*(displayParams.tileWidth + displayParams.padWidth)}px`;
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
        size = { cx: rows, cy: cols};
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
    
    this.setSpeed = function(sp) {
        displayParams.moveSpeed = sp;
    }
}

var tv = new View();