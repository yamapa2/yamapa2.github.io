//  Default Oid Configuration, used when a new Oid is added
var sampleOidConfig = {
    id: 1,
    type: "HypoTrochoid",
    scale: 100,
    locX: 500,
    locY: 350,
    angle: 0,
    a: 900,
    r: 460,
    s: 385,
    slip: 1,
    color: { r: 0, g: 0, b: 0 },
    bgcolor: { r: 0, g: 0, b: 0 },
    grad: true,
    delphi: 5,
    steps: 0
};

//  Start the display with one default oid.
var allOidConfigs = [ JSON.parse(JSON.stringify(sampleOidConfig)) ];
var oidConfigIndex = 0;

//  Utility function to convert color string to rgb object
function str2rgb(color) {
    return {
        r: parseInt("0x"+color.substring(1, 3)), 
        g: parseInt("0x"+color.substring(3, 5)), 
        b: parseInt("0x"+color.substring(5, 7)), 
    }
}

//  Utility function to convert rgb object to color string
function rgb2str(color) {
    return "#"
            + ("00" + color.r.toString(16)).substr(-2)
            + ("00" + color.g.toString(16)).substr(-2)
            + ("00" + color.b.toString(16)).substr(-2);
}

//  Oid Id is updated in the UI, switch the focus object to the new oid
function onOidIdChanged(oidId) {
    oidId = parseInt(oidId)

    //  Find the new Oid and set it as the current context oid
    for(oidConfigIndex = 0; oidConfigIndex < allOidConfigs.length; ++oidConfigIndex) {
        if(allOidConfigs[oidConfigIndex].id == oidId) {
            setOidConfig(allOidConfigs[oidConfigIndex]);    //  Set oid parameters in the form
            identifyCanvas(oidId);                          //  Visually identify the oid in the UI
            break;
        }
    }
}

//  Oid Type changed in the UI, make sure the right parameters are displayed
function onOidTypeChanged(val) {
    //  First hide all the fields that depend on the oid type
    let fields = [ "a", "b", "d", "length", "vertices" ];
    for(let f of fields)
        document.getElementById(f+"cell").style.display = "none";
    
    //  Then find the relevant parameters for the current oid type
    switch (val) {
        case 'Cycloid':
            fields = [ "length" ];
            break;
        case 'EpiTrochoid':
        case 'HypoTrochoid':
            fields = [ "a" ];
            break;
        case 'Ellipsloid':
            fields = [ "a", "b" ];
            break;
        case 'Polyloid':
            fields = [ "a", "b", "d", "vertices" ];
            break;
        default:
            fields = [];
    }

    //  Show the fields relevant to the current oid type
    for(let f of fields)
        document.getElementById(f+"cell").style.display = "block";

    onOidUpdated();
}

//  Utility function to read Oid parameters from the UI
//  Make sure the filed names in the form matches to the field names in the Oid classes
function getOidConfig() {
    let form = document.getElementById("oidForm");
    let oidConfig = {};
    for(let field of form.querySelectorAll('input,select')) {
        switch (field.name) {
            //  Color fields
            case 'color':
            case 'bgcolor':
                oidConfig[field.name] = str2rgb(field.value);
                break;
            //  Boolean fields
            case 'grad':
                if(field.checked)
                    oidConfig[field.name] = field.checked;
                break;
            //  String fields
            case 'type':
                oidConfig[field.name] = field.value;
                break;
            //  Rest are all numeric fields
            default:
                let val = parseFloat(field.value);
                if(!isNaN(val))
                    oidConfig[field.name] = val;
        }
    }
    
    return oidConfig;
}

//  Function to set Oid parameters in the UI
//  Make sure the filed names in the form matches to the field names in the Oid classes
function setOidConfig(oidConfig) {
    let form = document.getElementById("oidForm");

    for(let field in oidConfig) {
        //  Set the value only if the field exists in the form
        if(field in form) {
            if(field == 'color' || field == 'bgcolor')
                form[field].value = rgb2str(oidConfig[field]);
            else
                form[field].value = oidConfig[field];
        }
    }

    //  Make sure to call the Oit Type change function to show/hide relevant form fields
    onOidTypeChanged(oidConfig.type)
}

//  Function to update the display values of various range widgets in the form
function updateLabelValues(oidConfig){
    for(let field in oidConfig) {
        let fieldLabel = document.querySelector(`label[for="${field}.value"]`);

        //  If a label exists to display  the field value set the value
        if(fieldLabel) {
            if(field == 'color' || field == 'bgcolor')
                fieldLabel.innerHTML = rgb2str(oidConfig[field]);
            else
                fieldLabel.innerHTML = oidConfig[field];
        }
    }
}

//  Function to repaint the canvas
function updateCanvas(oidConfig) {
    let canvas = document.querySelector(`#canvas${oidConfig.id}`);
    let g = canvas.getContext('2d');

    //  Trick to get the class definition from the class name
    let oidClass = (Function('return ' + oidConfig.type))();

    g.clearRect(0, 0, canvas.width, canvas.height);
    new Sph().addOid(oidClass, oidConfig).paint(g);
}

