class HypoTrochoid extends Trochoid {
	constructor() {
        super();
        
        //	Pre-computed values to increase the speed
        this.apmr = this.twoapmr = this.offpm = 0
	}

	initialize() {
		super.initialize();
		
		this.apmr = this.a - this.r;

        //	Compute the color gradient
        for(let c in this.colorGrad)
            this.colorGrad[c] = (this.bgcolor[c] - this.color[c]) / (this.apmr + this.s);
    }

	_nextStep() {
		let alpha = this.rbyaslip * this.phi;

        //	Compute the next point on the Oid
        let pt = new Vector(this.apmr).rotate(alpha)
                .plus(new Vector(this.s).rotate(alpha - this.phi))

        return { pt: pt, gf: pt.magnitude() };
	}
    
    _contains(pt) {
        return (Math.abs(pt.magnitude() - this.apmr) <= this.s);
    }
}