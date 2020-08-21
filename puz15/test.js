function createCellVariables() {
    for(let i = 0; i < rows; ++i) { 
        for(let j = 0; j < cols; ++j) { 
            this[`p${i}${j}`] = { x: i, y: j };
        }
    }
}

function exec(cmd) {
    tv.record();
    try {
        eval(cmd);  
    }
    catch(err) {
        console.log(err);
    }
    tv.replay();
}

function fixNextTile() {
    let ss = tb.createSnapshot();
    let nSq = 1;
    for(tox = 0; tox < ss.size.cx; ++tox) {
        for(toy = 0; toy < ss.size.cy; ++toy) {
            for(fromx = 0; fromx < ss.size.cx; ++fromx) {
                for(fromy = 0; fromy < ss.size.cy; ++fromy) {
                    if(nSq == ss.tiles[fromx][fromy])
                        break;
                }
                if(fromy < ss.size.cy)
                    break;
            }

            ++nSq;
            if(tox != fromx || toy != fromy) {
                exec("tb.fixTile({x: tox, y: toy}, {x: fromx, y: fromy})");
                return;
            }
        }
    }
}