//  Function to visually identofy a Oid bby flashing the same few times
function identifyCanvas(oidid) {
    let canvasDiv = document.getElementById(`canvasdiv${oidid}`);
    let flashes = 6;    //  Flash three times, make sure this is an even number

    function flashCanvas() {
        canvasDiv.style.display = (flashes % 2 == 0) ? "none" :"block";
        if(--flashes > 0)
            setTimeout(flashCanvas, 200);
    }

    flashCanvas();
}

//  Function to add a new Oid
function addOid(oidConfig) {
    oidConfig = JSON.parse(JSON.stringify(oidConfig));              //  Make a deep copy of the oid, before addding
    oidConfig.id = 1 + Math.max(...allOidConfigs.map(x => x.id));   //  Create a Id to the new Oid
    allOidConfigs.push(oidConfig);

    //  Add the new Oid Id to the id list
    let oidIdSelect = document.getElementById("oididselect");
    oidIdSelect.innerHTML += `<option id="oidid${oidConfig.id}" value="${oidConfig.id}">${oidConfig.id}</option>`;

    //  Add a new canvas to paint this Oid
    let canvasDiv = document.getElementById("canvasdiv");
    let newCanvasHTML = `<div id="canvasdiv${oidConfig.id}" style="position:absolute; top:0px; left:0px;">`;
    newCanvasHTML += `<canvas id="canvas${oidConfig.id}" height="700" width="1000"></canvas>`;
    newCanvasHTML += `</div>`;
    canvasDiv.innerHTML += newCanvasHTML

    //  Change the current Oid context to the latest
    oidConfigIndex = allOidConfigs.length-1;

    //  Adding a new canvas clears all the existing canvases (not sure why), so repaint all the canvases
    for(oidConfig of allOidConfigs)
        updateCanvas(oidConfig);

    //  Make sure to call the Oid Id changed to set the Oid parameters
    //  and flash the newly added Oid
    onOidIdChanged(oidConfig.id);
}

//  Function to handle the add oid button clicked
function onAddPressed(btn) {
    addOid(sampleOidConfig);
}

//  Function to handle the copy oid button clicked
function onCopyPressed(btn) {
    //  Simply take the current oid and add a copy again (addOid will create a copy)
    addOid(allOidConfigs[oidConfigIndex]);
}

//  Function to update oid
function updateOid(oidConfig) {
    allOidConfigs[oidConfigIndex] = oidConfig;
    updateLabelValues(allOidConfigs[oidConfigIndex]);
    updateCanvas(allOidConfigs[oidConfigIndex]);
}

//  Function to handle the Oid updates from the UI.
//  This function will be called realtime as the parameters are updated in the form
function onOidUpdated() {
    updateOid(getOidConfig());
}

//  Function to delete an Oid by index
function deleteOid(oidIndex) {
    if(allOidConfigs.length <= 1)   //  Do not let the last Oid to be deleted
        return;

    let deletedOidConfigs = allOidConfigs.splice(oidIndex, 1);
    oidConfigIndex = 0; //  Set the current Oid to the first one

    //  Remove the Oid from the Id list
    let oidIdOption = document.getElementById(`oidid${deletedOidConfigs[0].id}`);
    oidIdOption.parentNode.removeChild(oidIdOption);

    //  Remove the Oid canvas
    let canvasDiv = document.getElementById(`canvasdiv${deletedOidConfigs[0].id}`);
    canvasDiv.parentNode.removeChild(canvasDiv);

    //  Make sure to call the Oid Id changed to set the Oid parameters
    //  and flash the current context Oid
    onOidIdChanged(allOidConfigs[oidConfigIndex].id);
}

//  Function to handle delete oid button
function onDeletePressed(btn) {
    deleteOid(oidConfigIndex);
}

//  Function to handle JSON button
function onJsonPressed(btn) {
    let canvasDiv = document.getElementById("canvasdiv");
    let jsonDiv = document.getElementById("jsondiv");
    let jsonoids = document.getElementById("jsonoids");

    //  Create json string from the all the existing Oids
    jsonoids.value = JSON.stringify(allOidConfigs, null, 4);//.replace(/"([^"]+)":/g, '$1:');

    if(btn.innerHTML == "json") {
        //  If the current button title is json, dhide the canvas and show the json text
        canvasDiv.style.display = "none";
        jsonDiv.style.display = "inline-block";
        btn.innerHTML = "sph"   //  Change the button title to sph
    } else {
        //  If the current button title is sph, dhide the canvas and show the json text
        canvasDiv.style.display = "inline-block";
        jsonDiv.style.display = "none";
        btn.innerHTML = "json"  //  Change the bbutton title to json
    }
}

//  Function to handle load button pressed
function onLoadPressed(btn) {
    newOidConfigs = JSON.parse(btn.form.oids.value);

    //  Delete all the existig Oids except the first one
    for(let i = 1; i < allOidConfigs.length; ++i)
        deleteOid(i);
    
    //  Update the first Oid with the first Oid from the new list
    //  Make sure you match the id, otherwise the canvas may not be matches
    newOidConfigs[0].id = allOidConfigs[0].id;
    updateOid(newOidConfigs[0]);

    //  Add all the other Oids, no need to change id values, as the addOid will make sure, it has unique ids
    for(let i = 1; i < newOidConfigs.length; ++i)
        addOid(newOidConfigs[i]);
}