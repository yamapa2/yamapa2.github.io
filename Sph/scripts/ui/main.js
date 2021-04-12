//  Start the display with one default oid.
var allOidViews = [];
var currentOidView = null;

//  Function to add a new Oid
function addOid(oidConfig = null) {
    //  Create a Id to the new Oid
    let oidId = 1 + (allOidViews.length <= 0 ? 0 : Math.max(...allOidViews.map(ov => ov.oidConfig.id)));
    currentOidView = new OidView(oidId)
        .setup()
        .setOidConfig(oidConfig);
    
    allOidViews.push(currentOidView);

    //  Adding a new canvas clears all the existing canvases (not sure why), so repaint all the canvases
    for(let oidView of allOidViews)
        oidView.paint();

    //  Flash the newly added Oid
    currentOidView.identify();
}

//  Function to delete an Oid by index
function deleteOid() {
    if(allOidViews.length <= 1)   //  Do not let the last Oid to be deleted
        return;
    
    let oidViewIndex = allOidViews.findIndex(x => x.oidConfig.id == currentOidView.oidConfig.id);

    allOidViews.splice(oidViewIndex, 1);
    currentOidView.teardown();

    currentOidView = allOidViews[0]; //  Set the current Oid to the first one

    //  Flash the current context Oid
    currentOidView.setOidConfig().identify();
}

//  Function to load a set of Oids
function loadOidConfigs(oidConfigs) {
    //  Delete all the existig Oids except the first one
    for(let oidView of allOidViews)
        oidView.teardown();
    allOidViews  = [];
    
    //  Add all the other Oids, no need to change id values, as the addOid will make sure, it has unique ids
    for(let i = 0; i < oidConfigs.length; ++i)
        allOidViews.push(new OidView(i+1).setup().setOidConfig(oidConfigs[i]));
    
    for(let oidView of allOidViews)
        oidView.paint();
    
    //  Set the first oid as the current oid and visually identify it by flasshing
    currentOidView = allOidViews[allOidViews.length-1].identify();
}

//  Oid Id is updated in the UI, switch the focus object to the new oid
function onOidIdChanged(oidId) {
    oidId = parseInt(oidId)

    //  Find the new Oid and set it as the current context oid
    let oidView = allOidViews.find(x => x.oidConfig.id == oidId);
    if(oidView != undefined)
        currentOidView = oidView.setOidConfig().identify();
}

//  Oid Type changed in the UI, make sure the right parameters are displayed
function onOidTypeChanged(val) {
    currentOidView.updateOidType(val).getOidConfig().updateLabelValues().paint();
}

//  Function to handle the add oid button clicked
function onAddPressed(btn) {
    addOid();
}

//  Function to handle the copy oid button clicked
function onCopyPressed(btn) {
    //  Simply take the current oid and add a copy again (addOid will create a copy)
    addOid(currentOidView.oidConfig);
}

//  Function to handle the Oid updates from the UI.
//  This function will be called realtime as the parameters are updated in the form
function onOidUpdated() {
    currentOidView.getOidConfig().updateLabelValues().paint();
}

//  Function to handle delete oid button
function onDeletePressed(btn) {
    deleteOid();
}

//  Function to handle JSON button
function onJsonPressed(btn) {
    let canvasDiv = document.getElementById("canvasdiv");
    let jsonDiv = document.getElementById("jsondiv");
    let jsonoids = document.getElementById("jsonoids");

    //  Create json string from the all the existing Oids
    jsonoids.value = JSON.stringify(allOidViews.map(x => x.trimOidConfig()), null, 4);    //.replace(/"([^"]+)":/g, '$1:');

    if(btn.innerHTML == "json") {
        //  If the current button title is json, dhide the canvas and show the json text
        canvasDiv.style.display = "none";
        jsonDiv.style.display = "block";
        btn.innerHTML = "sph"   //  Change the button title to sph
    } else {
        //  If the current button title is sph, dhide the canvas and show the json text
        canvasDiv.style.display = "block";
        jsonDiv.style.display = "none";
        btn.innerHTML = "json"  //  Change the bbutton title to json
    }
}

//  Function to handle load button pressed
function onLoadPressed(btn) {
    loadOidConfigs(JSON.parse(btn.form.oids.value));
}

//  Function to handle requests for loading samples
function onSamplesChanged(oidConfig) {
    fetch("scripts/samples/" + oidConfig)
        .then(response => response.json())
        .then(oidConfigs => loadOidConfigs(oidConfigs));

    //  Keep the sample select always in none position, we are misusing select here as a menu option
    let form = document.getElementById("oidForm");
    form.sample.value = "none";
}

//  Function to register mouse events (mouseup and mousedown)
function registerMouseMoves() {
    let canvasDiv = document.getElementById("canvasdiv");
    canvasDiv.addEventListener("mousedown", startOidTracking, false);
    canvasDiv.addEventListener("mouseup", stopOidTracking, false);
}

//  Call back function while the mouse pointer is tracked
function trackOid(e) {
    let canvas = document.getElementById(`canvas${currentOidView.oidConfig.id}`)
    let form = document.getElementById("oidForm");

    let xc = parseInt(form.locX.value);
    let yc = parseInt(form.locY.value);
    let x0 = e.clientX - e.movementX;
    let y0 = e.clientY - e.movementY;
    let x1 = e.clientX;
    let y1 = e.clientY;

    if(x1 < 0 || canvas.width < x1 || y1 < 0 || canvas.height < y1) {
        //  If the mouse is moved out of the current canvas, stop tracking the mouse
        stopOidTracking(e);
    } else if(e.altKey) {
        //  Alt key pressed, scale the Oid
        if(e.movementX ** 2 + e.movementY ** 2 > 8) {
            let rel = ((xc - x1) ** 2 + (yc - y1) ** 2) - ((xc - x0) ** 2 + (yc - y0) ** 2)

            form.scale.value = parseFloat(form.scale.value) + (rel > 0 ? 0.1 : -0.1);
            currentOidView.getOidConfig().updateLabelValues().paint();
        }
    } else if(e.shiftKey) {
        //  Shift key pressed, rotate the Oid
        let theta = (Math.atan(y0-yc, x0-xc) - Math.atan(y1-yc, x1-xc)) * 180 / Math.PI;
        if(Math.abs(theta) > 0.0001)
            theta = (x1 < xc ? -1: 1) * theta / Math.abs(theta);

        form.angle.value = (parseInt(form.angle.value) - theta + 360) % 360;
        currentOidView.getOidConfig().updateLabelValues().paint();
} else {
        //  If the mouse is moved without shift or alt keys pressed, move and update the Oid center
        form.locX.value = parseInt(form.locX.value) + e.movementX;
        form.locY.value = parseInt(form.locY.value) + e.movementY;
        currentOidView.getOidConfig().updateLabelValues().paint();
    }
}

//  Call back function when mousedown event detected
function startOidTracking(e) {
    document.addEventListener("mousemove", trackOid, false);    //  Register for mouse move events

    //  Find the oid on which the mouse is clicked, and visually identify it
    let oidView = allOidViews.find(ov => ov.sph.contains({ x: e.clientX, y: e.clientY }));
    if(oidView)
        currentOidView = oidView.setOidConfig().identify();
}

//  Call back function when mouseup event detected
function stopOidTracking(e) {
    document.removeEventListener("mousemove", trackOid);        //  Deregister for mouse move events
}