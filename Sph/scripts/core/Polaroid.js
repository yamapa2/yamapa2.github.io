class PolarGenerator {
    constructor(rdef) {
        this.deltheta = 0.1 * Math.PI / 180;
        this.theta = -this.deltheta;
        this.rdef = rdef;
    }

    initialize() {
        this.theta = -this.deltheta;
        this.fr = new Function("return " + "function (t) { return " + this.rdef + "; }")();
    }

    reset() {
        this.theta = -this.deltheta;
    }

	next() {
        this.theta += this.deltheta;
        return new Vector(this.fr(this.theta)).rotate(this.theta);
    }
}

class Polaroid extends Customoid {
	constructor() {
		super();

        //	Generating oid parameters
        this.rdef = "1";          //  Polar function, default is r=1 (unit circle)
    }

    fieldRequirements() {
        let req = super.fieldRequirements();
        return { mandatory: req.mandatory.concat([ "rdef" ]), optional: req.optional };
    }

	initialize() {
        this.generator = new PolarGenerator(this.rdef);
        super.initialize();
    }
}