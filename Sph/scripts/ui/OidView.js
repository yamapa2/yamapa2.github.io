//  Default Oid Configuration, used when a new Oid is added
var sampleOidConfig = {
    id: 1,
    type: "HypoTrochoid",
    scale: 1,
    locX: 500,
    locY: 350,
    angle: 0,
    a: 146,
    r: 20,
    s: 120,
    rdef: "200*Math.sin(3*t)",
    xdef: "t",
    ydef: "0",
    slip: 1,
    color: { r: 0, g: 0, b: 0 },
    bgcolor: { r: 0, g: 0, b: 0 },
    grad: true,
    delphi: 5,
    steps: 0
};

class OidView {
	constructor(oidId) {
        this.oidConfig = JSON.parse(JSON.stringify(sampleOidConfig));
        this.oidConfig.id = oidId;

        //  Trick to get the class definition from the class name
        let oidClass = (Function('return ' + this.oidConfig.type))();
        this.sph = new Sph().addOid(oidClass, this.oidConfig);
	}

    //  Utility function to convert color string to rgb object
    str2rgb(color) {
        return {
            r: parseInt("0x"+color.substring(1, 3)), 
            g: parseInt("0x"+color.substring(3, 5)), 
            b: parseInt("0x"+color.substring(5, 7)), 
        }
    }

    //  Utility function to convert rgb object to color string
    rgb2str(color) {
        return "#"
                + ("00" + color.r.toString(16)).substr(-2)
                + ("00" + color.g.toString(16)).substr(-2)
                + ("00" + color.b.toString(16)).substr(-2);
    }

    setup() {
        //  Add the new Oid Id to the id list
        let oidIdSelect = document.getElementById("oididselect");
        oidIdSelect.innerHTML += `<option id="oidid${this.oidConfig.id}" value="${this.oidConfig.id}">${this.oidConfig.id}</option>`;
    
        //  Add a new canvas to paint this Oid
        let canvasDiv = document.getElementById("canvasdiv");
        let newCanvasHTML = `<div id="canvasdiv${this.oidConfig.id}" style="position:absolute; top:0px; left:0px;">`;
        newCanvasHTML += `<canvas id="canvas${this.oidConfig.id}" height="700" width="1000"></canvas>`;
        newCanvasHTML += `</div>`;
        canvasDiv.innerHTML += newCanvasHTML;

        return this;
    }

    teardown() {
        //  Remove the Oid from the Id list
        let oidIdOption = document.getElementById(`oidid${this.oidConfig.id}`);
        oidIdOption.parentNode.removeChild(oidIdOption);

        //  Remove the Oid canvas
        let canvasDiv = document.getElementById(`canvasdiv${this.oidConfig.id}`);
        canvasDiv.parentNode.removeChild(canvasDiv);

        return this;
    }

    //  Utility function to read Oid parameters from the UI
    //  Make sure the filed names in the form matches to the field names in the Oid classes
    getOidConfig() {
        let form = document.getElementById("oidForm");
        this.oidConfig = {};
        for(let field of form.querySelectorAll('input,select')) {
            switch (field.name) {
                //  Color fields
                case 'color':
                case 'bgcolor':
                    this.oidConfig[field.name] = this.str2rgb(field.value);
                    break;
                //  Boolean fields
                case 'grad':
                    this.oidConfig[field.name] = field.checked;
                    break;
                //  String fields
                case 'type':
                case 'rdef':
                case 'xdef':
                case 'ydef':
                    this.oidConfig[field.name] = field.value;
                    break;
                //  Rest are all numeric fields
                default:
                    let val = parseFloat(field.value);
                    if(!isNaN(val))
                        this.oidConfig[field.name] = val;
            }
        }

        return this;
    }

