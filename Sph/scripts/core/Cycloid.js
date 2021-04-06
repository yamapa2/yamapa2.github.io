class Cycloid extends Oid {
	constructor() {
		super();

		this.length = 0;		//	Half of the length of the Generator line, length is Mandatory
	    this.rbyslip = 0.0;
	}

	initialize() {
        super.initialize()
        
		this.rbyslip = this.r / this.slip;

		if(this.steps <= 0)
            this.steps = Math.round(2.0 * this.length * this.slip / (this.r * this.delphi));
		
		//	Compute the color gradient
        for(let c in this.colorGrad)
            this.colorGrad[c] = (this.bgcolor[c] - this.color[c]) / this.length;
    }

    reset() {
        //	Initialize the Oid state for drawing
		this.px = this.length;
        this.py = this.r-this.s;

        super.reset();
	}

	_nextStep() {
		let xt, yt, gf;

		//	Compute the next point on the Oid
		xt = this.s * Math.sin(this.phi) + this.length - this.rbyslip * this.phi;
		yt = this.r - this.s * Math.cos(this.phi);

        //	Color gradient factor
        gf = yt < 0  ? -yt : yt;

        return { x: xt, y: yt, gf: gf };
    }
    
    _contains(pt) {
        return (-this.length <= pt.x && pt.x <= this.length && this.r-this.s <= pt.y && pt.y < this.r+this.s);
    }
}