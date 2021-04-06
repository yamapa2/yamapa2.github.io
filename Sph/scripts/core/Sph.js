class Sph {
    constructor() {
        this.oids = []      //	Array of Oids
    }

    loadOids(oidConfigs) {
        for(let oidConfig of oidConfigs) {
            this.addOid(oidConfig.type, oidConfig);
        }
        return this;
    }

    addOid(oidClass, oidConfig) {
        let oid = Object.assign(new oidClass, oidConfig);
        oid.initialize();
        this.oids.push(oid);
        return this;
    }

	paint(g) {
        //	Draw every Oid in the array sph
		for(let oid of this.oids) {
            oid.reset();
            oid.draw(g);
        }
        return this;
    }
    
    highlight(g, oidId) {
        let oid = this.oids[oidId];

        let oldColor = oid.color;
        let oldGrad = oid.grad;
        let nFlash = 6;

        function repaint() {
            if(nFlash % 2 == 0) {
                oid.color = { r: 1-oldColor.r, g: 1-oldColor.g, b: 1-oldColor.b };
                oid.grad = false;
            } else {
                oid.color = oldColor;
                oid.grad = oldGrad;
            }

            oid.reset();
            oid.draw(g);

            --nFlash;
            if(nFlash > 0)
                setTimeout(repaint, 500);
        }

        repaint();
    }

	contains(pt) {
		for(let oid of this.oids) {
            if(oid.contains(pt))
                return oid;
        }
        return null;
    }
 }