    //  Function to set Oid parameters in the UI
    //  Make sure the filed names in the form matches to the field names in the Oid classes
    setOidConfig(oidConfig = null) {
        if(oidConfig != null) {
            //  Make a copy of the oidConfig before resetting the config
            //  Also make sure the oidId is retained, canvas is tied to this oidId
            let oidId = this.oidConfig.id;
            this.oidConfig = JSON.parse(JSON.stringify(oidConfig));
            this.oidConfig.id = oidId;
        }

        let oidConfigValues = { slip: 1, steps: 0, s: this.oidConfig.r, grad: false };
        for(let value in this.oidConfig)
            oidConfigValues[value] = this.oidConfig[value];

        let form = document.getElementById("oidForm");

        for(let field in oidConfigValues) {
            //  Set the value only if the field exists in the form
            if(field in form) {
                switch (field) {
                    //  Color fields
                    case 'color':
                    case 'bgcolor':
                        form[field].value = this.rgb2str(oidConfigValues[field]);
                        break;
                    //  Boolean fields
                    case 'grad':
                        form[field].checked = oidConfigValues[field];
                        break;
                    //  Rest are all numeric and string fields
                    default:
                        form[field].value = oidConfigValues[field];
                }
            }
        }

        this.updateLabelValues();

        //  Make sure to call the Oit Type change function to show/hide relevant form fields
        this.updateOidType(this.oidConfig.type);

        return this;
    }

    //  Function to update the display values of various range widgets in the form
    updateLabelValues() {
        for(let field in this.oidConfig) {
            let fieldLabel = document.querySelector(`label[for="${field}.value"]`);

            //  If a label exists to display  the field value set the value
            if(fieldLabel) {
                if(field == 'color' || field == 'bgcolor')
                    fieldLabel.innerHTML = rgb2str(this.oidConfig[field]);
                else
                    fieldLabel.innerHTML = this.oidConfig[field];
            }
        }

        return this;
    }

    //  Oid Type changed in the UI, make sure the right parameters are displayed
    updateOidType(val) {
        //  Utility function to toggle display of a field
        function toggleFields(fnames, display="none") {
            for(let f of fnames) {
                let fe = document.getElementById(f+"cell");
                if(fe != null)
                    fe.style.display = display;
            }
        }

        //  First hide all the fields that depend on the oid type
        let fields = [];
        let oidOptions = document.getElementById("typeselect").options;
        for(let opt of oidOptions) {
            let oidClass = (Function('return ' +  opt.value))();
            let holdFields = (new oidClass).fieldRequirements();
            fields = [...fields, ...holdFields.mandatory, ...holdFields.optional];
        }
        toggleFields(fields, "none");

        //  Then find the relevant parameters for the current oid type and show them
        let oidClass = (Function('return ' +  val))();
        let holdFields = (new oidClass).fieldRequirements();
        fields = [...holdFields.mandatory, ...holdFields.optional];
        toggleFields(fields, "block");

        return this;
    }

    //  Function to repaint the canvas
    paint() {
        let canvas = document.querySelector(`#canvas${this.oidConfig.id}`);
        let g = canvas.getContext('2d');
        g.clearRect(0, 0, canvas.width, canvas.height);

        //  Trick to get the class definition from the class name
        let oidClass = (Function('return ' + this.oidConfig.type))();
        this.sph = new Sph().addOid(oidClass, this.oidConfig);
        this.sph.paint(g);

        return this;
    }

    //  Function to visually identofy a Oid by flashing the same few times
    identify(flashes = 2, rate = 100) {
        let canvasDiv = document.getElementById(`canvasdiv${this.oidConfig.id}`);
        flashes *= 2;    //  Flash n*2 times, once off and once on

        function flashCanvas() {
            canvasDiv.style.display = (flashes % 2 == 0) ? "none" :"block";
            if(--flashes > 0)
                setTimeout(flashCanvas, rate);
        }
        flashCanvas();

        return this;
    }

    //  Function to trim unused fields in Oid config
    trimOidConfig() {
        let oidClass = (Function('return ' + this.oidConfig.type))();
        let fields = (new oidClass).fieldRequirements();
        fields = [...fields.mandatory, ...fields.optional];

        let trimmedOidConfig = {};
        for(let field of fields)
            trimmedOidConfig[field] = this.oidConfig[field];

        return trimmedOidConfig;
    }
}