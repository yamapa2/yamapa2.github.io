//	Abstract base class for all the types of Oids
class Oid {
    constructor() {
        //	Generator circle parameters
        this.r = this.s = 0;		//	Generator circle radius and distance between center of the generator
                                    //	circle and the generator point, r is Mandatory
        
        //	Oid parameters
        this.delphi = 5;                        //	Paint resolution, 5 degrees default resolution
        this.slip = 1.0;		                //	Slippage factor of the generator circle, no slippage by default
        this.scale = 1.0;		                //	Over all scaling of the Oid, to be filled by initialize()
        this.locX = this.locY = 0;	            //	Oid center, by default render the Oid at (0, 0)
        this.angle = 0.0;	                    //	Inclination with the X-axis
        this.color = { r: 0, g: 0, b: 0 };		//	Oid color
        
        //	Oid state
        this.nCurStep = this.steps = 0;	    //  To be filled by initialize() and initDraw()
        this.phi = 0.0;
        this.px = this.py = this.x = this.y = 0.0;

        //	Oid color gradation parameters
        this.bgcolor = { r: 255, g: 255, b: 255 };	//	Oids color to gradually (linear) change from 'color', by default take the background color of the applet
        this.colorGrad = { r: 0, g: 0, b: 0 };	//	Color Gradient, by default no gradation is used
        this.grad = false;                     //	true if color gradation required, default is false
    
        //	Pre-computed values to increase the speed
        this.cosAngle = this.sinAngle = 0;
    }

    initialize() {
        if(this.s <= 0)
            this.s = this.r;

        //  Convert angles from degrees to radians
        this.delphi *= Math.PI / 180;
        this.angle *= Math.PI / 180;
        
        //	Pre-computed values to increase the speed
        this.cosAngle = Math.cos(this.angle);
		this.sinAngle = Math.sin(this.angle);
    }

    reset() {
		this.phi = 0.0;
		this.px = this.py = this.x = this.y = 0.0;
		this.nCurStep = this.steps;
    }

    _transformOid2Scr(pt) {
        //	Translate to screen coordinates
        let xs = this.locX + this.scale * (pt.x * this.cosAngle - pt.y * this.sinAngle);
        let ys = this.locY + this.scale * (pt.x * this.sinAngle + pt.y * this.cosAngle);
        return { x: xs, y: ys };
    }

    _transformScr2Oid(pt) {
        //	Translate from screen coordinates
        let xo = ((pt.y - this.locY) * this.sinAngle + (pt.x - this.locX) * this.cosAngle) / this.scale;
        let yo = ((pt.y - this.locY) * this.cosAngle - (pt.x - this.locX) * this.sinAngle) / this.scale;
        return { x: xo, y: yo };
    }

    draw(g) {
        //	Draw the next step, until there are no more steps
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
            ns = this._transformOid2Scr(ns);
            this.x = ns.x;
            this.y = ns.y;

            let oldColor = g.strokeStyle;   //	Store the color to restore after painting the current step

            g.strokeStyle = `rgb(${curColor.r}, ${curColor.g}, ${curColor.b})`;
            g.beginPath();

            if(this.nCurStep == this.steps)
                g.moveTo(this.x, this.y);
            else
                g.moveTo(this.px, this.py);
            g.lineTo(this.x, this.y);

            g.stroke();

            g.strokeStyle = oldColor;		//	Restore the old color

            //	Change the current state of the Oid
            this.px = this.x;
            this.py = this.y;

            this.phi += this.delphi;
            --this.nCurStep;
        }
    }
    
    contains(pt) {
        return this._contains(this._transformScr2Oid(pt));
    }
}