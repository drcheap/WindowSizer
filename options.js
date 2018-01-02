const PREFIX_EDIT = "edit-";
const PREFIX_REMOVE = "remove-";
const PREFIX_SAVE = "save-";
const PREFIX_CANCEL = "cancel-";
const MODE_NEW = "new";
const MODE_EDIT = "edit";

// hasClass, addClass, removeClass functions borrowed (and reformatted) from: https://stackoverflow.com/questions/6787383
function hasClass(ele,cls)
{
   return !!ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
}

function addClass(ele,cls)
{
   if(!hasClass(ele,cls))
   {
      ele.className += " " + cls;
   }
}

function removeClass(ele,cls)
{
   if (hasClass(ele,cls))
   {
      let reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
      ele.className = ele.className.replace(reg,' ');
   }
}

function isNumeric(n)
{
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function getId(fullString,prefixToRemove)
{
   return parseInt(fullString.substring(prefixToRemove.length));
}

function getValues(mode)
{
   let hasError = false;

   let eW = document.querySelector("#" + mode + "Width");
   let width = eW.value;
   if(!isNumeric(width) || parseInt(width) > screen.availWidth)
   {
      hasError = true;
      addClass(eW,"invalid");
      eW.value = "";
   }
   else
   {
      removeClass(eW,"invalid");
   }

   let eH = document.querySelector("#" + mode + "Height");
   let height = eH.value;
   if(!isNumeric(height) || parseInt(height) > screen.availHeight)
   {
      hasError = true;
      addClass(eH,"invalid");
      eH.value = "";
   }
   else
   {
      removeClass(eH,"invalid");
   }

   let eN = document.querySelector("#" + mode + "Name");
   let name = eN.value;
   if(name.length < 1)
   {
      hasError = true;
      addClass(eN,"invalid");
      eN.value = "";
   }
   else
   {
      removeClass(eN,"invalid");
   }

   let result = {"valid": !hasError};
   let eS = document.querySelector("#" + mode + "Status");
   if(hasError)
   {
      eS.textContent = "Please correct errors";
      addClass(eS,"errmsg");
   }
   else
   {
      eW.value = "";
      eH.value = "";
      eN.value = "";
      eS.textContent = "";
      removeClass(eS,"errmsg");
      result.width = parseInt(width);
      result.height = parseInt(height);
      result.name = name;
   }
   return result;
}

function displayPresets()
{
   return browser.storage.local.get("presets").then((obj) => {
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
         let presetIndex = i + 1;
         console.log("(display) Add item " + presetIndex + ": " + presets[i].name);

         // Make the row, the annoying but safe way
         let tr = document.createElement("tr");
         tr.className = "presetItem";

         let tdK = document.createElement("td");
         tdK.textContent = "Alt+" + presetIndex;
         tr.appendChild(tdK);

         let tdW = document.createElement("td");
         tdW.textContent = presets[i].width;
         tr.appendChild(tdW);

         let tdH = document.createElement("td");
         tdH.textContent = presets[i].height;
         tr.appendChild(tdH);

         let tdN = document.createElement("td");
         tdN.textContent = presets[i].name;
         tr.appendChild(tdN);

         let tdA = document.createElement("td");

         let btnE = document.createElement("button");
         btnE.type = "button";
         btnE.id = PREFIX_EDIT + presets[i].id;
         btnE.textContent = "Edit";
         btnE.addEventListener('click', editPreset);
         tdA.appendChild(btnE);

         let btnR = document.createElement("button");
         btnR.type = "button";
         btnR.id = PREFIX_REMOVE + presets[i].id;
         btnR.textContent = "Remove";
         btnR.addEventListener('click', removePreset);
         tdA.appendChild(btnR);

         tr.appendChild(tdA);

         tr.appendChild(document.createElement("td"));

         // Add it to the table
         let lastRow = document.querySelector("#addPreset");
         lastRow.parentNode.insertBefore(tr,lastRow);
      }

      showCurrentSize();
   });
}

function showCurrentSize()
{
   let eCS = document.querySelector("#currentSize").textContent = window.outerWidth + "x" + window.outerHeight + " (click to use)";
}

