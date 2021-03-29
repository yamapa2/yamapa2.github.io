class HypoTrochoid extends Trochoid {
	constructor() {
        super();
        
        //	Pre-computed values to increase the speed
        this.apmr = this.twoapmr = this.offpm = 0
	}

	initialize() {
		super.initialize();
		
		this.apmr = this.a - this.r;
		this.twoapmr = 2 * this.apmr;
		this.offpm = this.apmr * this.apmr + this.s * this.s;

		//	This oid fits in a circle of radius (a-r+s)
		this.scale = this.scale / (this.apmr + this.s);

        //	Compute the color gradient
        for(let c in this.colorGrade)
            this.colorGrade[c] = (this.bgcolor[c] - this.color[c]) / (this.scale * (this.apmr + this.s));
    }

    reset() {
        super.reset();
        
		//	Initialize the state of the Oid for drawing
		let hold;
		hold = this.scale * (this.apmr + this.s);
		this.px = this.locX + hold * Math.cos(this.phi);
		this.py = this.locY + hold * Math.sin(this.phi);
	}

	nextStep() {
		let rbyaslip_phi;
		let phi_minus_rbyaslip_phi;
		let xt, yt, gf;

		rbyaslip_phi = this.rbyaslip * this.phi;
		phi_minus_rbyaslip_phi = this.phi - rbyaslip_phi;

		//	Compute the next point on the Oid
		xt = this.scale * (this.apmr * Math.cos(rbyaslip_phi) + this.s * Math.cos(phi_minus_rbyaslip_phi));
		yt = this.scale * (this.apmr * Math.sin(rbyaslip_phi) - this.s * Math.sin(phi_minus_rbyaslip_phi));

		//	Color gradient factor
        gf = Math.sqrt(xt*xt + yt*yt);

        return { x: xt, y: yt, gf: gf };
	}
}