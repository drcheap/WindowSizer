function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function addPreset(e) {

   let newWidth = document.querySelector("#newWidth").value;
   document.querySelector("#newWidth").value = "";

   if(!isNumeric(newWidth) || parseInt(newWidth) > screen.availWidth)
   {
      //alert("Invalid width");
      e.preventDefault();
      return;
   }

   var newHeight = document.querySelector("#newHeight").value;
   document.querySelector("#newHeight").value = "";

   if(!isNumeric(newHeight) || parseInt(newHeight) > screen.availHeight)
   {
      //alert("Invalid width");
      e.preventDefault();
      return;
   }

   let newName = document.querySelector("#newName").value;
   document.querySelector("#newName").value = "";

   if(newName.length < 1)
   {
      //alert("Please enter a name");
      e.preventDefault();
      return;
   }

   let getPresets = browser.storage.sync.get("presets");
   getPresets.then((obj) => {

      console.log("(add) Adding preset: " + newWidth + "x" + newHeight + " " + newName);
      let item = {
         "id": new Date().valueOf(),      // This is not *perfect* but works as long as two presets aren't created in the same millisecond (o).(O)
         "width": newWidth,
         "height": newHeight,
         "name": newName
      };

      let presets = obj.presets;
      presets.push(item);
      browser.storage.sync.set({"presets": presets});
      displayPresets();
   });

   e.preventDefault();
}

function displayPresets() {
   let getPresets = browser.storage.sync.get("presets");
   getPresets.then((obj) => {

      let presets = obj.presets;
      console.log("(display) Loaded " + presets.length + " presets: %o", presets);

      let existingRows = document.querySelectorAll(".presetItem");
      for(let row of existingRows)
      {
         console.log("(display) Remove item row");
         row.remove();
      };

      for(let i = 0;i < presets.length;i++)
      {
         console.log("(display) Add item row " + (i+1) + ": " + presets[i].name);

         let tr = document.createElement("tr");
         tr.className = "presetItem";

         let tdW = document.createElement("td");
         tdW.appendChild(document.createTextNode(presets[i].width));
         tr.appendChild(tdW);

         let tdH = document.createElement("td");
         tdH.appendChild(document.createTextNode(presets[i].height));
         tr.appendChild(tdH);

         let tdN = document.createElement("td");
         tdN.appendChild(document.createTextNode(presets[i].name));
         tr.appendChild(tdN);

         let tdR = document.createElement("td");

         let btnR = document.createElement("button");
         btnR.type = "button";
         btnR.id = presets[i].id;
         btnR.appendChild(document.createTextNode("Remove"));
         btnR.addEventListener('click', removePreset);
         tdR.appendChild(btnR);

         tr.appendChild(tdR);

         let lastRow = document.querySelector("#addPreset");
         lastRow.parentNode.insertBefore(tr ,lastRow);
      }
   });
}

function removePreset(e)
{
   let getPresets = browser.storage.sync.get("presets");
   getPresets.then((obj) => {

      let myId = parseInt(e.target.id);
      console.log("(remove) Request to remove id=" + myId);

      let presets = obj.presets;
      for(let i = 0;i < presets.length;i++)
      {
         if(presets[i].id === myId)
         {
            console.log("(remove) Found it at i=" + i);

            presets.splice(i,1); // Removes this item
            break;
         }
      }

      browser.storage.sync.set({"presets": presets});
      displayPresets();
   });

   e.preventDefault();
}

// Preset initialization, if needed
browser.storage.sync.get("presets").then((obj) => {
   if(!Array.isArray(obj.presets))
   {
      console.log("(init) No presets found, initializing...");
      browser.storage.sync.set({"presets": []});
   }
});

document.addEventListener('DOMContentLoaded', displayPresets);
document.querySelector("#addNew").addEventListener("click", addPreset);