function useCurrentSize()
{
   document.querySelector("#newWidth").value = window.outerWidth;
   document.querySelector("#newHeight").value = window.outerHeight;
}

function addPreset(e)
{
   let values = getValues(MODE_NEW);
   if(values.valid)
   {
      browser.storage.local.get("presets").then((obj) => {
         console.log("(add) Adding preset: " + values.width + "x" + values.height + " " + values.name);
         let item = {
            "id": new Date().valueOf(),      // This is not *perfect* but works as long as two presets aren't created in the same millisecond (o).(O)
            "width": values.width,
            "height": values.height,
            "name": values.name
         };

         let presets = obj.presets;
         presets.push(item);
         browser.storage.local.set({"presets": presets});
         displayPresets();
      });
   }

   e.preventDefault();
}

function editPreset(e)
{
   let myId = getId(e.target.id,PREFIX_EDIT);

   let pendingEdit = document.querySelector("#editStatus");
   if(pendingEdit != null)
   {
      cancelEdits().then(function(){
         document.querySelector("#" + PREFIX_EDIT + myId).click();
      });
      return;
   }

   let tr = e.target.parentElement.parentElement;

   // Replace values with editable versions
   let tdW = tr.children[1]
   let inW = document.createElement("input");
   inW.type = "text";
   inW.id = "editWidth";
   inW.value = tdW.textContent;
   inW.size = 4;
   inW.maxLength = 4;
   tdW.textContent = "";
   tdW.appendChild(inW);

   let tdH = tr.children[2]
   let inH = document.createElement("input");
   inH.type = "text";
   inH.id = "editHeight";
   inH.value = tdH.textContent;
   inH.size = 4;
   inH.maxLength = 4;
   tdH.textContent = "";
   tdH.appendChild(inH);

   let tdN = tr.children[3]
   let inN = document.createElement("input");
   inN.type = "text";
   inN.id = "editName";
   inN.value = tdN.textContent;
   inN.size = 4;
   inN.maxLength = 4;
   tdN.textContent = "";
   tdN.appendChild(inN);

   // Offer a different set of actions
   let tdA = tr.children[4];
   tdA.textContent = "";

   let btnS = document.createElement("button");
   btnS.type = "button";
   btnS.id = PREFIX_SAVE + myId;
   btnS.textContent = "Save";
   btnS.addEventListener('click', saveEdits);
   tdA.appendChild(btnS);

   let btnC = document.createElement("button");
   btnC.type = "button";
   btnC.id = PREFIX_CANCEL + myId;
   btnC.textContent = "Cancel";
   btnC.addEventListener('click', cancelEdits);
   tdA.appendChild(btnC);

   let tdS = tr.children[5];
   tdS.id = "editStatus";

   e.preventDefault();
}

function saveEdits(e)
{
   let values = getValues(MODE_EDIT);
   if(values.valid)
   {

      browser.storage.local.get("presets").then((obj) => {
         let myId = getId(e.target.id,PREFIX_EDIT);
         console.log("(remove) Request to edit id=" + myId);

         let presets = obj.presets;
         for(let i = 0;i < presets.length;i++)
         {
            if(presets[i].id === myId)
            {
               console.log("(edit) Found it at i=" + i);

               presets[i].width = values.width;
               presets[i].height = values.height;
               presets[i].name = values.name;
               break;
            }
         }

         browser.storage.local.set({"presets": presets});
         displayPresets();
      });
   }

   e.preventDefault();
}

function cancelEdits()
{
   return displayPresets();
}

function removePreset(e)
{
   browser.storage.local.get("presets").then((obj) => {
      let myId = getId(e.target.id,PREFIX_REMOVE);
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

      browser.storage.local.set({"presets": presets});
      displayPresets();
   });

   e.preventDefault();
}

// Preset initialization, if needed
browser.storage.local.get("presets").then((obj) => {
   if(!Array.isArray(obj.presets))
   {
      console.log("(init) No presets found, initializing...");
      browser.storage.local.set({"presets": []});
   }
});

window.addEventListener("resize", showCurrentSize);
document.addEventListener("DOMContentLoaded", displayPresets);
document.querySelector("#addNew").addEventListener("click", addPreset);
document.querySelector("#currentSize").addEventListener("click", useCurrentSize);
