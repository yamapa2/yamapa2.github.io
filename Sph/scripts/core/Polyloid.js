class Polyloid extends Customoid {
	constructor() {
		super();

		//	Generator polygon parameters
	    this.vertices = 0;      //	Number of vertices
        this.a = this.b = 0;	//	Radii of "Vertex-circle" and "Side-circle", default is a void polygon
        this.d = 0;             //	Half of the side length minus radius of the vertex-circle, default is a void polygon
		this.epsilon = 20.0;	//	//	Resolution (in pixels) on the polygon, default resolution
	}

	createPoints() {
		//	Remove the points, if there exsts any
		this.points = []

		this.theta = 2.0 * Math.PI / this.vertices;
		this.phi = Math.PI - this.theta;
		let A = (this.a + this.d) / Math.cos(this.phi/2);		//	Distance from origin to each of the vertex-circle centers
		
		let psi = 0.0;
        let cbX = 0.0;
        let cbY = 0.0;

		//	Centers of first 2 vertex-circles
		let caX = [0, 0];
		let caY = [0, 0];

		let sumtheta = 0.0;
		for(let i = 0 ; i < 2 ; ++i) {
			caX[i] = A * Math.cos(sumtheta);
			caY[i] = A * Math.sin(sumtheta);
			sumtheta += this.theta;
		}

		if(this.b > 0) {
			let B;
			psi = Math.asin(A * Math.sqrt(2-2*Math.cos(this.theta)) / (2*(this.b+this.a)));
			B = Math.sqrt((this.b+this.a)*(this.b+this.a) + A*A + 2.0*(this.b+this.a)*A*Math.cos(this.theta/2+psi));

			//	Center of first side circle
			cbX = B * Math.cos(this.theta/2);
			cbY = B * Math.sin(this.theta/2);
		}

		let xt, yt, ht;
		for(let i = 0 ; i < this.vertices ; ++i) {
            let cositheta = Math.cos(i*this.theta);
            let sinitheta = Math.sin(i*this.theta);

			//	If vertex-circle is specified, compute the points on the first (circular)
			//	part of the (i)th section of the generating polygon.  This part is void if
			//	a is not specified
			if(this.a > 0)
			{
				for(let sumphi = 0.0 ; sumphi < this.theta/2 + psi ; sumphi += this.epsilon/this.a)
				{
					xt = caX[0] + this.a*Math.cos(sumphi);
					yt = caY[0] + this.a*Math.sin(sumphi);

					//	Rotate the point in +ve x-direction by an angle of i*theta, it provides
                    //	the first (circular) part of the (i)th section of the generating polygon
					ht = xt * cositheta - yt * sinitheta;
					yt = xt * sinitheta + yt * cositheta;
					xt = ht;

					//	Add the new point to the list of points
					this.points.push({ x: xt, y: yt });
				}
			}

			//	Compute the points on the second (middle) part of the (i)th section of the
			//	generating polygon.  This part cant be void.  It is circular if b is specified,
			//	else it is linear.
			if(this.b > 0)
			{
				for(let sumpsi = Math.PI - (this.theta/2 + psi) ; sumpsi < Math.PI - (this.theta/2 + psi) + 2*psi ; sumpsi += this.epsilon/this.b)
				{
					xt = cbX + this.b*Math.cos(-sumpsi);
					yt = cbY + this.b*Math.sin(-sumpsi);

					//	Rotate the point in +ve x-direction by an angle of i*theta, it provides
                    //	the second (circular) part of the (i)th section of the generating polygon
					ht = xt * cositheta - yt * sinitheta;
					yt = xt * sinitheta + yt * cositheta;
					xt = ht;

					//	Add the new point to the list of points
					this.points.push({ x: xt, y: yt });
				}
			}
			else
			{
				let initX, initY;
				initX = caX[0] + this.a*Math.cos(this.theta/2);
				initY = caY[0] + this.a*Math.sin(this.theta/2);

				for(let sumepsilon = 0.0 ; sumepsilon < 2*(this.a+this.d) ; sumepsilon += this.epsilon)
				{
					xt = initX + sumepsilon*Math.cos(Math.PI-this.phi/2);
					yt = initY + sumepsilon*Math.sin(Math.PI-this.phi/2);

					//	Rotate the point in +ve x-direction by an angle of i*theta, it provides
                    //	the second (linear) part of the (i)th section of the generating polygon
					ht = xt * cositheta - yt * sinitheta;
					yt = xt * sinitheta + yt * cositheta;
					xt = ht;

					//	Add the new point to the list of points
					this.points.push({ x: xt, y: yt });
				}
			}

			//	If vertex-circle is specified, compute the points on the third (circular)
			//	part of the (i)th section of the generating polygon.  This part is void if
			//	a is not specified
			if(this.a > 0)
			{
				for(let sumphi = this.theta/2 - psi ; sumphi < this.theta ; sumphi += this.epsilon/this.a)
				{
					xt = caX[1] + this.a*Math.cos(sumphi);
					yt = caY[1] + this.a*Math.sin(sumphi);

					//	Rotate the point in +ve x-direction by an angle of i*theta, it provides
					//	the third (circular) part of the (i)th section of the generating polygon
                    ht = xt * Math.cos(i*this.theta) - yt * Math.sin(i*this.theta);
					yt = xt * Math.sin(i*this.theta) + yt * Math.cos(i*this.theta);
					xt = ht;

					//	Add the new point to the list of points
					this.points.push({ x: xt, y: yt });
				}
			}
		}
	}

	initialize() {
		//	Subtract a from d.  If d is not specified assume it as equal to a
		if(this.d > 0)
            this.d -= this.a;

		//	vertices Needs atleast 2 vertices
		//	d can't be -ve
		//	If b is specified, it should be greater/equal to d, otherwise the vertex-circle and
		//	side-circle will not touch each other
		//	epsilon, Resolution must be +ve

		//	Create the points on the generating polygon
		this.createPoints();
		//	Ensure that there are atleat 2 points

		//	Initialize the Customoid
		super.initialize();
	}
    
    _contains(pt) {
        return false;
    }
}