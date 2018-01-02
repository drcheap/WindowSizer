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

function getId(fullString,prefixToRemove)
{
   return parseInt(fullString.substring(prefixToRemove.length));
}

function getValues(mode)
{
   let hasError = false;

   let eW = document.querySelector("#" + mode + "Width");
   let width = parseInt(eW.value);
   if(Number.isInteger(width) && width > 0 && width <= screen.availWidth)
   {
      removeClass(eW,"invalid");
   }
   else
   {
      hasError = true;
      addClass(eW,"invalid");
      eW.value = "";
   }

   let eH = document.querySelector("#" + mode + "Height");
   let height = parseInt(eH.value);
   if(Number.isInteger(height) && height > 0 && height <= screen.availHeight)
   {
      removeClass(eH,"invalid");
   }
   else
   {
      hasError = true;
      addClass(eH,"invalid");
      eH.value = "";
   }

   let eN = document.querySelector("#" + mode + "Name");
   let name = eN.value;
   if(name.length > 0)
   {
      removeClass(eN,"invalid");
   }
   else
   {
      hasError = true;
      addClass(eN,"invalid");
      eN.value = "";
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
      result.width = width;
      result.height = height;
      result.name = name;
   }
   return result;
}

async function displayPresets()
{
   let storage = await browser.storage.local.get("presets");
   let presets = storage.presets;

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
}

function showCurrentSize()
{
   let eCS = document.querySelector("#currentSize").textContent = window.outerWidth + "x" + window.outerHeight + " (click to use)";
}

function useCurrentSize()
{
   let pendingEdit = document.querySelector("#editStatus");
   let mode = pendingEdit == null ? MODE_NEW : MODE_EDIT;
   document.querySelector("#" + mode + "Width").value = window.outerWidth;
   document.querySelector("#" + mode + "Height").value = window.outerHeight;
}

async function addPreset()
{
   let values = getValues(MODE_NEW);
   if(values.valid)
   {
      console.log("(add) Adding preset: " + values.width + "x" + values.height + " " + values.name);

      let item = {
         "id": new Date().valueOf(),      // This is not *perfect* but works as long as two presets aren't created in the same millisecond (o).(O)
         "width": values.width,
         "height": values.height,
         "name": values.name
      };

      let storage = await browser.storage.local.get("presets");
      let presets = storage.presets;
      presets.push(item);
      await browser.storage.local.set({"presets": presets});
      displayPresets();
   }

   e.preventDefault();
}

async function editPreset(e)
{
   let myId = getId(e.target.id,PREFIX_EDIT);

   let pendingEdit = document.querySelector("#editStatus");
   if(pendingEdit != null)
   {
      // Abort the other & try this one again
      await cancelEdits();
      document.querySelector("#" + PREFIX_EDIT + myId).click();
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
   inN.size = 15;
   inN.maxLength = 15;
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

async function saveEdits(e)
{
   let values = getValues(MODE_EDIT);
   if(values.valid)
   {
      let myId = getId(e.target.id,PREFIX_EDIT);
      console.log("(edit) Request to edit id=" + myId);

      let storage = await browser.storage.local.get("presets");
      let presets = storage.presets;
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

      await browser.storage.local.set({"presets": presets});
      displayPresets();
   }

   e.preventDefault();
}

async function cancelEdits()
{
   // displayPresets() will take care of this by reloading everything
   await displayPresets();
}

async function removePreset(e)
{
   let myId = getId(e.target.id,PREFIX_REMOVE);
   console.log("(remove) Request to remove id=" + myId);

   let storage = await browser.storage.local.get("presets");
   let presets = storage.presets;
   for(let i = 0;i < presets.length;i++)
   {
      if(presets[i].id === myId)
      {
         console.log("(remove) Found it at i=" + i);

         presets.splice(i,1); // Removes this item
         break;
      }
   }

   await browser.storage.local.set({"presets": presets});
   displayPresets();

   e.preventDefault();
}

window.addEventListener("resize", showCurrentSize);
document.addEventListener("DOMContentLoaded", displayPresets);
document.querySelector("#addNew").addEventListener("click", addPreset);
document.querySelector("#currentSize").addEventListener("click", useCurrentSize);
