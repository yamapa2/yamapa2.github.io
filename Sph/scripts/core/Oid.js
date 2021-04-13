//  Represents a two dimensional position vector
class Vector {
    constructor(x=0, y=0) { this.x = x; this.y = y; }
    copy() { return  new Vector(this.x, this.y); }
    plus(v) { return  new Vector(this.x+v.x, this.y+v.y); }
    minus(v) { return  new Vector(this.x-v.x, this.y-v.y); }
    magnitude() { return Math.sqrt(this.x ** 2 + this.y ** 2); }
    dir() { return this.scale(1/this.magnitude()) }
    normal() { return this.dir().rotate(-Math.PI/2); }
    scale(s) { return  new Vector(this.x*s, this.y*s); }
    rotate(theta) { return this.rotate2(Math.cos(theta), -Math.sin(theta)); }
    rotate2(cosTheta, sinTheta) { return new Vector(this.x*cosTheta + this.y*sinTheta, -this.x*sinTheta + this.y*cosTheta); }
    polar() { return { r: this.magnitude(), theta: Math.atan2(this.y, this.x) }; }
}

//	Abstract base class for all the types of Oids
class Oid {
    constructor() {
        //	Generator circle parameters
        this.r = this.s = 0;		//	Generator circle radius and distance between center of the generator
                                    //	circle and the generator point, r is Mandatory
        this.hypo = true;           //  True if generator circle runs under the curve in clockwise direction
        
        //	Oid parameters
        this.delphi = 5;                        //	Paint resolution, 5 degrees default resolution
        this.slip = 1.0;		                //	Slippage factor of the generator circle, no slippage by default
        this.scale = 1.0;		                //	Over all scaling of the Oid, to be filled by initialize()
        this.locX = this.locY = 0;	            //	Oid center, by default render the Oid at (0, 0)
        this.angle = 0.0;	                    //	Inclination with the X-axis
        this.color = { r: 0, g: 0, b: 0 };		//	Oid color
        
        //	Oid state
        this.nCurStep = this.steps = 0;	        //  To be filled by initialize() and initDraw()
        this.phi = 0.0;
        this.pt0 = new Vector();
        this.pt1 = new Vector();

        //	Oid color gradation parameters
        this.bgcolor = { r: 255, g: 255, b: 255 };	//	Oids color to gradually (linear) change from 'color', by default take the background color of the applet
        this.colorGrad = { r: 0, g: 0, b: 0 };	    //	Color Gradient, by default no gradation is used
        this.grad = false;                          //	true if color gradation required, default is false
    
        //	Pre-computed values to increase the speed
        this.cosAngle = this.sinAngle = 0;
		this.rbyslip = 1;
        this.rdelphi = 0;
    }

    fieldRequirements() {
        return {
            mandatory: [ "r" ],
            optional: [ "s", "hypo", "locX", "locY", "scale", "angle", "slip", "delphi", "steps", "color", "bgcolor", "grad" ]
        };
    }

    initialize() {
        if(this.s <= 0)
            this.s = this.r;

        //  Convert angles from degrees to radians
        this.delphi *= Math.PI / 180;
        this.angle *= Math.PI / 180;
        
        //	Pre-computed values to increase the speed
        this.center = new Vector(this.locX, this.locY);
        this.cosAngle = Math.cos(this.angle);
        this.sinAngle = Math.sin(this.angle);
        this.rbyslip = this.r / this.slip;
        this.rdelphi = this.r * this.delphi;
    }

    reset() {
		this.phi = 0.0;
        this.pt0 = new Vector();
        this.pt1 = new Vector();
		this.nCurStep = this.steps;
    }

    _transformOid2Scr(pt) {
        //	Translate to screen coordinates
        return pt.rotate2(this.cosAngle, -this.sinAngle).scale(this.scale).plus(this.center);
    }

    _transformScr2Oid(pt) {
        //	Translate from screen coordinates
        return pt.minus(this.center).scale(1/this.scale).rotate(this.cosAngle, this.sinAngle);
    }

    draw(g) {
        //	Draw the next step, until there are no more steps
        this.pt0 = this._transformOid2Scr(this._nextStep().pt);
		while(this.nCurStep > 0) {
            let ns = this._nextStep();

            let curColor = { r: this.color.r, g: this.color.g, b: this.color.b };

            //	Apply linear color gradient.
            if(this.grad) {
                for(let c in this.color) {
                    curColor[c] = Math.round(this.color[c] + this.colorGrad[c] * ns.gf);
                    curColor[c] = curColor[c] < 0 ? 0 : curColor[c];
                    curColor[c] = curColor[c] > 255 ? 255 : curColor[c];
                }
            }

            //	Translate to screen coordinates
            this.pt1 = this._transformOid2Scr(ns.pt);

            let oldColor = g.strokeStyle;   //	Store the color to restore after painting the current step

            g.strokeStyle = `rgb(${curColor.r}, ${curColor.g}, ${curColor.b})`;
            g.beginPath();
            g.moveTo(this.pt0.x, this.pt0.y);
            g.lineTo(this.pt1.x, this.pt1.y);
            g.stroke();

            g.strokeStyle = oldColor;		//	Restore the old color

            //	Change the current state of the Oid
            this.pt0 = this.pt1;

            this.phi += this.delphi;
            --this.nCurStep;
        }
    }

    _contains(pt) {
        return false;
    }

    contains(pt) {
        return this._contains(this._transformScr2Oid(new Vector(pt.x, pt.y)));
    }
}