class Cycloid extends Oid {
	constructor() {
		super();

		this.length = 0;		//	Half of the length of the Generator line, length is Mandatory
        this.bRight = true;	    //	To which side of the generator line the cycloid is lying.  By default, draw the cycloid on the right side of the generator line
	    this.rbyslip = 0.0;
	}

	initialize() {
        super.initialize()
        
		this.rbyslip = this.r / this.slip;

		if(this.steps <= 0)
            this.steps = Math.round(2.0 * this.length * this.slip / (this.r * this.delphi));
		
		//	The cycloid is assumed to fit in the square of side "2*length" length
		this.scale = this.scale / (2.0 * this.length);

		//	Compute the color gradient
        for(let c in this.colorGrade)
            this.colorGrade[c] = (this.bgcolor[c] - this.color[c]) / (this.scale * this.length);
    }

    reset() {
        super.reset();

		//	Initialize the Oid state for drawing
		this.px = this.locX + this.scale * (this.length * this.cosAngle - (this.r-this.s) * this.sinAngle);
        this.py = this.locY + this.scale * (this.length * this.sinAngle + (this.r-this.s) * this.cosAngle) * (this.bRight ? 1 : -1);
	}

	nextStep() {
		let xt, yt, gf;

		//	Compute the next point on the Oid
		xt = this.scale * (this.s * Math.sin(this.phi) + this.length - this.rbyslip * this.phi);
		yt = this.scale * (this.r - this.s * Math.cos(this.phi));

		if(!this.bRight)
			yt = -yt;

        //	Color gradient factor
        gf = yt < 0  ? -yt : yt;

        return { x: xt, y: yt, gf: gf };
	}
}