class CartisianGenerator {
    constructor(xdef, ydef) {
        this.t = -1;
        this.xdef = xdef;
        this.ydef = ydef;
    }

    initialize() {
        this.t = -1;
        this.fx = new Function("return " + "function (t) { return " + this.xdef + "; }")();
        this.fy = new Function("return " + "function (t) { return " + this.ydef + "; }")();
    }

    reset() {
        this.t = -1;
    }

	next() {
        ++this.t;
        return new Vector(this.fx(this.t), this.fy(this.t));
    }
}

class Cartisianoid extends Customoid {
	constructor() {
		super();

        //	Generating oid parameters
        this.xdef = "t";          //  X function, default is r=1 (unit circle)
        this.ydef = "0";          //  Y function, default is r=1 (unit circle)
    }

    fieldRequirements() {
        let req = super.fieldRequirements();
        return { mandatory: req.mandatory.concat([ "xdef", "ydef" ]), optional: req.optional };
    }

	initialize() {
        this.generator = new CartisianGenerator(this.xdef, this.ydef);
        super.initialize();
    }
}