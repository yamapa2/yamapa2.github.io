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
	}
}