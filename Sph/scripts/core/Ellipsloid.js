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
	}

	initialize() {
        super.initialize()
        
		//	This oid fits in a circle of radius (a+r+s)
		this.scale = this.scale / (this.a + this.r + this.s);

		//	Compute "Pre-computed" values!!
		this.e = (this.a*this.a-this.b*this.b)/(2.0*this.a*this.a);

		//	Computing the perimeter of the Ellipse, by approximating with arcs, of angle 0.5 degrees
		this.deltheta = 0.5 * Math.PI / 180.0;
		this.theta = 0.0;
		while(this.theta < Math.PI)
		{
			let hold, holdSq1, holdSq2;
			let normal;
			let aCosTheta, bSinTheta;
			
			aCosTheta = this.a * Math.cos(this.theta);
			bSinTheta = this.b * Math.sin(this.theta);

			holdSq1 = aCosTheta * aCosTheta + bSinTheta * bSinTheta;

			this.theta += this.deltheta;

			aCosTheta = this.a * Math.cos(this.theta);
			bSinTheta = this.b * Math.sin(this.theta);

			holdSq2 = aCosTheta * aCosTheta + bSinTheta * bSinTheta;

			this.perimeter += this.deltheta * (Math.sqrt(holdSq1) + Math.sqrt(holdSq2)) / 2.0;
		}

		//	Compute the incremental angle on Ellipse
		this.deltheta = this.delphi * this.perimeter / (2.0 * Math.PI * this.r);

		//	If number of steps are not specified, take it as a number that makes the
		//	generated circle circles through the ellipse 25 times
		if(this.steps <= 0)
            this.steps = Math.round(25.0 * 2.0 * Math.PI / this.deltheta);

        //	Compute the color gradient
        for(let c in this.colorGrade)
            this.colorGrade[c] = (this.bgcolor[c] - this.color[c]) / (this.a + this.r + this.s);
    }
    
    reset() {
        super.reset();
        
        //	Initialize the state of the Oid for drawing
        this.theta = this.perimeter = 0.0

		this.px = this.locX + this.scale * (this.a + this.r + this.s) * this.cosAngle;
		this.py = this.locY + this.scale * (this.a + this.r + this.s) * this.sinAngle;
	}

	nextStep()
	{
		let xt, yt, gf;

		let hold, holdSq1, holdSq2;
		let normal;
		let aCosTheta, bSinTheta;
		
		aCosTheta = this.a * Math.cos(this.theta);
		bSinTheta = this.b * Math.sin(this.theta);

		holdSq1 = aCosTheta * aCosTheta + bSinTheta * bSinTheta;

		this.theta += this.deltheta;

		aCosTheta = this.a * Math.cos(this.theta);
		bSinTheta = this.b * Math.sin(this.theta);

		holdSq2 = aCosTheta * aCosTheta + bSinTheta * bSinTheta;

		this.perimeter += this.deltheta * (Math.sqrt(holdSq1) + Math.sqrt(holdSq2)) / 2.0;

		hold = aCosTheta + ((aCosTheta > 0) ? this.a : -this.a) * this.e;
		hold *= hold;
		holdSq1 = hold;

		holdSq1 += bSinTheta * bSinTheta;

		hold = Math.acos((holdSq1 + holdSq2 - this.a*this.e*this.a*this.e)/(2.0 * holdSq1 * holdSq2));
		normal = this.theta + hold/2.0;
		this.phi = this.perimeter*this.slip/this.r + normal;

		//	Compute the next point on the Oid
		xt = this.scale * (this.s * Math.cos(this.phi) + aCosTheta + this.r * Math.cos(normal));
		yt = this.scale * (this.s * Math.sin(this.phi) + bSinTheta + this.r * Math.sin(normal));

		//	Color gradient factor
        gf = Math.sqrt(xt*xt + yt*yt);

        return { x: xt, y: yt, gf: gf };
	}
}