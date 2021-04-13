class Trochoid extends Oid {
	constructor() {
		super();
        this.a = 0;		//	Radius of fixed circle, a is Mandatory
        this.rbyaslip = 0;
	}

    fieldRequirements() {
        let req = super.fieldRequirements();
        return { mandatory: req.mandatory.concat([ "a" ]), optional: req.optional };
    }

	initialize() {
        super.initialize()
        
		this.rbyaslip = this.r / (this.a * this.slip);

		//	Generating circle will have to rotate for lcm(a,r)/r number of revolutions
		//	before completing the Oid

		//	Compute the lcm of a and r
        let nRev = this.a;
        while(nRev % this.r != 0)
            nRev += this.a

		//	Required number of revolutions of generating circle
		nRev /= this.r;

		//	Compute the number of steps required to complete the Oid
		if(this.steps <= 0)
            this.steps = Math.round(this.slip * nRev * 2.0 * Math.PI / this.delphi);

        this.apmr = this.a + (this.hypo ? -this.r : this.r);

        //	Compute the color gradient
        for(let c in this.colorGrad)
            this.colorGrad[c] = (this.bgcolor[c] - this.color[c]) / (this.r + this.s);
    }

	_nextStep() {
		let alpha = this.rbyaslip * this.phi;

        //	Compute the next point on the Oid
        let pt = new Vector(this.apmr).rotate(alpha)
            .plus(new Vector(this.s).rotate(alpha + (this.hypo ? -this.phi : this.phi)));

        //	Color gradient factor
        let gf = Math.abs(pt.magnitude() - this.a);
        
        return { pt: pt, gf: gf };
	}
    
    _contains(pt) {
        return (Math.abs(pt.magnitude() - this.apmr) <= this.s);
    }
}