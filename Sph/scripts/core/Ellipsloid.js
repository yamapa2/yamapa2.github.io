class Ellipsloid extends Oid {
	constructor() {
		super();

        //	Generator ellipse parameters
		this.a = this.b = 0;	//	Semi-major and Semi-minor axes of the generator ellipse.  Both are mandatory

        //	Oid state variables
        this.perimeter = 0.0;
        this.deltheta = 0.0;
        this.theta = 0.0;

        //	Pre-computed values to increase the speed
        this.e = 0.0;
        this.ae = 0.0;
        this.ae2 = 0.0;
        this.rbyslip = 0.0;
	}

    fieldRequirements() {
        let req = super.fieldRequirements();
        return { mandatory: req.mandatory.concat([ "a", "b" ]), optional: req.optional };
    }

	initialize() {
        super.initialize()
        
		//	Compute "Pre-computed" values!!
        this.e = (this.a ** 2 - this.b ** 2)/(2.0 * this.a ** 2);
        this.ae = this.a ** 2;
        this.ae2 = this.ae ** 2;
        this.rbyslip = this.r / this.slip;

		//	Computing the perimeter of the Ellipse, by approximating with arcs, of angle 0.5 degrees
        this.deltheta = 0.5 * Math.PI / 180.0;
        this.theta = 0;
		while(this.theta < Math.PI) {
			let rdistSq1 = this.a * Math.cos(this.theta) ** 2 + this.b * Math.sin(this.theta) ** 2;
            this.theta += this.deltheta
			let rdistSq2 = this.a * Math.cos(this.theta) ** 2 + this.b * Math.sin(this.theta) ** 2;

			this.perimeter += this.deltheta * (Math.sqrt(rdistSq1) + Math.sqrt(rdistSq2)) / 2.0;
		}

		//	Compute the incremental angle on Ellipse
		this.deltheta = this.delphi * this.perimeter / (2.0 * Math.PI * this.r);

		//	If number of steps are not specified, take it as a number that makes the
		//	generated circle circles through the ellipse 25 times
		if(this.steps <= 0)
            this.steps = Math.round(25.0 * 2.0 * Math.PI / this.deltheta);

        //	Compute the color gradient
        for(let c in this.colorGrad)
            this.colorGrad[c] = (this.bgcolor[c] - this.color[c]) / (this.a + this.r + this.s);
    }
    
    reset() {
        //	Initialize the state of the Oid for drawing
        this.theta = this.perimeter = 0.0
        this.rdist = 1.0;

        super.reset();
    }

	_nextStep()
	{
		this.theta += this.deltheta;

		let aCosTheta = this.a * Math.cos(this.theta);
        let bSinTheta = this.b * Math.sin(this.theta);
        let holdSq1 = aCosTheta ** 2 + bSinTheta ** 2;
		let nrdist = Math.sqrt(holdSq1);

        this.perimeter += this.deltheta * (this.rdist + nrdist)/ 2.0;
        this.rdist = nrdist;

        let holdSq2  = (Math.abs(aCosTheta) + this.ae) ** 2 + bSinTheta ** 2

		let normal = this.theta + 0.5 * Math.acos((holdSq1 + holdSq2 - this.ae2)/(2 * holdSq1 * holdSq2));
		this.phi = this.perimeter / this.rbyslip + normal;

        //	Compute the next point on the Oid
        let pt = new Vector(aCosTheta, bSinTheta)
            .plus(new Vector(this.s).rotate(this.phi))
            .plus(new Vector(this.r).rotate(normal))

        return { pt: pt, gf: pt.magnitude() };
	}

    _contains(pt) {
        let xy1 = (pt.x/(this.a+this.r-this.s)) ** 2 + (pt.y/(this.b+this.r-this.s) ** 2);
        let xy2 = (pt.x/(this.a+this.r+this.s)) ** 2 + (pt.y/(this.b+this.r+this.s) ** 2);
        let xy = pt.x ** 2 + pt.y ** 2;
        return (xy1 <= xy && xy <= xy2);
    }
}