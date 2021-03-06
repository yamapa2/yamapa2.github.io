class Cycloid extends Oid {
	constructor() {
		super();

		this.length = 0;		//	Half of the length of the Generator line, length is Mandatory
	}

    fieldRequirements() {
        let req = super.fieldRequirements();
        return { mandatory: req.mandatory.concat([ "length" ]), optional: req.optional };
    }

	initialize() {
        super.initialize()
        
		if(this.steps <= 0)
            this.steps = Math.round(2.0 * this.length * this.slip / (this.r * this.delphi));
		
		//	Compute the color gradient
        for(let c in this.colorGrad)
            this.colorGrad[c] = (this.bgcolor[c] - this.color[c]) / this.length;
    }

	_nextStep() {
        //	Compute the next point on the Oid
        let pt = new Vector(this.length - this.rbyslip * this.phi, this.r)
            .minus(new Vector(this.s).rotate(this.hypo ? -this.phi : this.phi));

        return { pt: pt, gf: Math.abs(pt.y) };
    }
    
    _contains(pt) {
        return (-this.length <= pt.y && pt.y <= this.length && this.r-this.s <= pt.x && pt.x < this.r+this.s);
    }
}