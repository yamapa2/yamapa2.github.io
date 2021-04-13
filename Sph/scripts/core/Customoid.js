class Customoid extends Oid {
	constructor() {
		super();

        //	Generating oid parameters
        this.generator = null;  //  Points on the Oid

        //	Oid state variables
        this.segment = null;    //  Current segment being processed - captures from, to, length and dir
    }

    createSegment(from, to) {
        let segment = { from: from, to: to };
        segment.dir = segment.to.minus(segment.from).dir();
        segment.normal = segment.dir.normal();
        segment.length = segment.to.minus(segment.from).magnitude();
        return segment;
    }

	initialize() {
        super.initialize();
        this.generator.initialize();

		//	If number of steps are not specified, take it as 50000
		if(this.steps <= 0)
            this.steps = 5000;
            
        //  Find min and max distance from the center for cacluating color gradient
        let maxDist = 0;
        let minDist = 999999;
        for(let i = 0; i < this.steps; ++i) {
            let dist = this.generator.next().magnitude();
            maxDist = Math.max(maxDist, dist);
            minDist = Math.min(minDist, dist);
        }
        //  Make sure to reset the generator for drawing
        this.generator.reset();

        //	Compute the color gradient
        for(let c in this.colorGrad)
            this.colorGrad[c] = (this.bgcolor[c] - this.color[c]) / maxDist;
    }

    reset() {
        super.reset();
        this.generator.reset();

        //  Reset the state of the oid for drawing
        this.segment = this.createSegment(this.generator.next(), this.generator.next());
        this.contact = this.segment.from.copy();
    }

	_nextStep() {
        let hold = this.segment.length - this.contact.minus(this.segment.from).magnitude();
        while(hold <= 0) {
            //  Segment is too short, go the next point on the genrator
            this.segment = this.createSegment(this.segment.to, this.generator.next());
            hold += this.segment.length;
        }

        //  Check if the circle rolls over the current segment or not
        if(hold >= this.rdelphi) {
			this.contact = this.contact.plus(this.segment.dir.scale(this.rdelphi));
		} else {
            //  If rolls over current segment, move to the next segment
            this.segment = this.createSegment(this.segment.to, this.generator.next());
            this.contact = this.segment.from.plus(this.segment.dir.scale(this.rdelphi - hold));
		}

		//	Compute the next point on the Oid
        let pt;
        if(this.hypo) {
            //  Generator circle runs under the curve in clockwise direction
            pt = this.contact
                .minus(this.segment.normal.scale(this.r))
                .plus(this.segment.normal.scale(this.s).rotate(-this.phi * this.slip - Math.PI));
        } else {
            //  Generator circle runs over the curve in counter-clockwise direction
            pt = this.contact
                .plus(this.segment.normal.scale(this.r))
                .plus(this.segment.normal.scale(this.s).rotate(this.phi * this.slip + Math.PI));
        }

		return { pt: pt, gf: pt.magnitude() };
	}
}