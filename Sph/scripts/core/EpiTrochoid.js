class EpiTrochoid extends Trochoid {
	constructor() {
        super();
        
        //	Pre-computed values to increase the speed
        this.apmr = this.twoapmr = this.offpm = 0
	}

	initialize() {
		super.initialize();
		
		this.apmr = this.a + this.r;
		this.twoapmr = 2 * this.apmr;
		this.offpm = this.apmr * this.apmr + this.s * this.s;

        //	Compute the color gradient
        for(let c in this.colorGrad)
            this.colorGrad[c] = (this.bgcolor[c] - this.color[c]) / (this.apmr + this.s);
    }

    reset() {
		//	Initialize the state of the Oid for drawing
		this.px = this.apmr + this.s;
		this.py = 0;

        super.reset();
	}

	_nextStep() {
		let xt, yt, gf;

		let rbyaslip_phi = this.rbyaslip * this.phi;
		let phi_plus_rbyaslip_phi = this.phi + rbyaslip_phi;

		//	Compute the next point on the Oid
		xt = this.apmr * Math.cos(rbyaslip_phi) + this.s * Math.cos(phi_plus_rbyaslip_phi);
		yt = this.apmr * Math.sin(rbyaslip_phi) + this.s * Math.sin(phi_plus_rbyaslip_phi);

        //	Color gradient factor
        gf = Math.sqrt(xt*xt + yt*yt);

        return { x: xt, y: yt, gf: gf };
	}
    
    _contains(pt) {
        let x2y2 = pt.x ** 2 + pt.y ** 2;
        return ((this.apmr - this.s) ** 2 <= x2y2 && x2y2 <= (this.apmr + this.s) ** 2);
    }
}