class Point {
    constructor() {
        this.x = this.y = 0;        //	Point coordinates
        this.dist = 0;              //	Distance to the next point
        this.dirX = this.dirY = 0;  //	Directional cosine in X/Y-direction to the next point
    }
}

class Customoid extends Oid {
	constructor() {
		super();

        //	Generating oid parameters
        this.points = [];	//	this.points on the oid

        //	Oid state variables
        this.perimeter = 0;
        this.nCurPointInd = 0;
        this.curPointX = this.curPointY = 0;

        //	Pre-computed values to increase the speed
        this.maxDist = 0;
        this.rbyslip = 0.0;
    }

	initialize() {
        super.initialize()

        for(let i = 0 ; i < this.points.length ; ++i)
            this.points[i] = Object.assign(new Point, this.points[i])
        
		//	Compute the dirX (directional cosine along X-axis, from current point to next point),
		//	dirY (directional cosine along Y-axis, from current point to next point),
		//	and dist (distance between the current point to next point) for each point.
		//	Also compute the maximum distance from the center of the curve
		this.maxDist = 0.0;
		for(let i = 0 ; i < this.points.length ; ++i) {
			let dist;
			dist = this.points[i].x * this.points[i].x + this.points[i].y * this.points[i].y;
			if(dist > this.maxDist)
                this.maxDist = dist;

            this.points[i].dirX = this.points[(i+1) % this.points.length].x - this.points[i].x;
            this.points[i].dirY = this.points[(i+1) % this.points.length].y - this.points[i].y;

            this.points[i].dist = Math.sqrt(this.points[i].dirX ** 2 + this.points[i].dirY ** 2);

            this.points[i].dirX /= this.points[i].dist;
            this.points[i].dirY /= this.points[i].dist;
		}

		//	Farthest point on the Oid is "(r+s) plus the maximaum distance" far from center!
        this.maxDist = Math.sqrt(this.maxDist) + this.r + this.s;
        this.rbyslip = this.r / this.slip;

		//	If number of steps are not specified, take it as 50 times the
		//	number this.points specified
		if(this.steps <= 0)
            this.steps = 50 * this.points.length;

		//	In this oid delphi is the incremental distance on the contour.
		this.delphi *= this.r;

        //	Compute color gradient
        for(let c in this.colorGrad)
            this.colorGrad[c] = (this.bgcolor[c] - this.color[c]) / this.maxDist;
    }

    reset() {
        super.reset();

        //  Reset the state of the oid for drawing
		this.perimeter = 0.0;
		this.nCurPointInd = 0;
		this.curPointX = this.points[0].x;
		this.curPointY = this.points[0].y;

		this.px = this.maxDist;
		this.py = this.maxDist;
    }

	_nextStep() {
		let xt, yt, gf;

		let hold;
		hold = (this.curPointX - this.points[this.nCurPointInd].x) ** 2 + (this.curPointY - this.points[this.nCurPointInd].y) ** 2;
		hold = this.points[this.nCurPointInd].dist - Math.sqrt(hold);
        
        if( hold >= this.delphi ) {
			this.curPointX += this.points[this.nCurPointInd].dirX * this.delphi;
			this.curPointY += this.points[this.nCurPointInd].dirY * this.delphi;
		} else {
            this.nCurPointInd = (this.nCurPointInd + 1) % this.points.length;
			this.curPointX = this.points[this.nCurPointInd].x + this.points[this.nCurPointInd].dirX * (this.delphi - hold);
			this.curPointY = this.points[this.nCurPointInd].y + this.points[this.nCurPointInd].dirY * (this.delphi - hold);
		}

		this.perimeter += this.delphi;

		let cosPhi, sinPhi;
		cosPhi = Math.cos(this.perimeter / this.rbyslip);
		sinPhi = Math.sin(this.perimeter / this.rbyslip);

		hold = cosPhi * this.points[this.nCurPointInd].dirY - sinPhi * (-this.points[this.nCurPointInd].dirX);
		sinPhi = cosPhi * (-this.points[this.nCurPointInd].dirX) + sinPhi * this.points[this.nCurPointInd].dirY;
		cosPhi = hold;

		//	Compute the next point on the Oid
		xt = this.s * cosPhi + this.curPointX + this.r * this.points[this.nCurPointInd].dirY;
		yt = this.s * sinPhi + this.curPointY - this.r * this.points[this.nCurPointInd].dirX;

		//	Apply color gradient
        gf = Math.sqrt(xt*xt + yt*yt);

		return { x: xt, y: yt, gf: gf };
	}
    
    _contains(pt) {
        let x2y2 = x ** 2 + y ** 2;
        return ((this.apmr - this.s) ** 2 <= x2y2 && x2y2 <= (this.apmr + this.s) ** 2);
    }
}